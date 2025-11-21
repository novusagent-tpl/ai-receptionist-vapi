const kb = require('../kb');
const reservations = require('../reservations');

module.exports = async function createBooking(req, res) {
  const body = req.body || {};
  const {
    restaurant_id,
    day,
    time,
    people,
    name,
    phone,
    notes
  } = body;

  // VALIDATION STRICT
  if (!restaurant_id || !day || !time || !people || !name || !phone) {
    return res.status(200).json({
      ok: false,
      error_code: 'VALIDATION_ERROR',
      error_message: 'restaurant_id, day, time, people, name, phone sono obbligatori'
    });
  }

  const peopleNum = Number(people);
  if (!Number.isFinite(peopleNum) || peopleNum <= 0) {
    return res.status(200).json({
      ok: false,
      error_code: 'VALIDATION_ERROR',
      error_message: 'people deve essere un numero positivo'
    });
  }

  try {
    // max_people dal KB
    const info = kb.getRestaurantInfo(restaurant_id);
    if (info.max_people && peopleNum > info.max_people) {
      return res.status(200).json({
        ok: false,
        error_code: 'MAX_PEOPLE_EXCEEDED',
        error_message: `Numero massimo persone per prenotazione: ${info.max_people}`
      });
    }

    // Creazione prenotazione reale
    const result = await reservations.createReservation({
      restaurantId: restaurant_id,
      day,
      time,
      people: peopleNum,
      name,
      phone,
      notes: notes || null
    });

    return res.status(200).json(result);

  } catch (err) {
    console.error('Errore /api/create_booking:', err.message);
    return res.status(200).json({
      ok: false,
      error_code: 'CREATE_BOOKING_ERROR',
      error_message: err.message
    });
  }
};

