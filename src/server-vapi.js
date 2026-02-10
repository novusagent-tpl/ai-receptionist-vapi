require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cors = require('cors');

// Tools API handlers
const checkOpenings = require('./api/check_openings');
const createBooking = require('./api/create_booking');
const listBookings = require('./api/list_bookings');
const modifyBooking = require('./api/modify_booking');
const cancelBooking = require('./api/cancel_booking');
const faq = require('./api/faq');
const sendSms = require('./api/send_sms');
const resolveRelativeDay = require('./api/resolve_relative_day');
const resolveRelativeTime = require('./api/resolve_relative_time');
const isOpenNow = require('./api/is_open_now');

const logger = require('./logger');
const metrics = require('./metrics');
const reservations = require('./reservations');
const { getReservationsBackend } = reservations;

const app = express();

// --- Security headers (helmet) ---
app.use(helmet());

// --- CORS ---
// In produzione consenti solo origini specifiche; in dev consenti tutto.
const ALLOWED_ORIGINS = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['*'];

app.use(cors({
  origin: ALLOWED_ORIGINS.includes('*') ? true : ALLOWED_ORIGINS,
  methods: ['GET', 'POST'],
}));

// Middleware base
app.use(bodyParser.json());

// Middleware: request_id + Vapi call info + backend_used
app.use((req, res, next) => {
  // Genera request_id univoco per ogni richiesta
  req.requestId = logger.generateRequestId();

  // Estrai call_id e conversation_id dal payload Vapi (se presente)
  const vapiInfo = logger.extractVapiCallInfo(req.body);
  req.callId = vapiInfo.call_id || null;
  req.conversationId = vapiInfo.conversation_id || null;

  // Determina backend usato (se restaurant_id presente)
  const body = req.body || {};
  const msg = body.message;
  let restaurantId = body.restaurant_id || null;
  if (msg && msg.type === 'tool-calls') {
    const tc =
      (Array.isArray(msg.toolCalls) && msg.toolCalls[0]) ||
      (Array.isArray(msg.toolCallList) && msg.toolCallList[0]) ||
      null;
    if (tc && tc.function && tc.function.arguments) {
      restaurantId = tc.function.arguments.restaurant_id || restaurantId;
    }
  }
  req.restaurantId = restaurantId;

  try {
    req.backendUsed = restaurantId ? getReservationsBackend(restaurantId) : null;
  } catch {
    req.backendUsed = null;
  }

  // Prompt version dal config ristorante
  try {
    const { getRestaurantConfig } = require('./config/restaurants');
    const cfg = restaurantId ? getRestaurantConfig(restaurantId) : null;
    req.promptVersion = cfg ? (cfg.prompt_version || null) : null;
  } catch {
    req.promptVersion = null;
  }

  // Log ogni richiesta API (solo /api/)
  if (req.path.startsWith('/api/')) {
    logger.info('api_request', {
      request_id: req.requestId,
      method: req.method,
      path: req.path,
      restaurant_id: req.restaurantId,
      backend_used: req.backendUsed,
      prompt_version: req.promptVersion,
      call_id: req.callId,
      conversation_id: req.conversationId,
    });
  }

  // Tracking metriche: misura durata e registra al termine della response
  if (req.path.startsWith('/api/')) {
    const startTime = Date.now();
    const origJson = res.json.bind(res);

    res.json = function (body) {
      const durationMs = Date.now() - startTime;
      const toolPath = req.path.replace('/api/', '');
      const isError = body && (body.ok === false || body.error_code);
      const errorCode = (body && body.error_code) || null;
      const isBookingAttempt = toolPath === 'create_booking';
      const isBookingSuccess = isBookingAttempt && body && body.ok === true;

      metrics.recordRequest({
        restaurantId: req.restaurantId,
        toolPath,
        durationMs,
        isError,
        errorCode,
        isBookingAttempt,
        isBookingSuccess,
      });

      return origJson(body);
    };
  }

  next();
});

// --- Rate limiting (dopo estrazione restaurantId, prima delle route) ---
const { rateLimitMiddleware, getSnapshot: getRateLimitSnapshot } = require('./rate-limiter');
app.use(rateLimitMiddleware);

// --- Kill switch per ristorante ---
const { isRestaurantEnabled } = require('./config/restaurants');

app.use((req, res, next) => {
  if (!req.path.startsWith('/api/')) return next();
  if (!req.restaurantId) return next(); // nessun restaurant_id → lascia passare, l'API handler darà errore di validazione

  if (!isRestaurantEnabled(req.restaurantId)) {
    logger.warn('restaurant_disabled', {
      request_id: req.requestId,
      restaurant_id: req.restaurantId,
    });

    return res.json({
      ok: false,
      error_code: 'RESTAURANT_DISABLED',
      error_message: 'Il servizio prenotazioni per questo ristorante è temporaneamente sospeso. Riprova più tardi o chiama direttamente il ristorante.',
    });
  }

  next();
});

