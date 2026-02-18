const kb = require('../kb');
const timeUtils = require('../time-utils');
const logger = require('../logger');
const reservations = require('../reservations');
const { getRestaurantConfig } = require('../config/restaurants');
const { DateTime } = require('luxon');
const {
  isValidHHMM,
  hhmmToMinutes,
  applyCutoffToSlots,
  countActiveAt,
  nearestSlots
} = require('../capacity-utils');

const ITALIAN_DAYS = {
  monday: 'lunedì', tuesday: 'martedì', wednesday: 'mercoledì',
  thursday: 'giovedì', friday: 'venerdì', saturday: 'sabato', sunday: 'domenica'
};

const ITALIAN_MONTHS = {
  1: 'gennaio', 2: 'febbraio', 3: 'marzo', 4: 'aprile',
  5: 'maggio', 6: 'giugno', 7: 'luglio', 8: 'agosto',
  9: 'settembre', 10: 'ottobre', 11: 'novembre', 12: 'dicembre'
};

function buildDayLabel(dateISO) {
  const dt = DateTime.fromISO(dateISO, { zone: 'Europe/Rome' });
  if (!dt.isValid) return null;
  const dow = ITALIAN_DAYS[dt.toFormat('cccc').toLowerCase()] || '';
  const dayNum = dt.day;
  const month = ITALIAN_MONTHS[dt.month] || '';
  return `${dow} ${dayNum} ${month}`.trim();
}

function findNextOpenDay(dayISO, openingsConfig, slotStep) {
  const base = DateTime.fromISO(dayISO, { zone: 'Europe/Rome' });
  for (let i = 1; i <= 7; i++) {
    const next = base.plus({ days: i });
    const nextISO = next.toISODate();
    const res = timeUtils.openingsFor(nextISO, openingsConfig, slotStep);
    if (!res.closed) {
      const dow = next.toFormat('cccc').toLowerCase();
      return {
        next_open_day: nextISO,
        next_open_day_label: ITALIAN_DAYS[dow] || dow,
        next_open_ranges: {
          lunch: res.lunch_range ? `${res.lunch_range[0]}–${res.lunch_range[1]}` : null,
          dinner: res.dinner_range ? `${res.dinner_range[0]}–${res.dinner_range[1]}` : null
        }
      };
    }
  }
  return null;
}

function formatTimeHuman(hhmm) {
  if (!hhmm) return hhmm;
  const parts = String(hhmm).split(':');
  const h = Number(parts[0]);
  const m = Number(parts[1] || 0);
  if (m === 0) return String(h);
  return `${h} e ${String(m).padStart(2, '0')}`;
}

function formatRangesText(lunchRange, dinnerRange) {
  const parts = [];
  if (lunchRange) parts.push(`pranzo dalle ${formatTimeHuman(lunchRange[0])} alle ${formatTimeHuman(lunchRange[1])}`);
  if (dinnerRange) parts.push(`cena dalle ${formatTimeHuman(dinnerRange[0])} alle ${formatTimeHuman(dinnerRange[1])}`);
  return parts.join(' e ');
}

