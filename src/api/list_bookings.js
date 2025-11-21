const reservations = require('../reservations');

module.exports = async function listBookings(req, res) {
  const body = req.body || {};
  const { restaurant_id, phone } = body;

  // VALIDATION STRICT
  if (!restaurant_id || !phone) {
    return res.status(200).json({
      ok: false,
      error_code: 'VALIDATION_ERROR',
      error_message: 'restaurant_id e phone sono obbligatori'
    });
  }

  try {
    const result = await reservations.listReservationsByPhone(
      restaurant_id,
      phone
    );

    return res.status(200).json(result);

  } catch (err) {
    console.error('Errore /api/list_bookings:', err.message);
    return res.status(200).json({
      ok: false,
      error_code: 'LIST_BOOKINGS_ERROR',
      error_message: err.message
    });
  }
};
