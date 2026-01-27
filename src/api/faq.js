const kb = require('../kb');
const logger = require('../logger');

const FAQ_THRESHOLD = 0.6;

/**
 * Normalizza una stringa per il matching: lowercase, trim, rimuove punteggiatura,
 * collassa spazi multipli, rimuove accenti (fold per italiano).
 */
function normalize(str) {
  if (typeof str !== 'string') return '';
  let s = str.trim().toLowerCase().replace(/[\p{P}\p{S}]/gu, ' ').replace(/\s+/g, ' ').trim();
  const accented = 'àáâãäåèéêëìíîïòóôõöùúûüçñ';
  const plain = 'aaaaaaeeeeiiiiooooouuuucn';
  for (let i = 0; i < accented.length; i++) {
    s = s.replace(new RegExp(accented[i], 'g'), plain[i]);
  }
  return s;
}

/**
 * Tokenize: split su spazi, filtra vuoti.
 */
function tokenize(str) {
  const n = normalize(str);
  return n ? n.split(/\s+/).filter(Boolean) : [];
}

/**
 * Jaccard: |intersection| / |union|. Restituisce 0 se entrambi vuoti.
 */
function jaccard(aTokens, bTokens) {
  if (!aTokens.length && !bTokens.length) return 0;
  const setB = new Set(bTokens);
  const inter = aTokens.filter(t => setB.has(t)).length;
  const union = new Set([...aTokens, ...bTokens]).size;
  return union === 0 ? 0 : inter / union;
}

/**
 * Calcola score fuzzy deterministico per (question, entry).
 * - Exact match normalizzato => 1.0
 * - Jaccard token overlap
 * - Bonus substring se uno contiene l'altro (dopo normalizzazione)
 * - Bonus keywords se entry.keywords esiste e una keyword è nella domanda
 */
function fuzzyScore(questionNorm, questionTokens, entry) {
  if (!entry || !entry.q || !entry.a) return 0;
  const qNorm = normalize(entry.q);
  if (questionNorm === qNorm) return 1;
  const entryTokens = tokenize(entry.q);
  let score = jaccard(questionTokens, entryTokens);
  const subBonus = 0.15;
  if (questionNorm.length && qNorm.length) {
    if (questionNorm.includes(qNorm) || qNorm.includes(questionNorm)) score = Math.min(1, score + subBonus);
  }
  if (Array.isArray(entry.keywords) && entry.keywords.length) {
    const kwSet = new Set(entry.keywords.map(k => normalize(String(k))));
    const hasKw = questionTokens.some(t => kwSet.has(t)) || [...kwSet].some(k => questionNorm.includes(k));
    if (hasKw) score = Math.min(1, score + 0.1);
  }
  return score;
}

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

module.exports = async function faq(req, res) {
  try {
    const body = req.body || {};
    const { isVapi, toolCallId, args } = extractVapiContext(req);

    // Se arriva da Vapi, prendiamo gli argomenti da function.arguments
    const source = isVapi ? args : body;

    let { restaurant_id, question } = source;

    restaurant_id = restaurant_id && String(restaurant_id).trim();
    question = question && String(question).trim();

    // VALIDAZIONE STRICT
    if (!restaurant_id || !question) {
      const errorMsg = 'restaurant_id e question sono obbligatori';

  logger.error('faq_validation_error', {
    restaurant_id,
    message: errorMsg,
    request_id: req.requestId || null,
  });

      if (isVapi && toolCallId) {
        return res.status(200).json({
          results: [
            {
              toolCallId,
              error: `VALIDATION_ERROR: ${errorMsg}`
            }
          ]
        });
      }

      return res.status(200).json({
        ok: false,
        error_code: 'VALIDATION_ERROR',
        error_message: errorMsg
      });
    }

    // Lettura FAQ dal KB
    const entries = kb.getFaqEntries(restaurant_id);
    const qNorm = question.trim().toLowerCase();
    const questionNorm = normalize(question);
    const questionTokens = tokenize(question);

    let matchedAnswer = null;
    let bestScore = 0;
    let matchedQ = null;

    // 1) Priorità: match esatto case-insensitive (come prima)
    for (const entry of entries) {
      if (!entry || !entry.q || !entry.a) continue;
      const eNorm = String(entry.q).trim().toLowerCase();
      if (eNorm === qNorm) {
        matchedAnswer = String(entry.a);
        bestScore = 1;
        matchedQ = entry.q;
        break;
      }
    }

    // 2) Se non c'è match esatto: fuzzy deterministico
    if (matchedAnswer === null) {
      for (const entry of entries) {
        if (!entry || !entry.q || !entry.a) continue;
        const s = fuzzyScore(questionNorm, questionTokens, entry);
        if (s > bestScore) {
          bestScore = s;
          matchedQ = entry.q;
        }
      }
      if (bestScore >= FAQ_THRESHOLD) {
        const best = entries.find(e => e && e.q === matchedQ && e.a);
        if (best) matchedAnswer = String(best.a);
      } else {
        matchedQ = null;
      }
    }

    const payload = {
      ok: true,
      answer: matchedAnswer,
      source: matchedAnswer ? 'kb' : null
    };

    // Log successo sintetico (solo log: matched, score, matched_q non in response)
    logger.info('faq_success', {
      restaurant_id,
      has_answer: !!matchedAnswer,
      source: isVapi ? 'vapi' : 'http',
      request_id: req.requestId || null,
      matched: !!matchedAnswer,
      score: bestScore,
      matched_q: matchedQ ?? null
    });

    // Risposta per Vapi (tool-calls)
    if (isVapi && toolCallId) {
      return res.status(200).json({
        results: [
          {
            toolCallId,
            result: JSON.stringify(payload)
          }
        ]
      });
    }

    // Risposta "normale" per Postman / altri client
    return res.status(200).json(payload);
  } catch (err) {
const errMsg = err && err.message ? err.message : String(err);

const requestBody = req.body || {};

logger.error('faq_error', {
  restaurant_id: requestBody.restaurant_id || null,
  message: errMsg,
  request_id: req.requestId || null,
});


    const { isVapi, toolCallId } = extractVapiContext(req);

    if (isVapi && toolCallId) {
      return res.status(200).json({
        results: [
          {
            toolCallId,
            error: `FAQ_ERROR: ${err.message || String(err)}`
          }
        ]
      });
    }

    return res.status(200).json({
      ok: false,
      error_code: 'FAQ_ERROR',
      error_message: err.message
    });
  }
};
