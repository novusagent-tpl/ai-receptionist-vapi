const reservations = require('../reservations');

// Giornata 7 – Fase 3: cancel_booking
module.exports = async function cancelBooking(req, res) {
  const body = req.body || {};
  const { restaurant_id, booking_id } = body;

  // 1) VALIDAZIONE STRICT
  if (!restaurant_id || !booking_id) {
    return res.status(400).json({
      ok: false,
      error_code: 'MISSING_PARAMS',
      error_message: 'Parametri obbligatori: restaurant_id, booking_id'
    });
  }

  try {
    // 2) Chiamata a reservations.deleteReservation
    const result = await reservations.deleteReservation(restaurant_id, booking_id);

    if (!result.ok) {
      const status = result.error_code === 'BOOKING_NOT_FOUND' ? 400 : 500;
      return res.status(status).json({
        ok: false,
        error_code: result.error_code || 'CANCEL_BOOKING_ERROR',
        error_message: result.error_message || 'Errore nella cancellazione prenotazione'
      });
    }

    // 3) Risposta STRICT
    return res.status(200).json({
      ok: true,
      booking_id: result.booking_id,
      canceled: true
    });

  } catch (err) {
    console.error('Errore /api/cancel_booking:', err.message);
    return res.status(500).json({
      ok: false,
      error_code: 'CANCEL_BOOKING_ERROR',
      error_message: err.message
    });
  }
};
