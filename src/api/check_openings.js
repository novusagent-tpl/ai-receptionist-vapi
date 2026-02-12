const kb = require('../kb');
const timeUtils = require('../time-utils');
const logger = require('../logger');
const reservations = require('../reservations');
const { getRestaurantConfig } = require('../config/restaurants');
const { DateTime } = require('luxon');

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

function hhmmToMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return (h * 60) + m;
}

// Split slots into contiguous blocks (e.g., lunch vs dinner) using stepMinutes gap
function splitIntoBlocks(slots, stepMinutes = 30) {
  const mins = (slots || []).map(hhmmToMinutes).sort((a,b)=>a-b);
  const blocks = [];
  let cur = [];

  for (const x of mins) {
    if (!cur.length) { cur.push(x); continue; }
    const prev = cur[cur.length - 1];
    if (x - prev > stepMinutes) { blocks.push(cur); cur = [x]; }
    else cur.push(x);
  }
  if (cur.length) blocks.push(cur);
  return blocks;
}

// Returns a Set of bookable slot minutes after applying cutoff per block
function applyCutoffToSlots(slots, cutoffMinutes, stepMinutes = 30) {
  if (!cutoffMinutes || cutoffMinutes <= 0) {
    return new Set((slots || []).map(hhmmToMinutes));
  }

  const blocks = splitIntoBlocks(slots, stepMinutes);
  const bookable = new Set();

  for (const block of blocks) {
    const lastStart = block[block.length - 1];
    const closing = lastStart + stepMinutes;              // infer close as last slot + step
    const threshold = closing - cutoffMinutes;            // latest allowed start time (in minutes)
    for (const t of block) {
      if (t <= threshold) bookable.add(t);
    }
  }
  return bookable;
}


function buildDateTime(dayISO, hhmm, tz = 'Europe/Rome') {
  const [hh, mm] = hhmm.split(':').map(Number);
  return DateTime.fromISO(dayISO, { zone: tz }).set({
    hour: hh, minute: mm, second: 0, millisecond: 0
  });
}

