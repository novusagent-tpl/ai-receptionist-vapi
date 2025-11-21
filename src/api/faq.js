const kb = require('../kb');

module.exports = async function faq(req, res) {
  const body = req.body || {};
  const { restaurant_id } = body;

  // VALIDATION STRICT
  if (!restaurant_id) {
    return res.status(200).json({
      ok: false,
      error_code: 'VALIDATION_ERROR',
      error_message: 'restaurant_id è obbligatorio'
    });
  }

  try {
    const faqs = kb.getFaqEntries(restaurant_id);

    return res.status(200).json({
      ok: true,
      restaurant_id,
      faqs
    });

  } catch (err) {
    console.error('Errore /api/faq:', err.message);
    return res.status(200).json({
      ok: false,
      error_code: 'FAQ_ERROR',
      error_message: err.message
    });
  }
};
