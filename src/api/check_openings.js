const kb = require('../kb');
const timeUtils = require('../time-utils');

module.exports = async function checkOpenings(req, res) {
  const body = req.body || {};
  const { restaurant_id, day } = body;

  // VALIDATION STRICT
  if (!restaurant_id || !day) {
    return res.status(400).json({
      ok: false,
      error_code: 'MISSING_PARAMS',
      error_message: 'Parametri obbligatori: restaurant_id, day'
    });
  }

  try {
    const openingsConfig = kb.getOpeningsConfig(restaurant_id);
    const result = timeUtils.openingsFor(day, openingsConfig);

    return res.status(200).json({
      ok: true,
      closed: result.closed,
      slots: result.slots
    });

  } catch (err) {
    console.error('Errore /api/check_openings:', err.message);
    return res.status(500).json({
      ok: false,
      error_code: 'CHECK_OPENINGS_ERROR',
      error_message: err.message
    });
  }
};