function countActiveAt(dayISO, atTime, bookingTimes, avgStayMinutes, tz = 'Europe/Rome') {
  // Overlap bidirezionale: una nuova prenotazione a atTime con durata avgStayMinutes
  // conflitterebbe con tutte le prenotazioni il cui intervallo si sovrappone.
  const newStart = buildDateTime(dayISO, atTime, tz);
  const newEnd = newStart.plus({ minutes: avgStayMinutes });
  let count = 0;

  for (const bt of bookingTimes) {
    if (!bt || typeof bt !== 'string' || !/^\d{2}:\d{2}$/.test(bt)) continue;
    const existStart = buildDateTime(dayISO, bt, tz);
    const existEnd = existStart.plus({ minutes: avgStayMinutes });
    // Due intervalli [a,b) e [c,d) si sovrappongono se a < d AND c < b
    if (existStart < newEnd && newStart < existEnd) count++;
  }

  return count;
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

// --- GUARD: blocca date placeholder / non valide ---
const dayStr = String(dayISO || '').trim();

// blocca il placeholder che l’LLM inventa spesso
if (dayStr === '2023-10-04') {
  const errMsg = 'day placeholder non valido';

  logger.error('check_openings_validation_error', {
    ...logBase,
    day: dayStr,
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

// formato minimo YYYY-MM-DD
if (!/^\d{4}-\d{2}-\d{2}$/.test(dayStr)) {
  const errMsg = 'day deve essere YYYY-MM-DD';

  logger.error('check_openings_validation_error', {
    ...logBase,
    day: dayStr,
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

dayISO = dayStr;


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

    // --- VALIDAZIONE ORARIO NEL PASSATO (se requestedTime presente) ---
    if (requestedTime) {
      const now = DateTime.now().setZone('Europe/Rome');
      const dayDt = DateTime.fromISO(dayISO, { zone: 'Europe/Rome' });
      
      if (dayDt.isValid) {
        const [hh, mm] = requestedTime.split(':').map(Number);
        const requestedDt = dayDt.set({ hour: hh, minute: mm, second: 0, millisecond: 0 });
        
        // Se l'orario è nel passato (anche oggi)
        if (requestedDt < now) {
          const errMsg = 'L\'orario indicato è già passato.';
          
          logger.error('check_openings_past_time', {
            restaurant_id: restaurantId,
            day: dayISO,
            requested_time: requestedTime,
            message: errMsg,
            source: isVapi ? 'vapi' : 'http',
            request_id: req.requestId || null,
          });
          
          if (isVapi && toolCallId) {
            return res.status(200).json({
              results: [{
                toolCallId,
                error: `PAST_TIME: ${errMsg}`
              }]
            });
          }
          
          return res.status(200).json({
            ok: false,
            error_code: 'PAST_TIME',
            error_message: errMsg
          });
        }
      }
    }

    // availability (solo se requestedTime presente)
    let available = null;
    let nearest = null;
    let reason = null; // 'cutoff' | 'not_in_openings' | 'full' | null

    if (requestedTime) {
      const slots = Array.isArray(result.slots) ? result.slots : [];
      const info = kb.getRestaurantInfo(restaurantId);
      const cutoffMin = Number(info && info.booking_cutoff_minutes) || 0;
      const bookableSet = applyCutoffToSlots(slots, cutoffMin, 30);
      const bookableSlots = slots.filter(s => bookableSet.has(hhmmToMinutes(s)));

      const inOpenings = slots.includes(requestedTime);       // dentro fascia teorica
      const slotExists = bookableSlots.includes(requestedTime); // prenotabile dopo cutoff

      const tz = (info && info.timezone) || 'Europe/Rome';

      const maxConc = Number(info && info.max_concurrent_bookings);
      const stayMin = Number(info && info.avg_stay_minutes);

      if (!Number.isFinite(maxConc) || maxConc <= 0 || !Number.isFinite(stayMin) || stayMin <= 0) {
        const errMsg = 'Parametri capacity mancanti o non validi (max_concurrent_bookings, avg_stay_minutes)';

        logger.error('capacity_check_error', {
          restaurant_id: restaurantId,
          day: dayISO,
          requested_time: requestedTime,
          message: errMsg,
          source: isVapi ? 'vapi' : 'http',
          request_id: req.requestId || null,
        });

        if (isVapi && toolCallId) {
          return res.status(200).json({
            results: [{ toolCallId, error: `CONFIG_ERROR: ${errMsg}` }]
          });
        }

        return res.status(200).json({
          ok: false,
          error_code: 'CONFIG_ERROR',
          error_message: errMsg
        });
      }

      const dayRes = await reservations.listReservationsByDay(restaurantId, dayISO);
      if (!dayRes || !dayRes.ok) {
        const errMsg = (dayRes && dayRes.error_message) || 'Errore lettura prenotazioni del giorno';

        logger.error('capacity_check_error', {
          restaurant_id: restaurantId,
          day: dayISO,
          requested_time: requestedTime,
          message: errMsg,
          source: isVapi ? 'vapi' : 'http',
          request_id: req.requestId || null,
        });

        if (isVapi && toolCallId) {
          return res.status(200).json({
            results: [{ toolCallId, error: `CAPACITY_READ_ERROR: ${errMsg}` }]
          });
        }

        return res.status(200).json({
          ok: false,
          error_code: 'CAPACITY_READ_ERROR',
          error_message: errMsg
        });
      }

      const bookingTimes = (dayRes.results || []).map(x => x && x.time).filter(Boolean);

      // available reale SOLO se requested_time è uno slot teorico e non pieno
      let activeAtRequested = null;
      if (slotExists) {
        activeAtRequested = countActiveAt(dayISO, requestedTime, bookingTimes, stayMin, tz);
        available = activeAtRequested < maxConc;
        if (!available) {
          reason = 'full';
        }
      } else {
        available = false;
        if (!inOpenings) {
          reason = 'not_in_openings'; // fuori fasce di apertura
        } else {
          reason = 'cutoff'; // dentro fasce ma oltre cutoff
        }
      }

      // nearest_slots capacity-aware
      const capacityOkSlots = bookableSlots.filter(s => {
        const c = countActiveAt(dayISO, s, bookingTimes, stayMin, tz);
        return c < maxConc;
      });

      nearest = available ? [] : nearestSlots(capacityOkSlots, requestedTime, 3);

      logger.info('capacity_check_success', {
        restaurant_id: restaurantId,
        day: dayISO,
        requested_time: requestedTime,
        in_openings: inOpenings,
        slot_exists: slotExists,
        active_bookings_count: activeAtRequested,
        max_concurrent_bookings: maxConc,
        avg_stay_minutes: stayMin,
        available,
        reason,
        nearest_slots_count: Array.isArray(nearest) ? nearest.length : 0,
        source: isVapi ? 'vapi' : 'http',
        request_id: req.requestId || null,
      });
    }
    

    // Log successo sintetico
    logger.info('check_openings_success', {
      restaurant_id: restaurantId,
      day: dayISO,
      closed: !!result.closed,
      openings_count: Array.isArray(result.slots) ? result.slots.length : 0,
      requested_time: requestedTime || null,
      available,
      reason,
      source: isVapi ? 'vapi' : 'http',
      request_id: req.requestId || null,
    });

    // --- max_people dal config ristorante ---
    let maxPeople = null;
    try {
      const restCfg = getRestaurantConfig(restaurantId);
      maxPeople = restCfg && restCfg.max_people ? Number(restCfg.max_people) : null;
    } catch { /* ignore */ }

    // --- RISPOSTA PER VAPI (formato tools) ---
    if (isVapi && toolCallId) {
      const payload = {
        restaurant_id: restaurantId,
        day: dayISO,
        closed: result.closed,
        slots: result.slots,
        lunch_range: result.lunch_range || null,
        dinner_range: result.dinner_range || null,
        requested_time: requestedTime || null,
        available,
        reason,
        nearest_slots: nearest,
        max_people: maxPeople
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
      lunch_range: result.lunch_range || null,
      dinner_range: result.dinner_range || null,
      requested_time: requestedTime || null,
      available,
      reason,
      nearest_slots: nearest,
      max_people: maxPeople
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
