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
| Trattoria OctoDemo  | OctoTable (sandbox)    | octodemo      | KB: max_people 4, domenica chiuso, Lun-Sab lunch 12-15 dinner 19-23 |


**KB modena01:** martedì–giovedì lunch 12:30–14:30, dinner 19:00–22:30; venerdì/sabato dinner fino 23:30; lunedì e domenica chiusi.

---

## A. PRENOTAZIONE – Flow completo

### A1. Prenotazione semplice (tutti i dati subito)

**Ristorante:** modena01

**Cliente dice:** "Buongiorno, vorrei prenotare un tavolo per domani sera alle 20 per 2 persone, il nome è Mario Rossi."

**Obiettivo:** Flow completo in una frase. Receptionist deve: resolve_relative_day("domani"), check_openings(day, 20:00), raccogliere conferma se phone = numero chiamante, create_booking.

**Tool attesi:** resolve_relative_day, check_openings, create_booking (eventualmente list_bookings se chiede conferma prenotazioni esistenti)

**Esito:** 

**Risposte receptionist:** 1. Abbiamo disponibilità per domani sera alle 20. Procediamo con la prenotazione. Mi conferma il numero di telefono da utilizzare?  - Cliente: Dal numero che chiamo.
2.La prenotazione è stata confermata per domani. 12 febbraio. Alle 20 per 2 persone a nome Mario Rossi. Se bisogno di ulteriore assistenza non esiti a chiedere. Arrivederci.

