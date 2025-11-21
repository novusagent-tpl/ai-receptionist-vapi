const reservations = require('../reservations');

module.exports = async function cancelBooking(req, res) {
  const body = req.body || {};
  const { restaurant_id, booking_id } = body;

  // VALIDATION STRICT
  if (!restaurant_id || !booking_id) {
    return res.status(200).json({
      ok: false,
      error_code: 'VALIDATION_ERROR',
      error_message: 'restaurant_id e booking_id sono obbligatori'
    });
  }

  try {
    const result = await reservations.deleteReservation(
      restaurant_id,
      booking_id
    );

    return res.status(200).json(result);

  } catch (err) {
    console.error('Errore /api/cancel_booking:', err.message);
    return res.status(200).json({
      ok: false,
      error_code: 'CANCEL_BOOKING_ERROR',
      error_message: err.message
    });
  }
};
