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

    // Risposta per Vapi (tool-calls)
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
    
    // Log successo sintetico
    logger.info('list_bookings_success', {
      restaurant_id,
      phone,
      count: Array.isArray(result && result.bookings) ? result.bookings.length : 0,
      source: isVapi ? 'vapi' : 'http',
      request_id: req.requestId || null,
    });

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
            error: `LIST_BOOKINGS_ERROR: ${err.message || String(err)}`
          }
        ]
      });
    }

    return res.status(200).json({
      ok: false,
      error_code: 'LIST_BOOKINGS_ERROR',
      error_message: err.message
    });
  }
};
