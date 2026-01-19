# Checklist Test — AI Receptionist

## ✅ TEST BASE — ORARI E DISPONIBILITÀ

### Test 1: Orari con pranzo e cena separati
**Input:** "Siete aperti sabato?"
**Risultato atteso:** "Siamo aperti a pranzo dalle 12:30 alle 14:30 e a cena dalle 19:00 alle 23:00. A che ora preferisce?"
**Verifica:**
- ✅ Chiama resolve_relative_day("sabato")
- ✅ Chiama check_openings con day corretto
- ✅ Risposta distingue pranzo e cena

### Test 2: Orari solo cena
**Input:** "Siete aperti lunedì?"
**Risultato atteso:** "Siamo aperti dalle 19:00 alle 22:30. A che ora preferisce?"
**Verifica:**
- ✅ Chiama resolve_relative_day("lunedì")
- ✅ Risposta usa solo dinner_range (non dice "pranzo")

### Test 3: Orario continuo (se configurato)
**Input:** "Siete aperti domani?" (supponendo ristorante aperto 12:00-23:00 continuo)
**Risultato atteso:** "Siamo aperti dalle 12:00 alle 23:00. A che ora preferisce?"
**Verifica:**
- ✅ Se solo lunch_range o solo dinner_range presente, usa quello
- ✅ NON dice "pranzo e cena" se c'è una sola fascia

### Test 4: Giorno chiuso
**Input:** "Siete aperti domenica?"
**Risultato atteso:** "Quel giorno siamo chiusi."
**Verifica:**
- ✅ Chiama resolve_relative_day("domenica")
- ✅ Chiama check_openings
- ✅ Risposta corretta per closed=true

---

## ✅ TEST DATE RELATIVE

### Test 5: "Domani"
**Input:** "Voglio prenotare per domani alle 20"
**Risultato atteso:** 
- Chiama resolve_relative_day("domani")
- Chiama check_openings con day corretto
- Procede con prenotazione se available=true

### Test 6: "Sabato"
**Input:** "Siete aperti sabato?"
**Risultato atteso:**
- Chiama resolve_relative_day("sabato")
- NON calcola da solo il giorno della settimana
- Usa la data restituita dal tool

### Test 7: Giorno+mese senza anno
**Input:** "Voglio prenotare per 25 dicembre alle 20"
**Risultato atteso:**
- NON chiama resolve_relative_day
- Calcola anno futuro corretto (2026 se oggi è 19/01/2026)
- Chiama check_openings con "2026-12-25"

### Test 8: Festività
**Input:** "Siete aperti a Natale?"
**Risultato atteso:**
- Calcola anno futuro per Natale
- Chiama check_openings con data corretta

---

## ✅ TEST ORARI

### Test 9: Orario relativo
**Input:** "Voglio prenotare tra 2 ore"
**Risultato atteso:**
- Chiama resolve_relative_time("tra 2 ore")
- Chiama resolve_relative_day("oggi")
- Applica day_offset se presente
- Chiama check_openings con day+time corretti

### Test 10: Orario naturale
**Input:** "Voglio prenotare alle 19 e mezza"
**Risultato atteso:**
- Normalizza "19 e mezza" → "19:30"
- NON chiama resolve_relative_time
- Chiama resolve_relative_day("oggi") se manca day
- Chiama check_openings

### Test 11: Orario vago
**Input:** "Voglio prenotare più tardi"
**Risultato atteso:**
- Chiede orario esatto
- NON chiama resolve_relative_time

---

## ✅ TEST PRENOTAZIONE

### Test 12: Prenotazione completa
**Input:** "Voglio prenotare per sabato alle 20 per 2 persone a nome Mario"
**Risultato atteso:**
- Raccoglie: day (resolve_relative_day), time, people, name
- Valida orario con check_openings
- Se available=true: riepilogo → create_booking
- Conferma solo con esito tool

### Test 13: Orario non disponibile (cutoff)
**Input:** "Voglio prenotare per domani alle 22:30" (supponendo cutoff 45min, chiusura 23:00)
**Risultato atteso:**
- available=false, reason="cutoff"
- "Siamo aperti a quell'ora, ma per le prenotazioni non accettiamo così a ridosso della chiusura. Posso proporle: <nearest_slots>."

### Test 14: Orario fuori apertura
**Input:** "Voglio prenotare per domani alle 16:20" (supponendo apertura 19:00)
**Risultato atteso:**
- available=false, reason="not_in_openings"
- "A quell'ora non siamo aperti. Posso proporle alcuni orari: <nearest_slots>."

### Test 15: Orario pieno (capacity)
**Input:** "Voglio prenotare per domani alle 20:00" (supponendo già pieno)
**Risultato atteso:**
- available=false, reason="full"
- "A quell'ora non abbiamo disponibilità. Posso proporle: <nearest_slots>."

