# Test — Orari Ambigui (10 / 22)

Questi test verificano la gestione degli orari ambigui quando l'utente indica solo un numero (es. "alle 10", "alle 11") che potrebbe riferirsi sia alla mattina che alla sera.

---

## Test 1: Orario ambiguo — Richiede chiarimento

**Scenario:** Il ristorante è aperto sia a pranzo (12:30-14:30) che a cena (19:00-23:00). L'utente dice "alle 10" che potrebbe essere 10:00 (mattina, ma ristorante chiuso) o 22:00 (sera, "le 10 di sera").

**Input utente:** "Vorrei prenotare alle 10"

**Risultato atteso:**
- L'assistente DEVE chiedere chiarimento con UNA sola domanda:
  - "Intende alle 10 del mattino o alle 22 di sera?"
- NON deve chiamare `check_openings` prima di risolvere l'ambiguità
- Dopo la risposta dell'utente, procede con la prenotazione

**Verifica:**
- [ ] Chiede chiarimento (max 1 domanda)
- [ ] NON chiama `check_openings` prima del chiarimento
- [ ] Dopo la risposta dell'utente, procede correttamente

---

## Test 2: Orario ambiguo ma solo una interpretazione plausibile

**Scenario:** Il ristorante è aperto solo a cena (19:00-23:00), NON a pranzo. L'utente dice "alle 10".

**Input utente:** "Vorrei prenotare alle 10"

**Risultato atteso:**
- L'assistente DEVE capire che "alle 10" può riferirsi solo a 22:00 (le 10 di sera), perché:
  - 10:00 (mattina) non è negli orari di apertura
  - 22:00 (sera) è negli orari di apertura
- DEVE procedere automaticamente SENZA chiedere conferma
- Chiama `check_openings(day=YYYY-MM-DD, time="22:00")`

**Verifica:**
- [ ] NON chiede chiarimento
- [ ] Chiama `check_openings` con `time="22:00"` (non "10:00")
- [ ] Procede con la prenotazione come se l'utente avesse detto "alle 22"

---

## Test 3: Utente specifica "di sera" — No ambiguità

**Scenario:** L'utente specifica esplicitamente "di sera" o "di mattina", eliminando l'ambiguità.

**Input utente:** "Vorrei prenotare alle 10 di sera"

**Risultato atteso:**
- L'assistente DEVE interpretare come "22:00" (le 10 di sera)
- NON chiede chiarimento
- Chiama `check_openings(day=YYYY-MM-DD, time="22:00")`

**Verifica:**
- [ ] NON chiede chiarimento
- [ ] Normalizza correttamente: "alle 10 di sera" → "22:00"
- [ ] Chiama `check_openings` con `time="22:00"`

**Variante:**
- **Input:** "Vorrei prenotare alle 11 di mattina"
- **Risultato atteso:** Normalizza a "11:00" e chiama `check_openings(day=YYYY-MM-DD, time="11:00")`

---

## Test 4: Orario ambiguo in domanda di orari (non prenotazione)

**Scenario:** L'utente chiede solo gli orari, non sta prenotando. Dice "siete aperti alle 10?".

**Input utente:** "Siete aperti alle 10?"

**Risultato atteso:**
- Questa è una domanda di ORARI, NON di prenotazione
- L'assistente DEVE rispondere con gli orari di apertura (lunch_range/dinner_range)
- NON deve parlare di disponibilità o nearest_slots
- Se l'ambiguità persiste (es. ristorante aperto sia a pranzo che a cena), può chiedere chiarimento OPPURE rispondere con entrambe le fasce

**Opzione A (migliore):** Chiede chiarimento:
- "Intende alle 10 del mattino o alle 22 di sera?"

**Opzione B (accettabile):** Risponde con gli orari completi:
- "Siamo aperti a pranzo dalle 12:30 alle 14:30 e a cena dalle 19:00 alle 23:00. A quell'ora specifica [10:00 o 22:00] non abbiamo apertura/abbiamo apertura."

**Verifica:**
- [ ] NON usa `available`/`nearest_slots`/`cutoff` (è domanda di ORARI)
- [ ] Risponde con `lunch_range`/`dinner_range`
- [ ] Gestisce l'ambiguità appropriatamente (chiarimento OPPURE risposta completa)

---

## Note per i test

- **Importante:** Quando testi, verifica che l'assistente NON chiami `check_openings` prima di risolvere l'ambiguità nel Test 1 e Test 4 (se richiede chiarimento).
- **Esempi di orari ambigui comuni:**
  - "alle 10" → 10:00 o 22:00
  - "alle 11" → 11:00 o 23:00
  - "alle 9" → 09:00 o 21:00
- **Esempi di orari NON ambigui:**
  - "alle 12" → 12:00 (mezzogiorno, non 24:00 che non esiste in formato 24h)
  - "alle 13" → 13:00 (non c'è 25:00)
  - "alle 8" → 08:00 (se ristorante apre a pranzo, potrebbe essere ambiguo con 20:00, ma raro)
- La regola si applica principalmente a orari che possono essere sia < 12 (mattina) che > 12 (sera quando si usa il linguaggio informale "le 10 di sera").
