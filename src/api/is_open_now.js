const { DateTime } = require('luxon');
const kb = require('../kb');
const timeUtils = require('../time-utils');
const logger = require('../logger');

/**
 * Estrae args e toolCallId se la richiesta arriva da VAPI (message.type="tool-calls").
 * Supporta toolCalls e toolCallList (variante UI/API).
 */
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
    if (typeof rawArgs === 'string' && rawArgs.trim()) {
      args = JSON.parse(rawArgs);
    } else if (rawArgs && typeof rawArgs === 'object') {
      args = rawArgs;
    }
  } catch (_) {
    args = {};
  }

  return { isVapi: true, toolCallId, args };
}

module.exports = async function isOpenNow(req, res) {
  const { isVapi, toolCallId, args } = extractVapiContext(req);
  const restaurant_id = args?.restaurant_id;

  // helper risposta VAPI
  function vapiOk(payload) {
    return res.status(200).json({
      results: [{ toolCallId, result: payload }]
    });
  }

  function vapiErr(code, msgIt) {
    return res.status(200).json({
      results: [{ toolCallId, error: `${code}: ${msgIt}` }]
    });
  }

  // Validazione
  if (!restaurant_id) {
    const msgIt = 'restaurant_id mancante';
    logger.error('is_open_now_validation_error', { restaurant_id: null, message: msgIt, isVapi });
    if (isVapi) return vapiErr('VALIDATION_ERROR', msgIt);
    return res.status(400).json({ ok: false, error_code: 'MISSING_RESTAURANT_ID', error_message: msgIt });
  }

  let openingsConfig;
  try {
    openingsConfig = kb.getOpeningsConfig(restaurant_id);
  } catch (err) {
    const msgIt = 'Ristorante non trovato';
    logger.error('is_open_now_restaurant_not_found', { restaurant_id, message: msgIt, isVapi });
    if (isVapi) return vapiErr('RESTAURANT_NOT_FOUND', msgIt);
    return res.status(404).json({ ok: false, error_code: 'RESTAURANT_NOT_FOUND', error_message: msgIt });
  }

  try {
    const now = DateTime.now().setZone('Europe/Rome');
    const todayISO = now.toISODate();
    const nowTime = now.toFormat('HH:mm');

    const result = timeUtils.openingsFor(todayISO, openingsConfig);

    // chiuso tutto il giorno
    if (result.closed) {
      logger.info('is_open_now', { restaurant_id, aperto_ora: false, motivo: 'chiuso_oggi' });

      const payload = { ok: true, open_now: false, next_opening_time: null };
      return isVapi ? vapiOk(payload) : res.json(payload);
    }

    let openNow = false;
    let nextOpeningTime = null;

    for (const slot of result.slots || []) {
      if (nowTime >= slot.start && nowTime < slot.end) {
        openNow = true;
        break;
      }
      if (!openNow && nowTime < slot.start) {
        if (!nextOpeningTime || slot.start < nextOpeningTime) {
          nextOpeningTime = slot.start;
        }
      }
    }

    logger.info('is_open_now', {
      restaurant_id,
      aperto_ora: openNow,
      prossima_apertura: openNow ? null : nextOpeningTime
    });

    const payload = { ok: true, open_now: openNow, next_opening_time: openNow ? null : nextOpeningTime };
    return isVapi ? vapiOk(payload) : res.json(payload);
  } catch (err) {
    const msgIt = 'Impossibile determinare se il ristorante è aperto in questo momento';
    logger.error('is_open_now_error', { restaurant_id, errore: err.message });

    if (isVapi) return vapiErr('INTERNAL_ERROR', msgIt);
    return res.status(500).json({ ok: false, error_code: 'INTERNAL_ERROR', error_message: msgIt });
  }
};