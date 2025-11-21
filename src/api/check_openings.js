const kb = require('../kb');
const timeUtils = require('../time-utils');

module.exports = async function checkOpenings(req, res) {
  const body = req.body || {};
  const { restaurant_id, date } = body;

  // VALIDATION STRICT
  if (!restaurant_id || !date) {
    return res.status(200).json({
      ok: false,
      error_code: 'VALIDATION_ERROR',
      error_message: 'restaurant_id e date sono obbligatori'
    });
  }

  try {
    // 1) Ottieni configurazione di apertura del ristorante
    const openingsConfig = kb.getOpeningsConfig(restaurant_id);

    // 2) Calcola gli slot tramite modulo time-utils
    const result = timeUtils.openingsFor(date, openingsConfig);

    // 3) Risposta STRICT
    return res.status(200).json({
      ok: true,
      restaurant_id,
      date,
      closed: result.closed,
      slots: result.slots
    });

  } catch (err) {
    console.error('Errore /api/check_openings:', err.message);
    return res.status(200).json({
      ok: false,
      error_code: 'CHECK_OPENINGS_ERROR',
      error_message: err.message
    });
  }
};
