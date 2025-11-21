const reservations = require('../reservations');

module.exports = async function modifyBooking(req, res) {
  const body = req.body || {};
  const {
    restaurant_id,
    booking_id,
    new_day,
    new_time,
    new_people
  } = body;

  // VALIDATION STRICT
  if (!restaurant_id || !booking_id) {
    return res.status(200).json({
      ok: false,
      error_code: 'VALIDATION_ERROR',
      error_message: 'restaurant_id e booking_id sono obbligatori'
    });
  }

  if (!new_day && !new_time && (new_people === undefined || new_people === null)) {
    return res.status(200).json({
      ok: false,
      error_code: 'VALIDATION_ERROR',
      error_message: 'serve almeno uno tra new_day, new_time, new_people'
    });
  }

  let peopleNum = undefined;
  if (new_people !== undefined && new_people !== null) {
    peopleNum = Number(new_people);
    if (!Number.isFinite(peopleNum) || peopleNum <= 0) {
      return res.status(200).json({
        ok: false,
        error_code: 'VALIDATION_ERROR',
        error_message: 'new_people deve essere un numero positivo'
      });
    }
  }

  try {
    const result = await reservations.updateReservation(
      restaurant_id,
      booking_id,
      {
        new_day: new_day || undefined,
        new_time: new_time || undefined,
        new_people: peopleNum
      }
    );

    return res.status(200).json(result);

  } catch (err) {
    console.error('Errore /api/modify_booking:', err.message);
    return res.status(200).json({
      ok: false,
      error_code: 'MODIFY_BOOKING_ERROR',
      error_message: err.message
    });
  }
};
