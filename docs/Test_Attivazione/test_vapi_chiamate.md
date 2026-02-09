# Test Vapi – Chiamate vocali (receptionist AI)

Guida per testare la receptionist AI tramite **chiamate vocali reali** su Vapi. Ogni test simula una conversazione tipica con un cliente che chiama un ristorante.

**Ordine esecuzione:** Modena01 prima (tutti i test A–M), poi subset Roma (I1–I2 + selezione A, C, D, E, F, G, J).

**Come usare questo file:** dopo ogni test, compila:

- **Esito:** OK / KO / Parziale
- **Risposte receptionist:** cosa ha detto (sintesi o trascrizione)
- **Log tool chiamati:** quali API sono state invocate (da log backend o Vapi)

---

## Configurazione test


| Ristorante          | Backend                | restaurant_id | Note                                     |
| ------------------- | ---------------------- | ------------- | ---------------------------------------- |
| Da Michele (Modena) | resOS                  | modena01      | KB: max_people 4, lunedì/domenica chiusi |
| Ristorante Roma     | Google Sheets/Calendar | roma          | KB: max_people 8, orari da verificare    |


**KB modena01:** martedì–giovedì lunch 12:30–14:30, dinner 19:00–22:30; venerdì/sabato dinner fino 23:30; lunedì e domenica chiusi.

---

## A. PRENOTAZIONE – Flow completo

### A1. Prenotazione semplice (tutti i dati subito)

**Ristorante:** modena01

**Cliente dice:** "Buongiorno, vorrei prenotare un tavolo per domani sera alle 20 per 2 persone, il nome è Mario Rossi."

**Obiettivo:** Flow completo in una frase. Receptionist deve: resolve_relative_day("domani"), check_openings(day, 20:00), raccogliere conferma se phone = numero chiamante, create_booking.

**Tool attesi:** resolve_relative_day, check_openings, create_booking (eventualmente list_bookings se chiede conferma prenotazioni esistenti)

**Esito:** 

**Risposte receptionist:**

**Log tool chiamati:**

---

### A2. Prenotazione step-by-step (dati uno per volta)

**Ristorante:** modena01

**Cliente dice:**

1. "Vorrei prenotare."
2. [Receptionist chiede quando] "Domani."
3. [Receptionist chiede orario] "Alle 19 e mezza."
4. [Receptionist chiede quante persone] "Siamo in 3."
5. [Receptionist chiede nome] "Giulia Bianchi."
6. [Receptionist chiede conferma / usa numero chiamante] "Sì, confermo."

**Obiettivo:** Raccoglimento dati uno per volta; uso corretto di resolve_relative_day, resolve_relative_time (se necessario), check_openings prima di create_booking.

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### A3. Prenotazione con giorno della settimana

**Ristorante:** modena01

**Cliente dice:** "Buonasera, avete posto sabato prossimo per cena? Saremmo in 4, vorremmo le 21."

**Obiettivo:** resolve_relative_day("sabato prossimo"), check_openings, create_booking. Verificare che "sabato prossimo" venga risolto correttamente.

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### A4. Prenotazione pranzo

**Ristorante:** modena01

**Cliente dice:** "Vorrei prenotare per giovedì a pranzo, verso l'una, 2 persone. Nome Carla Neri."

**Obiettivo:** Pranzo (lunch) invece di cena; orario "verso l'una" → 13:00 o slot vicino; check_openings con time appropriato.

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

## B. PRENOTAZIONE – Casi particolari

### B1. Giorno chiuso (lunedì/domenica)

**Ristorante:** modena01

**Cliente dice:** "Vorrei prenotare per lunedì prossimo alle 20, 2 persone."

**Obiettivo:** check_openings restituisce closed=true. Receptionist deve dire che quel giorno è chiuso e NON inventare alternative senza verificare.

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### B2. Orario fuori slot (es. 19:20)

**Ristorante:** modena01

**Cliente dice:** "Avete posto domani alle 19 e 20 per 2 persone?"

**Obiettivo:** Le 19:20 non sono uno slot (slot ogni 30 min). Receptionist deve dire che non si accetta prenotazione a quell'orario esatto e proporre nearest_slots (19:00 o 19:30), NON "siamo chiusi".

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### B3. Orario ambiguo ("alle 10")

**Ristorante:** modena01

**Cliente dice:** "Vorrei prenotare per dopodomani alle 10, 2 persone."

