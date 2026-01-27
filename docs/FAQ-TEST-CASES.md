# Test cases FAQ matching (modena01)

Riferimento KB: `kb/modena01.json` (faq: animali, glutine, tavoli all'aperto, parcheggio).

## Come fare i test

### 1) Con lo script automatico (consigliato)

1. Avvia il backend in un terminale:  
   `node src/server-vapi.js`
2. In un altro terminale, dalla root del progetto:  
   `node scripts/faq-api-test.js`
3. Opzionale: se il server è su un’altra porta/host:  
   `node scripts/faq-api-test.js http://localhost:3001`

Lo script chiama `POST /api/faq` con le 5 domande sotto e verifica che la risposta sia coerente (match atteso o `answer = null`).

### 2) Manuale (Postman o curl)

- **URL:** `POST http://localhost:3000/api/faq`
- **Headers:** `Content-Type: application/json`
- **Body (JSON):**  
  `{ "restaurant_id": "modena01", "question": "Avete parcheggio?" }`

Esempio curl:
```bash
curl -s -X POST http://localhost:3000/api/faq -H "Content-Type: application/json" -d "{\"restaurant_id\":\"modena01\",\"question\":\"Avete parcheggio?\"}"
```

Risposta attesa: `{ "ok": true, "answer": "Sì, abbiamo un parcheggio privato...", "source": "kb" }` oppure `{ "ok": true, "answer": null, "source": null }` se non c’è match.

---

## Tabella test cases

| # | Input (domanda) | Atteso | Note |
|---|------------------|--------|------|
| 1 | `"Avete parcheggio?"` | match `entry.q = "Avete parcheggio?"` | Match esatto (case-insensitive). |
| 2 | `"Avete opzioni senza glutine?"` | match `entry.q = "Avete opzioni senza glutine?"` | Match esatto. |
| 3 | `"Avete piatti senza glutine?"` | match `entry.q = "Avete opzioni senza glutine?"` | Fuzzy: Jaccard >= 0.6. |
| 4 | `"Avete un parcheggio?"` | match `entry.q = "Avete parcheggio?"` | Fuzzy: Jaccard 2/3 >= 0.6. |
| 5 | `"Avete torte?"` | `answer = null` | Nessuna FAQ su torte; score < THRESHOLD. |

- **Restaurant id**: `modena01` per tutti.
- **Threshold**: 0.6 (configurabile come `FAQ_THRESHOLD` in `src/api/faq.js`).
- **Schema response**: invariato `{ ok, answer, source }`; `answer = null` e `source = null` se nessun match >= threshold.
- Domande come "Si accettano animali?" o "C'è qualcosa senza glutine?" hanno Jaccard < 0.6 e danno `answer = null`; per farle matchare si possono aggiungere `keywords` nelle entry del KB (opzionale).

---

## Aggiungere nuove FAQ

Sì: **basta modificare il file KB del ristorante**.

- **Dove:** `kb/<restaurant_id>.json` (es. `kb/modena01.json`, `kb/roma.json`).
- **Cosa:** nell’array `"faq"` aggiungi oggetti con almeno `"q"` (domanda) e `"a"` (risposta).

Esempio – nuova entry in `kb/modena01.json`:
```json
{
  "q": "Avete torte per compleanno?",
  "a": "Sì, su richiesta possiamo preparare torte. Chieda al personale quando prenota."
}
```

Opzionale – usare `keywords` per aiutare il fuzzy match (es. “animali”, “cani”, “glutine”):
```json
{
  "q": "I Animali sono amessi?",
  "a": "No, nel ristorante gli animali non sono amessi.",
  "keywords": ["animali", "cani", "gatti", "pet"]
}
```

- **Dopo aver modificato il file:** riavvia il backend (`node src/server-vapi.js`). Le KB sono caricate in cache all’avvio, quindi le nuove FAQ sono attive solo dopo il restart.
