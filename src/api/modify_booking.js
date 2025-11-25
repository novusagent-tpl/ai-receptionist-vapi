const reservations = require('../reservations');

// Giornata 7 – Fase 3: modify_booking
module.exports = async function modifyBooking(req, res) {
  const body = req.body || {};
  const {
    restaurant_id,
    booking_id,
    new_day,
    new_time,
    new_people
  } = body;

  // 1) VALIDAZIONE STRICT
  if (!restaurant_id || !booking_id) {
    return res.status(400).json({
      ok: false,
      error_code: 'MISSING_PARAMS',
      error_message: 'Parametri obbligatori: restaurant_id, booking_id'
    });
  }

  if (!new_day && !new_time && (new_people === undefined || new_people === null)) {
    return res.status(400).json({
      ok: false,
      error_code: 'NO_FIELDS_TO_UPDATE',
      error_message: 'Serve almeno uno tra new_day, new_time, new_people'
    });
  }

  try {
    // 2) Chiamata a reservations.updateReservation
    const result = await reservations.updateReservation(
      restaurant_id,
      booking_id,
      {
        new_day,
        new_time,
        new_people
      }
    );

    // 3) Gestione errori dal modulo reservations
    if (!result.ok) {
      const status = result.error_code === 'BOOKING_NOT_FOUND' ? 400 : 500;
      return res.status(status).json({
        ok: false,
        error_code: result.error_code || 'MODIFY_BOOKING_ERROR',
        error_message: result.error_message || 'Errore nella modifica prenotazione'
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
    console.error('Errore /api/modify_booking:', err.message);
    return res.status(500).json({
      ok: false,
      error_code: 'MODIFY_BOOKING_ERROR',
      error_message: err.message
    });
  }
};
