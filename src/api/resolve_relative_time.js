const logger = require('../logger');
const { DateTime } = require('luxon');

/* =========================
   Helpers
========================= */

function normalizeText(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, ' ');
}

function stripAccents(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function italianWordToNumber(t) {
  const m = {
    zero: 0,
    uno: 1, una: 1,
    due: 2,
    tre: 3,
    quattro: 4,
    cinque: 5,
    sei: 6,
    sette: 7,
    otto: 8,
    nove: 9,
    dieci: 10,
    undici: 11,
    dodici: 12,
    tredici: 13,
    quattordici: 14,
    quindici: 15,
    sedici: 16,
    diciassette: 17,
    diciotto: 18,
    diciannove: 19,
    venti: 20
  };
  return Object.prototype.hasOwnProperty.call(m, t) ? m[t] : null;
}

function roundToFiveMinutes(dt) {
  const base = dt.set({ second: 0, millisecond: 0 });
  const roundedMinutes = Math.round(base.minute / 5) * 5;
  return base
    .set({ minute: roundedMinutes % 60 })
    .plus({ hours: roundedMinutes >= 60 ? 1 : 0 });
}

function computeTimeWithOffset(now, delta) {
  const base = now.set({ second: 0, millisecond: 0 });
  const dt = roundToFiveMinutes(base.plus(delta));
  const dayOffset = Math.floor(
    dt.startOf('day').diff(base.startOf('day'), 'days').days
  );
  return {
    time: dt.toFormat('HH:mm'),
    day_offset: dayOffset
  };
}


function extractVapiContext(req) {
  const body = req.body || {};
  const message = body.message;

  if (!message || message.type !== 'tool-calls') {
    return { isVapi: false, toolCallId: null, args: {} };
  }

  const tc =
    (Array.isArray(message.toolCalls) && message.toolCalls[0]) ||
    (Array.isArray(message.toolCallList) && message.toolCallList[0]) ||
    null;

  if (!tc || !tc.function) {
    return { isVapi: true, toolCallId: null, args: {} };
  }

  return {
    isVapi: true,
    toolCallId: tc.id,
    args: tc.function.arguments || {}
  };
}

/* =========================
   Core parser
========================= */

function parseRelativeTime(textRaw) {
  const ZONE = 'Europe/Rome';
  const now = DateTime.now().setZone(ZONE);

  let text = normalizeText(textRaw);
  let tNoAcc = stripAccents(text);

  // Normalizza "un'ora"
  tNoAcc = tNoAcc.replace("un'ora", 'una ora');
  tNoAcc = tNoAcc.replace('un ora', 'una ora');

  // Orari assoluti: se l'AI manda "21", "20", "19:30", "20:00" ecc. → rispondi con l'orario normalizzato
  const absHHMM = tNoAcc.match(/^(?:alle?\s+)?(\d{1,2}):(\d{2})$/);
  if (absHHMM) {
    const hh = Number(absHHMM[1]);
    const mm = Number(absHHMM[2]);
    if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
      return { ok: true, time: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}` };
    }
  }
  const absHour = tNoAcc.match(/^(?:alle?\s+)?(\d{1,2})$/);
  if (absHour) {
    const hh = Number(absHour[1]);
    if (hh >= 0 && hh <= 23) {
      return { ok: true, time: `${String(hh).padStart(2, '0')}:00` };
    }
  }

  // Casi vaghi → NON supportati
  if (
    /\bverso\b/.test(tNoAcc) ||
    /\bpiu tardi\b/.test(tNoAcc) ||
    /\bpiu o meno\b/.test(tNoAcc) ||
    /\btra un po\b/.test(tNoAcc)
  ) {
    return {
      ok: false,
      error_code: 'VAGUE_TIME',
      error_message: 'Orario non preciso. Indichi un orario esatto (es. 20:00).'
    };
  }

  // tra/fra mezz'ora
  if (tNoAcc === "tra mezz'ora" || tNoAcc === 'tra mezzora' ||
      tNoAcc === "fra mezz'ora" || tNoAcc === 'fra mezzora') {
    return { ok: true, ...computeTimeWithOffset(now, { minutes: 30 }) };
  }

  // tra/fra un'ora
  if (tNoAcc === "tra una ora" || tNoAcc === "fra una ora") {
    return { ok: true, ...computeTimeWithOffset(now, { hours: 1 }) };
  }

  // tra/fra X minuti
  const mMin = tNoAcc.match(/^(tra|fra)\s+([a-z]+|\d+)\s+minut[oi]$/);
  if (mMin) {
    let minutes = Number(mMin[2]);
    if (!Number.isFinite(minutes)) minutes = italianWordToNumber(mMin[2]);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return { ok: false, error_code: 'UNSUPPORTED_RELATIVE_TIME', error_message: 'Minuti non validi.' };
    }
    return { ok: true, ...computeTimeWithOffset(now, { minutes }) };
  }

  // tra/fra X ore
  const mHours = tNoAcc.match(/^(tra|fra)\s+([a-z]+|\d+)\s+or[ae]$/);
  if (mHours) {
    let hours = Number(mHours[2]);
    if (!Number.isFinite(hours)) hours = italianWordToNumber(mHours[2]);
    if (!Number.isFinite(hours) || hours <= 0) {
      return { ok: false, error_code: 'UNSUPPORTED_RELATIVE_TIME', error_message: 'Ore non valide.' };
    }
    return { ok: true, ...computeTimeWithOffset(now, { hours }) };
  }

  // tra/fra X ore e mezza
  const mHalf = tNoAcc.match(/^(tra|fra)\s+([a-z]+|\d+)\s+or[ae]\s+e\s+mezza$/);
  if (mHalf) {
    let hours = Number(mHalf[2]);
    if (!Number.isFinite(hours)) hours = italianWordToNumber(mHalf[2]);
    if (!Number.isFinite(hours) || hours <= 0) {
      return { ok: false, error_code: 'UNSUPPORTED_RELATIVE_TIME', error_message: 'Ore non valide.' };
    }
    return { ok: true, ...computeTimeWithOffset(now, { hours, minutes: 30 }) };
  }

  // tra/fra X ore e Y minuti
  const mHM = tNoAcc.match(/^(tra|fra)\s+([a-z]+|\d+)\s+or[ae]\s+e\s+([a-z]+|\d+)\s+minut[oi]$/);
  if (mHM) {
    let h = Number(mHM[2]);
    let m = Number(mHM[3]);
    if (!Number.isFinite(h)) h = italianWordToNumber(mHM[2]);
    if (!Number.isFinite(m)) m = italianWordToNumber(mHM[3]);
    if (!Number.isFinite(h) || !Number.isFinite(m) || h <= 0 || m <= 0) {
      return { ok: false, error_code: 'UNSUPPORTED_RELATIVE_TIME', error_message: 'Valori non validi.' };
    }
    return { ok: true, ...computeTimeWithOffset(now, { hours: h, minutes: m }) };
  }

  return {
    ok: false,
    error_code: 'UNSUPPORTED_RELATIVE_TIME',
    error_message: 'Espressione orario non riconosciuta.'
  };
}

/* =========================
   Handler
========================= */

module.exports = async function resolveRelativeTime(req, res) {
  const { isVapi, toolCallId, args } = extractVapiContext(req);
  const source = isVapi ? args : req.body;

const restaurant_id = source.restaurant_id ? String(source.restaurant_id).trim() : null;
const text = source.text ? String(source.text).trim() : null;

  const logBase = {
    restaurant_id,
    source: isVapi ? 'vapi' : 'http',
    request_id: req.requestId || null
  };

  if (!restaurant_id || !text) {
    logger.error('resolve_relative_time_validation_error', {
  ...logBase,
  message: 'restaurant_id e text sono obbligatori'
});

    if (isVapi && toolCallId) {
      return res.json({
  results: [{
    toolCallId,
    error: 'VALIDATION_ERROR: restaurant_id e text sono obbligatori'
  }]
});
    }

    return res.json({
  ok: false,
  error_code: 'VALIDATION_ERROR',
  error_message: 'restaurant_id e text sono obbligatori' });
  }

  const parsed = parseRelativeTime(text);

  if (parsed.ok) {
    logger.info('resolve_relative_time_success', { ...logBase, text, ...parsed });
    if (isVapi && toolCallId) {
      return res.json({
        results: [{
          toolCallId,
          result: JSON.stringify({ ok: true, ...parsed, ambiguous: false })
        }]
      });
    }
    return res.json({ ok: true, ...parsed, ambiguous: false });
  }

logger.info('resolve_relative_time_error', {
  ...logBase,
  text,
  error_code: parsed.error_code,
  error_message: parsed.error_message
});

  if (isVapi && toolCallId) {
    return res.json({ results: [{ toolCallId, error: `${parsed.error_code}: ${parsed.error_message}` }] });
  }
  return res.json(parsed);
};
