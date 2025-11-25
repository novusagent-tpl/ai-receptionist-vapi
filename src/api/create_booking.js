const reservations = require('../reservations');

// Giornata 7 – Fase 3: create_booking
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

  // 1) VALIDAZIONE STRICT
  if (!restaurant_id || !day || !time || !people || !name || !phone) {
    return res.status(400).json({
      ok: false,
      error_code: 'MISSING_PARAMS',
      error_message: 'Parametri obbligatori: restaurant_id, day, time, people, name, phone'
    });
  }

  try {
    // 2) Chiamata a reservations.createReservation
    const result = await reservations.createReservation({
      restaurantId: restaurant_id,
      day,
      time,
      people,
      name,
      phone,
      notes: notes || ''
    });

    // 3) Gestione errori dal modulo reservations
    if (!result.ok) {
      return res.status(500).json({
        ok: false,
        error_code: result.error_code || 'CREATE_BOOKING_ERROR',
        error_message: result.error_message || 'Errore nella creazione prenotazione'
      });
    }

    // 4) Risposta STRICT
    return res.status(200).json({
      ok: true,
      booking_id: result.booking_id,
      day: result.day,
      time: result.time,
      people: result.people,
      name: result.name,
      phone: result.phone,
      notes: result.notes || null
    });

  } catch (err) {
    console.error('Errore /api/create_booking:', err.message);
    return res.status(500).json({
      ok: false,
      error_code: 'CREATE_BOOKING_ERROR',
      error_message: err.message
    });
  }
};

