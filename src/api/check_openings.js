const kb = require('../kb');
const timeUtils = require('../time-utils');

module.exports = async function checkOpenings(req, res) {
  try {
    const body = req.body || {};

    // ---- Rileva se la chiamata arriva da Vapi (tool-calls) ----
    const toolMessage =
      body.message && body.message.type === 'tool-calls'
        ? body.message
        : null;

    let restaurantId;
    let dayISO;
    let toolCallId = null;
    let isVapi = false;

    if (
      toolMessage &&
      Array.isArray(toolMessage.toolCallList) &&
      toolMessage.toolCallList.length > 0
    ) {
      // CHIAMATA DA VAPI
      isVapi = true;
      const tc = toolMessage.toolCallList[0];
      toolCallId = tc.id;

      // negli esempi Vapi gli argomenti stanno in "arguments"
      const args =
        tc.arguments ||
        (tc.function && tc.function.parameters) ||
        {};

      restaurantId = args.restaurant_id;
      // accetta sia "day" che "date"
      dayISO = args.day || args.date;
    } else {
      // CHIAMATA "NORMALE" (Postman, ecc.)
      restaurantId = body.restaurant_id;
      dayISO = body.day || body.date;
    }

    // ---- VALIDAZIONE ----
    if (!restaurantId || !dayISO) {
      if (isVapi) {
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

    // ---- LOGICA APERTURE ----
    const openingsConfig = kb.getOpeningsConfig(restaurantId);
    const result = timeUtils.openingsFor(dayISO, openingsConfig);

    // ---- RISPOSTA PER VAPI (formato tools) ----
    if (isVapi) {
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
            // Vapi preferisce una stringa singola: mandiamo JSON stringificato
            result: JSON.stringify(payload)
          }
        ]
      });
    }

    // ---- RISPOSTA "LEGACY" PER TEST MANUALI ----
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
    const toolMessage =
      body.message && body.message.type === 'tool-calls'
        ? body.message
        : null;

    const toolCallId =
      toolMessage &&
      Array.isArray(toolMessage.toolCallList) &&
      toolMessage.toolCallList[0] &&
      toolMessage.toolCallList[0].id;

    if (toolCallId) {
      // errore in formato Vapi ma SEMPRE HTTP 200
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