**Obiettivo:** "Alle 10" è ambiguo (mattina o sera). Receptionist deve chiedere chiarimento ("Intende alle 10 del mattino o alle 22 di sera?") PRIMA di chiamare tool. Non assumere. Il giorno ("dopodomani") è già chiaro: chiarire solo 10 vs 22, poi procedere con resolve_relative_day + check_openings + create_booking.

**Tool attesi:** resolve_relative_day, check_openings, create_booking (solo dopo chiarimento orario)

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### B4. Max persone superato (modena01: max 4)

**Ristorante:** modena01

**Cliente dice:** "Vorrei prenotare per venerdì alle 20 per 6 persone, nome Andrea Verdi."

**Obiettivo:** create_booking deve rifiutare (MAX_PEOPLE_EXCEEDED). Receptionist comunica il limite (max 4 persone) e non inventa.

**Tool attesi:** resolve_relative_day, check_openings, create_booking (restituisce errore)

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### B5. Disponibilità piena (slot full)

**Ristorante:** modena01

**Obiettivo:** Usare un giorno/orario con max_concurrent_bookings già raggiunto (creare prima N prenotazioni via Postman se necessario). Receptionist deve proporre nearest_slots e NON chiamare create_booking.

**Cliente dice:** "Vorrei prenotare per [giorno con slot pieno] alle 20 per 2 persone."

**Tool attesi:** check_openings (available=false, reason=full), NO create_booking

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### B6. Duplicato (stessa prenotazione già esistente)

**Ristorante:** modena01

**Precondizione:** Esiste già una prenotazione per quel telefono, giorno e orario (creata prima via Postman o chiamata precedente).

**Cliente dice:** "Vorrei prenotare per domani alle 20 per 2 persone, Mario Rossi." [stessi dati di prenotazione già esistente]

**Obiettivo:** Backend restituisce DUPLICATE_BOOKING. Receptionist deve comunicare che esiste già una prenotazione e proporre di modificarla o controllare.

**Tool attesi:** check_openings (o controllo duplicati), create_booking (restituisce DUPLICATE_BOOKING)

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

## C. LISTA PRENOTAZIONI

### C1. Cliente chiede le sue prenotazioni

**Ristorante:** modena01 (o roma)

**Cliente dice:** "Buongiorno, vorrei sapere se ho delle prenotazioni."

**Obiettivo:** list_bookings(phone=numero_chiamante). Se count=0: comunicare; se count=1: dare dettagli; se count>1: elencare in modo conciso (max 2 opzioni per scelta se serve).

**Tool attesi:** list_bookings

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### C2. Nessuna prenotazione

**Ristorante:** modena01

**Cliente dice:** "Ho una prenotazione per sabato?" [telefono senza prenotazioni]

**Obiettivo:** list_bookings restituisce results vuoto. Receptionist dice che non ci sono prenotazioni per quel numero; può chiedere se ha usato un altro numero o proporre di prenotare.

**Tool attesi:** list_bookings

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### C3. Più prenotazioni – cliente deve specificare

**Ristorante:** modena01

**Precondizione:** Cliente ha 2+ prenotazioni future (create via Postman).

**Cliente dice:** "Vorrei modificare la mia prenotazione." [ha 2 prenotazioni]

**Obiettivo:** list_bookings; receptionist chiede "Che giorno e a che ora era la prenotazione da modificare?" e propone max 2 opzioni; NON elenco lungo con tutti i dettagli.

**Tool attesi:** list_bookings

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

## D. MODIFICA PRENOTAZIONE

### D1. Modifica orario

**Ristorante:** modena01

**Precondizione:** Cliente ha 1 prenotazione (es. domani 20:00).

**Cliente dice:** "Ho una prenotazione per domani alle 20. Potrei spostarla alle 21?"

**Obiettivo:** list_bookings → identificare booking_id; check_openings(nuovo_time) se necessario; modify_booking con new_time. Confermare solo con esito tool.

**Tool attesi:** list_bookings, check_openings, modify_booking

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### D2. Modifica numero persone

**Ristorante:** modena01

**Cliente dice:** "Avevo prenotato per 2 persone venerdì alle 20, vorrei cambiare a 4 persone."

**Obiettivo:** list_bookings → identificare; modify_booking con new_people. Controllare che 4 non superi max_people (modena01 max 4, OK).

**Tool attesi:** list_bookings, modify_booking

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### D3. Modifica giorno (spostare ad altro giorno)

