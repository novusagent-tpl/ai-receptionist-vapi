const kb = require('../kb');
const reservations = require('../reservations');
const logger = require('../logger');
const { DateTime } = require('luxon');


/**
 * Estrae info da una chiamata Vapi (tool-calls) se presente.
 * Restituisce: { isVapi, toolCallId, args }
 */
function extractVapiContext(req) {
  const body = req.body || {};
  const message = body.message;

  if (!message || message.type !== 'tool-calls') {
    return { isVapi: false, toolCallId: null, args: {} };
  }

  const tc =
    (Array.isArray(message.toolCalls) && message.toolCalls[0]) ||
    (Array.isArray(message.toolCallList) && message.toolCallList[0]) ||
    null;

  if (!tc || !tc.function) {
    return { isVapi: true, toolCallId: null, args: {} };
  }

  const args = tc.function.arguments || {};
  return {
    isVapi: true,
    toolCallId: tc.id,
    args
  };
}

module.exports = async function createBooking(req, res) {
  try {
    const body = req.body || {};

    const { isVapi, toolCallId, args } = extractVapiContext(req);

    // Se è Vapi, prendiamo dai "arguments", altrimenti dal body normale
    const source = isVapi ? args : body;

    let {
      restaurant_id,
      day,
      time,
      people,
      name,
      phone,
      notes
    } = source;

    // Normalizzazioni base
    restaurant_id = restaurant_id && String(restaurant_id).trim();
    day = day && String(day).trim();
    time = time && String(time).trim();
    name = name && String(name).trim();
    phone = phone && String(phone).trim();
    notes = notes != null ? String(notes).trim() : null;

    const peopleNum = Number(people);

    // VALIDAZIONE STRICT
    if (!restaurant_id || !day || !time || !name || !phone || !Number.isFinite(peopleNum) || peopleNum <= 0) {
      const errorMsg = 'restaurant_id, day, time, people (>0), name, phone sono obbligatori';

   logger.error('create_booking_validation_error', {
    restaurant_id,
    message: errorMsg,
    request_id: req.requestId || null,
  });

      if (isVapi && toolCallId) {
        return res.status(200).json({
          results: [
            {
              toolCallId,
              error: `VALIDATION_ERROR: ${errorMsg}`
            }
          ]
        });
      }

      return res.status(200).json({
        ok: false,
        error_code: 'VALIDATION_ERROR',
        error_message: errorMsg
      });
    }

// --- VALIDAZIONE TEMPORALE MINIMA (G13) ---

const now = DateTime.now().setZone('Europe/Rome');
const dayDt = DateTime.fromISO(day, { zone: 'Europe/Rome' });

if (!dayDt.isValid) {
  const errorMsg = 'Formato data non valido';
  logger.error('create_booking_validation_error', {
    restaurant_id,
    message: errorMsg,
    request_id: req.requestId || null,
  });

  return res.status(200).json({
    ok: false,
    error_code: 'VALIDATION_ERROR',
    error_message: errorMsg
  });
}

// Ricostruzione orario completo
let bookingDt = dayDt;
if (typeof time === 'string' && time.includes(':')) {
  const [hh, mm] = time.split(':').map(Number);
  bookingDt = dayDt.set({ hour: hh, minute: mm, second: 0, millisecond: 0 });
}

// Caso 1 — Data nel passato
if (bookingDt < now.startOf('day')) {
  const errorMsg = 'Non è possibile prenotare per una data nel passato.';

  logger.error('create_booking_validation_error', {
    restaurant_id,
    message: errorMsg,
    request_id: req.requestId || null,
  });

  return res.status(200).json({
    ok: false,
    error_code: 'VALIDATION_ERROR',
    error_message: errorMsg
  });
}

// Caso 2 — Orario passato (oggi)
if (bookingDt < now) {
  const errorMsg = 'L’orario indicato è già passato.';

  logger.error('create_booking_validation_error', {
    restaurant_id,
    message: errorMsg,
    request_id: req.requestId || null,
  });

  return res.status(200).json({
    ok: false,
    error_code: 'VALIDATION_ERROR',
    error_message: errorMsg
  });
}

// Caso 3 — Last-minute < 10 minuti
if (bookingDt < now.plus({ minutes: 10 })) {
  const errorMsg = 'Non è possibile prenotare così a ridosso dell’orario attuale.';

  logger.error('create_booking_validation_error', {
    restaurant_id,
    message: errorMsg,
    request_id: req.requestId || null,
  });

  return res.status(200).json({
    ok: false,
    error_code: 'VALIDATION_ERROR',
    error_message: errorMsg
  });
}


    // Controllo max_people dal KB (se definito)
    const info = kb.getRestaurantInfo(restaurant_id);
    if (info.max_people && peopleNum > info.max_people) {
      const errorMsg = `Numero massimo persone per prenotazione: ${info.max_people}`;

      if (isVapi && toolCallId) {
        return res.status(200).json({
          results: [
            {
              toolCallId,
              error: `MAX_PEOPLE_EXCEEDED: ${errorMsg}`
            }
          ]
        });
      }

      return res.status(200).json({
        ok: false,
        error_code: 'MAX_PEOPLE_EXCEEDED',
        error_message: errorMsg
      });
    }

    // Creazione prenotazione reale
    const result = await reservations.createReservation({
      restaurantId: restaurant_id,
      day,
      time,
      people: peopleNum,
      name,
      phone,
      notes
    });

    // Log successo sintetico
    logger.info('create_booking_success', {
      restaurant_id,
      day,
      time,
      people: peopleNum,
      phone,
      booking_id: result && result.booking_id,
      source: isVapi ? 'vapi' : 'http',
      request_id: req.requestId || null,
    });

    // Se chiamato da Vapi → formato tools
    if (isVapi && toolCallId) {
      return res.status(200).json({
        results: [
          {
            toolCallId,
            result: JSON.stringify(result)
          }
        ]
      });
    }

    // Uso "normale" (Postman, ecc.)
    return res.status(200).json(result);
} catch (err) {
  const errMsg = err && err.message ? err.message : String(err);

  const requestBody = req.body || {};

  // LOG ERRORE STRUTTURATO
  logger.error('create_booking_error', {
    restaurant_id: requestBody.restaurant_id || null,
    message: errMsg,
    request_id: req.requestId || null,
  });

  const { isVapi, toolCallId } = extractVapiContext(req);

  if (isVapi && toolCallId) {
    return res.status(200).json({
      results: [
        {
          toolCallId,
          error: `CREATE_BOOKING_ERROR: ${err.message || String(err)}`
        }
      ]
    });
  }

  return res.status(500).json({
    ok: false,
    error_code: 'CREATE_BOOKING_ERROR',
    error_message: err.message
  });
 }
};

