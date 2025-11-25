const reservations = require('../reservations');

// Giornata 7 – Fase 3: list_bookings
module.exports = async function listBookings(req, res) {
  const body = req.body || {};
  const { restaurant_id, phone } = body;

  // 1) VALIDAZIONE STRICT
  if (!restaurant_id || !phone) {
    return res.status(400).json({
      ok: false,
      error_code: 'MISSING_PARAMS',
      error_message: 'Parametri obbligatori: restaurant_id, phone'
    });
  }

  try {
    // 2) Chiamata a reservations.listReservationsByPhone
    const result = await reservations.listReservationsByPhone(restaurant_id, phone);

    if (!result.ok) {
      return res.status(500).json({
        ok: false,
        error_code: result.error_code || 'LIST_BOOKINGS_ERROR',
        error_message: result.error_message || 'Errore nel recupero prenotazioni'
      });
    }

    // 3) Risposta STRICT
    return res.status(200).json({
      ok: true,
      results: result.results || []
    });

  } catch (err) {
    console.error('Errore /api/list_bookings:', err.message);
    return res.status(500).json({
      ok: false,
      error_code: 'LIST_BOOKINGS_ERROR',
      error_message: err.message
    });
  }
};
