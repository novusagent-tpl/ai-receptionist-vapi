const { DateTime } = require('luxon');
const kb = require('../kb');
const timeUtils = require('../time-utils');
const logger = require('../logger');

function extractVapiContext(req) {
  const body = req.body || {};
  const message = body.message;

  if (!message || message.type !== 'tool-calls') {
    return { isVapi: false, toolCallId: null, args: body };
  }

  const tc =
    (Array.isArray(message.toolCalls) && message.toolCalls[0]) ||
    (Array.isArray(message.toolCallList) && message.toolCallList[0]) ||
    null;

  const toolCallId = tc?.id || null;

  let args = {};
  try {
    const rawArgs = tc?.function?.arguments;
    if (typeof rawArgs === 'string' && rawArgs.trim()) args = JSON.parse(rawArgs);
    else if (rawArgs && typeof rawArgs === 'object') args = rawArgs;
  } catch (_) {
    args = {};
  }

  return { isVapi: true, toolCallId, args };
}

function isWithinRange(nowHHMM, startHHMM, endHHMM) {
  if (!startHHMM || !endHHMM) return false;
  // start inclusive, end exclusive
  return nowHHMM >= startHHMM && nowHHMM < endHHMM;
}

module.exports = async function isOpenNow(req, res) {
  const { isVapi, toolCallId, args } = extractVapiContext(req);
  const restaurant_id = args?.restaurant_id;

  function vapiOk(payload) {
    return res.status(200).json({ results: [{ toolCallId, result: payload }] });
  }
  function vapiErr(code, msgIt) {
    return res.status(200).json({ results: [{ toolCallId, error: `${code}: ${msgIt}` }] });
  }

  if (!restaurant_id) {
    const msgIt = 'restaurant_id mancante';
    logger.error('is_open_now_validation_error', { restaurant_id: null, messaggio: msgIt, isVapi });
    if (isVapi) return vapiErr('VALIDATION_ERROR', msgIt);
    return res.status(400).json({ ok: false, error_code: 'MISSING_RESTAURANT_ID', error_message: msgIt });
  }

  let openingsConfig;
  try {
    openingsConfig = kb.getOpeningsConfig(restaurant_id);
  } catch (err) {
    const msgIt = 'Ristorante non trovato';
    logger.error('is_open_now_restaurant_not_found', { restaurant_id, messaggio: msgIt, isVapi });
    if (isVapi) return vapiErr('RESTAURANT_NOT_FOUND', msgIt);
    return res.status(404).json({ ok: false, error_code: 'RESTAURANT_NOT_FOUND', error_message: msgIt });
  }

  try {
    const now = DateTime.now().setZone('Europe/Rome');
    const todayISO = now.toISODate();
    const nowTime = now.toFormat('HH:mm');

    const dow = timeUtils.getDayOfWeek(todayISO);
    const cfg = openingsConfig?.[dow];

    if (!cfg || cfg.closed) {
      const payload = { ok: true, open_now: false, next_opening_time: null };
      logger.info('is_open_now', { restaurant_id, aperto_ora: false, motivo: 'chiuso_oggi' });
      return isVapi ? vapiOk(payload) : res.json(payload);
    }

    const lunch = Array.isArray(cfg.lunch) && cfg.lunch.length === 2 ? cfg.lunch : null;
    const dinner = Array.isArray(cfg.dinner) && cfg.dinner.length === 2 ? cfg.dinner : null;

    const openNow =
      (lunch && isWithinRange(nowTime, lunch[0], lunch[1])) ||
      (dinner && isWithinRange(nowTime, dinner[0], dinner[1]));

    // Prossima apertura OGGI (solo start future)
    let nextOpeningTime = null;
    const candidates = [];
    if (lunch && nowTime < lunch[0]) candidates.push(lunch[0]);
    if (dinner && nowTime < dinner[0]) candidates.push(dinner[0]);
    if (candidates.length) nextOpeningTime = candidates.sort()[0];

    const payload = {
      ok: true,
      open_now: !!openNow,
      next_opening_time: openNow ? null : nextOpeningTime
    };

    logger.info('is_open_now', {
      restaurant_id,
      aperto_ora: payload.open_now,
      prossima_apertura: payload.next_opening_time
    });

    return isVapi ? vapiOk(payload) : res.json(payload);
  } catch (err) {
    const msgIt = 'Impossibile determinare se il ristorante è aperto in questo momento';
    logger.error('is_open_now_error', { restaurant_id, errore: err.message });

    if (isVapi) return vapiErr('INTERNAL_ERROR', msgIt);
    return res.status(500).json({ ok: false, error_code: 'INTERNAL_ERROR', error_message: msgIt });
  }
};
