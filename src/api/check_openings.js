const kb = require('../kb');
const timeUtils = require('../time-utils');

module.exports = async function checkOpenings(req, res) {
console.log('CHECK_OPENINGS BODY:', JSON.stringify(req.body, null, 2));

  try {
    const body = req.body || {};

    // Verifica se arriva da Vapi (tool-calls)
    let isVapi = false;
    let toolCallId = null;
    let args = {};
    let restaurantId = null;
    let dayISO = null;

    if (body.message && body.message.type === "tool-calls") {
      isVapi = true;

      const tc = body.message.toolCallList?.[0];
      toolCallId = tc?.id;

      // ---- QUI LA DIFFERENZA: arguments è UNA STRINGA JSON ----
      if (tc?.function?.arguments) {
        try {
          args = JSON.parse(tc.function.arguments);
        } catch (err) {
          console.error("Errore parsing arguments:", err);
        }
      }

      restaurantId = args.restaurant_id;
      dayISO = args.day || args.date;

    } else {
      // Chiamata normale (Postman)
      restaurantId = body.restaurant_id;
      dayISO = body.day || body.date;
    }

    // VALIDAZIONE
    if (!restaurantId || !dayISO) {
      if (isVapi) {
        return res.status(200).json({
          results: [
            {
              toolCallId,
              error: "VALIDATION_ERROR: restaurant_id e day sono obbligatori"
            }
          ]
        });
      }

      return res.status(200).json({
        ok: false,
        error_code: "VALIDATION_ERROR",
        error_message: "restaurant_id e day sono obbligatori"
      });
    }

    // LOGICA ORARI
    const openingsConfig = kb.getOpeningsConfig(restaurantId);
    const result = timeUtils.openingsFor(dayISO, openingsConfig);

    // RISPOSTA PER VAPI (obbligatoria)
    if (isVapi) {
      return res.status(200).json({
        results: [
          {
            toolCallId,
            result: JSON.stringify({
              restaurant_id: restaurantId,
              day: dayISO,
              closed: result.closed,
              slots: result.slots
            })
          }
        ]
      });
    }

    // RISPOSTA PER POSTMAN
    return res.status(200).json({
      ok: true,
      restaurant_id: restaurantId,
      day: dayISO,
      closed: result.closed,
      slots: result.slots
    });

  } catch (err) {
    console.error("Errore /api/check_openings:", err);

    const body = req.body || {};
    const toolMessage = body.message?.type === "tool-calls" ? body.message : null;
    const toolCallId = toolMessage?.toolCallList?.[0]?.id;

    if (toolCallId) {
      return res.status(200).json({
        results: [
          {
            toolCallId,
            error: "CHECK_OPENINGS_ERROR: " + err.message
          }
        ]
      });
    }

    return res.status(200).json({
      ok: false,
      error_code: "CHECK_OPENINGS_ERROR",
      error_message: err.message
    });
  }
};