module.exports = async function checkOpenings(req, res) {
  // IMPORTANT: queste variabili devono stare fuori dal try
  // perché nel catch dobbiamo poter loggare con contesto.
  let restaurantId = null;
  let dayISO = null;
  let requestedTime = null;
  let expectedWeekday = null;

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
        expectedWeekday = args.expected_weekday || null;
      }
    } else {
      // --- CHIAMATA "NORMALE" (Postman, ecc.) ---
      restaurantId = body.restaurant_id;
      dayISO = body.day || body.date;
      requestedTime = body.time || null;
      expectedWeekday = body.expected_weekday || null;
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

    // --- WEEKDAY_MISMATCH: guardrail backend ---
    if (expectedWeekday) {
      const ewNorm = String(expectedWeekday).trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const WEEKDAY_TO_LUXON = {
        lunedi: 1, martedi: 2, mercoledi: 3, giovedi: 4,
        venerdi: 5, sabato: 6, domenica: 7
      };
      const expectedLuxon = WEEKDAY_TO_LUXON[ewNorm];
      if (expectedLuxon) {
        const dayDt = DateTime.fromISO(dayISO, { zone: 'Europe/Rome' });
        if (dayDt.isValid && dayDt.weekday !== expectedLuxon) {
          const actualLabel = buildDayLabel(dayISO);
          const expectedIt = {
            1: 'lunedì', 2: 'martedì', 3: 'mercoledì', 4: 'giovedì',
            5: 'venerdì', 6: 'sabato', 7: 'domenica'
          }[expectedLuxon];

          // Calcola la data corretta per il weekday richiesto
          const now = DateTime.now().setZone('Europe/Rome').startOf('day');
          let delta = (expectedLuxon - now.weekday + 7) % 7;
          if (delta === 0) delta = 7;
          const correctedDt = now.plus({ days: delta });
          const correctedISO = correctedDt.toISODate();
          const correctedLabel = buildDayLabel(correctedISO);

          logger.warn('check_openings_weekday_mismatch', {
            ...logBase,
            expected_weekday: expectedIt,
            actual_day_label: actualLabel,
            corrected_day: correctedISO,
            corrected_day_label: correctedLabel,
          });

          const mismatchMsg = `La data ${dayISO} è ${actualLabel}, non ${expectedIt}. Il prossimo ${expectedIt} è ${correctedLabel}.`;
          const mismatchPayload = {
            ok: false,
            error_code: 'WEEKDAY_MISMATCH',
            message: mismatchMsg,
            corrected_day: correctedISO,
            corrected_day_label: correctedLabel,
          };

          if (isVapi && toolCallId) {
            return res.status(200).json({
              results: [{ toolCallId, result: JSON.stringify(mismatchPayload) }]
            });
          }
          return res.status(200).json(mismatchPayload);
        }
      }
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
    const infoEarly = kb.getRestaurantInfo(restaurantId);
    const slotStepEarly = Number(infoEarly && infoEarly.slot_step_minutes) || 30;
    const result = timeUtils.openingsFor(dayISO, openingsConfig, slotStepEarly);

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
    let reason = null; // 'closed' | 'cutoff' | 'not_in_openings' | 'full' | null

    if (requestedTime && result.closed) {
      // Giorno chiuso: short-circuit, niente capacity check
      available = false;
      reason = 'closed';
      nearest = [];

      logger.info('capacity_check_success', {
        restaurant_id: restaurantId,
        day: dayISO,
        requested_time: requestedTime,
        in_openings: false,
        slot_exists: false,
        active_bookings_count: null,
        max_concurrent_bookings: null,
        avg_stay_minutes: null,
        available: false,
        reason: 'closed',
        nearest_slots_count: 0,
        source: isVapi ? 'vapi' : 'http',
        request_id: req.requestId || null,
      });
    } else if (requestedTime) {
      const slots = Array.isArray(result.slots) ? result.slots : [];
      const info = kb.getRestaurantInfo(restaurantId);
      const cutoffMin = Number(info && info.booking_cutoff_minutes) || 0;
      const slotStep = Number(info && info.slot_step_minutes) || 30;
      const maxNear = Number(info && info.max_nearest_slots) || 3;
      const bookableSet = applyCutoffToSlots(slots, cutoffMin, slotStep);
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

      nearest = available ? [] : nearestSlots(capacityOkSlots, requestedTime, maxNear);

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

    // --- B5: next_open_day quando chiuso ---
    let nextOpen = null;
    if (result.closed) {
      const slotStepForNext = Number((kb.getRestaurantInfo(restaurantId) || {}).slot_step_minutes) || 30;
      nextOpen = findNextOpenDay(dayISO, openingsConfig, slotStepForNext);
    }

    // --- B1: costruzione campo message per Vapi ---
    let message = null;
    if (result.closed) {
      const dayDtLabel = DateTime.fromISO(dayISO, { zone: 'Europe/Rome' });
      const dowIt = ITALIAN_DAYS[dayDtLabel.toFormat('cccc').toLowerCase()] || '';
      message = `Il ristorante è chiuso ${dowIt}.`;
      if (nextOpen) {
        const rangesTxt = [];
        if (nextOpen.next_open_ranges.lunch) {
          const [l0, l1] = nextOpen.next_open_ranges.lunch.split('–');
          rangesTxt.push(`pranzo dalle ${formatTimeHuman(l0)} alle ${formatTimeHuman(l1)}`);
        }
        if (nextOpen.next_open_ranges.dinner) {
          const [d0, d1] = nextOpen.next_open_ranges.dinner.split('–');
          rangesTxt.push(`cena dalle ${formatTimeHuman(d0)} alle ${formatTimeHuman(d1)}`);
        }
        message += ` Il prossimo giorno di apertura è ${nextOpen.next_open_day_label} con ${rangesTxt.join(' e ')}.`;
      }
    } else if (!requestedTime) {
      const rangesTxt = formatRangesText(result.lunch_range, result.dinner_range);
      message = rangesTxt ? `Orari di apertura: ${rangesTxt}.` : 'Nessun orario di apertura trovato.';
    } else if (available === true) {
      message = 'Disponibile.';
    } else if (reason === 'not_in_openings') {
      const nearTxt = Array.isArray(nearest) && nearest.length > 0 ? nearest.map(s => formatTimeHuman(s)).join(', ') : '';
      message = nearTxt
        ? `Questo orario non è disponibile per prenotazioni. Orari più vicini: ${nearTxt}.`
        : 'Questo orario non è disponibile per prenotazioni.';
    } else if (reason === 'cutoff') {
      const nearTxt = Array.isArray(nearest) && nearest.length > 0 ? nearest.map(s => formatTimeHuman(s)).join(', ') : '';
      message = nearTxt
        ? `Questo orario è troppo vicino alla chiusura. Orari più vicini: ${nearTxt}.`
        : 'Questo orario è troppo vicino alla chiusura.';
    } else if (reason === 'full') {
      const nearTxt = Array.isArray(nearest) && nearest.length > 0 ? nearest.map(s => formatTimeHuman(s)).join(', ') : '';
      message = nearTxt
        ? `Nessun tavolo disponibile a quest'ora. Orari più vicini: ${nearTxt}.`
        : 'Nessun tavolo disponibile a quest\'ora.';
    }

    // day_label per il giorno richiesto
    const dayLabel = buildDayLabel(dayISO) || dayISO;

    // --- RISPOSTA PER VAPI (formato tools) ---
    if (isVapi && toolCallId) {
      const payload = {
        restaurant_id: restaurantId,
        day: dayISO,
        day_label: dayLabel,
        closed: result.closed,
        requested_time: requestedTime || null,
        time_human: requestedTime ? formatTimeHuman(requestedTime) : null,
        available,
        reason,
        nearest_slots_human: Array.isArray(nearest) && nearest.length > 0
          ? nearest.map(s => formatTimeHuman(s))
          : null,
        max_people: maxPeople,
        message
      };
      if (nextOpen) {
        payload.next_open_day = nextOpen.next_open_day;
        payload.next_open_day_label = nextOpen.next_open_day_label;
        payload.next_open_ranges = nextOpen.next_open_ranges;
      }

      return res.status(200).json({
        results: [{
          toolCallId,
          result: JSON.stringify(payload)
        }]
      });
    }

    // --- RISPOSTA "LEGACY" PER TEST MANUALI (Postman) ---
    const httpResponse = {
      ok: true,
      restaurant_id: restaurantId,
      day: dayISO,
      day_label: dayLabel,
      closed: result.closed,
      slots: result.slots,
      lunch_range: result.lunch_range || null,
      dinner_range: result.dinner_range || null,
      requested_time: requestedTime || null,
      available,
      reason,
      nearest_slots: nearest,
      max_people: maxPeople,
      message
    };
    if (nextOpen) {
      httpResponse.next_open_day = nextOpen.next_open_day;
      httpResponse.next_open_day_label = nextOpen.next_open_day_label;
      httpResponse.next_open_ranges = nextOpen.next_open_ranges;
    }
    return res.status(200).json(httpResponse);

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
