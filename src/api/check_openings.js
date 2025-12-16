const kb = require('../kb');
const timeUtils = require('../time-utils');
const logger = require('../logger');

/* =========================
   Helpers: time validation + nearest slots
========================= */

function isValidHHMM(s) {
  if (!s || typeof s !== 'string') return false;
  const m = s.match(/^(\d{2}):(\d{2})$/);
  if (!m) return false;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  return Number.isInteger(hh) && Number.isInteger(mm) && hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function nearestSlots(slots, requestedTime, max = 3) {
  if (!Array.isArray(slots) || slots.length === 0) return [];
  const req = toMinutes(requestedTime);

  return slots
    .map(s => ({ s, d: Math.abs(toMinutes(s) - req) }))
    .sort((a, b) => a.d - b.d)
    .map(x => x.s)
    .slice(0, max);
}

module.exports = async function checkOpenings(req, res) {
  // IMPORTANT: queste variabili devono stare fuori dal try
  // perché nel catch dobbiamo poter loggare con contesto.
  let restaurantId = null;
  let dayISO = null;
  let requestedTime = null;

  let isVapi = false;
  let toolCallId = null;

  try {
    const body = req.body || {};

    // --- RICONOSCIMENTO CHIAMATA DA VAPI (tool-calls) ---
    if (body.message && body.message.type === 'tool-calls') {
      isVapi = true;

      // Vapi ti manda sia toolCalls che toolCallList, usiamo il primo valido
      const tc =
        (Array.isArray(body.message.toolCalls) && body.message.toolCalls[0]) ||
        (Array.isArray(body.message.toolCallList) && body.message.toolCallList[0]) ||
        null;

      if (tc) {
        toolCallId = tc.id;

        // arguments è già un OGGETTO, NON una stringa
        const args = (tc.function && tc.function.arguments) || {};

        restaurantId = args.restaurant_id;
        dayISO = args.day || args.date;
        requestedTime = args.time || null;
      }
    } else {
      // --- CHIAMATA "NORMALE" (Postman, ecc.) ---
      restaurantId = body.restaurant_id;
      dayISO = body.day || body.date;
      requestedTime = body.time || null;
    }

    // normalize requestedTime (se presente)
    if (requestedTime != null) {
      requestedTime = String(requestedTime).trim();
      if (requestedTime === '') requestedTime = null;
    }

    const logBase = {
      restaurant_id: restaurantId || null,
      day: dayISO || null,
      time: requestedTime || null,
      source: isVapi ? 'vapi' : 'http',
      request_id: req.requestId || null,
    };

    // --- VALIDAZIONE day + restaurant ---
    if (!restaurantId || !dayISO) {
      const errMsg = 'restaurant_id e day sono obbligatori';

      logger.error('check_openings_validation_error', {
        ...logBase,
        message: errMsg,
      });

      if (isVapi && toolCallId) {
        return res.status(200).json({
          results: [{ toolCallId, error: `VALIDATION_ERROR: ${errMsg}` }]
        });
      }

      return res.status(200).json({
        ok: false,
        error_code: 'VALIDATION_ERROR',
        error_message: errMsg
      });
    }

    // --- VALIDAZIONE time (opzionale) ---
    if (requestedTime) {
      if (!isValidHHMM(requestedTime)) {
        const errMsg = 'time non valido. Formato richiesto HH:MM';

        logger.error('check_openings_validation_error', {
          ...logBase,
          message: errMsg,
        });

        if (isVapi && toolCallId) {
          return res.status(200).json({
            results: [{ toolCallId, error: `VALIDATION_ERROR: ${errMsg}` }]
          });
        }

        return res.status(200).json({
          ok: false,
          error_code: 'VALIDATION_ERROR',
          error_message: errMsg
        });
      }
    }

    // --- LOGICA ORARI ---
    const openingsConfig = kb.getOpeningsConfig(restaurantId);
    const result = timeUtils.openingsFor(dayISO, openingsConfig);

    // availability (solo se requestedTime presente)
    let available = null;
    let nearest = null;

    if (requestedTime) {
      available = Array.isArray(result.slots) && result.slots.includes(requestedTime);
      nearest = available ? [] : nearestSlots(result.slots, requestedTime, 3);
    }

    // Log successo sintetico
    logger.info('check_openings_success', {
      restaurant_id: restaurantId,
      day: dayISO,
      closed: !!result.closed,
      openings_count: Array.isArray(result.slots) ? result.slots.length : 0,
      requested_time: requestedTime || null,
      available,
      source: isVapi ? 'vapi' : 'http',
      request_id: req.requestId || null,
    });

    // --- RISPOSTA PER VAPI (formato tools) ---
    if (isVapi && toolCallId) {
      const payload = {
        restaurant_id: restaurantId,
        day: dayISO,
        closed: result.closed,
        slots: result.slots,
        requested_time: requestedTime || null,
        available,
        nearest_slots: nearest
      };

      return res.status(200).json({
        results: [{
          toolCallId,
          // Vapi vuole una stringa singola come result
          result: JSON.stringify(payload)
        }]
      });
    }

    // --- RISPOSTA "LEGACY" PER TEST MANUALI (Postman) ---
    return res.status(200).json({
      ok: true,
      restaurant_id: restaurantId,
      day: dayISO,
      closed: result.closed,
      slots: result.slots,
      requested_time: requestedTime || null,
      available,
      nearest_slots: nearest
    });

  } catch (err) {
    const errMsg = err && err.message ? err.message : String(err);

    logger.error('check_openings_error', {
      restaurant_id: restaurantId || null,
      day: dayISO || null,
      requested_time: requestedTime || null,
      message: errMsg,
      source: isVapi ? 'vapi' : 'http',
      request_id: req.requestId || null,
    });

    const body = req.body || {};
    let tcId = null;

    if (body.message && body.message.type === 'tool-calls') {
      const tc =
        (Array.isArray(body.message.toolCalls) && body.message.toolCalls[0]) ||
        (Array.isArray(body.message.toolCallList) && body.message.toolCallList[0]) ||
        null;
      tcId = tc && tc.id;
    }

    if (tcId) {
      // errore per Vapi → SEMPRE 200 con results[]
      return res.status(200).json({
        results: [{
          toolCallId: tcId,
          error: `CHECK_OPENINGS_ERROR: ${errMsg}`
        }]
      });
    }

    // errore per uso "normale"
    return res.status(200).json({
      ok: false,
      error_code: 'CHECK_OPENINGS_ERROR',
      error_message: errMsg
    });
  }
};
