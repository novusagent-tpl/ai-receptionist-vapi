const { DateTime } = require('luxon');
const kb = require('../kb');
const timeUtils = require('../time-utils');
const logger = require('../logger');

module.exports = async function isOpenNow(req, res) {
  const { restaurant_id } = req.body || {};

  // Validazione input
  if (!restaurant_id) {
    return res.status(400).json({
      ok: false,
      error_code: 'MISSING_RESTAURANT_ID',
      error_message: 'restaurant_id mancante'
    });
  }

  let openingsConfig;
  try {
    openingsConfig = kb.getOpeningsConfig(restaurant_id);
  } catch (err) {
    return res.status(404).json({
      ok: false,
      error_code: 'RESTAURANT_NOT_FOUND',
      error_message: 'Ristorante non trovato'
    });
  }

  try {
    // Ora corrente Europe/Rome
    const now = DateTime.now().setZone('Europe/Rome');
    const todayISO = now.toISODate();
    const nowTime = now.toFormat('HH:mm');

    // Recupero fasce di apertura di oggi
    const result = timeUtils.openingsFor(todayISO, openingsConfig);

    // Caso: ristorante chiuso tutto il giorno
    if (result.closed) {
      logger.info('is_open_now', {
        restaurant_id,
        aperto_ora: false,
        motivo: 'chiuso_oggi'
      });

      return res.json({
        ok: true,
        open_now: false,
        next_opening_time: null
      });
    }

    // Verifica se ora corrente rientra in una fascia
    let openNow = false;
    let nextOpeningTime = null;

    for (const slot of result.slots || []) {
      if (nowTime >= slot.start && nowTime < slot.end) {
        openNow = true;
        break;
      }

      // Calcolo prossima apertura di oggi
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

    return res.json({
      ok: true,
      open_now: openNow,
      next_opening_time: openNow ? null : nextOpeningTime
    });

  } catch (err) {
    logger.error('is_open_now_error', {
      restaurant_id,
      errore: err.message
    });

    return res.status(500).json({
      ok: false,
      error_code: 'INTERNAL_ERROR',
      error_message: 'Impossibile determinare se il ristorante è aperto in questo momento'
    });
  }
};
