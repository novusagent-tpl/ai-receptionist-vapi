// Giornata 7 – Fase 5: send_sms (Twilio, multi-ristorante)
const twilio = require('twilio');
const restaurants = require('../config/ristoranti.json');

module.exports = async function sendSms(req, res) {
  const body = req.body || {};
  const { restaurant_id, to, message } = body;

  // 1) VALIDAZIONE STRICT
  if (!restaurant_id || !to || !message) {
    return res.status(400).json({
      ok: false,
      error_code: 'MISSING_PARAMS',
      error_message: 'Parametri obbligatori: restaurant_id, to, message'
    });
  }

  try {
    // 2) Recupera config del ristorante
    const ristoConfig = restaurants[restaurant_id];
    if (!ristoConfig) {
      return res.status(400).json({
        ok: false,
        error_code: 'INVALID_RESTAURANT',
        error_message: 'restaurant_id non valido'
      });
    }

    if (!ristoConfig.sms_number) {
      return res.status(500).json({
        ok: false,
        error_code: 'CONFIG_ERROR',
        error_message: 'sms_number non configurato per questo ristorante'
      });
    }

    // 3) Inizializza Twilio
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // 4) Invio SMS
    const result = await client.messages.create({
      body: message,
      from: ristoConfig.sms_number, // numero del ristorante (mittente)
      to                              // numero del cliente (destinatario)
    });

    // 5) Risposta STRICT
    return res.status(200).json({
      ok: true,
      sid: result.sid
    });

  } catch (err) {
    console.error('Errore /api/send_sms:', err.message);
    return res.status(500).json({
      ok: false,
      error_code: 'SEND_SMS_ERROR',
      error_message: err.message
    });
  }
};

