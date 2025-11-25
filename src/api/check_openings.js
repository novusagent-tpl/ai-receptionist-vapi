const kb = require('../kb');
const timeUtils = require('../time-utils');

module.exports = async function checkOpenings(req, res) {
  console.log('CHECK_OPENINGS BODY:', JSON.stringify(req.body, null, 2));

  try {
    const body = req.body || {};

    let isVapi = false;
    let toolCallId = null;
    let restaurantId = null;
    let dayISO = null;

    // --- RICONOSCIMENTO CHIAMATA DA VAPI (tool-calls) ---
    if (body.message && body.message.type === 'tool-calls') {
      isVapi = true;

      // Vapi ti manda sia toolCalls che toolCallList, usiamo il primo valido
      const tc =
        (Array.isArray(body.message.toolCalls) &&
          body.message.toolCalls[0]) ||
        (Array.isArray(body.message.toolCallList) &&
          body.message.toolCallList[0]) ||
        null;

      if (tc) {
        toolCallId = tc.id;

        // QUI: arguments è già un OGGETTO, NON una stringa
        const args =
          (tc.function && tc.function.arguments) || {};

        restaurantId = args.restaurant_id;
        dayISO = args.day || args.date;
      }
    } else {
      // --- CHIAMATA "NORMALE" (Postman, ecc.) ---
      restaurantId = body.restaurant_id;
      dayISO = body.day || body.date;
    }

    // --- VALIDAZIONE ---
    if (!restaurantId || !dayISO) {
      if (isVapi && toolCallId) {
        return res.status(200).json({
          results: [
            {
              toolCallId,
              error:
                'VALIDATION_ERROR: restaurant_id e day sono obbligatori'
            }
          ]
        });
      }

      return res.status(200).json({
        ok: false,
        error_code: 'VALIDATION_ERROR',
        error_message: 'restaurant_id e day sono obbligatori'
      });
    }

    // --- LOGICA ORARI ---
    const openingsConfig = kb.getOpeningsConfig(restaurantId);
    const result = timeUtils.openingsFor(dayISO, openingsConfig);

    // --- RISPOSTA PER VAPI (formato tools) ---
    if (isVapi && toolCallId) {
      const payload = {
        restaurant_id: restaurantId,
        day: dayISO,
        closed: result.closed,
        slots: result.slots
      };

      return res.status(200).json({
        results: [
          {
            toolCallId,
            // Vapi vuole una stringa singola come result
            result: JSON.stringify(payload)
          }
        ]
      });
    }

    // --- RISPOSTA "LEGACY" PER TEST MANUALI (Postman) ---
    return res.status(200).json({
      ok: true,
      restaurant_id: restaurantId,
      day: dayISO,
      closed: result.closed,
      slots: result.slots
    });
  } catch (err) {
    console.error('Errore /api/check_openings:', err);

    const body = req.body || {};
    let toolCallId = null;

    if (body.message && body.message.type === 'tool-calls') {
      const tc =
        (Array.isArray(body.message.toolCalls) &&
          body.message.toolCalls[0]) ||
        (Array.isArray(body.message.toolCallList) &&
          body.message.toolCallList[0]) ||
        null;
      toolCallId = tc && tc.id;
    }

    if (toolCallId) {
      // errore per Vapi → SEMPRE 200 con results[]
      return res.status(200).json({
        results: [
          {
            toolCallId,
            error: `CHECK_OPENINGS_ERROR: ${err.message || String(err)}`
          }
        ]
      });
    }

    // errore per uso "normale"
    return res.status(200).json({
      ok: false,
      error_code: 'CHECK_OPENINGS_ERROR',
      error_message: err.message
    });
  }
};