**Ristorante:** modena01

**Cliente dice:** "Ho una prenotazione sabato alle 20, posso spostarla a domenica?" [domenica chiusa per modena01]

**Obiettivo:** check_openings(domenica) → closed=true. Receptionist deve dire che domenica è chiuso e proporre alternativa (es. venerdì o sabato altro orario).

**Tool attesi:** list_bookings, resolve_relative_day, check_openings (closed), NO modify_booking

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

## E. CANCELLAZIONE

### E1. Cancellazione prenotazione unica

**Ristorante:** modena01

**Precondizione:** Cliente ha 1 prenotazione.

**Cliente dice:** "Vorrei cancellare la mia prenotazione per domani."

**Obiettivo:** list_bookings → identificare; cancel_booking; confermare cancellazione.

**Tool attesi:** list_bookings, cancel_booking

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### E2. Cancellazione con più prenotazioni

**Ristorante:** modena01

**Precondizione:** Cliente ha 2+ prenotazioni.

**Cliente dice:** "Vorrei annullare una prenotazione." [Receptionist deve chiedere quale]

**Obiettivo:** list_bookings; chiedere quale (giorno+ora); cancel_booking sulla scelta.

**Tool attesi:** list_bookings, cancel_booking

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### E3. Cancellazione senza prenotazioni

**Ristorante:** modena01

**Cliente dice:** "Vorrei cancellare la prenotazione di stasera." [nessuna prenotazione per quel telefono]

**Obiettivo:** list_bookings → count=0. Receptionist dice che non ci sono prenotazioni; può chiedere se ha usato altro numero.

**Tool attesi:** list_bookings

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

## F. FAQ

### F1. Parcheggio

**Ristorante:** modena01

**Cliente dice:** "Avete parcheggio?"

**Obiettivo:** faq(question="...") → risposta da KB. Receptionist deve usare la risposta del tool, non inventare.

**Tool attesi:** faq

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### F2. Glutine

**Ristorante:** modena01

**Cliente dice:** "Avete opzioni senza glutine?"

**Obiettivo:** faq restituisce risposta da KB modena01.

**Tool attesi:** faq

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### F3. Animali

**Ristorante:** modena01

**Cliente dice:** "Si possono portare i cani?"

**Obiettivo:** faq con keywords "animali/cani" → match su entry "I Animali sono amessi?". Risposta: no.

**Tool attesi:** faq

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### F4. Domanda senza risposta in KB

**Ristorante:** modena01

**Cliente dice:** "Avete torte per compleanno?"

**Obiettivo:** faq restituisce answer=null (nessuna FAQ su torte). Receptionist deve dire "Non ho questa informazione disponibile" e NON inventare; può offrire di mettere in contatto col ristorante se is_open_now.

**Tool attesi:** faq

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

## G. ORARI (solo informazione)

### G1. "Siete aperti?"

**Ristorante:** modena01

**Cliente dice:** "Siete aperti adesso?"

**Obiettivo:** is_open_now (se serve per handover) o check_openings con day=oggi. Comunicare orari senza avviare flow prenotazione.

**Tool attesi:** is_open_now e/o check_openings

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### G2. "A che ora aprite domani?"

**Ristorante:** modena01

**Cliente dice:** "A che ora aprite domani? / Quali sono gli orari di domani?"

**Obiettivo:** resolve_relative_day("domani"), check_openings(day). Usare lunch_range e dinner_range per rispondere. NON confondere con disponibilità per prenotazione.

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### G3. Giorno chiuso – solo orari

**Ristorante:** modena01

**Cliente dice:** "Siete aperti lunedì?"

**Obiettivo:** check_openings(lunedì) → closed=true. Dire che lunedì è chiuso.

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

## H. EDGE CASES E ERRORI

### H1. NO_TABLE_AVAILABLE (resOS: slot pieno in create)

**Ristorante:** modena01 (resOS)

**Obiettivo:** Se check_openings passa ma create_booking restituisce NO_TABLE_AVAILABLE (race condition o capacity diversa resOS vs KB), receptionist deve comunicare e proporre altro orario senza panico.

**Cliente dice:** [Flow prenotazione che arriva a create_booking; backend restituisce NO_TABLE_AVAILABLE]

**Tool attesi:** check_openings, create_booking (errore NO_TABLE_AVAILABLE)

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### H2. Conferma ambigua ("sì" senza specificare quale slot)

**Ristorante:** modena01

