const reservations = require('../reservations');
const logger = require('../logger');
const { DateTime } = require('luxon');

const ITALIAN_DAYS = {
  monday: 'lunedì', tuesday: 'martedì', wednesday: 'mercoledì',
  thursday: 'giovedì', friday: 'venerdì', saturday: 'sabato', sunday: 'domenica'
};

const ITALIAN_MONTHS = {
  1: 'gennaio', 2: 'febbraio', 3: 'marzo', 4: 'aprile',
  5: 'maggio', 6: 'giugno', 7: 'luglio', 8: 'agosto',
  9: 'settembre', 10: 'ottobre', 11: 'novembre', 12: 'dicembre'
};

/**
 * Da una data ISO (es. "2026-02-19") genera "giovedì 19 febbraio 2026".
 * Se la data non è valida, ritorna null.
 */
function buildDayLabel(dayISO) {
  const dt = DateTime.fromISO(dayISO, { zone: 'Europe/Rome' });
  if (!dt.isValid) return null;
  const dow = ITALIAN_DAYS[dt.toFormat('cccc').toLowerCase()] || '';
  const dayNum = dt.day;
  const month = ITALIAN_MONTHS[dt.month] || '';
  return `${dow} ${dayNum} ${month}`.trim();
}

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

module.exports = async function listBookings(req, res) {
  try {
    const body = req.body || {};
    const { isVapi, toolCallId, args } = extractVapiContext(req);

    // Se viene da Vapi, prendiamo gli argomenti dalla function.arguments
    const source = isVapi ? args : body;

    let { restaurant_id, phone } = source;

    restaurant_id = restaurant_id && String(restaurant_id).trim();
    phone = phone && String(phone).trim();

    // VALIDAZIONE STRICT
    if (!restaurant_id || !phone) {
      const errorMsg = 'restaurant_id e phone sono obbligatori';

  // QUI LOG
  logger.error('list_bookings_validation_error', {
    restaurant_id,
    phone,
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

    // Lista prenotazioni reali
    const result = await reservations.listReservationsByPhone(
      restaurant_id,
      phone
    );

const resultList = Array.isArray(result && result.results) ? result.results : [];

    // Arricchisci ogni prenotazione con day_label (calcolato dal backend, universale)
    for (const booking of resultList) {
      if (booking.day) {
        booking.day_label = buildDayLabel(booking.day) || booking.day;
      }
    }

    logger.info('list_bookings_success', {
      restaurant_id,
      phone,
      count: resultList.length,
      booking_ids: resultList.map(b => b.booking_id).slice(0, 5),
      source: isVapi ? 'vapi' : 'http',
      request_id: req.requestId || null,
    });

    // Genera message riepilogativo per Vapi
    let message = null;
    if (resultList.length === 0) {
      message = 'Nessuna prenotazione trovata per questo numero di telefono.';
    } else if (resultList.length === 1) {
      const b = resultList[0];
      const timeStr = (b.time || '').slice(0, 5);
      message = `Trovata 1 prenotazione: ${b.day_label} alle ${timeStr} per ${b.people} ${b.people === 1 ? 'persona' : 'persone'} a nome ${b.name || 'N/D'}.`;
    } else {
      const lines = resultList.map(b => {
        const timeStr = (b.time || '').slice(0, 5);
        return `${b.day_label} alle ${timeStr} per ${b.people} ${b.people === 1 ? 'persona' : 'persone'} a nome ${b.name || 'N/D'}`;
      });
      message = `Trovate ${resultList.length} prenotazioni: ${lines.join('; ')}.`;
    }

    // Risposta per Vapi (tool-calls)
    if (isVapi && toolCallId) {
      const vapiResult = {
        ok: result.ok,
        count: resultList.length,
        message,
        results: resultList
      };
      return res.status(200).json({
        results: [
          {
            toolCallId,
            result: JSON.stringify(vapiResult)
          }
        ]
      });
    }

    // Risposta "normale" per Postman / altri client
    result.message = message;
    return res.status(200).json(result);
  } catch (err) {
    const errMsg = err && err.message ? err.message : String(err);
    const body = req.body || {};

    logger.error('list_bookings_error', {
      restaurant_id: body.restaurant_id || null,
      message: errMsg,
      request_id: req.requestId || null,
    });

    const { isVapi, toolCallId } = extractVapiContext(req);

    if (isVapi && toolCallId) {
      return res.status(200).json({
        results: [
          {
            toolCallId,
            error: `LIST_BOOKINGS_ERROR: ${errMsg}`
          }
        ]
      });
    }

    return res.status(200).json({
      ok: false,
      error_code: 'LIST_BOOKINGS_ERROR',
      error_message: errMsg
    });
  }
};