---

## ✅ TEST MODIFICA/CANCELLAZIONE

### Test 16: Modifica prenotazione
**Input:** "Voglio modificare la mia prenotazione"
**Risultato atteso:**
- Chiama list_bookings con numero_attivo
- Se più risultati: fa scegliere
- Raccoglie solo campi da cambiare
- Chiama modify_booking
- Conferma con esito tool

### Test 17: Cancellazione
**Input:** "Voglio cancellare la mia prenotazione"
**Risultato atteso:**
- Chiama list_bookings con numero_attivo
- Se più risultati: fa scegliere
- Chiama cancel_booking
- Conferma solo se ok:true

---

## ✅ TEST ERRORI

### Test 18: Data nel passato
**Input:** "Voglio prenotare per ieri alle 20"
**Risultato atteso:**
- Tool restituisce errore PAST_DATE
- "La data è già passata. Può indicarne un altro?"

### Test 19: Orario già passato
**Input:** "Voglio prenotare per oggi alle 10:00" (supponendo ora attuale 15:00)
**Risultato atteso:**
- Tool restituisce errore PAST_TIME
- "L'orario è già passato. Può sceglierne uno più avanti?"

### Test 20: Troppo vicino all'orario attuale
**Input:** "Voglio prenotare per oggi tra 5 minuti"
**Risultato atteso:**
- Tool restituisce errore (minimo 10 minuti)
- "Non posso registrare così a ridosso. Può scegliere un orario più avanti?"

---

## ✅ TEST FAQ

### Test 21: Domanda FAQ
**Input:** "Avete opzioni senza glutine?"
**Risultato atteso:**
- Chiama tool faq
- Risponde con answer dal KB
- NON usa check_openings

### Test 22: FAQ non trovata
**Input:** "Avete parcheggio?" (supponendo non in KB)
**Risultato atteso:**
- Chiama tool faq
- answer:null
- "Non ho l'informazione precisa. Vuole che riprovi o riformuli?"

---

## ✅ TEST HANDOVER

### Test 23: Handover con ristorante aperto
**Input:** "Voglio parlare con una persona"
**Risultato atteso:**
- Chiama is_open_now
- Se open_now=true: "La metto in contatto con il ristorante." → transfer_call_tool_roma

### Test 24: Handover con ristorante chiuso
**Input:** "Voglio parlare con una persona" (supponendo ristorante chiuso)
**Risultato atteso:**
- Chiama is_open_now
- Se open_now=false: "Il ristorante è chiuso. Riapre alle <next_opening_time>. Posso aiutarla io."
- NON fa transfer

---

## ✅ TEST EDGE CASES

### Test 25: Orario continuo (12:00-23:00 senza interruzione)
**Configurazione KB:** lunch: ["12:00", "23:00"], dinner: null
**Input:** "Siete aperti domani?"
**Risultato atteso:** "Siamo aperti dalle 12:00 alle 23:00. A che ora preferisce?"
**Verifica:**
- ✅ Usa solo lunch_range (o dinner_range se configurato così)
- ✅ NON dice "pranzo e cena"
- ✅ Risposta corretta per orario continuo

### Test 26: Due fasce consecutive (es. 12:00-14:00 e 14:00-23:00)
**Configurazione KB:** lunch: ["12:00", "14:00"], dinner: ["14:00", "23:00"]
**Input:** "Siete aperti domani?"
**Risultato atteso:** "Siamo aperti a pranzo dalle 12:00 alle 14:00 e a cena dalle 14:00 alle 23:00."
**Verifica:**
- ✅ Distingue correttamente le due fasce anche se consecutive

### Test 27: Solo pranzo (es. 12:00-15:00)
**Configurazione KB:** lunch: ["12:00", "15:00"], dinner: null
**Input:** "Siete aperti domani?"
**Risultato atteso:** "Siamo aperti dalle 12:00 alle 15:00. A che ora preferisce?"
**Verifica:**
- ✅ Usa solo lunch_range
- ✅ NON menziona "cena"

---

## 📝 NOTE PER I TEST

1. **Numero chiamante**: In chiamata vocale, usa sempre {{customer.number}} come numero_attivo (normalizzato)
2. **Sequenza tool**: Verifica sempre che i tool vengano chiamati nell'ordine corretto
3. **Conferme**: L'assistente NON deve mai confermare prima della risposta del tool
4. **Errori**: Dopo un errore di validazione, NON procedere con altri tool finché manca il dato

---

## 🔍 COME VERIFICARE

Per ogni test:
1. Controlla i log del backend per vedere le chiamate ai tool
2. Verifica che i parametri passati siano corretti
3. Controlla che la risposta dell'assistente corrisponda al risultato atteso
4. Verifica che NON ci siano invenzioni di dati (orari, date, disponibilità)
