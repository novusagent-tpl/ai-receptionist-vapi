const kb = require('../kb');

// Giornata 7 – Fase 4: faq
module.exports = async function faq(req, res) {
  const body = req.body || {};
  const { restaurant_id, question } = body;

  // 1) VALIDAZIONE STRICT
  if (!restaurant_id || !question || !String(question).trim()) {
    return res.status(400).json({
      ok: false,
      error_code: 'MISSING_PARAMS',
      error_message: 'Parametri obbligatori: restaurant_id, question'
    });
  }

  try {
    // 2) Recupera FAQ dal KB
    const entries = kb.getFaqEntries(restaurant_id); // array di { q, a } :contentReference[oaicite:2]{index=2}

    const qNorm = String(question).toLowerCase().trim();
    let matchedAnswer = null;

    if (Array.isArray(entries)) {
      for (const entry of entries) {
        const entryQ = String(entry.q || '').toLowerCase().trim();

        // Match semplice MVP: se la domanda utente contiene la domanda FAQ o viceversa
        if (!entryQ) continue;

        if (qNorm.includes(entryQ) || entryQ.includes(qNorm)) {
          matchedAnswer = entry.a || null;
          break;
        }
      }
    }

    // 3) Risposta STRICT
    // Se non troviamo nulla → answer: null (Vapi dirà "Non ho info precise")
    return res.status(200).json({
      ok: true,
      answer: matchedAnswer
    });

  } catch (err) {
    console.error('Errore /api/faq:', err.message);
    return res.status(500).json({
      ok: false,
      error_code: 'FAQ_ERROR',
      error_message: err.message
    });
  }
};