**Log tool chiamati:** {"ts":"2026-02-11T12:46:15.298Z","level":"info","event":"api_request","request_id":"3b227bcd","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cbc-b874-7dd3-9811-60d5d6b6e7e1","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T12:46:15.301Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"modena01","source":"vapi","request_id":"3b227bcd","text":"domani","date":"2026-02-12"}
{"ts":"2026-02-11T12:46:15.305Z","level":"info","event":"api_request","request_id":"04918468","method":"POST","path":"/api/resolve_relative_time","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cbc-b874-7dd3-9811-60d5d6b6e7e1","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T12:46:15.305Z","level":"info","event":"resolve_relative_time_error","restaurant_id":"modena01","source":"vapi","request_id":"04918468","text":"20","error_code":"UNSUPPORTED_RELATIVE_TIME","error_message":"Espressione orario non riconosciuta."}
{"ts":"2026-02-11T12:46:16.772Z","level":"info","event":"api_request","request_id":"0e12c696","method":"POST","path":"/api/check_openings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cbc-b874-7dd3-9811-60d5d6b6e7e1","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T12:46:17.056Z","level":"info","event":"capacity_check_success","restaurant_id":"modena01","day":"2026-02-12","requested_time":"20:00","in_openings":true,"slot_exists":true,"active_bookings_count":0,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"0e12c696"}
{"ts":"2026-02-11T12:46:17.057Z","level":"info","event":"check_openings_success","restaurant_id":"modena01","day":"2026-02-12","closed":false,"openings_count":13,"requested_time":"20:00","available":true,"reason":null,"source":"vapi","request_id":"0e12c696"}
{"ts":"2026-02-11T12:46:31.748Z","level":"info","event":"api_request","request_id":"44245295","method":"POST","path":"/api/create_booking","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cbc-b874-7dd3-9811-60d5d6b6e7e1","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T12:46:32.333Z","level":"info","event":"resos_create_reservation","restaurant_id":"modena01","resos_restaurant_id":"JLAs2CviunNCSEfbt","reservation_id":"DLq2fN8GTrCbHjetQ"}
{"ts":"2026-02-11T12:46:32.333Z","level":"info","event":"create_booking_success","restaurant_id":"modena01","day":"2026-02-12","time":"20:00","people":2,"phone":"+39XXX...688","booking_id":"DLq2fN8GTrCbHjetQ","source":"vapi","request_id":"44245295"}

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

**Risposte receptionist:** 1.Certamente. Per quando desidera effettuare la prenotazione, 2.Domani sarà il 12 febbraio. A che ora preferisce prenotare?; 3.Abbiamo disponibilità per domani alle 19.30. Quante persone saranno?  4.Perfetto, posso avere il suo nome per favore?; 5. Grazie Giulia. Infine userò il numero di telefono Plus 3 39 393 4 9 2 6 7 4 6 8. 9 8 per la prenotazione. Va bene?; 6.La prenotazione è confermata per domani 12 febbraio alle nineteen point 3 0 per 3 persone a nome Giulia Bianchi. Arrivederci e buona giornata.; 7.Prego buona giornata.

**Log tool chiamati:**{"ts":"2026-02-11T12:53:08.041Z","level":"info","event":"api_request","request_id":"543db944","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cc2-fb25-7cc8-a030-fb230c5ea786","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T12:53:08.042Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"modena01","source":"vapi","request_id":"543db944","text":"domani","date":"2026-02-12"}
{"ts":"2026-02-11T12:53:20.736Z","level":"info","event":"api_request","request_id":"70f3d56a","method":"POST","path":"/api/check_openings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cc2-fb25-7cc8-a030-fb230c5ea786","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T12:53:20.903Z","level":"info","event":"capacity_check_success","restaurant_id":"modena01","day":"2026-02-12","requested_time":"19:30","in_openings":true,"slot_exists":true,"active_bookings_count":0,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"70f3d56a"}
{"ts":"2026-02-11T12:53:20.903Z","level":"info","event":"check_openings_success","restaurant_id":"modena01","day":"2026-02-12","closed":false,"openings_count":13,"requested_time":"19:30","available":true,"reason":null,"source":"vapi","request_id":"70f3d56a"}
{"ts":"2026-02-11T12:53:56.921Z","level":"info","event":"api_request","request_id":"77d084e9","method":"POST","path":"/api/create_booking","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cc2-fb25-7cc8-a030-fb230c5ea786","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
Menu
{"ts":"2026-02-11T12:53:57.481Z","level":"info","event":"resos_create_reservation","restaurant_id":"modena01","resos_restaurant_id":"JLAs2CviunNCSEfbt","reservation_id":"GAqQyLmSWWLRQEdgB"}
{"ts":"2026-02-11T12:53:57.481Z","level":"info","event":"create_booking_success","restaurant_id":"modena01","day":"2026-02-12","time":"19:30","people":3,"phone":"+39XXX...688","booking_id":"GAqQyLmSWWLRQEdgB","source":"vapi","request_id":"77d084e9"}

---

### A3. Prenotazione con giorno della settimana

**Ristorante:** modena01

**Cliente dice:** "Buonasera, avete posto sabato prossimo per cena? Saremmo in 4, vorremmo le 21."

**Obiettivo:** resolve_relative_day("sabato prossimo"), check_openings, create_booking. Verificare che "sabato prossimo" venga risolto correttamente.

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Esito:**

**Risposte receptionist:** 1.Siamo aperti sabato prossimo 14 febbraio dalle 19 alle 23.30 e abbiamo disponibilità per le 21. Posso procedere con la prenotazione per 4 persone, mi conferma il suo nome e il numero di telefono? - Cliente: Mi chiamo Giulia; 2.Perfetto Giulia. E per il numero di telefono posso usare il numero da cui sta chiamando? - Cliente: Certo; 3.La prenotazione è confermata per sabato 14 febbraio alle 21 per 4 persone a nome Giulia. Se bisogno di ulteriore assistenza, non esiti a chiedere. Arrivederci. - Cliente: Va bene grazie 1000;
4.Prego, buona giornata.

**Log tool chiamati:**{"ts":"2026-02-11T13:07:28.445Z","level":"info","event":"api_request","request_id":"c570398c","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cd0-28db-7ffe-93fb-1502ddd47208","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T13:07:28.446Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"modena01","source":"vapi","request_id":"c570398c","text":"sabato prossimo","date":"2026-02-14"}
{"ts":"2026-02-11T13:07:28.457Z","level":"info","event":"api_request","request_id":"8dbf193a","method":"POST","path":"/api/resolve_relative_time","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cd0-28db-7ffe-93fb-1502ddd47208","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T13:07:28.457Z","level":"info","event":"resolve_relative_time_error","restaurant_id":"modena01","source":"vapi","request_id":"8dbf193a","text":"21","error_code":"UNSUPPORTED_RELATIVE_TIME","error_message":"Espressione orario non riconosciuta."}
{"ts":"2026-02-11T13:07:31.004Z","level":"info","event":"api_request","request_id":"ec8ad02b","method":"POST","path":"/api/check_openings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cd0-28db-7ffe-93fb-1502ddd47208","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T13:07:31.143Z","level":"info","event":"capacity_check_success","restaurant_id":"modena01","day":"2026-02-14","requested_time":"21:00","in_openings":true,"slot_exists":true,"active_bookings_count":0,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"ec8ad02b"}
{"ts":"2026-02-11T13:07:31.143Z","level":"info","event":"check_openings_success","restaurant_id":"modena01","day":"2026-02-14","closed":false,"openings_count":10,"requested_time":"21:00","available":true,"reason":null,"source":"vapi","request_id":"ec8ad02b"}
{"ts":"2026-02-11T13:08:06.558Z","level":"info","event":"api_request","request_id":"367d3022","method":"POST","path":"/api/create_booking","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cd0-28db-7ffe-93fb-1502ddd47208","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
Menu
{"ts":"2026-02-11T13:08:07.170Z","level":"info","event":"resos_create_reservation","restaurant_id":"modena01","resos_restaurant_id":"JLAs2CviunNCSEfbt","reservation_id":"jpRKssx95bJN9uArC"}
{"ts":"2026-02-11T13:08:07.170Z","level":"info","event":"create_booking_success","restaurant_id":"modena01","day":"2026-02-14","time":"21:00","people":4,"phone":"+39XXX...688","booking_id":"jpRKssx95bJN9uArC","source":"vapi","request_id":"367d3022"}

---

### A4. Prenotazione pranzo

**Ristorante:** modena01

**Cliente dice:** "Vorrei prenotare per giovedì a pranzo, verso l'una, 2 persone. Nome Carla Neri."

**Obiettivo:** Pranzo (lunch) invece di cena; orario "verso l'una" → 13:00 o slot vicino; check_openings con time appropriato.

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Esito:**

**Risposte receptionist:** 1.Siamo aperti a pranzo giovedì dalle 12.30 alle 14 :30. Per Luna abbiamo disponibilità Quante persone saranno?- Cliente: Saranno 2 persone.;
2.La prenotazione è stata confermata per giovedì 12 febbraio alle 13 per 2 persone a nome Carla Neri. Prego, buona giornata.; ... 

**Log tool chiamati:**{"ts":"2026-02-11T13:13:49.277Z","level":"info","event":"api_request","request_id":"2ef18f6b","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cd5-f6c6-7bb3-bd2c-e698b22af924","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T13:13:49.277Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"modena01","source":"vapi","request_id":"2ef18f6b","text":"giovedì","date":"2026-02-12"}
{"ts":"2026-02-11T13:13:50.343Z","level":"info","event":"api_request","request_id":"bcd86a3c","method":"POST","path":"/api/check_openings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cd5-f6c6-7bb3-bd2c-e698b22af924","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T13:13:50.501Z","level":"info","event":"capacity_check_success","restaurant_id":"modena01","day":"2026-02-12","requested_time":"13:00","in_openings":true,"slot_exists":true,"active_bookings_count":0,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"bcd86a3c"}
{"ts":"2026-02-11T13:13:50.501Z","level":"info","event":"check_openings_success","restaurant_id":"modena01","day":"2026-02-12","closed":false,"openings_count":13,"requested_time":"13:00","available":true,"reason":null,"source":"vapi","request_id":"bcd86a3c"}
{"ts":"2026-02-11T13:14:07.257Z","level":"info","event":"api_request","request_id":"8586789f","method":"POST","path":"/api/create_booking","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cd5-f6c6-7bb3-bd2c-e698b22af924","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T13:14:07.859Z","level":"info","event":"resos_create_reservation","restaurant_id":"modena01","resos_restaurant_id":"JLAs2CviunNCSEfbt","reservation_id":"wLy5NWaJcd3MjmJR4"}
{"ts":"2026-02-11T13:14:07.859Z","level":"info","event":"create_booking_success","restaurant_id":"modena01","day":"2026-02-12","time":"13:00","people":2,"phone":"+39XXX...688","booking_id":"wLy5NWaJcd3MjmJR4","source":"vapi","request_id":"8586789f"}

---

## B. PRENOTAZIONE – Casi particolari

### B1. Giorno chiuso (lunedì/domenica)

**Ristorante:** modena01

**Cliente dice:** "Vorrei prenotare per lunedì prossimo alle 20, 2 persone."

**Obiettivo:** check_openings restituisce closed=true. Receptionist deve dire che quel giorno è chiuso e NON inventare alternative senza verificare.

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**

**Risposte receptionist:** Mi dispiace, ma lunedì prossimo siamo chiusi. Vuole prenotare in un altro giorno?

**Log tool chiamati:**{"ts":"2026-02-11T13:22:39.613Z","level":"info","event":"api_request","request_id":"19f45727","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cde-1a40-711d-9231-15e3d4138d27","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T13:22:39.614Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"modena01","source":"vapi","request_id":"19f45727","text":"lunedì prossimo","date":"2026-02-16"}
{"ts":"2026-02-11T13:22:40.960Z","level":"info","event":"api_request","request_id":"12b75b1f","method":"POST","path":"/api/check_openings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cde-1a40-711d-9231-15e3d4138d27","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T13:22:41.087Z","level":"info","event":"capacity_check_success","restaurant_id":"modena01","day":"2026-02-16","requested_time":"20:00","in_openings":false,"slot_exists":false,"active_bookings_count":null,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":false,"reason":"not_in_openings","nearest_slots_count":0,"source":"vapi","request_id":"12b75b1f"}
{"ts":"2026-02-11T13:22:41.087Z","level":"info","event":"check_openings_success","restaurant_id":"modena01","day":"2026-02-16","closed":true,"openings_count":0,"requested_time":"20:00","available":false,"reason":"not_in_openings","source":"vapi","request_id":"12b75b1f"}

---

### B2. Orario fuori slot (es. 19:20)

**Ristorante:** modena01

**Cliente dice:** "Avete posto domani alle 19 e 20 per 2 persone?"

**Obiettivo:** Le 19:20 non sono uno slot (slot ogni 30 min). Receptionist deve dire che non si accetta prenotazione a quell'orario esatto e proporre nearest_slots (19:00 o 19:30), NON "siamo chiusi".

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**

**Risposte receptionist:** 1.Domani, 12 febbraio, siamo aperti a cena dalle 19 alle 22.30. Tuttavia, non accettiamo prenotazioni esattamente alle diciannove:venti. Posso proporle di prenotare alle 19 o alle diciannove:trenta. Va bene uno di questi orari?

**Log tool chiamati:**{"ts":"2026-02-11T13:27:06.346Z","level":"info","event":"api_request","request_id":"df931949","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4ce2-2ce1-711d-9235-6d915dd478ae","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T13:27:06.347Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"modena01","source":"vapi","request_id":"df931949","text":"domani","date":"2026-02-12"}
{"ts":"2026-02-11T13:27:06.562Z","level":"info","event":"api_request","request_id":"0c03895d","method":"POST","path":"/api/resolve_relative_time","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4ce2-2ce1-711d-9235-6d915dd478ae","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T13:27:06.563Z","level":"info","event":"resolve_relative_time_error","restaurant_id":"modena01","source":"vapi","request_id":"0c03895d","text":"19.20","error_code":"UNSUPPORTED_RELATIVE_TIME","error_message":"Espressione orario non riconosciuta."}
{"ts":"2026-02-11T13:27:08.341Z","level":"info","event":"api_request","request_id":"46972a93","method":"POST","path":"/api/check_openings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4ce2-2ce1-711d-9235-6d915dd478ae","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T13:27:08.513Z","level":"info","event":"capacity_check_success","restaurant_id":"modena01","day":"2026-02-12","requested_time":"19:00","in_openings":true,"slot_exists":true,"active_bookings_count":0,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"46972a93"}
{"ts":"2026-02-11T13:27:08.513Z","level":"info","event":"check_openings_success","restaurant_id":"modena01","day":"2026-02-12","closed":false,"openings_count":13,"requested_time":"19:00","available":true,"reason":null,"source":"vapi","request_id":"46972a93"}
{"ts":"2026-02-11T13:27:47.698Z","level":"info","event":"api_request","request_id":"411512f4","method":"POST","path":"/api/check_openings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4ce2-2ce1-711d-9235-6d915dd478ae","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T13:27:47.833Z","level":"info","event":"capacity_check_success","restaurant_id":"modena01","day":"2026-02-12","requested_time":"20:00","in_openings":true,"slot_exists":true,"active_bookings_count":2,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"411512f4"}
{"ts":"2026-02-11T13:27:47.833Z","level":"info","event":"check_openings_success","restaurant_id":"modena01","day":"2026-02-12","closed":false,"openings_count":13,"requested_time":"20:00","available":true,"reason":null,"source":"vapi","request_id":"411512f4"}
{"ts":"2026-02-11T13:28:18.574Z","level":"info","event":"api_request","request_id":"9cb77a51","method":"POST","path":"/api/create_booking","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4ce2-2ce1-711d-9235-6d915dd478ae","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
Menu
{"ts":"2026-02-11T13:28:19.187Z","level":"info","event":"resos_create_reservation","restaurant_id":"modena01","resos_restaurant_id":"JLAs2CviunNCSEfbt","reservation_id":"QuCeiW4gYgs3qbYbE"}
{"ts":"2026-02-11T13:28:19.187Z","level":"info","event":"create_booking_success","restaurant_id":"modena01","day":"2026-02-12","time":"20:00","people":2,"phone":"+39XXX...310","booking_id":"QuCeiW4gYgs3qbYbE","source":"vapi","request_id":"9cb77a51"}
---

### B3. Orario ambiguo ("alle 10")

**Ristorante:** modena01

**Cliente dice:** "Vorrei prenotare per dopodomani alle 10, 2 persone."

**Obiettivo:** "Alle 10" è ambiguo (mattina o sera). Receptionist deve chiedere chiarimento ("Intende alle 10 del mattino o alle 22 di sera?") PRIMA di chiamare tool. Non assumere. Il giorno ("dopodomani") è già chiaro: chiarire solo 10 vs 22, poi procedere con resolve_relative_day + check_openings + create_booking.

**Tool attesi:** resolve_relative_day, check_openings, create_booking (solo dopo chiarimento orario)

**Esito:**

**Risposte receptionist:**Intende alle 10 del mattino o alle 22 di sera?

**Log tool chiamati:**{"ts":"2026-02-11T13:37:34.735Z","level":"info","event":"api_request","request_id":"ed4912d1","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4ceb-a446-7bb3-bd40-ef9428b75d66","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T13:37:34.735Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"modena01","source":"vapi","request_id":"ed4912d1","text":"domani","date":"2026-02-12"}
{"ts":"2026-02-11T13:37:35.981Z","level":"info","event":"api_request","request_id":"7b8a9e7f","method":"POST","path":"/api/check_openings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4ceb-a446-7bb3-bd40-ef9428b75d66","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T13:37:36.107Z","level":"info","event":"capacity_check_success","restaurant_id":"modena01","day":"2026-02-12","requested_time":"22:00","in_openings":true,"slot_exists":true,"active_bookings_count":0,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"7b8a9e7f"}
{"ts":"2026-02-11T13:37:36.107Z","level":"info","event":"check_openings_success","restaurant_id":"modena01","day":"2026-02-12","closed":false,"openings_count":13,"requested_time":"22:00","available":true,"reason":null,"source":"vapi","request_id":"7b8a9e7f"}

---

### B4. Max persone superato (modena01: max 4)

**Ristorante:** modena01

**Cliente dice:** "Vorrei prenotare per venerdì alle 20 per 6 persone, nome Andrea Verdi."

**Obiettivo:** create_booking deve rifiutare (MAX_PEOPLE_EXCEEDED). Receptionist comunica il limite (max 4 persone) e non inventa.

**Tool attesi:** resolve_relative_day, check_openings, create_booking (restituisce errore)

**Esito:**

**Risposte receptionist:** 1.Per venerdì 13 febbraio alle 20 abbiamo disponibilità Posso procedere con la prenotazione per 6 per persone a nome Andrea Verdi. Conferma per favore? - Cliente: va bene.; 2.Purtroppo il numero massimo di persone per prenotazione è 4. Posso aiutarla a prenotare per 4 persone. Oppure desidera modificare il numero di partecipanti. - Cliente: Va bene, facciamo per 4 persone.

**Log tool chiamati:**{"ts":"2026-02-11T13:43:12.376Z","level":"info","event":"api_request","request_id":"5794ca2e","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cf0-df06-7337-bba9-c1640f490cfb","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T13:43:12.376Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"modena01","source":"vapi","request_id":"5794ca2e","text":"venerdì","date":"2026-02-13"}
{"ts":"2026-02-11T13:43:12.385Z","level":"info","event":"api_request","request_id":"ce681d0b","method":"POST","path":"/api/resolve_relative_time","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cf0-df06-7337-bba9-c1640f490cfb","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T13:43:12.385Z","level":"info","event":"resolve_relative_time_error","restaurant_id":"modena01","source":"vapi","request_id":"ce681d0b","text":"20","error_code":"UNSUPPORTED_RELATIVE_TIME","error_message":"Espressione orario non riconosciuta."}
Menu
{"ts":"2026-02-11T13:43:13.873Z","level":"info","event":"api_request","request_id":"b73bb856","method":"POST","path":"/api/check_openings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cf0-df06-7337-bba9-c1640f490cfb","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T13:43:13.996Z","level":"info","event":"capacity_check_success","restaurant_id":"modena01","day":"2026-02-13","requested_time":"20:00","in_openings":true,"slot_exists":true,"active_bookings_count":0,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"b73bb856"}
{"ts":"2026-02-11T13:43:13.996Z","level":"info","event":"check_openings_success","restaurant_id":"modena01","day":"2026-02-13","closed":false,"openings_count":17,"requested_time":"20:00","available":true,"reason":null,"source":"vapi","request_id":"b73bb856"}
{"ts":"2026-02-11T13:43:31.220Z","level":"info","event":"api_request","request_id":"f2aea490","method":"POST","path":"/api/create_booking","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cf0-df06-7337-bba9-c1640f490cfb","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T13:43:51.430Z","level":"info","event":"api_request","request_id":"5d4b53c6","method":"POST","path":"/api/create_booking","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cf0-df06-7337-bba9-c1640f490cfb","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T13:43:51.982Z","level":"info","event":"resos_create_reservation","restaurant_id":"modena01","resos_restaurant_id":"JLAs2CviunNCSEfbt","reservation_id":"6w92amCf9eQSKewYE"}
{"ts":"2026-02-11T13:43:51.982Z","level":"info","event":"create_booking_success","restaurant_id":"modena01","day":"2026-02-13","time":"20:00","people":4,"phone":"+39XXX...688","booking_id":"6w92amCf9eQSKewYE","source":"vapi","request_id":"5d4b53c6"}

---

### B5. Disponibilità piena (slot full)

**Ristorante:** modena01

**Obiettivo:** Usare un giorno/orario con max_concurrent_bookings già raggiunto (creare prima N prenotazioni via Postman se necessario). Receptionist deve proporre nearest_slots e NON chiamare create_booking.

**Cliente dice:** "Vorrei prenotare per [il 12] alle 20 per 2 persone."

**Tool attesi:** check_openings (available=false, reason=full), NO create_booking

**Esito:** Qui ho osservato una cosa, prima avevvo fatto un test dicendo 12 febbreio non solo 12 e non mi piace perché chiede il anno, non deve mai parlare del anno e non dirlo ai clienti, è ovvio che siamo nel 2026, deve sapere che quando si parla di una data prende sempre l'anno corrente che è il 2026 perché se parla del anno va in tilt e inizia a dire in inglese il anno.

**Risposte receptionist:**Per il 12 febbraio alle 20 non abbiamo disponibilità. Poiché siamo al completo. Posso proporle alcuni orari alternativi di diciannove:trenta o 21. Va bene uno di questi?

*Inoltre qui ha proposto le 19:30 anche se alle 20 erano tutti li tavoli occupati per un'ora, quindi poi mi ha detto che è occupato ma comunque ho detto che voglio alle 19:00 e anche se era libero mi ha detto che non ci sono tavoli.

**Log tool chiamati:**{"ts":"2026-02-11T13:51:55.354Z","level":"info","event":"api_request","request_id":"f6b8bea6","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cf8-e13a-7442-85ab-b395ae1105f2","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T13:51:55.355Z","level":"error","event":"resolve_relative_day_error","restaurant_id":"modena01","source":"vapi","request_id":"f6b8bea6","text":"12 febbraio","message":"Espressione giorno non riconosciuta. Usa domani/dopodomani/lunedì/tra X giorni oppure indica una data (YYYY-MM-DD)."}
{"ts":"2026-02-11T13:51:55.375Z","level":"info","event":"api_request","request_id":"713cc4d8","method":"POST","path":"/api/check_openings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cf8-e13a-7442-85ab-b395ae1105f2","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T13:51:55.528Z","level":"info","event":"capacity_check_success","restaurant_id":"modena01","day":"2026-02-12","requested_time":"20:00","in_openings":true,"slot_exists":true,"active_bookings_count":5,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":false,"reason":"full","nearest_slots_count":3,"source":"vapi","request_id":"713cc4d8"}
{"ts":"2026-02-11T13:51:55.528Z","level":"info","event":"check_openings_success","restaurant_id":"modena01","day":"2026-02-12","closed":false,"openings_count":13,"requested_time":"20:00","available":false,"reason":"full","source":"vapi","request_id":"713cc4d8"}
{"ts":"2026-02-11T13:52:37.062Z","level":"info","event":"api_request","request_id":"009f9105","method":"POST","path":"/api/create_booking","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cf8-e13a-7442-85ab-b395ae1105f2","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T13:52:37.400Z","level":"error","event":"resos_create_error","restaurant_id":"modena01","message":"resOS API POST /bookings: 422 no suitable table found [bookings.insert: no suitable table found]"}
{"ts":"2026-02-11T13:52:37.400Z","level":"info","event":"create_booking_success","restaurant_id":"modena01","day":"2026-02-12","time":"19:30","people":2,"phone":"+39XXX...688","source":"vapi","request_id":"009f9105"}
{"ts":"2026-02-11T13:52:51.871Z","level":"info","event":"api_request","request_id":"e4c5a3f8","method":"POST","path":"/api/check_openings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cf8-e13a-7442-85ab-b395ae1105f2","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T13:52:52.009Z","level":"info","event":"capacity_check_success","restaurant_id":"modena01","day":"2026-02-12","requested_time":"19:00","in_openings":true,"slot_exists":true,"active_bookings_count":0,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"e4c5a3f8"}
{"ts":"2026-02-11T13:52:52.009Z","level":"info","event":"check_openings_success","restaurant_id":"modena01","day":"2026-02-12","closed":false,"openings_count":13,"requested_time":"19:00","available":true,"reason":null,"source":"vapi","request_id":"e4c5a3f8"}
{"ts":"2026-02-11T13:53:07.876Z","level":"info","event":"api_request","request_id":"ac649617","method":"POST","path":"/api/create_booking","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cf8-e13a-7442-85ab-b395ae1105f2","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T13:53:08.199Z","level":"error","event":"resos_create_error","restaurant_id":"modena01","message":"resOS API POST /bookings: 422 no suitable table found [bookings.insert: no suitable table found]"}
{"ts":"2026-02-11T13:53:08.199Z","level":"info","event":"create_booking_success","restaurant_id":"modena01","day":"2026-02-12","time":"19:00","people":2,"phone":"+39XXX...688","source":"vapi","request_id":"ac649617"}
{"ts":"2026-02-11T13:53:28.100Z","level":"info","event":"api_request","request_id":"84476c21","method":"POST","path":"/api/create_booking","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4cf8-e13a-7442-85ab-b395ae1105f2","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T13:53:28.656Z","level":"info","event":"resos_create_reservation","restaurant_id":"modena01","resos_restaurant_id":"JLAs2CviunNCSEfbt","reservation_id":"rJjreGwWjQC3z9kbW"}
{"ts":"2026-02-11T13:53:28.656Z","level":"info","event":"create_booking_success","restaurant_id":"modena01","day":"2026-02-12","time":"21:00","people":2,"phone":"+39XXX...688","booking_id":"rJjreGwWjQC3z9kbW","source":"vapi","request_id":"84476c21"}

---

### B6. Duplicato (stessa prenotazione già esistente)

**Ristorante:** modena01

**Precondizione:** Esiste già una prenotazione per quel telefono, giorno e orario (creata prima via Postman o chiamata precedente).

**Cliente dice:** "Vorrei prenotare per domani alle 21 per 2 persone, Carla." [stessi dati di prenotazione già esistente]

**Obiettivo:** Backend restituisce DUPLICATE_BOOKING. Receptionist deve comunicare che esiste già una prenotazione e proporre di modificarla o controllare.

**Tool attesi:** check_openings (o controllo duplicati), create_booking (restituisce DUPLICATE_BOOKING)

**Esito:**

**Risposte receptionist:** 1.L'orario che mi indicato non è riconosciuto. Puoi indicarmi l'orario esatto? Ad esempio, 21.- Cliente:Sì, alle 21.
2.Siamo aperti domani. 12 febbraio dalle 19 alle 22.30 e abbiamo disponibilità per le 21 Posso procedere con la prenotazione per 2 persone.
3.Perfetto, posso avere il numero di telefono per completare la prenotazione a nome di Carla?
4.Risulta già una prenotazione per domani 12 febbraio alle 21 a nome di Carla. Vuole modificare questa prenotazione o verificare I dettagli dettagli?

**Log tool chiamati:**{"ts":"2026-02-11T14:02:47.034Z","level":"info","event":"api_request","request_id":"7e9e40ad","method":"POST","path":"/api/resolve_relative_time","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4d02-d1d4-7ee0-9f76-5cb02cb8a8dd","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T14:02:47.034Z","level":"info","event":"resolve_relative_time_error","restaurant_id":"modena01","source":"vapi","request_id":"7e9e40ad","text":"21","error_code":"UNSUPPORTED_RELATIVE_TIME","error_message":"Espressione orario non riconosciuta."}
{"ts":"2026-02-11T14:02:47.038Z","level":"info","event":"api_request","request_id":"e710bf0e","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4d02-d1d4-7ee0-9f76-5cb02cb8a8dd","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T14:02:47.038Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"modena01","source":"vapi","request_id":"e710bf0e","text":"domani","date":"2026-02-12"}
{"ts":"2026-02-11T14:03:02.950Z","level":"info","event":"api_request","request_id":"1c844de0","method":"POST","path":"/api/check_openings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4d02-d1d4-7ee0-9f76-5cb02cb8a8dd","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T14:03:03.105Z","level":"info","event":"capacity_check_success","restaurant_id":"modena01","day":"2026-02-12","requested_time":"21:00","in_openings":true,"slot_exists":true,"active_bookings_count":1,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"1c844de0"}
{"ts":"2026-02-11T14:03:03.105Z","level":"info","event":"check_openings_success","restaurant_id":"modena01","day":"2026-02-12","closed":false,"openings_count":13,"requested_time":"21:00","available":true,"reason":null,"source":"vapi","request_id":"1c844de0"}
{"ts":"2026-02-11T14:03:36.354Z","level":"info","event":"api_request","request_id":"e377256a","method":"POST","path":"/api/create_booking","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4d02-d1d4-7ee0-9f76-5cb02cb8a8dd","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T14:03:36.473Z","level":"info","event":"create_booking_success","restaurant_id":"modena01","day":"2026-02-12","time":"21:00","people":2,"phone":"+39XXX...688","source":"vapi","request_id":"e377256a"}
{"ts":"2026-02-11T14:03:37.501Z","level":"info","event":"api_request","request_id":"eed7e275","method":"POST","path":"/api/list_bookings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4d02-d1d4-7ee0-9f76-5cb02cb8a8dd","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T14:03:37.608Z","level":"info","event":"list_bookings_success","restaurant_id":"modena01","phone":"+39XXX...688","count":0,"source":"vapi","request_id":"eed7e275"}

---

## C. LISTA PRENOTAZIONI

### C1. Cliente chiede le sue prenotazioni

**Ristorante:** modena01 (o roma)

**Cliente dice:** "Buongiorno, vorrei sapere se ho delle prenotazioni."

**Obiettivo:** list_bookings(phone=numero_chiamante). Se count=0: comunicare; se count=1: dare dettagli; se count>1: elencare in modo conciso (max 2 opzioni per scelta se serve).

**Tool attesi:** list_bookings

**Esito:** Qui non deve dire l'anno perché lo legge in inglese, la cosa migliore e evitare che legga il anno.

**Risposte receptionist:** 1.Posso chiederle il numero di telefono utilizzato per la prenotazione
2.Alle seguenti prenotazioni, 12 febbraio 2026 alle 20 per 2 persone a nome, Mario Rossi, 12 febbraio 2126 alle 21 per 2 persone a nome Carla. 13 febbraio 2126 alle 20 per 4 persone a nome Andrea Verdi 14 febbraio 2126 alle....

**Log tool chiamati:**{"ts":"2026-02-11T14:06:35.585Z","level":"info","event":"api_request","request_id":"09e124ca","method":"POST","path":"/api/list_bookings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4d06-2220-7442-85c4-b57fd30e766b","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T14:06:35.725Z","level":"info","event":"list_bookings_success","restaurant_id":"modena01","phone":"+39XXX...688","count":0,"source":"vapi","request_id":"09e124ca"}

---

### C2. Nessuna prenotazione

**Ristorante:** modena01

**Cliente dice:** "Ho una prenotazione per sabato?" [telefono senza prenotazioni]

**Obiettivo:** list_bookings restituisce results vuoto. Receptionist dice che non ci sono prenotazioni per quel numero; può chiedere se ha usato un altro numero o proporre di prenotare.

**Tool attesi:** list_bookings

**Esito:**

**Risposte receptionist:**1.Posso controllare la sua prenotazione. Potrebbe gentilmente fornirmi il numero di telefono telefono utilizzato per la prenotazione. - Cliente: Certo il numero è uno 2 2 3 6 5 uno 2 3 2.
2.Non trovo prenotazioni con questo numero. Potrebbe confermarmi il numero utilizzato o indicarmi il giorno della prenotazione? - Cliente: Sì, il giorno è sabato.
3.Non riesco a trovare una prenotazione per sabato con il numero fornito. Potrebbe dirmi se utilizzato un altro numero di telefono per la prenotazione...

**Log tool chiamati:**{"ts":"2026-02-11T14:09:52.911Z","level":"info","event":"api_request","request_id":"f52eb590","method":"POST","path":"/api/list_bookings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4d09-12a6-7554-bd4e-2fd61e4c1598","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T14:09:53.110Z","level":"info","event":"list_bookings_success","restaurant_id":"modena01","phone":"+39XXX...123","count":0,"source":"vapi","request_id":"f52eb590"}

---

### C3. Più prenotazioni – cliente deve specificare

**Ristorante:** modena01

**Precondizione:** Cliente ha 2+ prenotazioni future (create via Postman).

**Cliente dice:** "Vorrei modificare la mia prenotazione." [ha 2 prenotazioni]

**Obiettivo:** list_bookings; receptionist chiede "Che giorno e a che ora era la prenotazione da modificare?" e propone max 2 opzioni; NON elenco lungo con tutti i dettagli.

**Tool attesi:** list_bookings

**Esito:** Qui non so perché ma non ha detto l'anno quini va bene, quando non dice l'anno va tutto bene e funziona bene

**Risposte receptionist:**1.Posso aiutarla con questo? Potrebbe gentilmente fornirmi il numero di telefono utilizzato per la prenotazione.
2.Ho trovato 4 prenotazioni con il numero fornito. Uno 12 febbraio alle 20 per 2 persone a nome. Mario Rossi. 2, 12 febbraio alle 21 per 2 persone a nome Carla. 3....

**Log tool chiamati:**{"ts":"2026-02-11T14:13:56.155Z","level":"info","event":"api_request","request_id":"aa64b252","method":"POST","path":"/api/list_bookings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4d0c-c9d1-777e-9051-7a061bdec73f","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T14:13:56.294Z","level":"info","event":"list_bookings_success","restaurant_id":"modena01","phone":"+39XXX...688","count":0,"source":"vapi","request_id":"aa64b252"}

---

## D. MODIFICA PRENOTAZIONE

### D1. Modifica orario

**Ristorante:** modena01

**Precondizione:** Cliente ha 1 prenotazione (es. domani 20:00).

**Cliente dice:** "Ho una prenotazione per domani alle 20. Potrei spostarla alle 21?"

**Obiettivo:** list_bookings → identificare booking_id; check_openings(nuovo_time) se necessario; modify_booking con new_time. Confermare solo con esito tool.

**Tool attesi:** list_bookings, check_openings, modify_booking

**Esito:**

**Risposte receptionist:**1.Posso aiutarla con questo. Prima, mi può fornire il numero di telefono con cui effettuato la prenotazione.
2.Ho trovato 2 prenotazioni con il numero fornito. Uno Carla Neri. Domani 12 febbraio alle 13 per 2 persone. 2 Giulia Bianchi, domani 12 febbraio alle 19.30 per 3 persone. Quale di queste prenotazioni desidera modificare?
3.La sua prenotazione per domani 12 febbraio, è stata spostata alle 21. Se bisogno di ulteriore assistenza, non esiti a chiedere. Buona giornata.

**Log tool chiamati:**{"ts":"2026-02-11T15:00:41.187Z","level":"info","event":"api_request","request_id":"2334721f","method":"POST","path":"/api/list_bookings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4d37-2c82-7cc8-a0c2-c08e2be6cd0d","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T15:00:41.445Z","level":"info","event":"list_bookings_success","restaurant_id":"modena01","phone":"+39XXX...680","count":0,"source":"vapi","request_id":"2334721f"}
{"ts":"2026-02-11T15:01:14.219Z","level":"info","event":"api_request","request_id":"c88ca9cb","method":"POST","path":"/api/check_openings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4d37-2c82-7cc8-a0c2-c08e2be6cd0d","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T15:01:14.577Z","level":"info","event":"capacity_check_success","restaurant_id":"modena01","day":"2026-02-12","requested_time":"21:00","in_openings":true,"slot_exists":true,"active_bookings_count":1,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"c88ca9cb"}
{"ts":"2026-02-11T15:01:14.577Z","level":"info","event":"check_openings_success","restaurant_id":"modena01","day":"2026-02-12","closed":false,"openings_count":13,"requested_time":"21:00","available":true,"reason":null,"source":"vapi","request_id":"c88ca9cb"}
{"ts":"2026-02-11T15:01:15.994Z","level":"info","event":"api_request","request_id":"c4107c7f","method":"POST","path":"/api/modify_booking","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4d37-2c82-7cc8-a0c2-c08e2be6cd0d","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
Menu
{"ts":"2026-02-11T15:01:16.231Z","level":"info","event":"resos_update_reservation","restaurant_id":"modena01","booking_id":"GAqQyLmSWWLRQEdgB"}
{"ts":"2026-02-11T15:01:16.231Z","level":"info","event":"modify_booking_success","restaurant_id":"modena01","booking_id":"GAqQyLmSWWLRQEdgB","source":"vapi","request_id":"c4107c7f"}

---

### D2. Modifica numero persone

**Ristorante:** modena01

**Cliente dice:** "Avevo prenotato per 2 persone venerdì alle 20, vorrei cambiare a 4 persone."

**Obiettivo:** list_bookings → identificare; modify_booking con new_people. Controllare che 4 non superi max_people (modena01 max 4, OK).

**Tool attesi:** list_bookings, modify_booking

**Esito:** 

**Risposte receptionist:**1.Per aiutarla a modificare la prenotazione, potrei avere il numero di telefono con cui effettuato la prenotazione
2.Con questo numero risultano 3 prenotazioni future. Il 12 febbraio alle 21 il 13 febbraio alle 20, e il 14 febbraio alle 21. Quale di queste?....
3. Poi ho detto qualle e mi ha detto che va bene e ha cambiato a 4 persone.

**Log tool chiamati:**{"ts":"2026-02-11T15:10:43.660Z","level":"info","event":"api_request","request_id":"df8e50ad","method":"POST","path":"/api/list_bookings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4d40-aedf-711d-92c5-88e31bc4b4a2","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T15:10:43.793Z","level":"info","event":"list_bookings_success","restaurant_id":"modena01","phone":"+39XXX...688","count":0,"source":"vapi","request_id":"df8e50ad"}
{"ts":"2026-02-11T15:10:47.390Z","level":"info","event":"api_request","request_id":"e4398a23","method":"POST","path":"/api/modify_booking","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4d40-aedf-711d-92c5-88e31bc4b4a2","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T15:10:47.639Z","level":"info","event":"resos_update_reservation","restaurant_id":"modena01","booking_id":"rJjreGwWjQC3z9kbW"}
{"ts":"2026-02-11T15:10:47.639Z","level":"info","event":"modify_booking_success","restaurant_id":"modena01","booking_id":"rJjreGwWjQC3z9kbW","source":"vapi","request_id":"e4398a23"}
{"ts":"2026-02-11T15:11:07.777Z","level":"info","event":"api_request","request_id":"ce1c6753","method":"POST","path":"/api/modify_booking","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4d40-aedf-711d-92c5-88e31bc4b4a2","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T15:11:08.041Z","level":"info","event":"resos_update_reservation","restaurant_id":"modena01","booking_id":"rJjreGwWjQC3z9kbW"}
Menu
{"ts":"2026-02-11T15:11:08.041Z","level":"info","event":"modify_booking_success","restaurant_id":"modena01","booking_id":"rJjreGwWjQC3z9kbW","source":"vapi","request_id":"ce1c6753"}

---

### D3. Modifica giorno (spostare ad altro giorno)

**Ristorante:** modena01

**Cliente dice:** "Ho una prenotazione sabato alle 20, posso spostarla a domenica?" [domenica chiusa per modena01]

**Obiettivo:** check_openings(domenica) → closed=true. Receptionist deve dire che domenica è chiuso e proporre alternativa (es. venerdì o sabato altro orario).

**Tool attesi:** list_bookings, resolve_relative_day, check_openings (closed), NO modify_booking

**Esito:**

**Risposte receptionist:** 1. Per spostare la prenotazione a domenica alle 20, devo prima individuare la sua prenotazione attuale. Potrebbe dirmi il numero di telefono usato per la prenotazione? 
2.Con questo numero, risultano 3 prenotazioni future, il 12 febbraio alle 21 il 13 febbraio alle 20 e il 14 febbraio alle 21. Quale di queste prenotazioni desidera spostare spostare a domenica alle 20?
3.La prenotazione di sabato è il 4 14 febbraio alle ventuno:zero, giusto? Conferma?
4.Domenica 15 febbraio il ristorante è chiuso, quindi non è possibile spostare la prenotazione a quella data. Vuole scegliere un altro giorno?

**Log tool chiamati:**{"ts":"2026-02-11T17:32:32.278Z","level":"info","event":"api_request","request_id":"03da0e3f","method":"POST","path":"/api/list_bookings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4dc2-7fad-788f-9970-c145e8695cdc","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T17:32:32.531Z","level":"info","event":"list_bookings_success","restaurant_id":"modena01","phone":"+39XXX...688","count":0,"source":"vapi","request_id":"03da0e3f"}
{"ts":"2026-02-11T17:33:03.657Z","level":"info","event":"api_request","request_id":"27307d2d","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4dc2-7fad-788f-9970-c145e8695cdc","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T17:33:03.657Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"modena01","source":"vapi","request_id":"27307d2d","text":"domenica","date":"2026-02-15"}
{"ts":"2026-02-11T17:33:04.915Z","level":"info","event":"api_request","request_id":"63d6c07c","method":"POST","path":"/api/check_openings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4dc2-7fad-788f-9970-c145e8695cdc","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T17:33:05.055Z","level":"info","event":"capacity_check_success","restaurant_id":"modena01","day":"2026-02-15","requested_time":"20:00","in_openings":false,"slot_exists":false,"active_bookings_count":null,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":false,"reason":"not_in_openings","nearest_slots_count":0,"source":"vapi","request_id":"63d6c07c"}
{"ts":"2026-02-11T17:33:05.055Z","level":"info","event":"check_openings_success","restaurant_id":"modena01","day":"2026-02-15","closed":true,"openings_count":0,"requested_time":"20:00","available":false,"reason":"not_in_openings","source":"vapi","request_id":"63d6c07c"}

---

## E. CANCELLAZIONE

### E1. Cancellazione prenotazione unica

**Ristorante:** modena01

**Precondizione:** Cliente ha 1 prenotazione.

**Cliente dice:** "Vorrei cancellare la mia prenotazione per domani."

**Obiettivo:** list_bookings → identificare; cancel_booking; confermare cancellazione.

**Tool attesi:** list_bookings, cancel_booking

**Esito:**

**Risposte receptionist:**1.Per cancellare la sua prenotazione prenotazione potrai avere il numero di telefono con cui hai effettuato la prenotazione o la data e l'orario esatti della prenotazione da cancellare,;  2.Ho trovato più prenotazioni con il suo numero. Per favore, mi conferma se vuole cancellare la prenotazione per il 12 febbraio alle 21 con nome Carla.;
3.La prenotazione per il 12 febbraio alle 21 con nome Carla è stata cancellata. Posso aiutarla in altro?


**Log tool chiamati:**{"ts":"2026-02-11T17:43:13.077Z","level":"info","event":"api_request","request_id":"3075e755","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4dcc-5c4d-7bbb-b3f4-351cedb80e7e","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T17:43:13.078Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"modena01","source":"vapi","request_id":"3075e755","text":"domani","date":"2026-02-12"}
{"ts":"2026-02-11T17:43:14.319Z","level":"info","event":"api_request","request_id":"ccb74010","method":"POST","path":"/api/list_bookings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4dcc-5c4d-7bbb-b3f4-351cedb80e7e","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T17:43:14.558Z","level":"info","event":"list_bookings_success","restaurant_id":"modena01","phone":"+39XXX...688","count":0,"source":"vapi","request_id":"ccb74010"}
{"ts":"2026-02-11T17:43:29.337Z","level":"info","event":"api_request","request_id":"a9c53dd9","method":"POST","path":"/api/cancel_booking","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4dcc-5c4d-7bbb-b3f4-351cedb80e7e","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T17:43:29.689Z","level":"info","event":"resos_delete_reservation","restaurant_id":"modena01","booking_id":"rJjreGwWjQC3z9kbW"}
{"ts":"2026-02-11T17:43:29.690Z","level":"info","event":"cancel_booking_success","restaurant_id":"modena01","booking_id":"rJjreGwWjQC3z9kbW","source":"vapi","request_id":"a9c53dd9"}

---

### E2. Cancellazione con più prenotazioni

**Ristorante:** modena01

**Precondizione:** Cliente ha 2+ prenotazioni.

**Cliente dice:** "Vorrei annullare una prenotazione." [Receptionist deve chiedere quale]

**Obiettivo:** list_bookings; chiedere quale (giorno+ora); cancel_booking sulla scelta.

**Tool attesi:** list_bookings, cancel_booking

**Esito:**

**Risposte receptionist:**1.Per annullare la prenotazione potrei avere il numero di telefono con cui è stata fatta la prenotazione, Se preferisce può darmi anche il giorno della prenotazione.;
2.Ho trovato 2 prenotazioni con quel numero. Una per il 12 febbraio alle 13.30 e una per il 12 febbraio alle 20. Quale delle 2 desidera cancellare?
3.La prenotazione per il 12 febbraio alle 20 è stata cancellata. Posso aiutarla in altro?


**Log tool chiamati:**{"ts":"2026-02-11T19:23:30.578Z","level":"info","event":"api_request","request_id":"6cfb36e8","method":"POST","path":"/api/list_bookings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4e27-b8ef-7000-802c-948b2de03eeb","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T19:23:31.021Z","level":"info","event":"list_bookings_success","restaurant_id":"modena01","phone":"+39XXX...310","count":0,"source":"vapi","request_id":"6cfb36e8"}
{"ts":"2026-02-11T19:23:32.590Z","level":"info","event":"api_request","request_id":"35dec2bd","method":"POST","path":"/api/list_bookings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4e27-b8ef-7000-802c-948b2de03eeb","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T19:23:32.689Z","level":"info","event":"list_bookings_success","restaurant_id":"modena01","phone":"+39XXX...310","count":0,"source":"vapi","request_id":"35dec2bd"}
{"ts":"2026-02-11T19:23:52.229Z","level":"info","event":"api_request","request_id":"74f5415f","method":"POST","path":"/api/cancel_booking","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c4e27-b8ef-7000-802c-948b2de03eeb","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-11T19:23:52.887Z","level":"info","event":"resos_delete_reservation","restaurant_id":"modena01","booking_id":"QuCeiW4gYgs3qbYbE"}
{"ts":"2026-02-11T19:23:52.887Z","level":"info","event":"cancel_booking_success","restaurant_id":"modena01","booking_id":"QuCeiW4gYgs3qbYbE","source":"vapi","request_id":"74f5415f"}

---

### E3. Cancellazione senza prenotazioni

**Ristorante:** modena01

**Cliente dice:** "Vorrei cancellare la prenotazione del 17." [nessuna prenotazione per quel telefono]

**Obiettivo:** list_bookings → count=0. Receptionist dice che non ci sono prenotazioni; può chiedere se ha usato altro numero.

**Tool attesi:** list_bookings

**Esito:**

**Risposte receptionist:**1.Per favore, mi puoi indicare il numero di telefono con cui effettuato la prenotazione o confermare la data esatta e l'orario della prenotazione del diciasette;
2.Con questo numero risultano prenotazioni per il 12 13.14 febbraio, ma nessuna per il diciasette. Può confermarmi il giorno e l'orario esatti della prenotazione che desidera cancellare;...

**Log tool chiamati:**{"ts":"2026-02-12T14:27:30.433Z","level":"info","event":"api_request","request_id":"2a5c0d34","method":"POST","path":"/api/list_bookings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c523f-83dc-7003-8bd0-a81653d79f3f","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-12T14:27:30.569Z","level":"info","event":"list_bookings_success","restaurant_id":"modena01","phone":"+39XXX...688","count":0,"source":"vapi","request_id":"2a5c0d34"}

---

## F. FAQ

### F1. Parcheggio

**Ristorante:** modena01

**Cliente dice:** "Avete parcheggio?"

**Obiettivo:** faq(question="...") → risposta da KB. Receptionist deve usare la risposta del tool, non inventare.

**Tool attesi:** faq

**Esito:**

**Risposte receptionist:**1.Sì, abbiamo un parcheggio privato gratuito dove potete parcheggiare le macchine. Posso aiutarla con qualcos'altro?

**Log tool chiamati:**HA chiamato usano il tool di vapi per il file che abbiamo inserito dentro vapi, quindi va bene. In questi casi non deve più usare il tool che avevvamo fatto noi per le faq, giusto?

---

### F2. Glutine

**Ristorante:** modena01

**Cliente dice:** "Avete opzioni senza glutine?"

**Obiettivo:** faq restituisce risposta da KB modena01.

**Tool attesi:** faq

**Esito:**

**Risposte receptionist:**1.Sì, abbiamo alcune opzioni senza glutine adatte a chi è celiaco. Le consiglio di chiedere al cameriere quando arriva per maggiori dettagli. Posso aiutarla con qualcos'altro?

**Log tool chiamati:**Funziona

---

### F3. Animali

**Ristorante:** modena01

**Cliente dice:** "Si possono portare i cani?"

**Obiettivo:** faq con keywords "animali/cani" → match su entry "I Animali sono amessi?". Risposta: no.

**Tool attesi:** faq

**Esito:**

**Risposte receptionist:**1.Nel ristorante non sono ammessi animali, compresi I cani. Posso aiutarla con qualcos'altro?

**Log tool chiamati:**Funziona

---

### F4. Domanda senza risposta in KB

**Ristorante:** modena01

**Cliente dice:** "Avete torte per compleanno?"

**Obiettivo:** faq restituisce answer=null (nessuna FAQ su torte). Receptionist deve dire "Non ho questa informazione disponibile" e NON inventare; può offrire di mettere in contatto col ristorante se is_open_now.

**Tool attesi:** faq

**Esito:**

**Risposte receptionist:**1.Non ho questa informazione disponibile. Può contattare direttamente il ristorante per verificare. Posso aiutarla in altro.

**Log tool chiamati:**Funziona

---

## G. ORARI (solo informazione)

### G1. "Siete aperti?"

**Ristorante:** modena01

**Cliente dice:** "Siete aperti adesso?"

**Obiettivo:** is_open_now (se serve per handover) o check_openings con day=oggi. Comunicare orari senza avviare flow prenotazione.

**Tool attesi:** is_open_now e/o check_openings

**Esito:**Va bene

**Risposte receptionist:**1.Il ristorante è chiuso in questo momento, Riapre alle 19. Posso aiutarla io?

**Log tool chiamati:**{"ts":"2026-02-12T14:36:33.207Z","level":"info","event":"api_request","request_id":"7c844764","method":"POST","path":"/api/is_open_now","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c5248-210e-7663-97dd-574ef3b630de","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-12T14:36:33.207Z","level":"info","event":"is_open_now","restaurant_id":"modena01","aperto_ora":false,"prossima_apertura":"19:00"}

---

### G2. "A che ora aprite domani?"

**Ristorante:** modena01

**Cliente dice:** "A che ora aprite domani? / Quali sono gli orari di domani?"

**Obiettivo:** resolve_relative_day("domani"), check_openings(day). Usare lunch_range e dinner_range per rispondere. NON confondere con disponibilità per prenotazione.

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**

**Risposte receptionist:**Siamo aperti a pranzo dalle 12 alle 15 e a cena dalle 19 alle 23.30. Vuole sapere gli orari di un giorno diverso, o preferisce un orario specifico?

**Log tool chiamati:**{"ts":"2026-02-12T14:39:01.478Z","level":"info","event":"api_request","request_id":"cb983156","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c524a-3d27-7cce-9d12-7d5d96e11c02","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-12T14:39:01.480Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"modena01","source":"vapi","request_id":"cb983156","text":"domani","date":"2026-02-13"}
{"ts":"2026-02-12T14:39:02.646Z","level":"info","event":"api_request","request_id":"52adba23","method":"POST","path":"/api/check_openings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c524a-3d27-7cce-9d12-7d5d96e11c02","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-12T14:39:02.651Z","level":"info","event":"check_openings_success","restaurant_id":"modena01","day":"2026-02-13","closed":false,"openings_count":17,"requested_time":null,"available":null,"reason":null,"source":"vapi","request_id":"52adba23"}

---

### G3. Giorno chiuso – solo orari

**Ristorante:** modena01

**Cliente dice:** "Siete aperti lunedì?"

**Obiettivo:** check_openings(lunedì) → closed=true. Dire che lunedì è chiuso.

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**

**Risposte receptionist:**1.Il ristorante è chiuso lunedì 16 febbraio. Posso aiutarla con qualcos'altro?

**Log tool chiamati:**{"ts":"2026-02-12T15:08:06.906Z","level":"info","event":"check_openings_success","restaurant_id":"modena01","day":"2026-02-16","closed":true,"openings_count":0,"requested_time":null,"available":null,"reason":null,"source":"vapi","request_id":"8f3bb97f"}

---

## H. EDGE CASES E ERRORI

### H1. NO_TABLE_AVAILABLE (resOS: slot pieno in create)

**Ristorante:** modena01 (resOS)

**Obiettivo:** Se check_openings passa ma create_booking restituisce NO_TABLE_AVAILABLE (race condition o capacity diversa resOS vs KB), receptionist deve comunicare e proporre altro orario senza panico.

**Cliente dice:** Salve vorrei prenotare per stasera. [Flow prenotazione che arriva a create_booking; backend restituisce NO_TABLE_AVAILABLE] 

**Tool attesi:** check_openings, create_booking (errore NO_TABLE_AVAILABLE)

**Esito:**Qui diciamo che la conversazione non è stata cosi pulita, inoltre ha detto l'anno in inglese che seconod me non serve dire l'anno inoltre come facciamo a risolvere questo rpoblema che per esempio in questo caso dalle 20 alle 21 tutti i tavoli erano prenotati, ma lui come orario consiglia le 19:30 però li e libero solo per mezz'ora ma le prenotazioni durano da 60 min>, quindi come risolviamo e quale l'opzione migliore, si puo fare nel backend aggiungendo/modificando qualcosa cosi non succede mai più e si risolve. E visto che mi consiglia gli orari disponibili più vicini e dico le 19 e 30 mi chiede i dettagli della prenotazione e poi mi dice che nemmeno alle 19 e 30 non è disponibile, quindi in realtà risponde bene però c'è un modo di fare per risolvere questa cosa?

**Risposte receptionist:**1.Per favore, mi indica il numero di persone per la prenotazione?;  2.A che ora preferisce prenotare per stasera?;   3.Mi scusi, per stasera intende oggi 12 febbraio 2026 Me lo conferma per favore?;   4.Sì, l'ascolto. Per la prenotazione a che ora preferisce? -Cliente: Alle 20  5.A quell'ora non abbiamo disponibilità posso proporle alcuni orari diciannove:trenta, 19 o 21? Va bene uno di questi?

**Log tool chiamati:**{"ts":"2026-02-12T15:10:16.049Z","level":"info","event":"api_request","request_id":"21694a36","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c5266-8adf-711d-98ab-d89302e798dd","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-12T15:10:16.050Z","level":"error","event":"resolve_relative_day_error","restaurant_id":"modena01","source":"vapi","request_id":"21694a36","text":"stasera","message":"Espressione giorno non riconosciuta. Usa domani/dopodomani/lunedì/tra X giorni oppure indica una data (YYYY-MM-DD)."}
{"ts":"2026-02-12T15:14:19.683Z","level":"info","event":"api_request","request_id":"c8eca663","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c526a-7941-7663-981b-8a9aa3634d38","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-12T15:14:19.683Z","level":"error","event":"resolve_relative_day_error","restaurant_id":"modena01","source":"vapi","request_id":"c8eca663","text":"stasera","message":"Espressione giorno non riconosciuta. Usa domani/dopodomani/lunedì/tra X giorni oppure indica una data (YYYY-MM-DD)."}
{"ts":"2026-02-12T15:14:56.917Z","level":"info","event":"api_request","request_id":"71110f09","method":"POST","path":"/api/check_openings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c526a-7941-7663-981b-8a9aa3634d38","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-12T15:14:57.471Z","level":"info","event":"capacity_check_success","restaurant_id":"modena01","day":"2026-02-12","requested_time":"20:00","in_openings":true,"slot_exists":true,"active_bookings_count":6,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":false,"reason":"full","nearest_slots_count":3,"source":"vapi","request_id":"71110f09"}
{"ts":"2026-02-12T15:14:57.471Z","level":"info","event":"check_openings_success","restaurant_id":"modena01","day":"2026-02-12","closed":false,"openings_count":13,"requested_time":"20:00","available":false,"reason":"full","source":"vapi","request_id":"71110f09"}

---

### H2. Conferma ambigua ("sì" senza specificare quale slot)

**Ristorante:** modena01

**Cliente dice:** "Non avete le 20:00? Va bene allora." [Receptionist aveva proposto 19:00 o 21:00]

**Obiettivo:** Receptionist NON deve assumere il primo slot. Deve chiedere "Preferisce alle 19 o alle 21?" e procedere solo dopo scelta esplicita.

**Tool attesi:** check_openings (già fatto), create_booking (solo dopo scelta chiara)

**Esito:**

**Risposte receptionist:**Si funziona, se dico cosi: "Non avete le 20:00? Va bene allora. poi mi ha consigliato i orari più vicini in cui c'è posto. Però controlla cnhe tu per sicurazza i log

**Log tool chiamati:**
{"ts":"2026-02-12T15:37:45.031Z","level":"info","event":"api_request","request_id":"3399e7ad","method":"POST","path":"/api/check_openings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c5280-06e0-7ff9-a934-947b41e0d518","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-12T15:37:45.448Z","level":"info","event":"capacity_check_success","restaurant_id":"modena01","day":"2026-02-12","requested_time":"20:00","in_openings":true,"slot_exists":true,"active_bookings_count":6,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":false,"reason":"full","nearest_slots_count":3,"source":"vapi","request_id":"3399e7ad"}
{"ts":"2026-02-12T15:37:45.448Z","level":"info","event":"check_openings_success","restaurant_id":"modena01","day":"2026-02-12","closed":false,"openings_count":13,"requested_time":"20:00","available":false,"reason":"full","source":"vapi","request_id":"3399e7ad"}
{"ts":"2026-02-12T15:38:30.269Z","level":"info","event":"api_request","request_id":"3e064e1b","method":"POST","path":"/api/create_booking","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c5280-06e0-7ff9-a934-947b41e0d518","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-12T15:38:30.593Z","level":"error","event":"resos_create_error","restaurant_id":"modena01","message":"resOS API POST /bookings: 422 no suitable table found [bookings.insert: no suitable table found]"}
{"ts":"2026-02-12T15:38:30.593Z","level":"info","event":"create_booking_success","restaurant_id":"modena01","day":"2026-02-12","time":"19:30","people":3,"phone":"+39XXX...688","source":"vapi","request_id":"3e064e1b"}

---

### H3. Cliente dà tutti i dati in ordine sparso

**Ristorante:** modena01

**Cliente dice:** "Siamo in 4, mio nome è Paolo, vorrei sabato alle 21, il numero è questo che state chiamando."

**Obiettivo:** Receptionist estrae day, time, people, name; phone = numero attivo. Deve verificare con check_openings prima di create_booking. Una domanda per volta se manca qualcosa.

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Esito:**

**Risposte receptionist:**Durante la chiamat ha risposto in modo coretto e giusto

**Log tool chiamati:**{"ts":"2026-02-12T15:45:03.781Z","level":"info","event":"api_request","request_id":"4c2bb78d","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c5286-a1af-7442-8c14-8284524634e5","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-12T15:45:03.783Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"modena01","source":"vapi","request_id":"4c2bb78d","text":"sabato","date":"2026-02-14"}
{"ts":"2026-02-12T15:45:03.797Z","level":"info","event":"api_request","request_id":"11fc6e57","method":"POST","path":"/api/resolve_relative_time","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c5286-a1af-7442-8c14-8284524634e5","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-12T15:45:03.799Z","level":"info","event":"resolve_relative_time_error","restaurant_id":"modena01","source":"vapi","request_id":"11fc6e57","text":"21","error_code":"UNSUPPORTED_RELATIVE_TIME","error_message":"Espressione orario non riconosciuta."}
{"ts":"2026-02-12T15:45:19.658Z","level":"info","event":"api_request","request_id":"c709753a","method":"POST","path":"/api/check_openings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c5286-a1af-7442-8c14-8284524634e5","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-12T15:45:19.866Z","level":"info","event":"capacity_check_success","restaurant_id":"modena01","day":"2026-02-14","requested_time":"21:00","in_openings":true,"slot_exists":true,"active_bookings_count":1,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"c709753a"}
{"ts":"2026-02-12T15:45:19.866Z","level":"info","event":"check_openings_success","restaurant_id":"modena01","day":"2026-02-14","closed":false,"openings_count":10,"requested_time":"21:00","available":true,"reason":null,"source":"vapi","request_id":"c709753a"}
{"ts":"2026-02-12T15:45:40.092Z","level":"info","event":"api_request","request_id":"af99524b","method":"POST","path":"/api/create_booking","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c5286-a1af-7442-8c14-8284524634e5","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
{"ts":"2026-02-12T15:45:40.242Z","level":"info","event":"create_booking_success","restaurant_id":"modena01","day":"2026-02-14","time":"21:00","people":4,"phone":"+39XXX...688","source":"vapi","request_id":"af99524b"}
{"ts":"2026-02-12T15:45:41.470Z","level":"info","event":"api_request","request_id":"9d686b12","method":"POST","path":"/api/list_bookings","restaurant_id":"modena01","backend_used":"resos","prompt_version":"v1.0","call_id":"019c5286-a1af-7442-8c14-8284524634e5","conversation_id":"930b1bfd-2e4d-479d-9c32-0276fb098834"}
Menu
{"ts":"2026-02-12T15:45:41.575Z","level":"info","event":"list_bookings_success","restaurant_id":"modena01","phone":"+39XXX...688","count":0,"source":"vapi","request_id":"9d686b12"}

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

## OctoDemo – Test CRUD (subset)

Dopo aver completato tutti i test A–M su modena01, eseguire solo il subset CRUD su octodemo per verificare che OctoTable funzioni end-to-end via voce.

### OT1. Prenotazione OctoTable

**Ristorante:** octodemo

**Cliente dice:** "Buongiorno, vorrei prenotare un tavolo per mercoledì alle 20 per 2 persone, il nome è Marco Test."

**Obiettivo:** Flow completo create su OctoTable sandbox. Verificare che la prenotazione arrivi su OctoTable.

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### OT2. Lista prenotazioni OctoTable

**Ristorante:** octodemo

**Cliente dice:** "Ho delle prenotazioni?"

**Obiettivo:** list_bookings su OctoTable. Deve trovare la prenotazione creata in OT1.

**Tool attesi:** list_bookings

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### OT3. Modifica prenotazione OctoTable

**Ristorante:** octodemo

**Cliente dice:** "Vorrei cambiare a 3 persone la mia prenotazione."

**Obiettivo:** modify_booking su OctoTable. Verificare che la modifica arrivi.

**Tool attesi:** list_bookings, modify_booking

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### OT4. Cancellazione OctoTable

**Ristorante:** octodemo

**Cliente dice:** "Vorrei cancellare la mia prenotazione."

**Obiettivo:** cancel_booking su OctoTable. Verificare che venga rimossa.

**Tool attesi:** list_bookings, cancel_booking

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### OT5. Errore provider OctoTable

**Ristorante:** octodemo

**Cliente dice:** "Vorrei prenotare per domenica alle 20 per 2 persone." [domenica chiuso]

**Obiettivo:** check_openings → closed=true. Receptionist dice che è chiuso. Non inventa alternative.

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

## Riepilogo esiti


| Categoria            | Test   | Modena01 | Roma | OctoDemo |
| -------------------- | ------ | -------- | ---- | -------- |
| A. Prenotazione      | A1–A4  |          |      |          |
| B. Casi particolari  | B1–B6  |          |      |          |
| C. Lista             | C1–C3  |          |      |          |
| D. Modifica          | D1–D3  |          |      |          |
| E. Cancellazione     | E1–E3  |          |      |          |
| F. FAQ               | F1–F4  |          |      |          |
| G. Orari             | G1–G3  |          |      |          |
| H. Edge cases        | H1–H4  |          |      |          |
| J. Handover          | J1–J3  |          |      |          |
| K. Telefono          | K1–K3  |          |      |          |
| L. Goodbye/Conferma  | L1–L3  |          |      |          |
| M. Provider error    | M1–M3  |          |      |          |
| I. Roma              | I1–I2  |          |      |          |
| OT. OctoTable CRUD   | OT1–5  |          |      |          |


---

*Compilare dopo ogni sessione di test. I log tool sono visibili nei log del backend (server Node) o nel dashboard Vapi (function calls).*