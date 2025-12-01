const kb = require('../kb');
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

module.exports = async function faq(req, res) {
  try {
    const body = req.body || {};
    const { isVapi, toolCallId, args } = extractVapiContext(req);

    // Se arriva da Vapi, prendiamo gli argomenti da function.arguments
    const source = isVapi ? args : body;

    let { restaurant_id, question } = source;

    restaurant_id = restaurant_id && String(restaurant_id).trim();
    question = question && String(question).trim();

    // VALIDAZIONE STRICT
    if (!restaurant_id || !question) {
      const errorMsg = 'restaurant_id e question sono obbligatori';

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

    // Lettura FAQ dal KB
    const entries = kb.getFaqEntries(restaurant_id);
    const qNorm = question.toLowerCase();

    let matchedAnswer = null;

    for (const entry of entries) {
      if (!entry || !entry.q || !entry.a) continue;
      const eNorm = String(entry.q).trim().toLowerCase();

      // match esatto case-insensitive
      if (eNorm === qNorm) {
        matchedAnswer = String(entry.a);
        break;
      }
    }

    const payload = {
      ok: true,
      answer: matchedAnswer,
      source: matchedAnswer ? 'kb' : null
    };

   // Log successo sintetico
    logger.info('faq_success', {
      restaurant_id,
      has_answer: !!matchedAnswer,
      source: isVapi ? 'vapi' : 'http',
      request_id: req.requestId || null,
    });

    // Risposta per Vapi (tool-calls)
    if (isVapi && toolCallId) {
      return res.status(200).json({
        results: [
          {
            toolCallId,
            result: JSON.stringify(payload)
          }
        ]
      });
    }

    // Risposta "normale" per Postman / altri client
    return res.status(200).json(payload);
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
            error: `FAQ_ERROR: ${err.message || String(err)}`
          }
        ]
      });
    }

    return res.status(200).json({
      ok: false,
      error_code: 'FAQ_ERROR',
      error_message: err.message
    });
  }
};
