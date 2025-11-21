let twilioClient = null;

try {
  const twilio = require('twilio');
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  } else {
    console.warn('Twilio non configurato: variabili mancanti');
  }
} catch (err) {
  console.warn('Twilio non disponibile:', err.message);
}

module.exports = async function sendSms(req, res) {
  const body = req.body || {};
  const { restaurant_id, to, message } = body;

  // VALIDATION STRICT
  if (!restaurant_id || !to || !message) {
    return res.status(200).json({
      ok: false,
      error_code: 'VALIDATION_ERROR',
      error_message: 'restaurant_id, to e message sono obbligatori'
    });
  }

  // Nessun invio se Twilio non è configurato
  if (!twilioClient || !process.env.TWILIO_FROM_NUMBER) {
    return res.status(200).json({
      ok: false,
      error_code: 'SMS_NOT_CONFIGURED',
      error_message: 'Twilio non configurato per invio SMS'
    });
  }

  try {
    const sms = await twilioClient.messages.create({
      from: process.env.TWILIO_FROM_NUMBER,
      to,
      body: message
    });

    return res.status(200).json({
      ok: true,
      restaurant_id,
      to,
      sid: sms.sid
    });

  } catch (err) {
    console.error('Errore /api/send_sms:', err.message);
    return res.status(200).json({
      ok: false,
      error_code: 'SMS_ERROR',
      error_message: err.message
    });
  }
};
