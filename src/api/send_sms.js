const kb = require('../kb');
const twilio = require('twilio');

// Inizializza client Twilio se configurato
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
let twilioClient = null;

if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
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

module.exports = async function sendSms(req, res) {
  try {
    const body = req.body || {};
    const { isVapi, toolCallId, args } = extractVapiContext(req);

    // Se viene da Vapi, usiamo gli arguments; altrimenti il body "normale"
    const source = isVapi ? args : body;

    let { restaurant_id, to, message } = source;

    restaurant_id = restaurant_id && String(restaurant_id).trim();
    to = to && String(to).trim();
    message = message && String(message).trim();

    // VALIDAZIONE STRICT
    if (!restaurant_id || !to || !message) {
      const errorMsg = 'restaurant_id, to e message sono obbligatori';

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

    // Config ristorante (per numero mittente)
    const info = kb.getRestaurantInfo(restaurant_id);
    const fromNumber = (info && info.sms_number) || process.env.TWILIO_PHONE_NUMBER;

    if (!fromNumber) {
      const errorMsg = 'Numero mittente SMS non configurato (sms_number o TWILIO_PHONE_NUMBER mancante)';

      if (isVapi && toolCallId) {
        return res.status(200).json({
          results: [
            {
              toolCallId,
              error: `CONFIG_ERROR: ${errorMsg}`
            }
          ]
        });
      }

      return res.status(200).json({
        ok: false,
        error_code: 'CONFIG_ERROR',
        error_message: errorMsg
      });
    }

    if (!twilioClient) {
      const errorMsg = 'Twilio non configurato (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN mancanti)';

      if (isVapi && toolCallId) {
        return res.status(200).json({
          results: [
            {
              toolCallId,
              error: `TWILIO_NOT_CONFIGURED: ${errorMsg}`
            }
          ]
        });
      }

      return res.status(200).json({
        ok: false,
        error_code: 'TWILIO_NOT_CONFIGURED',
        error_message: errorMsg
      });
    }

    // Invio SMS reale
    const sms = await twilioClient.messages.create({
      to,
      from: fromNumber,
      body: message
    });

    const payload = {
      ok: true,
      sid: sms.sid,
      to,
      from: fromNumber
    };

    // Risposta per Vapi
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
    console.error('Errore /api/send_sms:', err);

    const { isVapi, toolCallId } = extractVapiContext(req);

    if (isVapi && toolCallId) {
      return res.status(200).json({
        results: [
          {
            toolCallId,
            error: `SEND_SMS_ERROR: ${err.message || String(err)}`
          }
        ]
      });
    }

    return res.status(200).json({
      ok: false,
      error_code: 'SEND_SMS_ERROR',
      error_message: err.message
    });
  }
};

