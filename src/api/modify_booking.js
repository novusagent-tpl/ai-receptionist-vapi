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
function buildDayLabel(dateISO) {
  const dt = DateTime.fromISO(dateISO, { zone: 'Europe/Rome' });
  if (!dt.isValid) return null;
  const dow = ITALIAN_DAYS[dt.toFormat('cccc').toLowerCase()] || '';
  return `${dow} ${dt.day} ${ITALIAN_MONTHS[dt.month] || ''}`.trim();
}

function formatTimeHuman(hhmm) {
  if (!hhmm) return hhmm;
  const parts = String(hhmm).split(':');
  const h = Number(parts[0]);
  const m = Number(parts[1] || 0);
  if (m === 0) return String(h);
  return `${h} e ${String(m).padStart(2, '0')}`;
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

module.exports = async function modifyBooking(req, res) {
  try {
    const body = req.body || {};
    const { isVapi, toolCallId, args } = extractVapiContext(req);

    // Se viene da Vapi, prendiamo gli argomenti dalla function.arguments
    const source = isVapi ? args : body;

    let {
      restaurant_id,
      booking_id,
      new_day,
      new_time,
      new_people,
      day,
      time,
      people
    } = source;

    restaurant_id = restaurant_id && String(restaurant_id).trim();
    booking_id = booking_id && String(booking_id).trim();
    new_day = String(new_day ?? day ?? '').trim() || null;
    new_time = String(new_time ?? time ?? '').trim() || null;

    let newPeopleNum = null;
    const peopleVal = new_people ?? people;
    if (peopleVal !== undefined && peopleVal !== null && peopleVal !== "") {
      newPeopleNum = Number(peopleVal);
    }

    // Deve esserci almeno un campo da modificare
    const hasAnyChange =
      !!new_day || !!new_time || (newPeopleNum !== null && Number.isFinite(newPeopleNum));

    // VALIDAZIONE STRICT
    if (!restaurant_id || !booking_id || !hasAnyChange) {
      const errorMsg =
        'restaurant_id, booking_id e almeno uno tra new_day, new_time, new_people (o alias day, time, people) sono obbligatori';

  logger.error('modify_booking_validation_error', {
    restaurant_id,
    booking_id,
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

    if (newPeopleNum !== null && (!Number.isFinite(newPeopleNum) || newPeopleNum <= 0)) {
      const errorMsg = 'new_people deve essere un numero positivo';

  logger.error('modify_booking_validation_error', {
    restaurant_id,
    booking_id,
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

    // Costruiamo l'oggetto modifiche solo con i campi presenti
    const updates = {};
    if (new_day) updates.new_day = new_day;
    if (new_time) updates.new_time = new_time;
    if (newPeopleNum !== null) updates.new_people = newPeopleNum;

    // Modifica prenotazione reale
    const result = await reservations.updateReservation(
      restaurant_id,
      booking_id,
      updates
    );

    // Arricchisci con day_label e time_human
    if (result && result.ok) {
      logger.info('modify_booking_success', {
        restaurant_id,
        booking_id,
        source: isVapi ? 'vapi' : 'http',
        request_id: req.requestId || null,
      });
      if (result.day) {
        result.day_label = buildDayLabel(result.day) || result.day;
      }
      if (result.time) {
        result.time_human = formatTimeHuman(result.time);
      }
      const dl = result.day_label || result.day;
      const th = result.time_human || result.time;
      result.message = `Prenotazione modificata: ${dl} alle ${th}.`;
    } else if (result && !result.ok) {
      logger.warn('modify_booking_rejected', {
        restaurant_id,
        booking_id,
        error_code: result.error_code || 'UNKNOWN',
        error_message: result.error_message || null,
        source: isVapi ? 'vapi' : 'http',
        request_id: req.requestId || null,
      });
    }

    // Risposta per Vapi
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

    // Risposta "normale" per Postman / altri client
    return res.status(200).json(result);
  } catch (err) {
const errMsg = err && err.message ? err.message : String(err);

const requestBody = req.body || {};

logger.error('modify_booking_error', {
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
            error: `MODIFY_BOOKING_ERROR: ${err.message || String(err)}`
          }
        ]
      });
    }

    return res.status(200).json({
      ok: false,
      error_code: 'MODIFY_BOOKING_ERROR',
      error_message: err.message
    });
  }
};
