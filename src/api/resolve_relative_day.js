const logger = require('../logger');
const { DateTime } = require('luxon');

/**
 * Estrae info da una chiamata Vapi (tool-calls) se presente.
 * Restituisce: { isVapi, toolCallId, args }
 */
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

  const args = tc.function.arguments || {};
  return {
    isVapi: true,
    toolCallId: tc.id,
    args
  };
}

function normalizeText(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, ' ');
}

function stripAccents(s) {
  // Normalizza "lunedì" -> "lunedi", ecc.
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


function removeDayParts(s) {
  // Ignora parole tipo "sera/mattina/pomeriggio" (non producono orario in G15)
  return s
    .replace(/\b(mattina|pomeriggio|sera|serata|stasera)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveWeekdayToFutureDate(now, targetWeekdayLuxon) {
  // Luxon weekday: Monday=1 ... Sunday=7
  const current = now.weekday;
  let delta = (targetWeekdayLuxon - current + 7) % 7;
  if (delta === 0) delta = 7; // mai oggi: se è lo stesso giorno → +7
  return now.plus({ days: delta }).toISODate();
}

function parseRelativeDay(textRaw) {
  const ZONE = 'Europe/Rome';
  const now = DateTime.now().setZone(ZONE).startOf('day');

  let text = normalizeText(textRaw);

  // "stasera", "stamattina", "stanotte" → oggi
  if (['stasera', 'stamattina', 'stanotte'].includes(text)) {
    return { ok: true, date: now.toISODate(), ambiguous: false };
  }

  text = removeDayParts(text);
  const tNoAcc = stripAccents(text);

  // Caso: oggi/domani/dopodomani
  if (tNoAcc === 'oggi') {
    return { ok: true, date: now.toISODate(), ambiguous: false };
  }
  if (tNoAcc === 'domani') {
    return { ok: true, date: now.plus({ days: 1 }).toISODate(), ambiguous: false };
  }
  if (tNoAcc === 'dopodomani') {
    return { ok: true, date: now.plus({ days: 2 }).toISODate(), ambiguous: false };
  }

  // Caso: tra/fra una settimana
  if (tNoAcc === 'tra una settimana' || tNoAcc === 'fra una settimana') {
    return { ok: true, date: now.plus({ days: 7 }).toISODate(), ambiguous: false };
  }

  // Caso: tra/fra X giorni (X >= 0)
  // Esempi: "tra 0 giorni", "fra 2 giorni"
const mDays = tNoAcc.match(/^(tra|fra)\s+([a-z]+|\d+)\s+giorn[oi]$/);
if (mDays) {
  const raw = mDays[2];
  let x = Number(raw);
  if (!Number.isFinite(x)) {
    x = italianWordToNumber(raw);
  }

  if (!Number.isFinite(x) || x == null || x < 0) {
    return {
      ok: false,
      error_code: 'UNSUPPORTED_RELATIVE_DAY',
      error_message: 'Valore giorni non valido.',
      ambiguous: false
    };
  }

  return { ok: true, date: now.plus({ days: x }).toISODate(), ambiguous: false };
}


  // Caso: "prossimo <weekday>" o "<weekday>"
  // Accettiamo anche senza "prossimo"
  const weekdays = {
    lunedi: 1,
    martedi: 2,
    mercoledi: 3,
    giovedi: 4,
    venerdi: 5,
    sabato: 6,
    domenica: 7
  };

  let weekdayToken = tNoAcc;
  weekdayToken = weekdayToken.replace(/^prossim[oa]\s+/, ''); // "prossimo sabato", "prossima domenica"
  weekdayToken = weekdayToken.replace(/\s+prossim[oa]$/, '');

  if (weekdays[weekdayToken]) {
    const target = weekdays[weekdayToken];
    const date = resolveWeekdayToFutureDate(now, target);
    return { ok: true, date, ambiguous: false };
  }

  // Non riconosciuto
  return {
    ok: false,
    error_code: 'UNSUPPORTED_RELATIVE_DAY',
    error_message:
      'Espressione giorno non riconosciuta. Usa domani/dopodomani/lunedì/tra X giorni oppure indica una data (YYYY-MM-DD).',
    ambiguous: false
  };
}

module.exports = async function resolveRelativeDay(req, res) {
  const body = req.body || {};
  const { isVapi, toolCallId, args } = extractVapiContext(req);

  const source = isVapi ? args : body;

  let restaurant_id = source.restaurant_id != null ? String(source.restaurant_id).trim() : null;
  let text = source.text != null ? String(source.text).trim() : null;

  const logBase = {
    restaurant_id: restaurant_id || null,
    source: isVapi ? 'vapi' : 'http',
    request_id: req.requestId || null
  };

  // Validazione
  if (!restaurant_id || !text) {
    const errorMsg = 'restaurant_id e text sono obbligatori';

    logger.error('resolve_relative_day_validation_error', {
      ...logBase,
      message: errorMsg
    });

    if (isVapi && toolCallId) {
      return res.status(200).json({
        results: [
          { toolCallId, error: `VALIDATION_ERROR: ${errorMsg}` }
        ]
      });
    }

    return res.status(200).json({
      ok: false,
      error_code: 'VALIDATION_ERROR',
      error_message: errorMsg
    });
  }

  const result = parseRelativeDay(text);

  if (result.ok) {
    logger.info('resolve_relative_day_success', {
      ...logBase,
      text,
      date: result.date
    });

    // Vapi: result deve essere stringa JSON
    if (isVapi && toolCallId) {
      return res.status(200).json({
        results: [
          {
            toolCallId,
            result: JSON.stringify({
              ok: true,
              date: result.date,
              ambiguous: false
            })
          }
        ]
      });
    }

    return res.status(200).json({
      ok: true,
      date: result.date,
      ambiguous: false
    });
  }

  // Errore parsing
  logger.error('resolve_relative_day_error', {
    ...logBase,
    text,
    message: result.error_message || 'Errore non specificato'
  });

  if (isVapi && toolCallId) {
    return res.status(200).json({
      results: [
        {
          toolCallId,
          error: `${result.error_code || 'UNSUPPORTED_RELATIVE_DAY'}: ${result.error_message || 'Errore'}`
        }
      ]
    });
  }

  return res.status(200).json({
    ok: false,
    error_code: result.error_code || 'UNSUPPORTED_RELATIVE_DAY',
    error_message: result.error_message || 'Espressione giorno non riconosciuta.'
  });
};
