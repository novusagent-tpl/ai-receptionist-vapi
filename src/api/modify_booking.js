const reservations = require('../reservations');
const logger = require('../logger');

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
      new_people
    } = source;

    restaurant_id = restaurant_id && String(restaurant_id).trim();
    booking_id = booking_id && String(booking_id).trim();
    new_day = new_day && String(new_day).trim();
    new_time = new_time && String(new_time).trim();

    let newPeopleNum = null;
    if (new_people !== undefined && new_people !== null && new_people !== "") {
      newPeopleNum = Number(new_people);
    }

    // Deve esserci almeno un campo da modificare
    const hasAnyChange =
      !!new_day || !!new_time || (newPeopleNum !== null && Number.isFinite(newPeopleNum));

    // VALIDAZIONE STRICT
    if (!restaurant_id || !booking_id || !hasAnyChange) {
      const errorMsg =
        'restaurant_id, booking_id e almeno uno tra new_day, new_time, new_people sono obbligatori';

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

    // Log successo sintetico
    logger.info('modify_booking_success', {
      restaurant_id,
      booking_id,
      source: isVapi ? 'vapi' : 'http',
      request_id: req.requestId || null,
    });


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

logger.error('<event_name>_error', {
  restaurant_id: restaurant_id || body.restaurant_id || null, // se hai il dato, altrimenti null
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