**Cliente dice:** "Non avete le 19:30? Va bene allora." [Receptionist aveva proposto 19:00 o 21:00]

**Obiettivo:** Receptionist NON deve assumere il primo slot. Deve chiedere "Preferisce alle 19 o alle 21?" e procedere solo dopo scelta esplicita.

**Tool attesi:** check_openings (già fatto), create_booking (solo dopo scelta chiara)

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### H3. Cliente dà tutti i dati in ordine sparso

**Ristorante:** modena01

**Cliente dice:** "Siamo in 4, mio nome è Paolo, vorrei sabato alle 21, il numero è questo che state chiamando."

**Obiettivo:** Receptionist estrae day, time, people, name; phone = numero attivo. Deve verificare con check_openings prima di create_booking. Una domanda per volta se manca qualcosa.

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### H4. Orario relativo ("tra un'ora")

**Ristorante:** modena01

**Cliente dice:** "Vorrei prenotare per tra un'ora, 2 persone, nome Luca."

**Obiettivo:** Sequenza corretta: resolve_relative_time("tra un'ora") → resolve_relative_day("oggi") se serve → calcolo day con day_offset → check_openings(day, time). Non chiamare "oggi" e poi aggiungere day_offset a caso; se day_offset=1 (es. "tra un'ora" a mezzanotte) usare domani. Se "tra un'ora" è oltre chiusura o prima apertura, gestire.

**Tool attesi:** resolve_relative_time, resolve_relative_day, check_openings, create_booking

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

## J. HANDOVER (Call Transfer)

### J1. Trigger esplicito – ristorante aperto
**Ristorante:** modena01

**Cliente dice:** "Vorrei parlare con una persona / voglio parlare con qualcuno del ristorante."

**Obiettivo:** is_open_now; se open_now=true → transfer. Dire che si mette in contatto con il ristorante. Nessuna domanda dopo transfer.

**Tool attesi:** is_open_now, transfer_call_tool

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### J2. Trigger esplicito – ristorante chiuso
**Ristorante:** modena01

**Cliente dice:** "Vorrei parlare con qualcuno." [ristorante chiuso in questo momento]

**Obiettivo:** is_open_now → open_now=false. NON fare transfer. Dire che il ristorante è chiuso, quando riapre, e offrire aiuto ("Posso aiutarla io").

**Tool attesi:** is_open_now

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### J3. Handover dopo errore tecnico
**Ristorante:** modena01

**Contesto:** Dopo un errore tecnico ripetuto (es. tool fallito 2 volte), il cliente dice "Allora voglio parlare con qualcuno."

**Obiettivo:** is_open_now; se aperto → transfer. Se chiuso → messaggio chiusura + orari.

**Tool attesi:** is_open_now, eventuale transfer

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

## K. TELEFONO (numero chiamante vs numero dettato)

### K1. Numero diverso dal chiamante
**Ristorante:** modena01

**Cliente dice:** "Sto chiamando per mia moglie. Vorrei prenotare domani alle 20 per 2 persone, nome Maria Rossi, il numero è tre tre tre uno due tre quattro cinque sei sette."

**Obiettivo:** Usare il numero DETTATO (+393331234567), NON il numero del chiamante. Normalizzare "tre tre tre..." in E.164. create_booking con quel phone.

**Tool attesi:** resolve_relative_day, check_openings, create_booking (con phone dettato)

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### K2. Numero con formato sporco (spazi, trattini)
**Ristorante:** modena01

**Cliente dice:** "Il numero è 333 123 45 67" oppure "333-1234567" [formato non E.164]

**Obiettivo:** Normalizzare a +393331234567 per i tool. Al cliente dire "userò questo numero" senza leggere cifra per cifra. Non inventare.

**Tool attesi:** (nel contesto create_booking) create_booking con phone normalizzato

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### K3. Conferma uso numero chiamante
**Ristorante:** modena01

**Cliente dice:** "Vorrei prenotare per sabato alle 21, 3 persone, nome Andrea. Il numero è questo da cui sto chiamando."

**Obiettivo:** phone = numero attivo (caller). Receptionist deve confermare "Userò questo numero" senza chiedere di dettarlo.

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

## L. GOODBYE / CONFERMA FINALE (gating)

### L1. Chiusura precoce ("ok grazie ciao") prima di dare dati
**Ristorante:** modena01

**Cliente dice:** "Buongiorno... Ah no aspetta, ho trovato altro. Ok grazie ciao."