// Porta
const PORT = process.env.PORT || 3000;

// Healthcheck
app.get('/status', (req, res) => {
  return res.json({
    ok: true,
    env: process.env.NODE_ENV || 'dev'
  });
});

// Metrics endpoint — monitoring dashboard
app.get('/metrics', (req, res) => {
  const snapshot = metrics.getSnapshot();
  snapshot.rate_limiting = getRateLimitSnapshot();
  return res.json(snapshot);
});

// --- Debug endpoints (solo in sviluppo, bloccati in produzione) ---
const isProduction = process.env.NODE_ENV === 'production';

app.use('/debug', (req, res, next) => {
  if (isProduction) {
    return res.status(404).json({ ok: false, error: 'Not found' });
  }
  next();
});

const kb = require('./kb');
const timeUtils = require('./time-utils');

app.get('/debug/openings', (req, res) => {
  const restaurantId = req.query.restaurant_id;
  const dateISO = req.query.date;

  if (!restaurantId || !dateISO) {
    return res.status(400).json({
      ok: false,
      error: "Missing restaurant_id or date"
    });
  }

  try {
    const openingsConfig = kb.getOpeningsConfig(restaurantId);
    const result = timeUtils.openingsFor(dateISO, openingsConfig);

    return res.json({
      ok: true,
      restaurant_id: restaurantId,
      date: dateISO,
      closed: result.closed,
      slots: result.slots
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

// DEBUG: create booking
app.get('/debug/create_booking', async (req, res) => {
  try {
    const result = await reservations.createReservation({
      restaurantId: 'roma',
      day: "2025-02-14",
      time: "20:00",
      people: 2,
      name: "Test AI",
      phone: "+393331234567",
      notes: "Debug test"
    });

    return res.json(result);

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/debug/list_bookings', async (req, res) => {
  try {
    const result = await reservations.listReservationsByPhone(
      'roma',
      "+393331234567"
    );

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/debug/update_booking', async (req, res) => {
  try {
    const bookingId = req.query.id;
    if (!bookingId) {
      return res.json({ ok: false, error: "Missing id" });
    }

    const result = await reservations.updateReservation(
      'roma',
      bookingId,
      {
        new_day: "2025-02-15",
        new_time: "21:00",
        new_people: 3
      }
    );

    return res.json(result);

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/debug/delete_booking', async (req, res) => {
  try {
    const bookingId = req.query.id;
    if (!bookingId) {
      return res.json({ ok: false, error: "Missing id" });
    }

    const result = await reservations.deleteReservation(
      'roma',
      bookingId
    );

    return res.json(result);

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

const calendar = require('./calendar');

app.get('/debug/calendar_create', async (req, res) => {
  try {
    const result = await calendar.createCalendarEvent({
      calendarId: "09855ac5f977a03d174f27c715e8f9d10a726b35b28e45a2da23b05e9b3cb106@group.calendar.google.com",
      day: "2025-02-20",
      time: "19:30",
      people: 2,
      name: "Calendar Test",
      phone: "+393331234567",
      notes: "Test evento manuale"
    });

    return res.json(result);

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});


app.get('/debug/calendar_update', async (req, res) => {
  try {
    const eventId = req.query.id;
    if (!eventId) {
      return res.json({ ok: false, error: "Missing id" });
    }

    const result = await calendar.updateCalendarEvent({
      calendarId: "09855ac5f977a03d174f27c715e8f9d10a726b35b28e45a2da23b05e9b3cb106@group.calendar.google.com",
      eventId,
      day: "2025-02-20",
      time: "21:00",
      people: 3,
      name: "Calendar Update",
      phone: "+393331234567",
      notes: "Modificato da debug"
    });

    return res.json(result);

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/debug/calendar_delete', async (req, res) => {
  try {
    const eventId = req.query.id;
    if (!eventId) {
      return res.json({ ok: false, error: "Missing id" });
    }

    const result = await calendar.deleteCalendarEvent({
      calendarId: "09855ac5f977a03d174f27c715e8f9d10a726b35b28e45a2da23b05e9b3cb106@group.calendar.google.com",
      eventId
    });

    return res.json(result);

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// -----------------------------------------
// Tools API (VAPI)
// -----------------------------------------
app.post('/api/check_openings', checkOpenings);
app.post('/api/create_booking', createBooking);
app.post('/api/list_bookings', listBookings);
app.post('/api/modify_booking', modifyBooking);
app.post('/api/cancel_booking', cancelBooking);
app.post('/api/faq', faq);
app.post('/api/send_sms', sendSms);
app.post('/api/resolve_relative_day', resolveRelativeDay);
app.post('/api/resolve_relative_time', resolveRelativeTime);
app.post('/api/is_open_now', isOpenNow);


// Avvio server
app.listen(PORT, () => {
  console.log(`AI Receptionist VAPI backend listening on port ${PORT}`);
});