**Obiettivo:** Receptionist deve chiudere senza chiamare tool. Risposta breve ("Prego, buona giornata"). Nessun tool-call inutile.

**Tool attesi:** nessuno

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### L2. Conferma finale dopo create_booking ok
**Ristorante:** modena01

**Contesto:** create_booking restituisce ok:true con booking_id.

**Cliente dice:** [dopo aver sentito la conferma] "Perfetto, grazie. Ciao."

**Obiettivo:** Receptionist deve aver confermato dettagli (giorno, orario, persone, nome) e chiudere in modo pulito. Nessuna domanda extra. Risposta breve ("Prego, arrivederci").

**Tool attesi:** (già eseguiti: check_openings, create_booking)

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### L3. "A posto così" durante raccolta dati
**Ristorante:** modena01

**Cliente dice:** "Vorrei prenotare... A che ora? Mmh, a posto così, grazie."

**Obiettivo:** Dati incompleti. Receptionist deve chiudere senza create_booking (mancano day, time, people, ecc.). Non inventare. Chiusura cortese.

**Tool attesi:** nessuno (o solo resolve se aveva dato il giorno)

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

## M. PROVIDER_ERROR (errore generico non mappato)

### M1. CREATE_ERROR – errore resOS diverso da NO_TABLE_AVAILABLE
**Ristorante:** modena01 (resOS)

**Obiettivo:** Simulare un 422 diverso da "no suitable table" (es. campo invalido, errore generico). create_booking restituisce CREATE_ERROR con messaggio tecnico. Receptionist deve dire "non riesco a completare la prenotazione" + proporre alternativa (altro orario) o handover se is_open_now.

**Cliente dice:** [Flow prenotazione completo che arriva a create_booking; backend restituisce CREATE_ERROR]

**Tool attesi:** check_openings, create_booking (errore), eventuale is_open_now

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### M2. UPDATE_ERROR – modify_booking fallisce
**Ristorante:** modena01

**Obiettivo:** modify_booking restituisce UPDATE_ERROR (es. resOS rifiuta la modifica). Receptionist deve comunicare il motivo usando error_message e proporre alternativa (altro giorno/ora) o handover.

**Cliente dice:** "Vorrei spostare la prenotazione di domani alle 21." [modify fallisce]

**Tool attesi:** list_bookings, check_openings, modify_booking (errore), eventuale is_open_now

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### M3. Errore provider + proposta handover (ristorante aperto)
**Ristorante:** modena01

**Obiettivo:** Dopo CREATE_ERROR o UPDATE_ERROR, se is_open_now=true, receptionist può offrire "Vuole che la metta in contatto con il ristorante?" come fallback.

**Tool attesi:** create/modify (errore), is_open_now, eventuale transfer

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

## I. TEST ROMA (Sheets) – Stessi flow

Eseguire una selezione degli stessi test (es. A1, A2, C1, D1, E1, F1, G1, J1, J2) con **restaurant_id: roma** per verificare coerenza con backend Google Sheets/Calendar. Usare numero di telefono con prenotazioni su roma se necessario.

### I1. Prenotazione completa roma

**Ristorante:** roma

**Cliente dice:** "Vorrei prenotare per dopodomani alle 20 per 3 persone, nome Anna Blu."

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### I2. Lista e modifica roma

**Ristorante:** roma

**Cliente dice:** "Ho prenotazioni? Vorrei spostare quella di venerdì alle 21."

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

## Riepilogo esiti


| Categoria            | Test  | Modena01 | Roma |
| -------------------- | ----- | -------- | ---- |
| A. Prenotazione      | A1–A4 |          |      |
| B. Casi particolari  | B1–B6 |          |      |
| C. Lista             | C1–C3 |          |      |
| D. Modifica          | D1–D3 |          |      |
| E. Cancellazione     | E1–E3 |          |      |
| F. FAQ               | F1–F4 |          |      |
| G. Orari             | G1–G3 |          |      |
| H. Edge cases        | H1–H4 |          |      |
| J. Handover          | J1–J3 |          |      |
| K. Telefono          | K1–K3 |          |      |
| L. Goodbye/Conferma  | L1–L3 |          |      |
| M. Provider error    | M1–M3 |          |      |
| I. Roma              | I1–I2 |          |      |


---

*Compilare dopo ogni sessione di test. I log tool sono visibili nei log del backend (server Node) o nel dashboard Vapi (function calls).*