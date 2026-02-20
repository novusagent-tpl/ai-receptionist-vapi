# Test Vapi – Roma (Google Sheets/Calendar) — V2 16/02 -20:45

Retest dopo refactor backend rigido (v1.2): campo `message`, `reason: "closed"`, `next_open_day`, `nearest_slots` come unica fonte, endCall solo su saluto cliente, tool descriptions aggiunte.

**Configurazione:**

| Campo | Valore |
|-------|--------|
| restaurant_id | roma |
| Backend | Google Sheets/Calendar |
| max_people | 8 |
| max_concurrent_bookings | 3 (= 3 tavoli) |
| avg_stay_minutes | 60 |
| booking_cutoff_minutes | 45 |
| Lunedi-Giovedi | solo cena 19:00-22:30 |
| Venerdi-Sabato | pranzo 12:30-14:30 + cena 19:00-23:00 |
| Domenica | CHIUSO |
| Prompt version | v1.2 |

---

## RA. PRENOTAZIONE – Flow completo

### RA1. Prenotazione semplice

**Cliente dice:** "Buongiorno, vorrei prenotare un tavolo per stasera alle 20 per 3 persone, il nome e Marco Blu."

**Obiettivo:** Flow completo. resolve_relative_day → check_openings → create_booking. Verificare che la prenotazione appaia su Google Sheets e su Google Calendar.

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Esito:**AL momento della chiamata erano le 20:45 quindi il orario era passato e ho detto le 21, non è un problema dell assistente.

**Risposte receptionist:**Cliente: Buongiorno vorrei prenotare un tavolo per stasera alle 20 per 3 persone. Il nome è Marco Blu.;  1.L'orario che mi indicato è già passato. Può scegliere un orario più avanti. - Cliente: alle 21.;  2.Abbiamo disponibilità per stasera alle 21. Posso procedere con la prenotazione per 3 persone a nome Marco Blu, - Cliente: Certo.;   
3.La prenotazione per 3 persone a nome Marco Blu stasera alle 21 è stata confermata, l'aspettiamo. Se bisogno di ulteriore  - Cliente: Va bene grazie. Grazie 1000.:  4.Prego, buona serata e a presto. - Cliente: Ciao

**Log tool chiamati:**{"ts":"2026-02-16T19:45:50.451Z","level":"info","event":"api_request","request_id":"f5051f1a","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c67fc-a9f5-7771-81e7-3d10cab29c57","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T19:45:50.451Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"f5051f1a","text":"stasera","date":"2026-02-16"}
{"ts":"2026-02-16T19:45:50.475Z","level":"info","event":"api_request","request_id":"beafa1bc","method":"POST","path":"/api/resolve_relative_time","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c67fc-a9f5-7771-81e7-3d10cab29c57","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T19:45:50.476Z","level":"info","event":"resolve_relative_time_success","restaurant_id":"roma","source":"vapi","request_id":"beafa1bc","text":"20","ok":true,"time":"20:00"}
{"ts":"2026-02-16T19:45:51.726Z","level":"info","event":"api_request","request_id":"e9550fd5","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c67fc-a9f5-7771-81e7-3d10cab29c57","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T19:45:51.728Z","level":"error","event":"check_openings_past_time","restaurant_id":"roma","day":"2026-02-16","requested_time":"20:00","message":"L'orario indicato è già passato.","source":"vapi","request_id":"e9550fd5"}
{"ts":"2026-02-16T19:46:03.119Z","level":"info","event":"api_request","request_id":"31ef87dd","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c67fc-a9f5-7771-81e7-3d10cab29c57","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T19:46:03.643Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-16","requested_time":"21:00","in_openings":true,"slot_exists":true,"active_bookings_count":1,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"31ef87dd"}
{"ts":"2026-02-16T19:46:03.643Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-16","closed":false,"openings_count":8,"requested_time":"21:00","available":true,"reason":null,"source":"vapi","request_id":"31ef87dd"}
{"ts":"2026-02-16T19:46:16.300Z","level":"info","event":"api_request","request_id":"5701c84c","method":"POST","path":"/api/create_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c67fc-a9f5-7771-81e7-3d10cab29c57","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T19:46:17.991Z","level":"info","event":"sheets_write_booking_row","restaurant_id":"roma","sheet_id":"1MnaSIGqhieZVnxtnw_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":41,"booking_id":"bcb25820-149b-42ee-ae94-97bd5390be2c"}
{"ts":"2026-02-16T19:46:17.991Z","level":"info","event":"create_booking_success","restaurant_id":"roma","day":"2026-02-16","time":"21:00","people":3,"phone":"+39XXX...688","booking_id":"bcb25820-149b-42ee-ae94-97bd5390be2c","source":"vapi","request_id":"5701c84c"}

---

### RA2. Prenotazione step-by-step

**Cliente dice:**
1. "Vorrei prenotare."
2. [Quando?] "Venerdi."
3. [Orario?] "A pranzo, verso l'una."
4. [Persone?] "Siamo in 5."
5. [Nome?] "Marco Verdi."
6. [Telefono?] "Quello da cui chiamo."

**Obiettivo:** Raccolta dati uno per volta. Roma ha pranzo solo venerdì/sabato — verificare che il sistema lo sappia.

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Esito:** Allora qui ha fatto tutto bene da quello che ho osservato io ma non sono sicuro al 100%, inoltre l'unico errore che ho visto e come ha preso il numero di telefono, il umero che ha preso è +3933049267468 ma il numero da cui ho chiamato è +3492674688, perché l'ha presso in questo modo, qualè potrebbe essere il motivo? Inoltre è la prima volta che capira questo è come numero prende automaticamente ma lo prende sbagliato, fino ad ora lo prendeva automaticamente ma sempre giusto. Sarà solo un bug ? Guarda la conversazione per capire meglio.

**Risposte receptionist:**1.Perfetto, per quando desidera effettuare la prenotazione; 2.Ha scelto venerdì 20 febbraio. A che ora preferisce prenotare?; 3.Mi indichi l'orario esatto per la prenotazione per favore? Ad esempio può dire alle 13 o alle 13.30.; 4.Siamo disponibili per la prenotazione venerdì 20 febbraio alle 13. Quante persone saranno?;  5.Perfetto, posso avere il suo nome per favore?  6.Grazie Marco. Infine userò il numero di telefono Plus 3 9 3 304. 9 2 6 7 4 6 ttantotto. Per la prenotazione. Va bene? -  Cliente: Sì sì va bene.;  7.La sua prenotazione per venerdì 20 febbraio alle 13 per 5 persone a nome Marco Verdi è stata confermata. Grazie e a presto.;

**Log tool chiamati:**{"ts":"2026-02-16T20:01:43.036Z","level":"info","event":"api_request","request_id":"5ae19826","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c680b-2b99-755d-a3ee-c088f21b3e13","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T20:01:43.036Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"5ae19826","text":"venerdì","date":"2026-02-20"}
{"ts":"2026-02-16T20:01:54.979Z","level":"info","event":"api_request","request_id":"6940df55","method":"POST","path":"/api/resolve_relative_time","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c680b-2b99-755d-a3ee-c088f21b3e13","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T20:01:54.979Z","level":"info","event":"resolve_relative_time_error","restaurant_id":"roma","source":"vapi","request_id":"6940df55","text":"verso l'una","error_code":"VAGUE_TIME","error_message":"Orario non preciso. Indichi un orario esatto (es. 20:00)."}
{"ts":"2026-02-16T20:02:10.105Z","level":"info","event":"api_request","request_id":"ce58ce11","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c680b-2b99-755d-a3ee-c088f21b3e13","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T20:02:10.522Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-20","requested_time":"13:00","in_openings":true,"slot_exists":true,"active_bookings_count":0,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"ce58ce11"}
{"ts":"2026-02-16T20:02:10.522Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-20","closed":false,"openings_count":14,"requested_time":"13:00","available":true,"reason":null,"source":"vapi","request_id":"ce58ce11"}
{"ts":"2026-02-16T20:02:49.469Z","level":"info","event":"api_request","request_id":"d2e1007e","method":"POST","path":"/api/create_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c680b-2b99-755d-a3ee-c088f21b3e13","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T20:02:51.074Z","level":"info","event":"sheets_write_booking_row","restaurant_id":"roma","sheet_id":"1MnaSIGqhieZVnxtnw_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":37,"booking_id":"bcf1a8f3-f3ac-400e-8038-7c725452516e"}
{"ts":"2026-02-16T20:02:51.074Z","level":"info","event":"create_booking_success","restaurant_id":"roma","day":"2026-02-20","time":"13:00","people":5,"phone":"+39XXX...468","booking_id":"bcf1a8f3-f3ac-400e-8038-7c725452516e","source":"vapi","request_id":"d2e1007e"}

---

### RA3. Prenotazione con giorno della settimana

**Cliente dice:** "Avete posto giovedi prossimo per cena? Saremmo in 6, vorremmo le 21."

**Obiettivo:** resolve_relative_day("giovedi prossimo"), check_openings, create_booking. Roma max_people=8 quindi 6 e OK.

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Esito:**

**Risposte receptionist:**1.Per giovedì 19 febbraio alle 21 abbiamo disponibilità...Posso raccogliere il suo nome, e il numero di telefono per completare la prenotazione? - Cliente: Certo mi chiamo Andrea.; 2.Grazie Andrea, qual è il suo numero di telefono? - Cliente: Il numero di telefono è 3 4 9 2 6 7 4 6 9 9.; 3.La sua prenotazione per giovedì 19 febbraio alle 21 per 6 persone stata confermata. Grazie Andrea. Se bisogno di...

**Log tool chiamati:**{"ts":"2026-02-16T20:10:43.554Z","level":"info","event":"api_request","request_id":"ac94b844","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6813-76e5-755d-abdd-2c6a1bdf89d2","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T20:10:43.555Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"ac94b844","text":"giovedì prossimo","date":"2026-02-19"}
{"ts":"2026-02-16T20:10:46.093Z","level":"info","event":"api_request","request_id":"653c1623","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6813-76e5-755d-abdd-2c6a1bdf89d2","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T20:10:46.410Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-19","requested_time":"21:00","in_openings":true,"slot_exists":true,"active_bookings_count":0,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"653c1623"}
{"ts":"2026-02-16T20:10:46.410Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-19","closed":false,"openings_count":8,"requested_time":"21:00","available":true,"reason":null,"source":"vapi","request_id":"653c1623"}
{"ts":"2026-02-16T20:11:17.346Z","level":"info","event":"api_request","request_id":"383ed00b","method":"POST","path":"/api/create_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6813-76e5-755d-abdd-2c6a1bdf89d2","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T20:11:18.970Z","level":"info","event":"sheets_write_booking_row","restaurant_id":"roma","sheet_id":"1MnaSIGqhieZVnxtnw_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":38,"booking_id":"57c040ed-4706-4d8c-9f3e-0a0fe6289f7f"}
Menu
{"ts":"2026-02-16T20:11:18.970Z","level":"info","event":"create_booking_success","restaurant_id":"roma","day":"2026-02-19","time":"21:00","people":6,"phone":"+39XXX...699","booking_id":"57c040ed-4706-4d8c-9f3e-0a0fe6289f7f","source":"vapi","request_id":"383ed00b"}

---

## RB. CASI PARTICOLARI

### RB1. Giorno chiuso (domenica)

**Cliente dice:** "Vorrei prenotare per domenica alle 20, 2 persone."

**Obiettivo:** check_openings → closed=true, reason="closed", message="Il ristorante è chiuso domenica. Il prossimo giorno di apertura è lunedì con cena dalle 19:00 alle 22:30." Deve dire che domenica è chiuso e proporre lunedì. Il backend blocca anche se l'AI sbaglia (enforcement OUTSIDE_HOURS).

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**Ok, Da quello che ho notato io è andato benissimo, si vede il cambiamento del backend qui.

**Risposte receptionist:**1.Il ristorante è chiuso domenica. Riapriamo lunedì con cena dalle 19 alle 22.30. Vuole prenotare per lunedì? - Cliente: No grazie va bene lo stesso.; 2.Va bene. Se bisogno di ulteriore aiuto, non esiti a contattarmi. Arrivederci. - Cliente: Va bene gentilissima ciao.

**Log tool chiamati:**{"ts":"2026-02-16T20:15:18.936Z","level":"info","event":"api_request","request_id":"9ec8f934","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6817-9aa3-755d-abe6-f9b4024b958f","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T20:15:18.937Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"9ec8f934","text":"domenica","date":"2026-02-22"}
{"ts":"2026-02-16T20:15:20.490Z","level":"info","event":"api_request","request_id":"a47d9cff","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6817-9aa3-755d-abe6-f9b4024b958f","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T20:15:20.490Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-22","requested_time":"20:00","in_openings":false,"slot_exists":false,"active_bookings_count":null,"max_concurrent_bookings":null,"avg_stay_minutes":null,"available":false,"reason":"closed","nearest_slots_count":0,"source":"vapi","request_id":"a47d9cff"}
{"ts":"2026-02-16T20:15:20.490Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-22","closed":true,"openings_count":0,"requested_time":"20:00","available":false,"reason":"closed","source":"vapi","request_id":"a47d9cff"}

---

### RB2. Orario fuori slot (es. 16:00 di giovedi — no pranzo)

**Cliente dice:** "Vorrei prenotare per giovedi alle 16 per 2 persone."

**Obiettivo:** Giovedi Roma ha solo cena (19:00-22:30), non pranzo. check_openings → available=false, reason=not_in_openings, message con nearest_slots. Deve proporre SOLO gli orari in nearest_slots, non dire "siamo chiusi".

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**

**Risposte receptionist:**1.Questo orario non è disponibile per prenotazioni. Gli orari più vicini sono alle diciannove:zero e alle diciannove:trenta. Quale preferisce? - Cliente: Come mai non può posso alle 16?; 2.Il ristorante è aperto, ma non accettiamo prenotazioni esattamente alle 16. Posso offrirle gli orari più vicini che sono alle diciannove:zero e alle 19 :30. Vuole prenotare per uno di questi orari? - Cliente: No va bene lo stesso, grazie ciao...

**Log tool chiamati:**{"ts":"2026-02-16T20:20:19.295Z","level":"info","event":"api_request","request_id":"7b1d5e11","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c681c-45aa-766d-b624-1113d835235f","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T20:20:19.295Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"7b1d5e11","text":"giovedì","date":"2026-02-19"}
{"ts":"2026-02-16T20:20:20.770Z","level":"info","event":"api_request","request_id":"d9c35ad3","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c681c-45aa-766d-b624-1113d835235f","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T20:20:21.115Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-19","requested_time":"16:00","in_openings":false,"slot_exists":false,"active_bookings_count":null,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":false,"reason":"not_in_openings","nearest_slots_count":2,"source":"vapi","request_id":"d9c35ad3"}
Menu
{"ts":"2026-02-16T20:20:21.115Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-19","closed":false,"openings_count":8,"requested_time":"16:00","available":false,"reason":"not_in_openings","source":"vapi","request_id":"d9c35ad3"}

---

### RB3. Pranzo in giorno senza pranzo

**Cliente dice:** "Vorrei prenotare per mercoledi a pranzo, verso le 13."

**Obiettivo:** Mercoledi Roma ha solo cena. check_openings → not_in_openings. Dire che mercoledi non c'e servizio a pranzo, proporre cena o venerdi/sabato per pranzo.

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**

**Risposte receptionist:**1.Questo orario non è disponibile per prenotazioni. Gli orari più vicini sono alle diciannove:zero e alle diciannove:zero diciannove:trenta. Quale preferisce? - Cliente: Quindi non siete aperti alle 13?; 2.Esatto. Non siamo aperti a pranzo alle 13. Siamo disponibili per la cena a partire partire dalle 19. Vuole prenotare per uno degli orari di disponibili? - Cliente: No grazie.; 3.Va bene, se bisogno di ulteriore assistenza non esiti a contattarmi. Buona giornata...

**Log tool chiamati:**{"ts":"2026-02-16T20:23:18.009Z","level":"info","event":"api_request","request_id":"89d426a1","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c681e-f5db-755d-a41e-3b8ada712973","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T20:23:18.010Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"89d426a1","text":"mercoledì","date":"2026-02-18"}
{"ts":"2026-02-16T20:23:18.392Z","level":"info","event":"api_request","request_id":"486a4797","method":"POST","path":"/api/resolve_relative_time","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c681e-f5db-755d-a41e-3b8ada712973","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T20:23:18.393Z","level":"info","event":"resolve_relative_time_success","restaurant_id":"roma","source":"vapi","request_id":"486a4797","text":"13","ok":true,"time":"13:00"}
{"ts":"2026-02-16T20:23:19.915Z","level":"info","event":"api_request","request_id":"ab44b807","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c681e-f5db-755d-a41e-3b8ada712973","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T20:23:20.279Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-18","requested_time":"13:00","in_openings":false,"slot_exists":false,"active_bookings_count":null,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":false,"reason":"not_in_openings","nearest_slots_count":2,"source":"vapi","request_id":"ab44b807"}
{"ts":"2026-02-16T20:23:20.279Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-18","closed":false,"openings_count":8,"requested_time":"13:00","available":false,"reason":"not_in_openings","source":"vapi","request_id":"ab44b807"}

---

### RB4. Max persone superato (roma max=8)

**Cliente dice:** "Vorrei prenotare per venerdi alle 20 per 12 persone, nome Andrea."

**Obiettivo:** 12 > max_people (8). L'AI deve comunicarlo SUBITO (da check_openings max_people) senza raccogliere nome/telefono. Offrire handover se aperto.

**Tool attesi:** resolve_relative_day, check_openings (contiene max_people=8)

**Esito:**

**Risposte receptionist:**1.Per le prenotazioni online, il massimo è 8 persone. Desidera prenotare per 8 persone a nome Andrea? - Cliente: No no.;  2.Capisco. Vuole che la metta in contatto col ristorante, per verificare la disponibilità per un gruppo più grande. - Cliente: Sì sì va bene...; 3.Un attimo la metto in contatto con il ristorante. - *Ha chiamato il tool transfer call tool roma e ha inoltrato la chiamata

**Log tool chiamati:**{"ts":"2026-02-16T20:29:46.392Z","level":"info","event":"api_request","request_id":"43b4f7bd","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6824-f2eb-7884-b54a-e4d874b86ddb","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T20:29:46.393Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"43b4f7bd","text":"venerdì","date":"2026-02-20"}
{"ts":"2026-02-16T20:29:48.588Z","level":"info","event":"api_request","request_id":"18b61f7d","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6824-f2eb-7884-b54a-e4d874b86ddb","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T20:29:48.917Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-20","requested_time":"20:00","in_openings":true,"slot_exists":true,"active_bookings_count":0,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"18b61f7d"}
{"ts":"2026-02-16T20:29:48.917Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-20","closed":false,"openings_count":14,"requested_time":"20:00","available":true,"reason":null,"source":"vapi","request_id":"18b61f7d"}
{"ts":"2026-02-16T20:30:14.179Z","level":"info","event":"api_request","request_id":"837bcabf","method":"POST","path":"/api/is_open_now","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6824-f2eb-7884-b54a-e4d874b86ddb","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T20:30:14.180Z","level":"info","event":"is_open_now","restaurant_id":"roma","aperto_ora":true,"prossima_apertura":null}

---

### RB5. Cutoff — orario troppo vicino a chiusura

**Cliente dice:** "Vorrei prenotare per giovedi alle 22 e 30 per 2 persone."

**Obiettivo:** Roma cena giovedi chiude alle 22:30, cutoff 45 min. check_openings → available=false, reason=cutoff, message con nearest_slots (es. 22:00, 21:30). L'AI deve proporre SOLO gli orari in nearest_slots. Il backend blocca anche in create_booking (enforcement).

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**Ma se il cutoff è di 45 minuti perché mi ha consigliato le 22:00 ? Un altra cosa è che in questo test è stata la prima volta in cui ha letto l'orario in inglese ovvero 21.30 in questi test.

**Risposte receptionist:**1.L'orario che mi indicato non è riconosciuto. Mi indica l'orario esatto 22. -  Cliente: Le 22.30; 2. Questo orario è troppo vicino alla chiusura. Posso proporle 2 orari più vicini? Le 22 o le 21.30. Quale preferisce? - Cliente: Le 21.30 va bene.; 3.Perfetto, quindi prenotiamo per giovedì 19 febbraio alle 20 one point 3 0 per 2 persone. Posso avere il suo nome per favore?

**Log tool chiamati:**{"ts":"2026-02-16T20:47:27.222Z","level":"info","event":"api_request","request_id":"4f7f3cdc","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6835-18c1-755d-a442-f99c43a89b97","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T20:47:27.222Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"4f7f3cdc","text":"giovedì","date":"2026-02-19"}
{"ts":"2026-02-16T20:47:27.776Z","level":"info","event":"api_request","request_id":"9ed9b3f2","method":"POST","path":"/api/resolve_relative_time","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6835-18c1-755d-a442-f99c43a89b97","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T20:47:27.777Z","level":"info","event":"resolve_relative_time_error","restaurant_id":"roma","source":"vapi","request_id":"9ed9b3f2","text":"22.30","error_code":"UNSUPPORTED_RELATIVE_TIME","error_message":"Espressione orario non riconosciuta."}
{"ts":"2026-02-16T20:47:40.106Z","level":"info","event":"api_request","request_id":"7dbcb511","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6835-18c1-755d-a442-f99c43a89b97","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T20:47:40.637Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-19","requested_time":"22:30","in_openings":true,"slot_exists":false,"active_bookings_count":null,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":false,"reason":"cutoff","nearest_slots_count":2,"source":"vapi","request_id":"7dbcb511"}
{"ts":"2026-02-16T20:47:40.637Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-19","closed":false,"openings_count":8,"requested_time":"22:30","available":false,"reason":"cutoff","source":"vapi","request_id":"7dbcb511"}
{"ts":"2026-02-16T20:48:21.071Z","level":"info","event":"api_request","request_id":"2e50021c","method":"POST","path":"/api/create_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6835-18c1-755d-a442-f99c43a89b97","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T20:48:22.679Z","level":"info","event":"sheets_write_booking_row","restaurant_id":"roma","sheet_id":"1MnaSIGqhieZVnxtnw_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":39,"booking_id":"06e53a7d-9d10-454f-bfd9-f29126c84f88"}
{"ts":"2026-02-16T20:48:22.679Z","level":"info","event":"create_booking_success","restaurant_id":"roma","day":"2026-02-19","time":"21:30","people":2,"phone":"+39XXX...688","booking_id":"06e53a7d-9d10-454f-bfd9-f29126c84f88","source":"vapi","request_id":"2e50021c"}

---

### RB6. Duplicato (stessa prenotazione esistente)

**Precondizione:** Esiste gia una prenotazione per quel telefono, giorno e orario (creata in RA1).

**Cliente dice:** "Vorrei prenotare per [stesso giorno] alle 20. (per 2 persone, Mauro.)"

**Obiettivo:** Backend restituisce DUPLICATE_BOOKING. Receptionist comunica che esiste gia.

**Tool attesi:** check_openings, create_booking (DUPLICATE_BOOKING)

**Esito:**

**Risposte receptionist:**1.Posso chiederle a che ora preferisce per il 19? - Cliente: Alle 21.30; 2.Mi scuso. Ma non riesco a riconoscere il giorno che indicato. Potrebbe specificare se si tratta di un giorno di questo mese o di un altro. - Cliente. Si, il 19 febbraio.; 3. Per il 19 febbraio alle ventuno:trenta abbiamo disponibilità Quante persone desidera prenotare? - Per 2.; 4.Mi può fornire il suo nome per favore? - Cliente: Mauro.; 5.Perfetto Mauro. Posso usare il numero di telefono Plus 3 9 3 4 9 2 6 7 4 6 8 8 per la prenotazione? - Cliente: Si;
5. Risulta già una prenotazione per il 19 febbraio alle ventuno:trenta con questo numero. Desidera modificarla o verificare I dettagli? - Cliente: Allora no, lasciamo così, va bene lo stesso.: 6.Va bene Mauro, se hai bisogno di ulteriore assistenza non esiti a contattarmi. Buona serata.

**Log tool chiamati:**{"ts":"2026-02-16T20:53:46.388Z","level":"info","event":"api_request","request_id":"aa21435c","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c683a-c6a9-7cc5-bd38-85223fb7e735","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T20:53:46.388Z","level":"error","event":"resolve_relative_day_error","restaurant_id":"roma","source":"vapi","request_id":"aa21435c","text":"19","message":"Espressione giorno non riconosciuta. Usa domani/dopodomani/lunedì/tra X giorni oppure indica una data (YYYY-MM-DD)."}
{"ts":"2026-02-16T20:53:46.520Z","level":"info","event":"api_request","request_id":"3a6c7af6","method":"POST","path":"/api/resolve_relative_time","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c683a-c6a9-7cc5-bd38-85223fb7e735","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T20:53:46.520Z","level":"info","event":"resolve_relative_time_error","restaurant_id":"roma","source":"vapi","request_id":"3a6c7af6","text":"21.30","error_code":"UNSUPPORTED_RELATIVE_TIME","error_message":"Espressione orario non riconosciuta."}

---

## RC. LISTA PRENOTAZIONI

### RC1. Cliente chiede le sue prenotazioni

**Cliente dice:** "Buongiorno, vorrei sapere se ho delle prenotazioni."

**Obiettivo:** list_bookings. Verificare che trovi la prenotazione creata in RA1 (su Sheets).

**Tool attesi:** list_bookings

**Esito:**Prenotaioni future ho solo una dal numero da cui chiamo ed è per il 19

**Risposte receptionist:**1.Posso aiutarla a controllare le sue prenotazioni. Mi può fornire il numero di telefono che usato per la prenotazione? - Cliente: Il numero da cui chiamo; 
2.Una prenotazione per 19 febbraio alle 21.30 per 2 persone a nome Mauro. Vuole modificare o cancellare questa prenotazione? - Cliente: No volevo sapere solo i dati.

**Log tool chiamati:**{"ts":"2026-02-17T19:12:47.403Z","level":"info","event":"api_request","request_id":"a9cd6965","method":"POST","path":"/api/list_bookings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6d04-927b-7225-b4a5-70767743df9c","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-17T19:12:48.293Z","level":"info","event":"list_bookings_success","restaurant_id":"roma","phone":"+39XXX...688","count":1,"booking_ids":["06e53a7d-9d10-454f-bfd9-f29126c84f88"],"source":"vapi","request_id":"a9cd6965"}

---

### RC2. Nessuna prenotazione

**Cliente dice:** "Ho una prenotazione per sabato?" [telefono senza prenotazioni per Roma]

**Obiettivo:** list_bookings → results vuoto. Comunicare e proporre di prenotare.

**Tool attesi:** list_bookings

**Esito:** Allora qui c'è una cosa, io con il numero da cui ho chiamato ho solo una prenotazione per giovedì 19 febbraio, e se chiedo se ho una prenotazione per sabato mi dice di si però con i dati di questa del 19, controlla la conversazione e dimmi cosa ne pensi e qualle potrebbe essere il rpoblema e come possiamo risolvere questo.

**Risposte receptionist:**Cliente: Vorrei sapere se ho una prenotazione per sabato.; 1.Mi può confermare numero di telefono utilizzato per la prenotazione? - Cliente: Sì il numero è 3 4 9 2 6 7 4 6 8 8.; 2.Ho trovato una prenotazione per sabato 19 febbraio alle 21.30 a nome Mauro per 2 persone. Vuole modificare o cancellare questa prenotazione? - Cliente: No va bene così, va bene lo stesso grazie.; 3.Perfetto. Se hai bisogno di ulteriore aiuto non esiti a contattarmi. Arrivederci...


**Log tool chiamati:**{"ts":"2026-02-17T19:27:01.151Z","level":"info","event":"api_request","request_id":"95bd8916","method":"POST","path":"/api/list_bookings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6d11-a1b4-755a-9c0b-da09f9bbd285","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
Menu
{"ts":"2026-02-17T19:27:01.629Z","level":"info","event":"list_bookings_success","restaurant_id":"roma","phone":"+39XXX...688","count":1,"booking_ids":["06e53a7d-9d10-454f-bfd9-f29126c84f88"],"source":"vapi","request_id":"95bd8916"}


Test rifatto dopo deploy(patch):

Risposte Receptionist: Cliente: Ciao Alice vorrei sapere se ho qualche prenota per sabato. 1.Non trovo prenotazioni per sabato. Ho trovato una prenotazione per giovedì 19 febbraio alle ventuno:trenta per 2 persone a nome Mauro. Vuole fare qualcosa riguardo a questa prenotazione? - Cliente:No allora va bene così, grazie.; 2.Ciao, grazie a te. Se hai bisogno di ulteriore aiuto non esitare a contattarmi.

Log tool chiamati:{"ts":"2026-02-17T20:38:32.200Z","level":"info","event":"api_request","request_id":"73f3d445","method":"POST","path":"/api/list_bookings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6d53-4aaa-7000-826b-886323b10752","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-17T20:38:32.607Z","level":"info","event":"list_bookings_success","restaurant_id":"roma","phone":"+39XXX...688","count":1,"booking_ids":["4d35fee9-9bb3-47fe-b65c-3f526539bd62"],"source":"vapi","request_id":"73f3d445"}

---

## RD. MODIFICA PRENOTAZIONE

### RD1. Modifica orario

**Precondizione:** Prenotazione attiva (da RA1).

**Cliente dice:** "Ho una prenotazione per [giovedi] alle 21:30. Potrei spostarla alle 21?"

**Obiettivo:** list_bookings → identificare; check_openings(21:00); modify_booking. Verificare che Sheets E Calendar siano aggiornati.

**Tool attesi:** list_bookings, check_openings, modify_booking

**Esito:**

**Risposte receptionist:**1.Trovato una prenotazione per giovedì 19 febbraio alle 21.30 a nome Mauro. Vuole spostare questa prenotazione? - Cliente: Sì voglio spostarla alle 21.;
2.La sua prenotazione è stata spostata con successo a giovedì 19 febbraio alle 21 Vuole che le invii un messaggio di conferma - Cliente: No grazie va bene lo stesso.
3.Va bene, se bisogno di ulteriore assistenza non esiti a contattarmi. Buona serata,..
 
**Log tool chiamati:**{"ts":"2026-02-17T19:31:08.581Z","level":"info","event":"api_request","request_id":"0d10dcc7","method":"POST","path":"/api/list_bookings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6d15-8b7a-711f-9ae4-23f1b9f7bf4e","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-17T19:31:09.082Z","level":"info","event":"list_bookings_success","restaurant_id":"roma","phone":"+39XXX...688","count":1,"booking_ids":["06e53a7d-9d10-454f-bfd9-f29126c84f88"],"source":"vapi","request_id":"0d10dcc7"}
{"ts":"2026-02-17T19:31:28.391Z","level":"info","event":"api_request","request_id":"8f5d4dba","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6d15-8b7a-711f-9ae4-23f1b9f7bf4e","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-17T19:31:28.784Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-19","requested_time":"21:00","in_openings":true,"slot_exists":true,"active_bookings_count":2,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"8f5d4dba"}
{"ts":"2026-02-17T19:31:28.784Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-19","closed":false,"openings_count":8,"requested_time":"21:00","available":true,"reason":null,"source":"vapi","request_id":"8f5d4dba"}
{"ts":"2026-02-17T19:31:30.722Z","level":"info","event":"api_request","request_id":"201faffe","method":"POST","path":"/api/modify_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6d15-8b7a-711f-9ae4-23f1b9f7bf4e","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
Menu
{"ts":"2026-02-17T19:31:32.913Z","level":"info","event":"modify_booking_success","restaurant_id":"roma","booking_id":"06e53a7d-9d10-454f-bfd9-f29126c84f88","source":"vapi","request_id":"201faffe"}

---

### RD2. Modifica numero persone

**Cliente dice:** "Vorrei cambiare da 3 a 6 persone per la mia prenotazione."

**Obiettivo:** 6 <= max_people (8) → OK. modify_booking con new_people=6.

**Tool attesi:** list_bookings, modify_booking

**Esito:**

**Risposte receptionist:**1.Posso aiutarla con questo. Prima però ho bisogno di verificare la sua prenotazione. Mi può confermare il numero di telefono utilizzato per la prenotazione? - Cliente:Sì, il numero è 3 4 9 2 6 7 4 6 8 8.; 2.Ho trovato una prenotazione prenotazione a nome Mauro per il giorno 19 febbraio alle 21 ma risulta per 2 persone. Vuole modificare questa prenotazione da 2 a 6 persone? - Cliente: Si; 3.La prenotazione è stata modificata con successo. Ora è per 6 persone il giorno 19 febbraio alle 21. Se bisogno di ulteriore assistenza, non esiti a chiedere. - Cliente: Va bene allora ciao...

**Log tool chiamati:**{"ts":"2026-02-17T19:34:49.437Z","level":"info","event":"api_request","request_id":"7c3c7787","method":"POST","path":"/api/list_bookings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6d18-ace6-7ff2-b8ea-2815d632cf3c","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-17T19:34:49.900Z","level":"info","event":"list_bookings_success","restaurant_id":"roma","phone":"+39XXX...688","count":1,"booking_ids":["06e53a7d-9d10-454f-bfd9-f29126c84f88"],"source":"vapi","request_id":"7c3c7787"}
{"ts":"2026-02-17T19:35:08.827Z","level":"info","event":"api_request","request_id":"70e92abc","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6d18-ace6-7ff2-b8ea-2815d632cf3c","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-17T19:35:09.168Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-19","requested_time":"21:00","in_openings":true,"slot_exists":true,"active_bookings_count":2,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"70e92abc"}
{"ts":"2026-02-17T19:35:09.171Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-19","closed":false,"openings_count":8,"requested_time":"21:00","available":true,"reason":null,"source":"vapi","request_id":"70e92abc"}
{"ts":"2026-02-17T19:35:11.175Z","level":"info","event":"api_request","request_id":"557ea143","method":"POST","path":"/api/modify_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6d18-ace6-7ff2-b8ea-2815d632cf3c","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-17T19:35:12.659Z","level":"info","event":"modify_booking_success","restaurant_id":"roma","booking_id":"06e53a7d-9d10-454f-bfd9-f29126c84f88","source":"vapi","request_id":"557ea143"}

---

### RD3. Modifica a giorno chiuso

**Cliente dice:** "Posso spostare la prenotazione a domenica?"

**Obiettivo:** check_openings(domenica) → closed=true, reason="closed", next_open_day. Non modificare. Proporre altro giorno.

**Tool attesi:** list_bookings, resolve_relative_day, check_openings (closed)

**Esito:**Allora qui succede lo stesso errore di RC2, ovvero che chiedo di spostare la prenotazione a domenica ma lei la prenotazione che ho io la vede già per domenica anche se è per il giovedì 19 febbraio...

**Risposte receptionist:**1. Posso aiutarla con la modifica della prenotazione. Mi può fornire il numero di telefono utilizzato per la prenotazione? - Cliente: Sì, il numero è 3 4 9 2 6 7 4 6 8 8.;  2.Ho trovato una prenotazione a domenica 19 febbraio alle 21 per 6 persone a nome Mauro. Vuole modificare questa prenotazione? Se sì, mi può dire a che ora desidera spostarla. - Cliente:Voglio spostarla domenica.; 3.Mi scusi, ma ho bisogno di sapere a che ora desidera spostare la prenotazione. Di domenica. Puoi indicarmi l'orario esatto... *ho chiuso la chiamata

**Log tool chiamati:**{"ts":"2026-02-17T19:45:44.194Z","level":"info","event":"api_request","request_id":"14bf4720","method":"POST","path":"/api/list_bookings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6d22-b568-7225-b4ef-8beac7323b52","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-17T19:45:44.723Z","level":"info","event":"list_bookings_success","restaurant_id":"roma","phone":"+39XXX...688","count":1,"booking_ids":["06e53a7d-9d10-454f-bfd9-f29126c84f88"],"source":"vapi","request_id":"14bf4720"}

Test rifatto dopo deploy(patch):

Risposte Receptionist: Cliente:Salve posso spostare la prenotazione a domenica.; 1.Posso aiutarla con la modifica della prenotazione. Mi può confermare il numero di telefono che usato per la prenotazione? - Cliente: Sì, numero è 3 4 9 2 6 7 4 6 8 8.; 2.Ho trovato una prenotazione per giovedì 19 febbraio alle 21.30 per 2 persone a nome Mauro. Mi può confermare se desidera spostare questa prenotazione a domenica. - Cliente:Sì voglio spostarla domenica.; 3.Purtroppo il ristorante è chiuso domenica. Riapriamo lunedì con cena dalle 19 alle 22.30 Vuole spostare la prenotazione a lunedì alle 21.30 - Cliente: No va bene, grazie, ciao.; 4.Ciao, se bisogno di ulteriore aiuto non esiti a contattarmi. Buona serata!

Log tool chiamati:{"ts":"2026-02-17T20:42:36.199Z","level":"info","event":"api_request","request_id":"d5a61586","method":"POST","path":"/api/list_bookings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6d56-cf96-7ff5-8241-93daaba87771","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-17T20:42:36.723Z","level":"info","event":"list_bookings_success","restaurant_id":"roma","phone":"+39XXX...688","count":1,"booking_ids":["4d35fee9-9bb3-47fe-b65c-3f526539bd62"],"source":"vapi","request_id":"d5a61586"}
{"ts":"2026-02-17T20:42:55.822Z","level":"info","event":"api_request","request_id":"5bf2c1a6","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6d56-cf96-7ff5-8241-93daaba87771","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-17T20:42:55.825Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"5bf2c1a6","text":"domenica","date":"2026-02-22"}
{"ts":"2026-02-17T20:42:56.719Z","level":"info","event":"api_request","request_id":"dfdfdbae","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6d56-cf96-7ff5-8241-93daaba87771","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-17T20:42:56.721Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-22","requested_time":"21:30","in_openings":false,"slot_exists":false,"active_bookings_count":null,"max_concurrent_bookings":null,"avg_stay_minutes":null,"available":false,"reason":"closed","nearest_slots_count":0,"source":"vapi","request_id":"dfdfdbae"}
{"ts":"2026-02-17T20:42:56.721Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-22","closed":true,"openings_count":0,"requested_time":"21:30","available":false,"reason":"closed","source":"vapi","request_id":"dfdfdbae"}

---

## RE. CANCELLAZIONE

### RE1. Cancellazione prenotazione

**Precondizione:** Prenotazione attiva (da RA1/RA2/RA3).

**Cliente dice:** "Vorrei cancellare la mia prenotazione."

**Obiettivo:** list_bookings → identificare; cancel_booking. Verificare che sia rimossa sia da Sheets che da Calendar.

**Tool attesi:** list_bookings, cancel_booking

**Esito:**Ha cancellato la prenotazione sia da sheets che calendar

**Risposte receptionist:**1.Posso aiutarla con questo. Mi conferma il numero di telefono che usato per la prenotazione o il giorno in cui effettuato la prenotazione. - Cliente: Sì il giorno è giovedì.; 2.Ho trovato una prenotazione per giovedì 19 febbraio alle 21 a nome Mauro. Vuole procedere con la cancellazione di questa prenotazione? - Cliente:si; 3.La prenotazione per giovedì 19 febbraio alle 21 è stata cancellata con successo. Posso aiutarla in altro modo? - Cliente:No, va bene così.; 4. Grazie, arrivederci.

**Log tool chiamati:**{"ts":"2026-02-17T19:52:12.891Z","level":"info","event":"api_request","request_id":"23037de6","method":"POST","path":"/api/list_bookings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6d28-b65e-7bb2-9513-7bd24f84e30f","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-17T19:52:13.837Z","level":"info","event":"list_bookings_success","restaurant_id":"roma","phone":"+39XXX...688","count":1,"booking_ids":["06e53a7d-9d10-454f-bfd9-f29126c84f88"],"source":"vapi","request_id":"23037de6"}
{"ts":"2026-02-17T19:52:30.407Z","level":"info","event":"api_request","request_id":"f01fe7ad","method":"POST","path":"/api/cancel_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6d28-b65e-7bb2-9513-7bd24f84e30f","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-17T19:52:31.892Z","level":"info","event":"sheets_delete_booking_row","restaurant_id":"roma","sheet_id":"1MnaSIGqhieZVnxtnw_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":39,"booking_id":"06e53a7d-9d10-454f-bfd9-f29126c84f88"}
{"ts":"2026-02-17T19:52:31.892Z","level":"info","event":"cancel_booking_success","restaurant_id":"roma","booking_id":"06e53a7d-9d10-454f-bfd9-f29126c84f88","source":"vapi","request_id":"f01fe7ad"}

---

### RE2. Cancellazione senza prenotazioni

**Cliente dice:** "Vorrei cancellare la prenotazione del 17."

**Obiettivo:** list_bookings → count=0. Comunicare e chiedere conferma numero.

**Tool attesi:** list_bookings

**Esito:**

**Risposte receptionist:**1.Non trovo prenotazioni con questo numero. Mi può confermare il numero usato o il giorno della prenotazione? - Cliente: Sì il giorno è il diciasette e il numero è 3 4 9 2 6 7 4 6 8 8.; 2.Non riesco ancora a trovare prenotazioni con il numero fornito. Mi può confermare il numero usato per la prenotazione o fornirmi un altro giorno? - Cliente: Allora vabbè sarà che mia moglie ha cancellato la prenotazione.; 3.Va bene, se bisogno di ulteriori informazioni o se desidera effettuare una nuova prenotazione non esiti a chiedere. Sono qui per aiutarla...

**Log tool chiamati:**{"ts":"2026-02-17T19:55:33.023Z","level":"info","event":"api_request","request_id":"eeb50245","method":"POST","path":"/api/list_bookings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6d2b-f3ea-711f-9b0c-32ecf6ee9d3b","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-17T19:55:33.557Z","level":"info","event":"list_bookings_success","restaurant_id":"roma","phone":"+39XXX...688","count":0,"booking_ids":[],"source":"vapi","request_id":"eeb50245"}
{"ts":"2026-02-17T19:55:56.141Z","level":"info","event":"api_request","request_id":"5fbcd46c","method":"POST","path":"/api/list_bookings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6d2b-f3ea-711f-9b0c-32ecf6ee9d3b","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-17T19:55:56.462Z","level":"info","event":"list_bookings_success","restaurant_id":"roma","phone":"+39XXX...688","count":0,"booking_ids":[],"source":"vapi","request_id":"5fbcd46c"}


---

## RF. FAQ

### RF1. Parcheggio

**Cliente dice:** "Avete parcheggio?"

**Obiettivo:** Risposta dal KB roma. Verificare che le FAQ siano separate da modena01.

**Tool attesi:** Knowledge Base Vapi

**Esito:**

**Risposte receptionist:**1.Non abbiamo un parcheggio privato, ma ci sono posti auto disponibili nelle vie vicine al ristorante. Posso aiutarla con qualcos'altro - Cliente:No volevo sapere solo questo.; 2.Va bene, grazie per avermi contattato. Arrivederci...

**Log tool chiamati:**Qui non ci sono tool chiamati al nostro server, fa tutto dentro vapi visto che il faq e dentro la knowledge base del assistente

---

### RF2. Domanda senza risposta

**Cliente dice:** "Fate catering per eventi?"

**Obiettivo:** KB → answer non trovata. Non inventare.

**Tool attesi:** Knowledge Base Vapi

**Esito:**

**Risposte receptionist:**Cliente: Ciao, io avevo un dubbio e volevo sapere una cosa.; 1.Ciao, qual è il suo dubbio? Sarò felice di aiutarla. - Cliente: Allora volevo sapere se fate catering per eventi.; 2.Non ho questa informazione disponibile riguardo al catering per eventi. Può contattare direttamente il ristorante per verificare. Posso aiutarla con qualcos'altro? - Cliente:E perché non sa rispondere; 3.Mi dispiace, non ho accesso a tutte le informazioni specifiche sul catering, posso solo fornire informazioni generali e orari. Se desidera posso aiutarla con prenotazioni o altre domande. Vuole che la metto in contatto.... * ho chiuso la chimata

**Log tool chiamati:**Qui non ci sono tool chiamati al nostro server, fa tutto dentro vapi visto che il faq e dentro la knowledge base del assistente

---

## RG. ORARI

### RG1. "Siete aperti?"

**Cliente dice:** "Siete aperti adesso?"

**Obiettivo:** is_open_now. Comunicare orari senza avviare prenotazione.

**Tool attesi:** is_open_now

**Esito:**

**Risposte receptionist:**1.Il ristorante è chiuso in questo momento. Riapriamo alle 19. Posso aiutarla con qualcos'altro? - Cliente:No va bene così ciao.; *Ho chiuso la chiamata

**Log tool chiamati:**{"ts":"2026-02-18T12:44:34.912Z","level":"info","event":"api_request","request_id":"c03bd850","method":"POST","path":"/api/is_open_now","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c70c7-c870-7000-808a-4e10617faf1f","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T12:44:34.914Z","level":"info","event":"is_open_now","restaurant_id":"roma","aperto_ora":false,"prossima_apertura":"19:00"}

---

### RG2. "A che ora aprite venerdi?"

**Cliente dice:** "A che ora aprite venerdi?"

**Obiettivo:** Venerdi Roma ha pranzo + cena. Comunicare entrambe le fasce.

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**Allora qui e successa una cosa strana nella prima chiamata ho osservato che qualcosa non è andato bene e quando sono andato su vapi in call logs questa è stata la conversazione: Cliente: Ciao, ciao Raprite venerdì.(qui ha capito sbagliato) 1.Il ristorante è chiuso venerdì, riapriamo sabato. Posso aiutarla con qualcos'altro? - Cliente: Quindi siete siete chiusi venerdì?; 2.Sì, esatto. Il ristorante è chiuso venerdì Riapriamo sabato. Posso aiutarla con qualcos'altro? - *perché ha risposto cosi anche se ha capito male e il stt ha trascritto male, e inoltre non ha chiamato nessun tool, ha risposto cosi a caso. Poi ho rifatto la chiamata e guarda sotto com'è andata, ha capito bene e ha anche risposto bene: 

**Risposte receptionist:**Cliente: Ciao, a che ora aprite venerdì?; 1.Siamo aperti. Venerdì 20 febbraio a pranzo. Dalle dodici:trenta alle 14. 30 e a cena dalle 19 alle 23. A che ora preferisce? - Cliente:Volevo sapere solo questo. Grazie.; 2.Prego, se bisogno di ulteriore assistenza non esiti a contattarmi. Arrivederci...

**Log tool chiamati:**{"ts":"2026-02-18T12:48:36.454Z","level":"info","event":"api_request","request_id":"ea38ebaf","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c70cb-745b-7444-bcea-d572bc5ff069","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T12:48:36.458Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"ea38ebaf","text":"venerdì","date":"2026-02-20","day_label":"venerdì 20 febbraio"}
{"ts":"2026-02-18T12:48:38.545Z","level":"info","event":"api_request","request_id":"2972111c","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c70cb-745b-7444-bcea-d572bc5ff069","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T12:48:38.550Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-20","closed":false,"openings_count":14,"requested_time":null,"available":null,"reason":null,"source":"vapi","request_id":"2972111c"}

---

### RG3. Giorno chiuso — solo orari

**Cliente dice:** "Siete aperti domenica?"

**Obiettivo:** check_openings → closed=true, reason="closed", next_open_day. Dire che domenica e chiuso e proporre prossimo giorno aperto.

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**Anche qui non ha risposto bene dal kb e successa una cosa strana...perché cavolo succedono ste cose se abbiamo provato a migliorare tutto grazie al backend, in ogni test scopriamo che qualcosa di nuovo non va, se dobbiamo fare centinaia di test per provare ogni tipo di caso non è utiole per niente questo sistema e non funziona per niente allora prima quando decideva tutto l'ai forse andava meglio... un sistema del genere non può essere implementato in un risotrante reale se funzionera in questo modo. Deve essere sempre coretto il sistema e funzionare bene..

**Risposte receptionist:**Cliente: Salve vorrei sapere se siete aperti domenica.; 1.Siamo aperti domenica a cena dalle 19 alle 22.30. A che ora preferisce? - Cliente: Quindi alle 19 aprile.; 2.Mi scusi, ma l'orario che mi indicato è già passato. Può scegliere un orario più avanti, - Cliente:Volevo sapere se siete aperti domenica.; 3.Siamo aperti domenica a cena dalle 19 alle 20 A che ora preferisce? - Cliente: Allora va bene ciao.

**Log tool chiamati:**{"ts":"2026-02-18T12:54:24.216Z","level":"info","event":"api_request","request_id":"520a8e1a","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c70d0-c2a1-7bb0-aae3-b6b1f2f807ef","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T12:54:24.218Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-19","closed":false,"openings_count":8,"requested_time":null,"available":null,"reason":null,"source":"vapi","request_id":"520a8e1a"}

Inoltre se ti può servire quando ha chiamato il tool check_openings in vapi questa è al response che ha ricevuto: {"restaurant_id":"roma","day":"2026-02-19","day_label":"giovedì 19 febbraio","closed":false,"lunch_range":null,"dinner_range":["19:00","22:30"],"requested_time":null,"available":null,"reason":null,"nearest_slots":null,"max_people":8,"message":"Orari di apertura: cena dalle 19:00 alle 22:30."}

---

## RH. EDGE CASES

### RH1. "Stasera" riconosciuto

**Cliente dice:** "Vorrei prenotare per stasera alle 20 per 2 persone."

**Obiettivo:** resolve_relative_day("stasera") → oggi. Fix B2 funziona anche su Roma.

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Esito:**Questo caso secondo me è stato utile perché avvevo gia una prenotazione con lo stesso numero per stasera quindi abbiamo controllato anche il duplicate_booking, però per sicurezza controlla anche tu ongi risposta e ogni log?

**Risposte receptionist:**Cliente: Salve vorrei prenotare per stasera alle 20 per 2 persone.; 1.Per stasera, mercoledì 18 febbraio, alle 20 abbiamo disponibilità Per confermare la prenotazione mi serve il suo nome e il numero di telefono. - Cliente: Sì mi chiamo Giancarlo Esposito. E il numero di telefono è questo da cui chiamo.; 2.Risulta già una prenotazione per stasera? Mercoledì 18 febbraio alle 20 a nome Conte. Vuole modificare questa prenotazione o verificare I dettagli? - Cliente: Allora cambiamo numero, usiamo un altro numero.; 3.Mi fornisca il nuovo numero di telefono per favore. - Cliente: Allora 3 4 9 2 6 6 4 6 32.; 3.La prenotazione per stasera, mercoledì 18 febbraio, alle 20 per 2 persone a nome, Giancarlo Esposito è stata confermata Se bisogno di ulteriore assistenza, sono qui per aiutarla. - Cliente: Va bene grazie ciao...

**Log tool chiamati:**{"ts":"2026-02-18T13:01:07.540Z","level":"info","event":"api_request","request_id":"4efacdf5","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c70d6-e365-7ff7-914a-2a6ba2632419","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T13:01:07.541Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"4efacdf5","text":"stasera","date":"2026-02-18","day_label":"mercoledì 18 febbraio"}
{"ts":"2026-02-18T13:01:07.914Z","level":"info","event":"api_request","request_id":"9ca7fe6d","method":"POST","path":"/api/resolve_relative_time","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c70d6-e365-7ff7-914a-2a6ba2632419","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T13:01:07.915Z","level":"info","event":"resolve_relative_time_success","restaurant_id":"roma","source":"vapi","request_id":"9ca7fe6d","text":"20","ok":true,"time":"20:00"}
{"ts":"2026-02-18T13:01:08.927Z","level":"info","event":"api_request","request_id":"967eef8f","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c70d6-e365-7ff7-914a-2a6ba2632419","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T13:01:09.916Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-18","requested_time":"20:00","in_openings":true,"slot_exists":true,"active_bookings_count":1,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"967eef8f"}
{"ts":"2026-02-18T13:01:09.916Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-18","closed":false,"openings_count":8,"requested_time":"20:00","available":true,"reason":null,"source":"vapi","request_id":"967eef8f"}
{"ts":"2026-02-18T13:01:31.300Z","level":"info","event":"api_request","request_id":"e3442a72","method":"POST","path":"/api/create_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c70d6-e365-7ff7-914a-2a6ba2632419","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T13:01:32.165Z","level":"warn","event":"sheets_duplicate_booking_blocked","restaurant_id":"roma","day":"2026-02-18","time":"20:00","phone":"+39XXX...688","existing_booking_id":"69dd9797-253c-4470-84d5-2fca717f62dd"}
{"ts":"2026-02-18T13:01:32.165Z","level":"info","event":"create_booking_success","restaurant_id":"roma","day":"2026-02-18","time":"20:00","people":2,"phone":"+39XXX...688","source":"vapi","request_id":"e3442a72"}
{"ts":"2026-02-18T13:01:33.089Z","level":"info","event":"api_request","request_id":"edc70dba","method":"POST","path":"/api/list_bookings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c70d6-e365-7ff7-914a-2a6ba2632419","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T13:01:33.410Z","level":"info","event":"list_bookings_success","restaurant_id":"roma","phone":"+39XXX...688","count":2,"booking_ids":["4d35fee9-9bb3-47fe-b65c-3f526539bd62","69dd9797-253c-4470-84d5-2fca717f62dd"],"source":"vapi","request_id":"edc70dba"}
{"ts":"2026-02-18T13:02:07.639Z","level":"info","event":"api_request","request_id":"557b951c","method":"POST","path":"/api/create_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c70d6-e365-7ff7-914a-2a6ba2632419","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T13:02:12.153Z","level":"info","event":"sheets_write_booking_row","restaurant_id":"roma","sheet_id":"1MnaSIGqhieZVnxtnw_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":41,"booking_id":"cbabadd3-e352-4731-a921-02e9322de53a"}
{"ts":"2026-02-18T13:02:12.153Z","level":"info","event":"create_booking_success","restaurant_id":"roma","day":"2026-02-18","time":"20:00","people":2,"phone":"+39XXX...632","booking_id":"cbabadd3-e352-4731-a921-02e9322de53a","source":"vapi","request_id":"557b951c"}

---

### RH2. Orari in italiano (non inglese)

**Cliente dice:** "Vorrei prenotare per sabato alle 20 e 30 per 4 persone, nome Giulia."

**Obiettivo:** Verificare che la conferma sia in italiano parlato ("alle venti e trenta", "sabato 15 febbraio"), MAI "8:30 PM", MAI "February 15", MAI "2026".

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Cosa controllare nella risposta:**
- [ ] Data in italiano ("sabato 15 febbraio"), no inglese
- [ ] Orario parlato ("alle venti e trenta"), no "20:30" o "8:30 PM"
- [ ] Anno MAI menzionato
- [ ] Nessuna parola in inglese

**Esito:**Da quello che ho osservato ha letto le date e i numeri in italiano e correttamente però ci sono comunque casi che ho osservato priam dove leggeva il numero tipo 22.30 in inglese perché non ho cambiato la voce di 11labs che è in più lingue non solo in italiano..

**Risposte receptionist:**1.Ho prenotato un tavolo per 4 persone a nome Giulia per sabato 21 febbraio alle 20.30. Se bisogno di ulteriore assistenza, sono qui per aiutarla. - Cliente:Va bene allora che numero ho usato?; 2.Utilizzato il numero Plus 3 9 3 4 9 2 6 7 4 6 8 8. Per le sue prenotazioni. Se hai bisogno di ulteriori informazioni, non esiti a chiedere. - Cliente: Va bene allora ciao.

**Log tool chiamati:**{"ts":"2026-02-18T13:10:29.552Z","level":"info","event":"api_request","request_id":"d00af25a","method":"POST","path":"/api/resolve_relative_time","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c70df-6c22-7006-8d58-cf6cc12b3bcf","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T13:10:29.553Z","level":"info","event":"resolve_relative_time_error","restaurant_id":"roma","source":"vapi","request_id":"d00af25a","text":"20 e 30","error_code":"UNSUPPORTED_RELATIVE_TIME","error_message":"Espressione orario non riconosciuta."}
{"ts":"2026-02-18T13:10:29.557Z","level":"info","event":"api_request","request_id":"2ac321d2","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c70df-6c22-7006-8d58-cf6cc12b3bcf","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T13:10:29.558Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"2ac321d2","text":"sabato","date":"2026-02-21","day_label":"sabato 21 febbraio"}
{"ts":"2026-02-18T13:10:30.574Z","level":"info","event":"api_request","request_id":"9837df85","method":"POST","path":"/api/resolve_relative_time","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c70df-6c22-7006-8d58-cf6cc12b3bcf","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T13:10:30.574Z","level":"info","event":"resolve_relative_time_success","restaurant_id":"roma","source":"vapi","request_id":"9837df85","text":"20:30","ok":true,"time":"20:30"}
{"ts":"2026-02-18T13:10:31.661Z","level":"info","event":"api_request","request_id":"4658c234","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c70df-6c22-7006-8d58-cf6cc12b3bcf","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T13:10:32.697Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-21","requested_time":"20:30","in_openings":true,"slot_exists":true,"active_bookings_count":0,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"4658c234"}
{"ts":"2026-02-18T13:10:32.699Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-21","closed":false,"openings_count":14,"requested_time":"20:30","available":true,"reason":null,"source":"vapi","request_id":"4658c234"}
{"ts":"2026-02-18T13:10:36.207Z","level":"info","event":"api_request","request_id":"6afc6cb9","method":"POST","path":"/api/create_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c70df-6c22-7006-8d58-cf6cc12b3bcf","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T13:10:40.015Z","level":"info","event":"sheets_write_booking_row","restaurant_id":"roma","sheet_id":"1MnaSIGqhieZVnxtnw_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":42,"booking_id":"609f97b3-edf7-4027-ac99-83d4ba296ffc"}
{"ts":"2026-02-18T13:10:40.015Z","level":"info","event":"create_booking_success","restaurant_id":"roma","day":"2026-02-21","time":"20:30","people":4,"phone":"+39XXX...688","booking_id":"609f97b3-edf7-4027-ac99-83d4ba296ffc","source":"vapi","request_id":"6afc6cb9"}
{"ts":"2026-02-18T13:11:01.597Z","level":"info","event":"api_request","request_id":"16f57499","method":"POST","path":"/api/list_bookings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c70df-6c22-7006-8d58-cf6cc12b3bcf","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T13:11:02.438Z","level":"info","event":"list_bookings_success","restaurant_id":"roma","phone":"+39XXX...688","count":3,"booking_ids":["4d35fee9-9bb3-47fe-b65c-3f526539bd62","69dd9797-253c-4470-84d5-2fca717f62dd","609f97b3-edf7-4027-ac99-83d4ba296ffc"],"source":"vapi","request_id":"16f57499"}
Menu


---

### RH3. Conferma ambigua ("si" senza specificare slot)

**Contesto:** check_openings propone 2 slot alternativi.

**Cliente dice:** "Va bene allora." [senza dire quale orario]

**Obiettivo:** NON assumere. Chiedere "Preferisce alle X o alle Y?"

**Tool attesi:** check_openings (gia fatto)

**Esito:**

**Risposte receptionist:**1.Oggi siamo aperti. Ma non possiamo accettare prenotazioni alle 16. Gli orari più vicini disponibili sono alle 19 e alle 19.30. Vuole prenotare per uno di questi orari? - Cliente: Sì va bene allora.; 2.Preferisce prenotare per le 19 o per le 19.30? - Cliente: Le 19.30.; 3.Quante persone desidera prenotare?... - *Ho chiuso la chiamata

**Log tool chiamati:**{"ts":"2026-02-18T13:22:25.904Z","level":"info","event":"api_request","request_id":"b5781416","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c70ea-65c6-7338-9ed0-d9214005362b","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T13:22:25.905Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"b5781416","text":"oggi","date":"2026-02-18","day_label":"mercoledì 18 febbraio"}
{"ts":"2026-02-18T13:22:27.290Z","level":"info","event":"api_request","request_id":"658afb40","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c70ea-65c6-7338-9ed0-d9214005362b","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T13:22:28.433Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-18","requested_time":"16:00","in_openings":false,"slot_exists":false,"active_bookings_count":null,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":false,"reason":"not_in_openings","nearest_slots_count":2,"source":"vapi","request_id":"658afb40"}
{"ts":"2026-02-18T13:22:28.433Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-18","closed":false,"openings_count":8,"requested_time":"16:00","available":false,"reason":"not_in_openings","source":"vapi","request_id":"658afb40"}

---

### RH4. endCall dopo saluto

**Cliente dice:** "Ok grazie, arrivederci."

**Obiettivo:** Receptionist saluta e chiama endCall nella STESSA risposta. La chiamata si chiude subito, senza aspettare altro turno.

**Tool attesi:** endCall

**Esito:**Si funziona

**Risposte receptionist:**

**Log tool chiamati:**

---

## RJ. HANDOVER

### RJ1. Handover — ristorante aperto

**Cliente dice:** "Vorrei parlare con qualcuno del ristorante."

**Obiettivo:** is_open_now → se aperto, transfer.

**Tool attesi:** is_open_now, transfer_call_tool

**Esito:** Se il ristorante è aperto fa il transfer, l'ho già provato ieri.

**Risposte receptionist:**Cliente: Vorrei parlare con qualcuno del ristorante.; 1.Il ristorante è chiuso al momento. E riaprirà alle 19. Posso aiutarla io con prenotazioni o informazioni. - Cliente: Allora va bene grazie, ci sarò più tardi.; 2.A presto. Se hai bisogno non esiti a contattarmi. - Va bene ciao...

**Log tool chiamati:**{"ts":"2026-02-18T13:27:03.928Z","level":"info","event":"api_request","request_id":"7f211590","method":"POST","path":"/api/is_open_now","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c70ee-818b-766e-9ed4-da457996817a","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T13:27:03.929Z","level":"info","event":"is_open_now","restaurant_id":"roma","aperto_ora":false,"prossima_apertura":"19:00"}

---

### RJ2. Handover — ristorante chiuso

**Cliente dice:** "Vorrei parlare con qualcuno." [ristorante chiuso]

**Obiettivo:** is_open_now → chiuso. NON fare transfer. Dire chiuso + offrire aiuto AI.

**Tool attesi:** is_open_now

**Esito:**Funziona, il test è uguale a quello di RJ1

**Risposte receptionist:**

**Log tool chiamati:**

---





TEST RIFATTI DOPO ULTIMA PATCH - Test RG3, RH2, RG2:

### RG3. Giorno chiuso — solo orari

**Cliente dice:** "Siete aperti domenica?"

**Obiettivo:** check_openings → closed=true, reason="closed", next_open_day. Dire che domenica e chiuso e proporre prossimo giorno aperto.

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**

**Risposte receptionist:**1.Quel giorno siamo chiusi. Riapriamo lunedì 23 febbraio con cena dalle 19 alle 22.30. Posso aiutarla con qualcos'altro? - Cliente:Va bene così, ciao.

**Log tool chiamati:Vapi- 1. Resolve Relative Day. 2.Check Openings: {"restaurant_id":"roma","day":"2026-02-22","day_label":"domenica 22 febbraio","closed":true,"lunch_range":null,"dinner_range":null,"requested_time":null,"time_human":null,"available":null,"reason":null,"nearest_slots":null,"nearest_slots_human":null,"max_people":8,"message":"Il ristorante è chiuso domenica. Il prossimo giorno di apertura è lunedì con cena dalle 19 alle 22 e 30.","next_open_day":"2026-02-23","next_open_day_label":"lunedì","next_open_ranges":{"lunch":null,"dinner":"19:00–22:30"}}

Render: {"ts":"2026-02-18T15:24:08.614Z","level":"info","event":"api_request","request_id":"0a27adcf","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c7159-dbc7-755f-bac2-d12efe716087","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T15:24:09.006Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"0a27adcf","text":"domenica","date":"2026-02-22","day_label":"domenica 22 febbraio"}
{"ts":"2026-02-18T15:24:10.086Z","level":"info","event":"api_request","request_id":"34d451da","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c7159-dbc7-755f-bac2-d12efe716087","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T15:24:10.089Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-22","closed":true,"openings_count":0,"requested_time":null,"available":null,"reason":null,"source":"vapi","request_id":"34d451da"}

--

### RH2. Orari in italiano (non inglese)

**Cliente dice:** "Vorrei prenotare per sabato alle 20 e 30 per 4 persone, nome Giulia."

**Obiettivo:** Verificare che la conferma sia in italiano parlato ("alle venti e trenta", "sabato 15 febbraio"), MAI "8:30 PM", MAI "February 15", MAI "2026".

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Cosa controllare nella risposta:**
- [ ] Data in italiano ("sabato 15 febbraio"), no inglese
- [ ] Orario parlato ("alle venti e trenta"), no "20:30" o "8:30 PM"
- [ ] Anno MAI menzionato
- [ ] Nessuna parola in inglese

**Esito:**L'unica cosa qui che ho osservato io che non va bene e che ha letto l'orario 20.30 di nuovo in inglese come twenty point three zero, perché nonha letto in italiano se abbiamo fatto qualla patch. Forse e solo un problema di voice da 11labs o si può risolvere ?

**Risposte receptionist:**1.Per sabato 21 febbraio alle 20.30 abbiamo disponibilità per 4 persone a nome Giulia, posso procedere con la prenotazione? - Cliente: Certo.; 2.Mi serve solo il numero di telefono per completare la prenotazione. Qual è il numero? - Cliente: Il numero è 3 4 9 2 6 7 4 6 8 8.; 3.La prenotazione per 4 persone a nome Giulia è stata confermata per sabato 21 febbraio alle 20 point 3 0 Se bisogno di ulteriore assistenza, non esiti a chiedere. - Cliente: Va bene ciao...

**Log tool chiamati:Vapi-1.Resolve relative Day; 2.Check Openings:{"restaurant_id":"roma","day":"2026-02-21","day_label":"sabato 21 febbraio","closed":false,"lunch_range":["12:30","14:30"],"dinner_range":["19:00","23:00"],"requested_time":"20:30","time_human":"20 e 30","available":true,"reason":null,"nearest_slots":[],"nearest_slots_human":null,"max_people":8,"message":"Disponibile."} ;
3.Create Booking: {"ok":true,"booking_id":"bbf66563-bf8b-44e0-91fc-c2a64c644716","day":"2026-02-21","time":"20:30","people":4,"name":"Giulia","phone":"+393492674688","notes":null,"event_id":"b1rhj75eo4v0t55624jqn5fans","day_label":"sabato 21 febbraio"};
4.End Call

Render:{"ts":"2026-02-18T15:30:53.944Z","level":"info","event":"api_request","request_id":"c1f0fa5b","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c715f-f7c3-7006-8e28-b4160bc52d0c","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T15:30:53.945Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"c1f0fa5b","text":"sabato","date":"2026-02-21","day_label":"sabato 21 febbraio"}
{"ts":"2026-02-18T15:30:56.986Z","level":"info","event":"api_request","request_id":"8684d808","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c715f-f7c3-7006-8e28-b4160bc52d0c","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T15:30:58.132Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-21","requested_time":"20:30","in_openings":true,"slot_exists":true,"active_bookings_count":0,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"8684d808"}
{"ts":"2026-02-18T15:30:58.133Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-21","closed":false,"openings_count":14,"requested_time":"20:30","available":true,"reason":null,"source":"vapi","request_id":"8684d808"}
{"ts":"2026-02-18T15:31:27.582Z","level":"info","event":"api_request","request_id":"1857aefc","method":"POST","path":"/api/create_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c715f-f7c3-7006-8e28-b4160bc52d0c","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T15:31:31.012Z","level":"info","event":"sheets_write_booking_row","restaurant_id":"roma","sheet_id":"1MnaSIGqhieZVnxtnw_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":42,"booking_id":"bbf66563-bf8b-44e0-91fc-c2a64c644716"}
{"ts":"2026-02-18T15:31:31.013Z","level":"info","event":"create_booking_success","restaurant_id":"roma","day":"2026-02-21","time":"20:30","people":4,"phone":"+39XXX...688","booking_id":"bbf66563-bf8b-44e0-91fc-c2a64c644716","source":"vapi","request_id":"1857aefc"}


--

### RG2. "A che ora aprite venerdi?"

**Cliente dice:** "A che ora aprite venerdi?"

**Obiettivo:** Venerdi Roma ha pranzo + cena. Comunicare entrambe le fasce.

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**Poi perché legge ancora con ":" se ho fatto l'upload, provo a rifarlo di nuovo? In chiamata mi sa che l'ha detto bene però perchè c'è ancora ":"

**Risposte receptionist:**1.Siamo aperti a pranzo dalle dodici:trenta alle quattordici:trenta e a cena dalle 19 alle 23 Posso aiutarla con qualcos'altro? - Cliente: No va bene così, volevo sapere solo questo.; 2.Va bene grazie e buona serata....

**Log tool chiamati:Vapi-1.Resolve Relative Day; 2.Check Openings: {"restaurant_id":"roma","day":"2026-02-20","day_label":"venerdì 20 febbraio","closed":false,"lunch_range":["12:30","14:30"],"dinner_range":["19:00","23:00"],"requested_time":null,"time_human":null,"available":null,"reason":null,"nearest_slots":null,"nearest_slots_human":null,"max_people":8,"message":"Orari di apertura: pranzo dalle 12 e 30 alle 14 e 30 e cena dalle 19 alle 23."}; 3.Enda Call

Render: {"ts":"2026-02-18T15:36:37.329Z","level":"info","event":"api_request","request_id":"50df6038","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c7165-438d-733f-aece-570d1862f47e","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T15:36:37.361Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"50df6038","text":"venerdì","date":"2026-02-20","day_label":"venerdì 20 febbraio"}
{"ts":"2026-02-18T15:36:39.344Z","level":"info","event":"api_request","request_id":"b079e309","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c7165-438d-733f-aece-570d1862f47e","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T15:36:39.346Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-20","closed":false,"openings_count":14,"requested_time":null,"available":null,"reason":null,"source":"vapi","request_id":"b079e309"}

---

TEST RIFATTI DOPO PATCH RG2, RH2 :

### RG2. "A che ora aprite venerdi?"

**Cliente dice:** "A che ora aprite venerdi?"

**Obiettivo:** Venerdi Roma ha pranzo + cena. Comunicare entrambe le fasce.

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**

**Risposte receptionist:**1.Siamo aperti a pranzo dalle dodici:trenta alle 14 30. E a cena dalle 19 alle 23 Vuole prenotare per venerdì? - Cliente: No volevo sapere solo l'orario e basta.; 2.Capisco, mi scuso per l'inconveniente. Se bisogno di ulteriori informazioni, sono qui per aiutarla. - Cliente: Va bene ciao...

**Log tool chiamati:Vapi-1.Resolve Relative Day; 2.Check Openings: {"restaurant_id":"roma","day":"2026-02-20","day_label":"venerdì 20 febbraio","closed":false,"requested_time":null,"time_human":null,"available":null,"reason":null,"nearest_slots_human":null,"max_people":8,"message":"Orari di apertura: pranzo dalle 12 e 30 alle 14 e 30 e cena dalle 19 alle 23."}; 3.End Call

Render: {"ts":"2026-02-18T17:28:41.696Z","level":"info","event":"api_request","request_id":"a0c31626","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c71cb-e53d-7773-89d1-7c71d0646e4d","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T17:28:41.700Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"a0c31626","text":"venerdì","date":"2026-02-20","day_label":"venerdì 20 febbraio"}
{"ts":"2026-02-18T17:28:43.136Z","level":"info","event":"api_request","request_id":"18a113ac","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c71cb-e53d-7773-89d1-7c71d0646e4d","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T17:28:43.139Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-20","closed":false,"openings_count":14,"requested_time":null,"available":null,"reason":null,"source":"vapi","request_id":"18a113ac"}

--
### RH2. Orari in italiano (non inglese)

**Cliente dice:** "Vorrei prenotare per sabato alle 20 e 30 per 4 persone, nome Giulia."

**Obiettivo:** Verificare che la conferma sia in italiano parlato ("alle venti e trenta", "sabato 15 febbraio"), MAI "8:30 PM", MAI "February 15", MAI "2026".

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Cosa controllare nella risposta:**
- [ ] Data in italiano ("sabato 15 febbraio"), no inglese
- [ ] Orario parlato ("alle venti e trenta"), no "20:30" o "8:30 PM"
- [ ] Anno MAI menzionato
- [ ] Nessuna parola in inglese

**Esito:**

**Risposte receptionist:** 1.La prenotazione è confermata per sabato 21 febbraio alle venti:trenta per 4 persone a nome Giulia. Se bisogno di ulteriore assistenza non esiti a chiedere. -  Cliente: Va bene ciao, grazie...

**Log tool chiamati:Vapi-1.Resolve Relative Day; 2.Check Openings:{"restaurant_id":"roma","day":"2026-02-21","day_label":"sabato 21 febbraio","closed":false,"requested_time":"20:30","time_human":"20 e 30","available":true,"reason":null,"nearest_slots_human":null,"max_people":8,"message":"Disponibile."}; 3.Crete Booking:{"ok":true,"booking_id":"440d677c-8474-4941-a30a-f5fd9f41c0f1","day":"2026-02-21","time":"20:30","people":4,"name":"Giulia","phone":"+393492674688","notes":null,"event_id":"b4aa178eqfl2icoqr0i28om2qs","day_label":"sabato 21 febbraio","time_human":"20 e 30","message":"Prenotazione confermata per sabato 21 febbraio alle 20 e 30, 4 persone a nome Giulia."};
4.End Call

Render:{"ts":"2026-02-18T17:32:57.928Z","level":"info","event":"api_request","request_id":"bc903a1c","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c71cf-c24b-7bb7-878b-3ccac6b0d612","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T17:32:57.929Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"bc903a1c","text":"sabato","date":"2026-02-21","day_label":"sabato 21 febbraio"}
{"ts":"2026-02-18T17:32:59.165Z","level":"info","event":"api_request","request_id":"bd609560","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c71cf-c24b-7bb7-878b-3ccac6b0d612","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T17:33:00.290Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-21","requested_time":"20:30","in_openings":true,"slot_exists":true,"active_bookings_count":0,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"bd609560"}
{"ts":"2026-02-18T17:33:00.290Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-21","closed":false,"openings_count":14,"requested_time":"20:30","available":true,"reason":null,"source":"vapi","request_id":"bd609560"}
{"ts":"2026-02-18T17:33:01.597Z","level":"info","event":"api_request","request_id":"8dd32cf4","method":"POST","path":"/api/create_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c71cf-c24b-7bb7-878b-3ccac6b0d612","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-18T17:33:05.385Z","level":"info","event":"sheets_write_booking_row","restaurant_id":"roma","sheet_id":"1MnaSIGqhieZVnxtnw_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":42,"booking_id":"440d677c-8474-4941-a30a-f5fd9f41c0f1"}
{"ts":"2026-02-18T17:33:05.385Z","level":"info","event":"create_booking_success","restaurant_id":"roma","day":"2026-02-21","time":"20:30","people":4,"phone":"+39XXX...688","booking_id":"440d677c-8474-4941-a30a-f5fd9f41c0f1","source":"vapi","request_id":"8dd32cf4"}

---

## Riepilogo esiti Roma V2

| Test | Descrizione | Esito V1 | Esito V2 |
|------|-------------|----------|----------|
| RA1 | Prenotazione semplice | PASS con difetti | |
| RA2 | Prenotazione step-by-step | PASS | |
| RA3 | Prenotazione giorno settimana | FAIL (endCall, resolve_time) | |
| RB1 | Giorno chiuso (domenica) | FAIL CRITICO | |
| RB2 | Fuori orario (16:00 giovedi) | PASS con difetti | |
| RB3 | Pranzo in giorno senza pranzo | PARZIALE | |
| RB4 | Max persone superato (>8) | PASS con difetti | |
| RB5 | Cutoff (22:30 con cutoff 45 min) | FAIL CRITICO | |
| RB6 | Duplicato | PASS | |
| RC1 | Lista prenotazioni | — | |
| RC2 | Nessuna prenotazione | — | |
| RD1 | Modifica orario | — | |
| RD2 | Modifica persone | — | |
| RD3 | Modifica a giorno chiuso | — | |
| RE1 | Cancellazione | — | |
| RE2 | Cancellazione senza prenotazioni | — | |
| RF1 | FAQ parcheggio | — | |
| RF2 | FAQ senza risposta | — | |
| RG1 | Siete aperti? | — | |
| RG2 | Orari venerdi (pranzo+cena) | — | |
| RG3 | Domenica chiuso | — | |
| RH1 | "Stasera" riconosciuto | — | |
| RH2 | Orari in italiano (no inglese) | — | |
| RH3 | Conferma ambigua | — | |
| RH4 | endCall dopo saluto | — | |
| RJ1 | Handover aperto | — | |
| RJ2 | Handover chiuso | — | |

**Totale: 27 test**

---

*Dopo ogni test: compilare Esito, Risposte receptionist, Log tool chiamati. Verificare anche su Google Sheets e Calendar che le prenotazioni create/modificate/cancellate siano corrette.*

---

# TEST V2.0 — Prompt v2.0 + Backend v2.1 (230 test backend OK)

**Data:** ___/02/2026
**Prompt version:** v2.0
**Backend version:** v2.1 (230 regression test PASS)

---

## Fase 1 — Test critici (erano FAIL in V1)

### 1. RG3 — Giorno chiuso (domenica)

**Cliente dice:** "Siete aperti domenica?"

**Obiettivo:** check_openings → closed=true, message con next_open_day. Deve dire CHIUSO + proporre lunedì.

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**

**Risposte receptionist:**1.Il ristorante è chiuso domenica. Il prossimo giorno di apertura è lunedì. Con cena dalle 19 alle 22.30. Posso aiutarla con una prenotazione per lunedì? - Cliente: No va bene lo stesso, ciao...;

**Log tool chiamati (Vapi):**1.Resolve Relative Day; 2.Check Openings:{"restaurant_id":"roma","day":"2026-02-22","day_label":"domenica 22 febbraio","closed":true,"requested_time":null,"time_human":null,"available":null,"reason":"closed","nearest_slots_human":null,"max_people":8,"message":"Il ristorante è chiuso domenica. Il prossimo giorno di apertura è lunedì con cena dalle 19 alle 22 e 30.","next_open_day":"2026-02-23","next_open_day_label":"lunedì","next_open_ranges":{"lunch":null,"dinner":"19:00–22:30"}}
3.End Call

**Log tool chiamati (Render):**{"ts":"2026-02-19T17:28:08.294Z","level":"info","event":"api_request","request_id":"eff237c5","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c76f1-ba20-7cc5-96c8-fa5de1be9387","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T17:28:08.296Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"eff237c5","text":"domenica","date":"2026-02-22","day_label":"domenica 22 febbraio"}
{"ts":"2026-02-19T17:28:09.490Z","level":"info","event":"api_request","request_id":"cfcfd04f","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c76f1-ba20-7cc5-96c8-fa5de1be9387","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T17:28:09.493Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-22","closed":true,"openings_count":0,"requested_time":null,"available":null,"reason":"closed","source":"vapi","request_id":"cfcfd04f"}

---

### 2. RB5 — Cutoff (22:30 con cutoff 45 min)

**Cliente dice:** "Vorrei prenotare per giovedì alle 22 e 30 per 2 persone."

**Obiettivo:** check_openings → reason=cutoff, nearest_slots_human in formato parlato. L'AI propone orari alternativi pronunciati correttamente.

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**

**Risposte receptionist:**1.Il prossimo giovedì 26 febbraio non abbiamo disponibilità alle 22.30 poiché è troppo vicino alla chiusura. Gli orari più vicini disponibili sono alle 22 e alle 21 30. Quale preferisce? - Cliente:Facciamo le 21.30.; 2.Posso procedere con la prenotazione per 2 persone. Mi conferma il suo nome? - Cliente: La chiamo più tardi, ciao.; 3.Arrivederci, a presto. - Cliente: Ciao.; 4.Salve, come posso aiutarla?.. *ho chiuso la chiamata

**Log tool chiamati (Vapi):**1.Resolve Relative Day; 2.Check Openings: {"ok":false,"error_code":"WEEKDAY_MISMATCH","message":"La data 2026-02-23 è lunedì 23 febbraio, non giovedì. Il prossimo giovedì è giovedì 26 febbraio.","corrected_day":"2026-02-26","corrected_day_label":"giovedì 26 febbraio"}; 3.Check Openings:{"restaurant_id":"roma","day":"2026-02-26","day_label":"giovedì 26 febbraio","closed":false,"requested_time":"22:30","time_human":"22 e 30","available":false,"reason":"cutoff","nearest_slots_human":["22","21 e 30"],"max_people":8,"message":"Questo orario è troppo vicino alla chiusura. Orari più vicini: 22, 21 e 30."}

**Log tool chiamati (Render):**{"ts":"2026-02-19T17:30:11.481Z","level":"info","event":"api_request","request_id":"e45ec5d1","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c76f3-8f67-722f-a479-636bd05da2f2","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T17:30:11.482Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"e45ec5d1","text":"giovedì","date":"2026-02-26","day_label":"giovedì 26 febbraio"}
{"ts":"2026-02-19T17:30:11.489Z","level":"info","event":"api_request","request_id":"c20b8798","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c76f3-8f67-722f-a479-636bd05da2f2","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T17:30:11.490Z","level":"warn","event":"check_openings_weekday_mismatch","restaurant_id":"roma","day":"2026-02-23","time":"22:30","source":"vapi","request_id":"c20b8798","expected_weekday":"giovedì","actual_day_label":"lunedì 23 febbraio","corrected_day":"2026-02-26","corrected_day_label":"giovedì 26 febbraio"}
{"ts":"2026-02-19T17:30:12.450Z","level":"info","event":"api_request","request_id":"49b5b27d","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c76f3-8f67-722f-a479-636bd05da2f2","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T17:30:12.784Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-26","requested_time":"22:30","in_openings":true,"slot_exists":false,"active_bookings_count":null,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":false,"reason":"cutoff","nearest_slots_count":2,"source":"vapi","request_id":"49b5b27d"}
{"ts":"2026-02-19T17:30:12.784Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-26","closed":false,"openings_count":8,"requested_time":"22:30","available":false,"reason":"cutoff","source":"vapi","request_id":"49b5b27d"}

---

### 3. RB1 — Giorno chiuso (domenica) con prenotazione

**Cliente dice:** "Vorrei prenotare per domenica alle 20, 2 persone."

**Obiettivo:** check_openings → closed=true + next_open_day. NON crea prenotazione. Propone lunedì.

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**

**Risposte receptionist:**1.Mi dispiace, ma il ristorante è chiuso domenica. Riapriamo lunedì con cena dalle 19 alle 22.30. Vuole prenotare per lunedì? - Cliente: No grazie ciao.; 2.Arrivederci se bisogno non esiti a contattarmi. - Cliente: Va bene ciao... *End Call

**Log tool chiamati (Vapi):**2.Resolve Relative Day; 2.Check Openings:{"restaurant_id":"roma","day":"2026-02-22","day_label":"domenica 22 febbraio","closed":true,"requested_time":"20:00","time_human":"20","available":false,"reason":"closed","nearest_slots_human":null,"max_people":8,"message":"Il ristorante è chiuso domenica. Il prossimo giorno di apertura è lunedì con cena dalle 19 alle 22 e 30.","next_open_day":"2026-02-23","next_open_day_label":"lunedì","next_open_ranges":{"lunch":null,"dinner":"19:00–22:30"}};
3.End Call

**Log tool chiamati (Render):**{"ts":"2026-02-19T17:31:42.298Z","level":"info","event":"api_request","request_id":"4242bfd8","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c76f4-fbc8-711c-997a-2738929ad168","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T17:31:42.299Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"4242bfd8","text":"domenica","date":"2026-02-22","day_label":"domenica 22 febbraio"}
{"ts":"2026-02-19T17:31:43.543Z","level":"info","event":"api_request","request_id":"75c7cefb","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c76f4-fbc8-711c-997a-2738929ad168","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T17:31:43.544Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-22","requested_time":"20:00","in_openings":false,"slot_exists":false,"active_bookings_count":null,"max_concurrent_bookings":null,"avg_stay_minutes":null,"available":false,"reason":"closed","nearest_slots_count":0,"source":"vapi","request_id":"75c7cefb"}
{"ts":"2026-02-19T17:31:43.544Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-22","closed":true,"openings_count":0,"requested_time":"20:00","available":false,"reason":"closed","source":"vapi","request_id":"75c7cefb"}

---

## Fase 2 — Test TTS/pronuncia

### 4. RG2 — Orari venerdì (pranzo+cena)

**Cliente dice:** "A che ora aprite venerdì?"

**Obiettivo:** Pronuncia orari in italiano parlato ("dodici e trenta", non "dodici:trenta"). Comunica pranzo + cena.

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**

**Risposte receptionist:**1.Venerdì 20 febbraio 20 febbraio. Siamo aperti per pranzo dalle 12.30 alle 14.30 e per cena dalle 19 alle 23. Posso aiutarla con qualcos'altro? - *Ho chiuso la chiamata

**Log tool chiamati (Vapi):** 1.Resolve Relative Day; 2.Check Openings:{"restaurant_id":"roma","day":"2026-02-20","day_label":"venerdì 20 febbraio","closed":false,"requested_time":null,"time_human":null,"available":null,"reason":null,"nearest_slots_human":null,"max_people":8,"message":"Orari di apertura: pranzo dalle 12 e 30 alle 14 e 30 e cena dalle 19 alle 23."}; 3.End call

**Log tool chiamati (Render):**{"ts":"2026-02-19T17:40:42.087Z","level":"info","event":"api_request","request_id":"f174d886","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c76fd-3d00-7cc4-9295-bf35cfe93766","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T17:40:42.087Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"f174d886","text":"venerdì","date":"2026-02-20","day_label":"venerdì 20 febbraio"}
{"ts":"2026-02-19T17:40:43.723Z","level":"info","event":"api_request","request_id":"e406eafe","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c76fd-3d00-7cc4-9295-bf35cfe93766","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T17:40:43.725Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-20","closed":false,"openings_count":14,"requested_time":null,"available":null,"reason":null,"source":"vapi","request_id":"e406eafe"}

---

### 5. RH2 — Orari in italiano (conferma prenotazione)

**Cliente dice:** "Vorrei prenotare per sabato alle 20 e 30 per 4 persone, nome Giulia."

**Obiettivo:** Conferma in italiano parlato ("venti e trenta", non "twenty point three zero" o "20:30").

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Cosa controllare:**
- [ ] Data in italiano ("sabato X febbraio")
- [ ] Orario parlato ("alle venti e trenta")
- [ ] Anno MAI menzionato
- [ ] Nessuna parola in inglese

**Esito:** A volte e un po' troppo agressivo con la chiusura delle chiamate ovvero end_call, per questo test avevvo già una orenotazione con il numero da cui ho chiamato quindi non è riuscito a fare un altra. A riguardo del tool end_call secondo me dovrebbe fare in modo che quando il cliente fa capire che basta, l'assistente condlunde con una frase gentile e carina poi se il cliente dice Ciao, Arrivederci puo chiamare il tool, se invece il cliente ha altre domande continua la conversazione, se invece non sente nessuna risposta dopo l'ultimo messaggio di conclusione dopo qualche secondo chiude la chiamata.

**Risposte receptionist:**1.Ho verificato e siamo disponibili per sabato 21 febbraio alle 20.30. Posso procedere con la prenotazione per 4 persone a nome Giulia. - Cliente: ok... pronto?; 2.Hoverity verificato e siamo disponibili per sabato 21 febbraio alle 20.30. Posso procedere con la prenotazione per 4 persone a nome Giulia. - Cl: No va bene cosi. * Ha chiuso lui la chiamata

**Log tool chiamati (Vapi):**1.Resolve relative day; 2.Resolve relative time; 3.Check Openings:{"restaurant_id":"roma","day":"2026-02-21","day_label":"sabato 21 febbraio","closed":false,"requested_time":"20:30","time_human":"20 e 30","available":true,"reason":null,"nearest_slots_human":null,"max_people":8,"message":"Disponibile."}
4. Crete Booking: {"ok":false,"error_code":"DUPLICATE_BOOKING","error_message":"Esiste già una prenotazione per 2026-02-21 alle 20:30 con questo numero."}
5. End call

**Log tool chiamati (Render):**{"ts":"2026-02-19T17:41:52.156Z","level":"info","event":"api_request","request_id":"e062125e","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c76fe-3671-7bb5-83b2-bfe8f4badd23","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T17:41:52.157Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"e062125e","text":"sabato","date":"2026-02-21","day_label":"sabato 21 febbraio"}
{"ts":"2026-02-19T17:41:52.170Z","level":"info","event":"api_request","request_id":"6d9806ae","method":"POST","path":"/api/resolve_relative_time","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c76fe-3671-7bb5-83b2-bfe8f4badd23","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T17:41:52.171Z","level":"info","event":"resolve_relative_time_success","restaurant_id":"roma","source":"vapi","request_id":"6d9806ae","text":"20:30","ok":true,"time":"20:30"}
{"ts":"2026-02-19T17:41:53.375Z","level":"info","event":"api_request","request_id":"a922d9dd","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c76fe-3671-7bb5-83b2-bfe8f4badd23","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T17:41:53.925Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-21","requested_time":"20:30","in_openings":true,"slot_exists":true,"active_bookings_count":1,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"a922d9dd"}
{"ts":"2026-02-19T17:41:53.925Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-21","closed":false,"openings_count":14,"requested_time":"20:30","available":true,"reason":null,"source":"vapi","request_id":"a922d9dd"}
{"ts":"2026-02-19T17:42:14.984Z","level":"info","event":"api_request","request_id":"4a2d0c4d","method":"POST","path":"/api/create_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c76fe-3671-7bb5-83b2-bfe8f4badd23","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T17:42:15.264Z","level":"warn","event":"sheets_duplicate_booking_blocked","restaurant_id":"roma","day":"2026-02-21","time":"20:30","phone":"+39XXX...688","existing_booking_id":"440d677c-8474-4941-a30a-f5fd9f41c0f1"}
{"ts":"2026-02-19T17:42:15.264Z","level":"info","event":"create_booking_success","restaurant_id":"roma","day":"2026-02-21","time":"20:30","people":4,"phone":"+39XXX...688","source":"vapi","request_id":"4a2d0c4d"}

---

## Fase 3 — Flow completo

### 6. RA1 — Prenotazione semplice

**Cliente dice:** "Vorrei prenotare per domani alle 20 per 3 persone, nome Marco."

**Obiettivo:** Flow completo con v2.0. Verificare day_label corretto nella conferma.

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Esito:**

**Risposte receptionist:**Ha fatto la prenotazione correttamente.

**Log tool chiamati (Vapi):**1.Resolve Relative Day; 2.Resolve Relative Time; 3.Check openings:{"restaurant_id":"roma","day":"2026-02-20","day_label":"venerdì 20 febbraio","closed":false,"requested_time":"20:00","time_human":"20","available":true,"reason":null,"nearest_slots_human":null,"max_people":8,"message":"Disponibile."}
4.Create Booking: {"ok":true,"booking_id":"7c4eb9a0-1b75-4e3a-8cb2-ff4c55931a32","day":"2026-02-20","time":"20:00","people":3,"name":"Marco","phone":"+393492674688","notes":null,"event_id":"2l5998sklojedvpfemr5v4n178","day_label":"venerdì 20 febbraio","time_human":"20","message":"Prenotazione confermata per venerdì 20 febbraio alle 20, 3 persone a nome Marco."} 5.End Call


**Log tool chiamati (Render):**{"ts":"2026-02-19T18:01:35.682Z","level":"info","event":"api_request","request_id":"8c0cfac0","method":"POST","path":"/api/resolve_relative_time","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c7710-484a-7bbe-881b-e450548d9602","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T18:01:35.683Z","level":"info","event":"resolve_relative_time_success","restaurant_id":"roma","source":"vapi","request_id":"8c0cfac0","text":"20","ok":true,"time":"20:00"}
{"ts":"2026-02-19T18:01:35.685Z","level":"info","event":"api_request","request_id":"356211ed","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c7710-484a-7bbe-881b-e450548d9602","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T18:01:35.687Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"356211ed","text":"domani","date":"2026-02-20","day_label":"venerdì 20 febbraio"}
{"ts":"2026-02-19T18:01:36.809Z","level":"info","event":"api_request","request_id":"a1409663","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c7710-484a-7bbe-881b-e450548d9602","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T18:01:37.159Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-20","requested_time":"20:00","in_openings":true,"slot_exists":true,"active_bookings_count":0,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"a1409663"}
{"ts":"2026-02-19T18:01:37.159Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-20","closed":false,"openings_count":14,"requested_time":"20:00","available":true,"reason":null,"source":"vapi","request_id":"a1409663"}
{"ts":"2026-02-19T18:01:38.353Z","level":"info","event":"api_request","request_id":"21b1a468","method":"POST","path":"/api/create_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c7710-484a-7bbe-881b-e450548d9602","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
Menu
{"ts":"2026-02-19T18:01:40.383Z","level":"info","event":"sheets_write_booking_row","restaurant_id":"roma","sheet_id":"1MnaSIGqhieZVnxtnw_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":45,"booking_id":"7c4eb9a0-1b75-4e3a-8cb2-ff4c55931a32"}
{"ts":"2026-02-19T18:01:40.383Z","level":"info","event":"create_booking_success","restaurant_id":"roma","day":"2026-02-20","time":"20:00","people":3,"phone":"+39XXX...688","booking_id":"7c4eb9a0-1b75-4e3a-8cb2-ff4c55931a32","source":"vapi","request_id":"21b1a468"}

---

### 7. RA3 — Prenotazione giorno settimana

**Cliente dice:** "Avete posto giovedì prossimo per cena? Saremmo in 6, alle 21."

**Obiettivo:** resolve_relative_day("giovedì prossimo"), check_openings con expected_weekday, create_booking. day_label corretto.

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Esito:**

**Risposte receptionist:**(ha chiamato i primi 2 tool) 1.Sì, abbiamo disponibilità per giovedì 26 febbraio alle 21 per 6 persone. Posso procedere con la prenotazione. Mi conferma il suo nome e il numero di telefono? - Cliente:Sì mi chiamo Michele, il numero è 2 0 uno 9 0 5 3 2 uno.; (ha chiamato il terzo tool) 2.La prenotazione è confermata per giovedì 26 febbraio alle 21 per 6 persone a nome. Michele. Se bisogno di ulteriore assistenza, non esiti a chiedere. Buona serata, - Cliente: Va bene ciao;

**Log tool chiamati (Vapi):**1.Resolve Relative Day; 2.Check openings: {"restaurant_id":"roma","day":"2026-02-26","day_label":"giovedì 26 febbraio","closed":false,"requested_time":"21:00","time_human":"21","available":true,"reason":null,"nearest_slots_human":null,"max_people":8,"message":"Disponibile."}; 
3.Create Booking: {"ok":true,"booking_id":"9a021dc1-3881-48c1-bdf5-7f3c0d34032f","day":"2026-02-26","time":"21:00","people":6,"name":"Michele","phone":"+39200905321","notes":null,"event_id":"qpon5gcj04g6g2hdkpl5bsam4k","day_label":"giovedì 26 febbraio","time_human":"21","message":"Prenotazione confermata per giovedì 26 febbraio alle 21, 6 persone a nome Michele."} 4.End Call

**Log tool chiamati (Render):**{"ts":"2026-02-19T18:05:11.374Z","level":"info","event":"api_request","request_id":"6d15abdd","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c7713-99f2-7ff9-abdb-b91398da2473","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T18:05:11.375Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"6d15abdd","text":"giovedì prossimo","date":"2026-02-26","day_label":"giovedì 26 febbraio"}
{"ts":"2026-02-19T18:05:12.488Z","level":"info","event":"api_request","request_id":"c35fc4f5","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c7713-99f2-7ff9-abdb-b91398da2473","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T18:05:12.925Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-26","requested_time":"21:00","in_openings":true,"slot_exists":true,"active_bookings_count":0,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"c35fc4f5"}
{"ts":"2026-02-19T18:05:12.925Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-26","closed":false,"openings_count":8,"requested_time":"21:00","available":true,"reason":null,"source":"vapi","request_id":"c35fc4f5"}
{"ts":"2026-02-19T18:05:36.709Z","level":"info","event":"api_request","request_id":"225a4721","method":"POST","path":"/api/create_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c7713-99f2-7ff9-abdb-b91398da2473","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T18:05:38.562Z","level":"info","event":"sheets_write_booking_row","restaurant_id":"roma","sheet_id":"1MnaSIGqhieZVnxtnw_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":46,"booking_id":"9a021dc1-3881-48c1-bdf5-7f3c0d34032f"}
{"ts":"2026-02-19T18:05:38.562Z","level":"info","event":"create_booking_success","restaurant_id":"roma","day":"2026-02-26","time":"21:00","people":6,"phone":"+39XXX...321","booking_id":"9a021dc1-3881-48c1-bdf5-7f3c0d34032f","source":"vapi","request_id":"225a4721"}

---

### 8. RB4 — Max persone superato (>8)

**Cliente dice:** "Vorrei prenotare per venerdì alle 20 per 12 persone."

**Obiettivo:** max_people=8 dal backend. L'AI comunica il limite e propone handover se aperto.

**Tool attesi:** resolve_relative_day, check_openings (contiene max_people=8)

**Esito:**

**Risposte receptionist:**Cliente: Vorrei prenotare per venerdì alle 20; 1.Mi scusi, ma potrei sapere a che ora desideri desidera prenotare per venerdì. - Cliente:Alle 20.; 2.Il prossimo venerdì è il 20 febbraio. Posso procedere a controllare la disponibilità per le 20. - Cliente: si; 3.Mi dispiace, ma per le prenotazioni online il mass massimo è di 8 persone. Posso aiutarla a prenotare per un massimo di 8 persone o desidera un altro orario? - CL: No ciao..

**Log tool chiamati (Vapi):**1.Resolve Relative Day; 2.Check Openings: {"ok":false,"error_code":"WEEKDAY_MISMATCH","message":"La data 2026-02-24 è martedì 24 febbraio, non venerdì. Il prossimo venerdì è venerdì 20 febbraio.","corrected_day":"2026-02-20","corrected_day_label":"venerdì 20 febbraio"} 3.Check Openings:{"restaurant_id":"roma","day":"2026-02-20","day_label":"venerdì 20 febbraio","closed":false,"requested_time":"20:00","time_human":"20","available":true,"reason":null,"nearest_slots_human":null,"max_people":8,"message":"Disponibile."}
4. End Call

**Log tool chiamati (Render):**{"ts":"2026-02-19T18:14:08.748Z","level":"info","event":"api_request","request_id":"5b3a6898","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c771b-ab17-7ff3-900f-1e5540232f04","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T18:14:08.749Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"5b3a6898","text":"venerdì","date":"2026-02-20","day_label":"venerdì 20 febbraio"}
{"ts":"2026-02-19T18:14:08.754Z","level":"info","event":"api_request","request_id":"1cbd1d13","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c771b-ab17-7ff3-900f-1e5540232f04","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T18:14:08.754Z","level":"warn","event":"check_openings_weekday_mismatch","restaurant_id":"roma","day":"2026-02-24","time":"20:00","source":"vapi","request_id":"1cbd1d13","expected_weekday":"venerdì","actual_day_label":"martedì 24 febbraio","corrected_day":"2026-02-20","corrected_day_label":"venerdì 20 febbraio"}
{"ts":"2026-02-19T18:14:24.224Z","level":"info","event":"api_request","request_id":"ffe0f778","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c771b-ab17-7ff3-900f-1e5540232f04","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T18:14:24.693Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-20","requested_time":"20:00","in_openings":true,"slot_exists":true,"active_bookings_count":1,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"ffe0f778"}
{"ts":"2026-02-19T18:14:24.693Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-20","closed":false,"openings_count":14,"requested_time":"20:00","available":true,"reason":null,"source":"vapi","request_id":"ffe0f778"}

---

## Fase 4 — Modifica/Cancella/Lista

### 9. RC1 — Lista prenotazioni

**Precondizione:** Prenotazione creata nel test 6 (RA1).

**Cliente dice:** "Ho delle prenotazioni?"

**Obiettivo:** list_bookings → trova la prenotazione del test 6. day_label e time_human nella risposta.

**Tool attesi:** list_bookings

**Esito:**

**Risposte receptionist:**Cliente: Salve vorrei sapere se ho delle; 1.Non riesco a capire bene potrebbe ripetere vuole sapere se delle prenotazioni. - Cl:Sì giusto.; 2.Posso controllare le sue prenotazioni. Mi può fornire il numero di telefono con cui effettuato la prenotazione? - Cl: Questo da cui chiamo?; 3.Sì, userò questo numero....(ha chiamato list bookings) Procedo a controllare le sue prenotazioni. Un momento per favore....Ho trovato 3 prenotazioni, uno giovedì 19 febbraio alle ventuno:trenta per 2 persone a nome Mauro. 2, venerdì 20 febbraio alle 20 per 3 persone a nome Marco. 3, sabato 21 febbraio alle 20 30 per 4 persone a nome Giulia. Se bisogno di ulteriori informazioni o desidera modificare una prenotazione mi faccia sapere.
- Cliente: Va bene, allora no volevo sapere solo questo.

**Log tool chiamati (Vapi):**1. List Bookings: {"ok":true,"count":3,"message":"Trovate 3 prenotazioni: giovedì 19 febbraio alle 21:30 per 2 persone a nome Mauro; sabato 21 febbraio alle 20:30 per 4 persone a nome Giulia; venerdì 20 febbraio alle 20:00 per 3 persone a nome Marco.","results":[{"booking_id":"4d35fee9-9bb3-47fe-b65c-3f526539bd62","day":"2026-02-19","time":"21:30","people":2,"name":"Mauro","phone":"+393492674688","notes":null,"day_label":"giovedì 19 febbraio"},{"booking_id":"440d677c-8474-4941-a30a-f5fd9f41c0f1","day":"2026-02-21","time":"20:30","people":4,"name":"Giulia","phone":"+393492674688","notes":null,"day_label":"sabato 21 febbraio"},{"booking_id":"7c4eb9a0-1b75-4e3a-8cb2-ff4c55931a32","day":"2026-02-20","time":"20:00","people":3,"name":"Marco","phone":"+393492674688","notes":null,"day_label":"venerdì 20 febbraio"}]}

**Log tool chiamati (Render):**{"ts":"2026-02-19T18:18:55.100Z","level":"info","event":"api_request","request_id":"86613c58","method":"POST","path":"/api/list_bookings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c771f-da12-7aad-b64b-7f8da809ad60","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T18:18:55.444Z","level":"info","event":"list_bookings_success","restaurant_id":"roma","phone":"+39XXX...688","count":3,"booking_ids":["4d35fee9-9bb3-47fe-b65c-3f526539bd62","440d677c-8474-4941-a30a-f5fd9f41c0f1","7c4eb9a0-1b75-4e3a-8cb2-ff4c55931a32"],"source":"vapi","request_id":"86613c58"}

---

### 10. RD1 — Modifica orario

**Precondizione:** Prenotazione attiva dal test 6.

**Cliente dice:** "Posso spostare la prenotazione alle 21?"

**Obiettivo:** list_bookings → check_openings(21:00) → modify_booking. Conferma con day_label.

**Tool attesi:** list_bookings, check_openings, modify_booking

**Esito:**

**Risposte receptionist:**1.Per procedere con il cambio della prenotazione ho bisogno di verificare la sua prenotazione attuale Mi può confermare il numero di telefono telefono utilizzato per la prenotazione? - Cl: Si il numero di telefono è questo da cui chiamo, è la prenotazione per domani.; 2.Ho trovato 3 prenotazioni a nome Mauro. Quella per domani è alle 21.30. Vuole spostare questa prenotazione alle 21? - CL: Si; 3.La sua prenotazione è stata spostata con successo. Ora è per giovedì 19 febbraio alle 21. Grazie e buona serata! - Cl: Va bene, ciao.

**Log tool chiamati (Vapi):**1.List Bookings: {"ok":true,"count":3,"message":"Trovate 3 prenotazioni: giovedì 19 febbraio alle 21:30 per 2 persone a nome Mauro; sabato 21 febbraio alle 20:30 per 4 persone a nome Giulia; venerdì 20 febbraio alle 20:00 per 3 persone a nome Marco.","results":[{"booking_id":"4d35fee9-9bb3-47fe-b65c-3f526539bd62","day":"2026-02-19","time":"21:30","people":2,"name":"Mauro","phone":"+393492674688","notes":null,"day_label":"giovedì 19 febbraio"},{"booking_id":"440d677c-8474-4941-a30a-f5fd9f41c0f1","day":"2026-02-21","time":"20:30","people":4,"name":"Giulia","phone":"+393492674688","notes":null,"day_label":"sabato 21 febbraio"},{"booking_id":"7c4eb9a0-1b75-4e3a-8cb2-ff4c55931a32","day":"2026-02-20","time":"20:00","people":3,"name":"Marco","phone":"+393492674688","notes":null,"day_label":"venerdì 20 febbraio"}]} ; 2.Check Openings: {"restaurant_id":"roma","day":"2026-02-19","day_label":"giovedì 19 febbraio","closed":false,"requested_time":"21:00","time_human":"21","available":true,"reason":null,"nearest_slots_human":null,"max_people":8,"message":"Disponibile."}
3.Modify Booking:{"ok":true,"booking_id":"4d35fee9-9bb3-47fe-b65c-3f526539bd62","day":"2026-02-19","time":"21:00","people":2,"name":"Mauro","phone":"+393492674688","notes":"","day_label":"giovedì 19 febbraio","time_human":"21","message":"Prenotazione modificata: giovedì 19 febbraio alle 21."}
4. End Call

**Log tool chiamati (Render):**{"ts":"2026-02-19T18:24:24.644Z","level":"info","event":"api_request","request_id":"4aece11c","method":"POST","path":"/api/list_bookings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c7724-d4be-7338-ad7f-b8567c1b0c50","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T18:24:25.209Z","level":"info","event":"list_bookings_success","restaurant_id":"roma","phone":"+39XXX...688","count":3,"booking_ids":["4d35fee9-9bb3-47fe-b65c-3f526539bd62","440d677c-8474-4941-a30a-f5fd9f41c0f1","7c4eb9a0-1b75-4e3a-8cb2-ff4c55931a32"],"source":"vapi","request_id":"4aece11c"}
{"ts":"2026-02-19T18:24:38.141Z","level":"info","event":"api_request","request_id":"e392ebd0","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c7724-d4be-7338-ad7f-b8567c1b0c50","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T18:24:38.462Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-19","requested_time":"21:00","in_openings":true,"slot_exists":true,"active_bookings_count":2,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"e392ebd0"}
{"ts":"2026-02-19T18:24:38.462Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-19","closed":false,"openings_count":8,"requested_time":"21:00","available":true,"reason":null,"source":"vapi","request_id":"e392ebd0"}
{"ts":"2026-02-19T18:24:39.808Z","level":"info","event":"api_request","request_id":"fcd4f059","method":"POST","path":"/api/modify_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c7724-d4be-7338-ad7f-b8567c1b0c50","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
Menu
{"ts":"2026-02-19T18:24:41.301Z","level":"info","event":"modify_booking_success","restaurant_id":"roma","booking_id":"4d35fee9-9bb3-47fe-b65c-3f526539bd62","source":"vapi","request_id":"fcd4f059"}

---

### 11. RD3 — Modifica a giorno chiuso

**Cliente dice:** "Posso spostare la prenotazione a domenica?"

**Obiettivo:** check_openings(domenica) → closed=true + next_open_day. NON modifica. Propone lunedì.

**Tool attesi:** list_bookings, resolve_relative_day, check_openings

**Esito:**

**Risposte receptionist:**1.Ho trovato 3 prenotazioni a nome tuo. La prenotazione di domani, venerdì, 20 febbraio, è per 3 persone a nome Marco alle 20 Posso spostarla domenica 22 febbraio. Vuoi mantenere lo stesso orario o preferisci un'altra - Cl: Si, lo stesso orario; 2.Mi dispiace, ma il ristorante è chiuso domenica 22 febbraio. Riapriamo lunedì 23 febbraio con cena dalle 19 alle 22.30. Vuoi spostare la prenotazione a lunedì? - Cl: si va bene.; 3.La tua prenotazione è stata spostata con successo a lunedì 23 febbraio alle 20 Ti ringrazio e se hai bisogno di ulteriore assistenza non esitare a chiedere. - Cl: Va bene Ciao.;

**Log tool chiamati (Vapi):**1.Resolve Relative Day; 2. Resolve relative day; 3. List Bookings: {"ok":true,"count":3,"message":"Trovate 3 prenotazioni: giovedì 19 febbraio alle 21:00 per 2 persone a nome Mauro; sabato 21 febbraio alle 20:30 per 4 persone a nome Giulia; venerdì 20 febbraio alle 20:00 per 3 persone a nome Marco.","results":[{"booking_id":"4d35fee9-9bb3-47fe-b65c-3f526539bd62","day":"2026-02-19","time":"21:00","people":2,"name":"Mauro","phone":"+393492674688","notes":null,"day_label":"giovedì 19 febbraio"},{"booking_id":"440d677c-8474-4941-a30a-f5fd9f41c0f1","day":"2026-02-21","time":"20:30","people":4,"name":"Giulia","phone":"+393492674688","notes":null,"day_label":"sabato 21 febbraio"},{"booking_id":"7c4eb9a0-1b75-4e3a-8cb2-ff4c55931a32","day":"2026-02-20","time":"20:00","people":3,"name":"Marco","phone":"+393492674688","notes":null,"day_label":"venerdì 20 febbraio"}]};
4.Check Openings: {"restaurant_id":"roma","day":"2026-02-22","day_label":"domenica 22 febbraio","closed":true,"requested_time":"20:00","time_human":"20","available":false,"reason":"closed","nearest_slots_human":null,"max_people":8,"message":"Il ristorante è chiuso domenica. Il prossimo giorno di apertura è lunedì con cena dalle 19 alle 22 e 30.","next_open_day":"2026-02-23","next_open_day_label":"lunedì","next_open_ranges":{"lunch":null,"dinner":"19:00–22:30"}};
5.Modify Booking: {"ok":true,"booking_id":"7c4eb9a0-1b75-4e3a-8cb2-ff4c55931a32","day":"2026-02-23","time":"20:00","people":3,"name":"Marco","phone":"+393492674688","notes":"","day_label":"lunedì 23 febbraio","time_human":"20","message":"Prenotazione modificata: lunedì 23 febbraio alle 20."}
6.End Call

**Log tool chiamati (Render):**{"ts":"2026-02-19T18:30:47.536Z","level":"info","event":"api_request","request_id":"55bed123","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c772b-0c26-7ff9-abfe-90c4e914ff44","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T18:30:47.537Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"55bed123","text":"domani","date":"2026-02-20","day_label":"venerdì 20 febbraio"}
{"ts":"2026-02-19T18:30:48.570Z","level":"info","event":"api_request","request_id":"9ed7fbd5","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c772b-0c26-7ff9-abfe-90c4e914ff44","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T18:30:48.570Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"9ed7fbd5","text":"domenica","date":"2026-02-22","day_label":"domenica 22 febbraio"}
{"ts":"2026-02-19T18:30:49.612Z","level":"info","event":"api_request","request_id":"75ff57bf","method":"POST","path":"/api/list_bookings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c772b-0c26-7ff9-abfe-90c4e914ff44","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T18:30:50.094Z","level":"info","event":"list_bookings_success","restaurant_id":"roma","phone":"+39XXX...688","count":3,"booking_ids":["4d35fee9-9bb3-47fe-b65c-3f526539bd62","440d677c-8474-4941-a30a-f5fd9f41c0f1","7c4eb9a0-1b75-4e3a-8cb2-ff4c55931a32"],"source":"vapi","request_id":"75ff57bf"}
{"ts":"2026-02-19T18:31:15.444Z","level":"info","event":"api_request","request_id":"eefc5c60","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c772b-0c26-7ff9-abfe-90c4e914ff44","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T18:31:15.445Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-22","requested_time":"20:00","in_openings":false,"slot_exists":false,"active_bookings_count":null,"max_concurrent_bookings":null,"avg_stay_minutes":null,"available":false,"reason":"closed","nearest_slots_count":0,"source":"vapi","request_id":"eefc5c60"}
{"ts":"2026-02-19T18:31:15.445Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-22","closed":true,"openings_count":0,"requested_time":"20:00","available":false,"reason":"closed","source":"vapi","request_id":"eefc5c60"}
{"ts":"2026-02-19T18:31:54.084Z","level":"info","event":"api_request","request_id":"2adfea2d","method":"POST","path":"/api/modify_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c772b-0c26-7ff9-abfe-90c4e914ff44","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
Menu
{"ts":"2026-02-19T18:31:55.620Z","level":"info","event":"modify_booking_success","restaurant_id":"roma","booking_id":"7c4eb9a0-1b75-4e3a-8cb2-ff4c55931a32","source":"vapi","request_id":"2adfea2d"

---

### 12. RE1 — Cancellazione

**Precondizione:** Prenotazione attiva dal test 6/10.

**Cliente dice:** "Vorrei cancellare la mia prenotazione."

**Obiettivo:** list_bookings → cancel_booking. Verifica rimozione da Sheets e Calendar.

**Tool attesi:** list_bookings, cancel_booking

**Esito:**perché a volte end call è troppo rigido ma in questo caso non ha capito che è la fine della conversazione alla fine?

**Risposte receptionist:**Cl: Salve vorrei cancellare la mia prenotazione di lunedì.; 1.Ho trovato 3 prenotazioni a nome suo. Quella di lunedì e per il 23 febbraio alle 20 a nome Marco. Posso procedere con la cancellazione di questa prenotazione. - Cl: Si.; 2.La prenotazione di lunedì 23 febbraio alle 20 è stata cancellata con su successo. Posso aiutarla con qualcos'altro? - Cl: No grazie ciao; 3.Ciao, buona serata. - Ciao.; 4.Ciao, come posso aiutarla oggi?

**Log tool chiamati (Vapi):**1.List Bookings: {"ok":true,"count":3,"message":"Trovate 3 prenotazioni: giovedì 19 febbraio alle 21:00 per 2 persone a nome Mauro; sabato 21 febbraio alle 20:30 per 4 persone a nome Giulia; lunedì 23 febbraio alle 20:00 per 3 persone a nome Marco.","results":[{"booking_id":"4d35fee9-9bb3-47fe-b65c-3f526539bd62","day":"2026-02-19","time":"21:00","people":2,"name":"Mauro","phone":"+393492674688","notes":null,"day_label":"giovedì 19 febbraio"},{"booking_id":"440d677c-8474-4941-a30a-f5fd9f41c0f1","day":"2026-02-21","time":"20:30","people":4,"name":"Giulia","phone":"+393492674688","notes":null,"day_label":"sabato 21 febbraio"},{"booking_id":"7c4eb9a0-1b75-4e3a-8cb2-ff4c55931a32","day":"2026-02-23","time":"20:00","people":3,"name":"Marco","phone":"+393492674688","notes":null,"day_label":"lunedì 23 febbraio"}]} ; 
2.Cancel Booking;

**Log tool chiamati (Render):**{"ts":"2026-02-19T18:37:54.073Z","level":"info","event":"api_request","request_id":"495cbefc","method":"POST","path":"/api/list_bookings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c7731-9303-799a-98d6-03fd94c305c5","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T18:37:54.496Z","level":"info","event":"list_bookings_success","restaurant_id":"roma","phone":"+39XXX...688","count":3,"booking_ids":["4d35fee9-9bb3-47fe-b65c-3f526539bd62","440d677c-8474-4941-a30a-f5fd9f41c0f1","7c4eb9a0-1b75-4e3a-8cb2-ff4c55931a32"],"source":"vapi","request_id":"495cbefc"}
{"ts":"2026-02-19T18:38:12.162Z","level":"info","event":"api_request","request_id":"e3bdacb6","method":"POST","path":"/api/cancel_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c7731-9303-799a-98d6-03fd94c305c5","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T18:38:13.522Z","level":"info","event":"sheets_delete_booking_row","restaurant_id":"roma","sheet_id":"1MnaSIGqhieZVnxtnw_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":10,"booking_id":"7c4eb9a0-1b75-4e3a-8cb2-ff4c55931a32"}
{"ts":"2026-02-19T18:38:13.522Z","level":"info","event":"cancel_booking_success","restaurant_id":"roma","booking_id":"7c4eb9a0-1b75-4e3a-8cb2-ff4c55931a32","source":"vapi","request_id":"e3bdacb6"}

---

## Fase 5 — Edge cases + Handover

### 13. RH3 — Conferma ambigua

**Contesto:** Chiedi prenotazione alle 16 oggi (fuori orario), poi rispondi "sì va bene" senza specificare orario.

**Cliente dice:** "Vorrei prenotare per oggi alle 16 per 2 persone." → [AI propone slot] → "Sì va bene allora."

**Obiettivo:** NON assume un orario. Chiede "Preferisce alle X o alle Y?"

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**

**Risposte receptionist:**Cl: Salve voglio fare una prenotazione per domani alle 16.; 1.Mi dispiace, ma l'orario delle 16 non è disponibile per prenotazioni. Gli orari più vicini sono alle 14 e alle 13.30. Quale di questi orari preferisce? - Cl: Si va bene; 2.Quale orario preferisce tra le 14 e le 1000 point tre-zero? - Cl:le 14.; 3.Posso avere il suo nome e il numero di telefono per completare la prenotazione per domani alle 14? - Cl: Certo mi chiamo Luca.; 4.E per il numero di telefono posso usare il numero che chiamato. - Cl: Certo; 5.La prenotazione è stata confermata per venerdì 20 febbraio alle 4 quattordici:zero. Per una persona nome Luca. Grazie e buona giornata. - Cl: Grazie ciao;

**Log tool chiamati (Vapi):**1.Resolve Relative Day; 2.Resolve Relative time; 3. Check Openings: {"restaurant_id":"roma","day":"2026-02-20","day_label":"venerdì 20 febbraio","closed":false,"requested_time":"16:00","time_human":"16","available":false,"reason":"not_in_openings","nearest_slots_human":["14","13 e 30"],"max_people":8,"message":"Questo orario non è disponibile per prenotazioni. Orari più vicini: 14, 13 e 30."} 4.Create Booking: {"ok":true,"booking_id":"1313ced9-25d9-4fed-98da-44556db7606d","day":"2026-02-20","time":"14:00","people":1,"name":"Luca","phone":"+393492674688","notes":null,"event_id":"fmlr70euivjc5cpb6lh0qk4m78","day_label":"venerdì 20 febbraio","time_human":"14","message":"Prenotazione confermata per venerdì 20 febbraio alle 14, 1 persona a nome Luca."}; 5.End Call

**Log tool chiamati (Render):**{"ts":"2026-02-19T18:41:53.386Z","level":"info","event":"api_request","request_id":"17a5075b","method":"POST","path":"/api/resolve_relative_time","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c7735-37fa-7cc5-9733-4e27eeecdec6","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T18:41:53.386Z","level":"info","event":"resolve_relative_time_success","restaurant_id":"roma","source":"vapi","request_id":"17a5075b","text":"16","ok":true,"time":"16:00"}
{"ts":"2026-02-19T18:41:53.407Z","level":"info","event":"api_request","request_id":"adef4d26","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c7735-37fa-7cc5-9733-4e27eeecdec6","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T18:41:53.408Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"adef4d26","text":"domani","date":"2026-02-20","day_label":"venerdì 20 febbraio"}
{"ts":"2026-02-19T18:41:54.773Z","level":"info","event":"api_request","request_id":"830bf4cb","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c7735-37fa-7cc5-9733-4e27eeecdec6","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T18:41:55.124Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-20","requested_time":"16:00","in_openings":false,"slot_exists":false,"active_bookings_count":null,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":false,"reason":"not_in_openings","nearest_slots_count":2,"source":"vapi","request_id":"830bf4cb"}
{"ts":"2026-02-19T18:41:55.124Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-20","closed":false,"openings_count":14,"requested_time":"16:00","available":false,"reason":"not_in_openings","source":"vapi","request_id":"830bf4cb"}
{"ts":"2026-02-19T18:42:44.696Z","level":"info","event":"api_request","request_id":"5851f7fd","method":"POST","path":"/api/create_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c7735-37fa-7cc5-9733-4e27eeecdec6","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T18:42:46.364Z","level":"info","event":"sheets_write_booking_row","restaurant_id":"roma","sheet_id":"1MnaSIGqhieZVnxtnw_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":11,"booking_id":"1313ced9-25d9-4fed-98da-44556db7606d"}
{"ts":"2026-02-19T18:42:46.364Z","level":"info","event":"create_booking_success","restaurant_id":"roma","day":"2026-02-20","time":"14:00","people":1,"phone":"+39XXX...688","booking_id":"1313ced9-25d9-4fed-98da-44556db7606d","source":"vapi","request_id":"5851f7fd"}

---

### 14. RG1 — Siete aperti adesso?

**Cliente dice:** "Siete aperti adesso?"

**Obiettivo:** is_open_now → risposta corretta senza avviare prenotazione.

**Tool attesi:** is_open_now

**Esito:** in questo test mi è venuto in mente una cosa anche se non c'entra nulla con il test, negli file faq dobbiamo aggiungere anche una domanda/risposta di tipo quando tempo prima bisogna prenotare della ver prenotazione. E invece noi abbiamo una regola del genere per il sistema perché non mi ricordo? Secondo te ci sono anche altre cose necessarie da aggiungere nei file faq che inseriamo su vapi nella knowledge base di ogni assistente?

**Risposte receptionist:**1.Sì, siamo aperti adesso. Come posso assisterla? - Cl: Vorrei sapere delle cose prima di prenotare...

**Log tool chiamati (Vapi):**1. Is Open Now

**Log tool chiamati (Render):**{"ts":"2026-02-19T18:46:40.512Z","level":"info","event":"api_request","request_id":"2d6b7a10","method":"POST","path":"/api/is_open_now","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c7739-a5e8-7cc5-9738-2574de3e6461","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T18:46:40.513Z","level":"info","event":"is_open_now","restaurant_id":"roma","aperto_ora":true,"prossima_apertura":null}

---

### 15. RJ1/RJ2 — Handover

**Cliente dice:** "Vorrei parlare con qualcuno del ristorante."

**Obiettivo:** is_open_now → se aperto: transfer. Se chiuso: dice chiuso + offre aiuto AI.

**Tool attesi:** is_open_now, (transfer_call_tool_roma se aperto)

**Esito:**

**Risposte receptionist:**1.Un attimo, la metto in contatto con il ristorante.

**Log tool chiamati (Vapi):**1. Is Open Now; 2.Transfer Call Tool Roma

**Log tool chiamati (Render):**{"ts":"2026-02-19T18:50:32.364Z","level":"info","event":"api_request","request_id":"78a98340","method":"POST","path":"/api/is_open_now","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c773d-1eed-7009-a779-8371d516296a","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T18:50:32.364Z","level":"info","event":"is_open_now","restaurant_id":"roma","aperto_ora":true,"prossima_apertura":null}

---

## Riepilogo Test V2.0

| # | Test | Descrizione | Esito V2.0 | Note |
|---|------|-------------|------------|------|
| 1 | RG3 | Domenica chiuso | PASS | Backend+AI perfetti. closed=true, next_open_day lunedì |
| 2 | RB5 | Cutoff 22:30 | PASS | Cutoff rilevato, slot alternativi proposti. WEEKDAY_MISMATCH corretto. endCall lento dopo saluto |
| 3 | RB1 | Giorno chiuso + prenotazione | PASS | NON ha creato prenotazione, proposto lunedì correttamente |
| 4 | RG2 | Orari venerdì pronuncia | PASS con difetto | AI riformula "12.30" invece di usare "12 e 30" dal message. Ripetuto "20 febbraio" 2 volte |
| 5 | RH2 | Conferma italiano | PARZIALE | Disrupted da DUPLICATE_BOOKING pre-esistente. endCall troppo aggressivo |
| 6 | RA1 | Prenotazione semplice | PASS | Flow perfetto, day_label e time_human corretti |
| 7 | RA3 | Prenotazione giorno settimana | PASS | "giovedì prossimo" risolto, prenotazione creata correttamente |
| 8 | RB4 | Max persone >8 | PASS | AI ha comunicato limite 8 persone. WEEKDAY_MISMATCH corretto dal backend |
| 9 | RC1 | Lista prenotazioni | PASS con difetto | TTS "ventuno:trenta" — list_bookings message usava HH:MM (FIXATO) |
| 10 | RD1 | Modifica orario | PASS | list→check→modify flow perfetto |
| 11 | RD3 | Modifica a giorno chiuso | PASS | Proposto lunedì dopo closed=true, modificato dopo conferma |
| 12 | RE1 | Cancellazione | PASS con difetto | Cancellazione OK. endCall non attivato dopo "Ciao" (FIXATO in prompt) |
| 13 | RH3 | Conferma ambigua | PASS con difetti | Ha chiesto quale slot (OK). TTS "1000 point tre-zero" per 13:30. Persone perse (1 invece di 2) |
| 14 | RG1 | Siete aperti? | PASS | Perfetto |
| 15 | RJ1/RJ2 | Handover | PASS | Transfer immediato quando aperto |

**Totale: 15 test V2.0**
**Passati: 12/15 (PASS puliti o con difetti minori)**
**Parziali: 1/15**
**Con difetti importanti: 2/15 (Test 4 TTS, Test 13 persone perse)**

### Fix applicati dopo V2.0:
1. **list_bookings** — aggiunto `formatTimeHuman` al campo `message` e `time_human` a ogni risultato (fix Test 9)
2. **Prompt** — regola MESSAGE: usare il testo del campo `message` così com'è, non riformulare orari (fix Test 4, 13)
3. **Prompt** — regola TIME_HUMAN: usare `time_human` e `nearest_slots_human` per dire gli orari (fix Test 13)
4. **Prompt** — regola END CALL: dopo saluto del cliente, salutare e chiamare endCall nella stessa risposta (fix Test 2, 12)
5. **Prompt** — regola CONSERVAZIONE DATI: non perdere dati già comunicati durante alternative (fix Test 13)
6. **Logging** — fix `create_booking`, `modify_booking`, `cancel_booking`: log `_success` solo se `ok:true`, aggiunto `_rejected` (warn) per errori business (DUPLICATE_BOOKING, SLOT_FULL, ecc.)

---

# RE-TEST V2.1 — Prompt v2.1 + Backend v2.1 (fix logging)

**Data:** ___/02/2026
**Backend su Render:** v2.1 (list_bookings time_human + fix logging)
**Prompt su Vapi:** v2.1 (endCall rinforzato, CONSERVAZIONE DATI, REGOLA MESSAGE/TIME_HUMAN)
**Regression test locale:** 230/230 PASS

---

## Fase 1 — Re-test critici (fix V2.0 → V2.1)

### 16. RG2-v2 — Orari venerdì pronuncia (re-test Test 4)

**Contesto:** Nel test V2.0 l'AI riformulava "12 e 30" in "12.30" e ripeteva "20 febbraio" due volte.

**Cliente dice:** "Siete aperti venerdì?"

**Obiettivo:** check_openings → AI usa il campo `message` così com'è. TTS deve dire "12 e 30" NON "12.30" o "12:30".

**Cosa verificare:**
- [ ] AI usa il testo del `message` senza riformulare orari
- [ ] TTS pronuncia correttamente "12 e 30" (non "12.30", non "twelve point thirty")
- [ ] day_label usato correttamente
- [ ] Nessuna ripetizione inutile della data

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**

**Risposte receptionist:**1.Siamo aperti venerdì 20 febbraio. Gli orari di apertura sono pranzo dalle 12.30 alle 14.30 e cena dalle 19 alle 23. Posso aiutarla con una prenotazione? - Cl: No volevo sapere solo questo, grazie.; 2.Prego. Se bisogno di ulteriore aiuto non esiti a contattarmi. Arrivederci - Cl: Ok buona giornata.;

**Log tool chiamati (Vapi):**1.Resolve Relative Day; 2.Check Openings:{"restaurant_id":"roma","day":"2026-02-20","day_label":"venerdì 20 febbraio","closed":false,"requested_time":null,"time_human":null,"available":null,"reason":null,"nearest_slots_human":null,"max_people":8,"message":"Orari di apertura: pranzo dalle 12 e 30 alle 14 e 30 e cena dalle 19 alle 23."} ; 3.End Call

**Log tool chiamati (Render):**{"ts":"2026-02-19T21:10:53.014Z","level":"info","event":"api_request","request_id":"70c38d8b","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c77bd-ae9c-799d-8142-7d1a342eb8c0","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T21:10:53.194Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"70c38d8b","text":"venerdì","date":"2026-02-20","day_label":"venerdì 20 febbraio"}
{"ts":"2026-02-19T21:10:54.394Z","level":"info","event":"api_request","request_id":"0303a5eb","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c77bd-ae9c-799d-8142-7d1a342eb8c0","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T21:10:54.400Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-20","closed":false,"openings_count":14,"requested_time":null,"available":null,"reason":null,"source":"vapi","request_id":"0303a5eb"}

---

### 17. RH2-v2 — Prenotazione flusso completo (re-test Test 5)

**Contesto:** Nel test V2.0 il flusso era stato interrotto da un DUPLICATE_BOOKING (comportamento corretto — c'era una prenotazione pre-esistente con gli stessi dati). Non era un bug del backend. L'unico difetto era l'endCall troppo aggressivo, già coperto dal test 19.

**Cliente dice:** "Vorrei prenotare per domani alle 20 per 2 persone, mi chiamo Marco."

**Obiettivo:** Flusso prenotazione completo e pulito. Verificare che conferma, message e endCall funzionino in un flusso standard senza interferenze.

**Cosa verificare:**
- [ ] Flusso completo senza interruzioni (nessuna prenotazione pre-esistente con stessi dati)
- [ ] Conferma usa `message` dal tool (formato parlato)
- [ ] endCall solo dopo che il cliente saluta
- [ ] day_label e time_human corretti nella conferma

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Esito:**HO rifatto il test comunque però usando un altro numero

**Risposte receptionist:**1.Ho verificato e siamo disponibili per domani venerdì 20 febbraio, alle 20 Per confermare la prenotazione, mi conferma il numero di telefono? - Cl: Si il mio numero è 2 0 2 6 0 2 uno 9 2 uno.; 2.Userò il numero più 39200 2 6 0 2 uno 9 2 Procediamo con la prenotazione per 2 persone a nome Marco. Confermo? - Cl: Si, giusto; 3.La prenotazione è confermata per venerdì 20 febbraio alle 20 per 2 persone a nome Marco. Grazie e buona serata. - Cl: Va bene ciao.;

**Log tool chiamati (Vapi):**1.Resolve Relative Day; 2.Check openings: {"restaurant_id":"roma","day":"2026-02-20","day_label":"venerdì 20 febbraio","closed":false,"requested_time":"20:00","time_human":"20","available":true,"reason":null,"nearest_slots_human":null,"max_people":8,"message":"Disponibile."} ; 3.Create Booking: {"ok":true,"booking_id":"fb04f498-e16f-4bf7-9eab-5cd286e17268","day":"2026-02-20","time":"20:00","people":2,"name":"Marco","phone":"+392026021921","notes":null,"event_id":"fta33b9ueho7s2chd12g4b11qs","day_label":"venerdì 20 febbraio","time_human":"20","message":"Prenotazione confermata per venerdì 20 febbraio alle 20, 2 persone a nome Marco."} : 4.End Call

**Log tool chiamati (Render):**{"ts":"2026-02-19T21:18:23.101Z","level":"info","event":"api_request","request_id":"31a06bad","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c77c4-7e60-7993-92ce-1a647cd2cee1","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T21:18:23.103Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"31a06bad","text":"domani","date":"2026-02-20","day_label":"venerdì 20 febbraio"}
{"ts":"2026-02-19T21:18:24.505Z","level":"info","event":"api_request","request_id":"fbd2d0c6","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c77c4-7e60-7993-92ce-1a647cd2cee1","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T21:18:25.698Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-20","requested_time":"20:00","in_openings":true,"slot_exists":true,"active_bookings_count":0,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"fbd2d0c6"}
{"ts":"2026-02-19T21:18:25.698Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-20","closed":false,"openings_count":14,"requested_time":"20:00","available":true,"reason":null,"source":"vapi","request_id":"fbd2d0c6"}
{"ts":"2026-02-19T21:19:03.566Z","level":"info","event":"api_request","request_id":"b3259c05","method":"POST","path":"/api/create_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c77c4-7e60-7993-92ce-1a647cd2cee1","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T21:19:06.795Z","level":"info","event":"sheets_write_booking_row","restaurant_id":"roma","sheet_id":"1MnaSIGqhieZVnxtnw_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":12,"booking_id":"fb04f498-e16f-4bf7-9eab-5cd286e17268"}
{"ts":"2026-02-19T21:19:06.795Z","level":"info","event":"create_booking_success","restaurant_id":"roma","day":"2026-02-20","time":"20:00","people":2,"phone":"+39XXX...921","booking_id":"fb04f498-e16f-4bf7-9eab-5cd286e17268","source":"vapi","request_id":"b3259c05"}

---

### 18. RC1-v2 — Lista prenotazioni TTS (re-test Test 9)

**Precondizione:** Almeno 2 prenotazioni attive per il numero di test.

**Cliente dice:** "Vorrei sapere le mie prenotazioni."

**Obiettivo:** list_bookings → AI legge il `message`. TTS deve dire "21 e 30" NON "ventuno:trenta".

**Cosa verificare:**
- [ ] Campo `message` nel log Vapi contiene orari in formato parlato ("21 e 30" non "21:30")
- [ ] Ogni prenotazione ha `time_human` nel payload
- [ ] TTS pronuncia correttamente gli orari
- [ ] AI usa `message` come base, non riformula

**Tool attesi:** list_bookings

**Esito:**Qui ha scritto 20.30 però nella chiamata ha letto bene, però dopo tutto quello che abbiamo fatto perché ancora con il punto?

**Risposte receptionist:**1.Posso aiutarla a controllare le sue prenotazioni. Mi può fornire il numero di telefono utilizzato per la prenotazione? - Cl: Sì il numero è 3 4 9 2 6 7 4 6 8 8.; 2.Ho trovato 3 prenotazioni a nome suo. Uno giovedì 19 febbraio alle 21 per 2 persone a nome Mauro. 2 venerdì 20 febbraio alle 14 per uno persona a nome Luca. 3. Sabato 21 febbraio alle 20.30 per 4 persone a nome Giulia. Se bisogno di ulteriori informazioni o desidera modificare una prenotazione mi faccia sapere. - Cl: No volevo sapere solo questo ciao.; 4.Arrivederci...

**Log tool chiamati (Vapi):**1.List Bookings: {"ok":true,"count":3,"message":"Trovate 3 prenotazioni: giovedì 19 febbraio alle 21 per 2 persone a nome Mauro; sabato 21 febbraio alle 20 e 30 per 4 persone a nome Giulia; venerdì 20 febbraio alle 14 per 1 persona a nome Luca.","results":[{"booking_id":"4d35fee9-9bb3-47fe-b65c-3f526539bd62","day":"2026-02-19","time":"21:00","people":2,"name":"Mauro","phone":"+393492674688","notes":null,"day_label":"giovedì 19 febbraio","time_human":"21"},{"booking_id":"440d677c-8474-4941-a30a-f5fd9f41c0f1","day":"2026-02-21","time":"20:30","people":4,"name":"Giulia","phone":"+393492674688","notes":null,"day_label":"sabato 21 febbraio","time_human":"20 e 30"},{"booking_id":"1313ced9-25d9-4fed-98da-44556db7606d","day":"2026-02-20","time":"14:00","people":1,"name":"Luca","phone":"+393492674688","notes":null,"day_label":"venerdì 20 febbraio","time_human":"14"}]} ; 2.End Call

**Log tool chiamati (Render):**{"ts":"2026-02-19T21:27:34.525Z","level":"info","event":"api_request","request_id":"ce4af99a","method":"POST","path":"/api/list_bookings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c77cc-b274-7333-88bf-5c5ca3e04a99","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T21:27:35.405Z","level":"info","event":"list_bookings_success","restaurant_id":"roma","phone":"+39XXX...688","count":3,"booking_ids":["4d35fee9-9bb3-47fe-b65c-3f526539bd62","440d677c-8474-4941-a30a-f5fd9f41c0f1","1313ced9-25d9-4fed-98da-44556db7606d"],"source":"vapi","request_id":"ce4af99a"}

---

### 19. RE1-v2 — Cancellazione + endCall (re-test Test 12)

**Precondizione:** Prenotazione attiva per il numero di test.

**Cliente dice:** "Vorrei cancellare la mia prenotazione."

**Obiettivo:** list_bookings → cancel_booking. Dopo conferma, il cliente dice "Grazie, ciao" → AI saluta e chiama endCall nella stessa risposta. NON deve dire "Come posso aiutarla?".

**Cosa verificare:**
- [ ] Cancellazione completata correttamente
- [ ] Dopo "ciao" del cliente: AI saluta + endCall nella stessa risposta
- [ ] Nessun "Come posso aiutarla?" dopo il saluto
- [ ] Se il cliente dice "ciao" una seconda volta: endCall immediato senza testo

**Tool attesi:** list_bookings, cancel_booking, end_call

**Esito:**Anche se non ha capito il numero correttamente dal primo tentativo per il resto secondo me è andato bene.

**Risposte receptionist:**1.Posso aiutarla con questo. Mi può fornire il numero di telefono telefono con cui effettuato la prenotazione? - Cliente: Sì, il numero è 2 0 2 6 0 2000 921.; 2.Non trovo prenotazioni associate a questo numero di telefono. Mi può confermare il numero usato o indicarmi il giorno della prenotazione? - Cliente: Sì il numero è 2 0 2 60 21 921. ; 3.Ho trovato una prenotazione venerdì 20 febbraio alle 20 per 2 persone a nome Marco. Vuole procedere con la cancellazione? - Cl:Sì,; 4.La prenotazione è stata cancellata con successo. Se bisogno di ulteriore assistenza, non esiti a chiedere. - Cl: Va bene ciao.;

**Log tool chiamati (Vapi):**1.List Bookings: {"ok":true,"count":0,"message":"Nessuna prenotazione trovata per questo numero di telefono.","results":[]}; 2.List Bookings: {"ok":true,"count":1,"message":"Trovata 1 prenotazione: venerdì 20 febbraio alle 20 per 2 persone a nome Marco.","results":[{"booking_id":"fb04f498-e16f-4bf7-9eab-5cd286e17268","day":"2026-02-20","time":"20:00","people":2,"name":"Marco","phone":"+392026021921","notes":null,"day_label":"venerdì 20 febbraio","time_human":"20"}]} ; 3.Cancel Booking;

**Log tool chiamati (Render):**{"ts":"2026-02-19T21:44:01.356Z","level":"info","event":"api_request","request_id":"dd0d08ab","method":"POST","path":"/api/list_bookings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c77db-ce1e-7009-8f04-16d9ef46ec82","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T21:44:01.819Z","level":"info","event":"list_bookings_success","restaurant_id":"roma","phone":"+39XXX...000","count":0,"booking_ids":[],"source":"vapi","request_id":"dd0d08ab"}
{"ts":"2026-02-19T21:44:21.298Z","level":"info","event":"api_request","request_id":"a4f8c1a5","method":"POST","path":"/api/list_bookings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c77db-ce1e-7009-8f04-16d9ef46ec82","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T21:44:21.590Z","level":"info","event":"list_bookings_success","restaurant_id":"roma","phone":"+39XXX...921","count":1,"booking_ids":["fb04f498-e16f-4bf7-9eab-5cd286e17268"],"source":"vapi","request_id":"a4f8c1a5"}
{"ts":"2026-02-19T21:44:37.638Z","level":"info","event":"api_request","request_id":"6b9a6712","method":"POST","path":"/api/cancel_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c77db-ce1e-7009-8f04-16d9ef46ec82","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T21:44:39.943Z","level":"info","event":"sheets_delete_booking_row","restaurant_id":"roma","sheet_id":"1MnaSIGqhieZVnxtnw_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":12,"booking_id":"fb04f498-e16f-4bf7-9eab-5cd286e17268"}
{"ts":"2026-02-19T21:44:39.943Z","level":"info","event":"cancel_booking_success","restaurant_id":"roma","booking_id":"fb04f498-e16f-4bf7-9eab-5cd286e17268","source":"vapi","request_id":"6b9a6712"}

---

### 20. RH3-v2 — Conferma ambigua + persone conservate (re-test Test 13)

**Contesto:** Nel test V2.0 le persone venivano perse (1 invece di 2) e TTS diceva "1000 point tre-zero" per "13 e 30".

**Cliente dice:** "Vorrei prenotare per domani alle 16 per 2 persone." → [AI propone slot] → "Sì va bene allora."

**Obiettivo:** check_openings → available=false → propone nearest_slots_human. Quando il cliente dice "sì va bene" senza specificare → AI chiede quale slot. Dopo scelta, la prenotazione deve essere per 2 persone (non 1).

**Cosa verificare:**
- [ ] AI chiede "quale orario preferisce?" quando cliente dice "sì va bene"
- [ ] TTS pronuncia correttamente gli slot (es. "13 e 30" non "1000 point tre-zero")
- [ ] Prenotazione creata per 2 persone (CONSERVAZIONE DATI)
- [ ] `nearest_slots_human` nel payload Vapi in formato parlato

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Esito:**

**Risposte receptionist:**1.Mi dispiace, l'orario delle 16 non è disponibile per prenotazioni. Gli orari più vicini sono alle 14 e alle 13.30. Quale di questi preferisce? -Cl: Sì va bene allora.; 2.Quale orario preferisce tra le 14 e le 13.30? - Cl: Le 12.30.; 3.Posso avere il suo nome per favore? - Cl: Sì mi chiamo Maro.; 4.Perfetto, Maro. E per il numero di telefono userò il numero che chiamato, va bene? - Cl: No meglio se usa questo.; 5.Mi fornisca il nuovo numero di telefono, per favore.; 6.La prenotazione è confermata per venerdì 20 febbraio alle tredici:trenta per 2 persone a nome Maro. Se bisogno di ulteriore assistenza, non esiti a chiedere...

**Log tool chiamati (Vapi):**1.Resolve Relative Day; 2.Check Openings: {"restaurant_id":"roma","day":"2026-02-20","day_label":"venerdì 20 febbraio","closed":false,"requested_time":"16:00","time_human":"16","available":false,"reason":"not_in_openings","nearest_slots_human":["14","13 e 30"],"max_people":8,"message":"Questo orario non è disponibile per prenotazioni. Orari più vicini: 14, 13 e 30."} 
3.Create Booking: {"ok":true,"booking_id":"947c588f-d8cf-4fdf-95fa-3ff487566cd3","day":"2026-02-20","time":"13:30","people":2,"name":"Maro","phone":"+392674886","notes":null,"event_id":"birdf6cul3mi4d88q7d1vcvd9o","day_label":"venerdì 20 febbraio","time_human":"13 e 30","message":"Prenotazione confermata per venerdì 20 febbraio alle 13 e 30, 2 persone a nome Maro."};

**Log tool chiamati (Render):**{"ts":"2026-02-19T21:49:21.564Z","level":"info","event":"api_request","request_id":"111674ef","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c77e0-dd90-7cc5-8c75-d2394dc0c3bf","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T21:49:21.565Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"111674ef","text":"domani","date":"2026-02-20","day_label":"venerdì 20 febbraio"}
{"ts":"2026-02-19T21:49:22.870Z","level":"info","event":"api_request","request_id":"2d57c3a5","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c77e0-dd90-7cc5-8c75-d2394dc0c3bf","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T21:49:24.010Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-20","requested_time":"16:00","in_openings":false,"slot_exists":false,"active_bookings_count":null,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":false,"reason":"not_in_openings","nearest_slots_count":2,"source":"vapi","request_id":"2d57c3a5"}
{"ts":"2026-02-19T21:49:24.010Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-20","closed":false,"openings_count":14,"requested_time":"16:00","available":false,"reason":"not_in_openings","source":"vapi","request_id":"2d57c3a5"}
{"ts":"2026-02-19T21:50:17.889Z","level":"info","event":"api_request","request_id":"4c47a320","method":"POST","path":"/api/create_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c77e0-dd90-7cc5-8c75-d2394dc0c3bf","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T21:50:20.516Z","level":"info","event":"sheets_write_booking_row","restaurant_id":"roma","sheet_id":"1MnaSIGqhieZVnxtnw_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":12,"booking_id":"947c588f-d8cf-4fdf-95fa-3ff487566cd3"}
{"ts":"2026-02-19T21:50:20.516Z","level":"info","event":"create_booking_success","restaurant_id":"roma","day":"2026-02-20","time":"13:30","people":2,"phone":"+39XXX...886","booking_id":"947c588f-d8cf-4fdf-95fa-3ff487566cd3","source":"vapi","request_id":"4c47a320"}

---

### 21. RH1-v2 — DUPLICATE_BOOKING (test aggiuntivo)

**Precondizione:** Creare una prenotazione per domani alle 20 con il numero di test.

**Cliente dice:** "Vorrei prenotare per domani alle 20 per 2 persone, a nome Marco." (stessi dati della prenotazione esistente)

**Obiettivo:** create_booking → DUPLICATE_BOOKING. AI dice "Risulta già una prenotazione con questi dati. Desidera modificarla?"

**Cosa verificare:**
- [ ] Backend restituisce DUPLICATE_BOOKING (non success)
- [ ] AI comunica il duplicato al cliente senza errori tecnici
- [ ] Log Render mostra `create_booking_rejected` con `error_code: DUPLICATE_BOOKING` (NON `create_booking_success`)
- [ ] Metriche corrette (nessun falso positivo)

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Esito:**

**Risposte receptionist:**1.Ho trovato disponibilità per domani, venerdì 20 febbraio alle 20 per 2 persone. Posso procedere con la prenotazione a nome Marco. -Cliente: Sì sì sì.; 2.Risulta già una prenotazione per domani domani, venerdì 20 febbraio alle 20 con questo numero. Desidera modificarla. - Cl: No, va bene così ciao.; 3.Arrivederci. - Cl: ciao;

**Log tool chiamati (Vapi):**1.Resolve Relative Day; 2.Check Openings: {"restaurant_id":"roma","day":"2026-02-20","day_label":"venerdì 20 febbraio","closed":false,"requested_time":"20:00","time_human":"20","available":true,"reason":null,"nearest_slots_human":null,"max_people":8,"message":"Disponibile."}; 3.Create Booking: {"ok":false,"error_code":"DUPLICATE_BOOKING","error_message":"Esiste già una prenotazione per 2026-02-20 alle 20:00 con questo numero."}; 4.End call

**Log tool chiamati (Render):**{"ts":"2026-02-19T22:01:49.621Z","level":"info","event":"api_request","request_id":"391550cc","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c77ec-43cf-7339-97f3-afbe5c91351c","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T22:01:49.621Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"391550cc","text":"domani","date":"2026-02-20","day_label":"venerdì 20 febbraio"}
{"ts":"2026-02-19T22:01:50.838Z","level":"info","event":"api_request","request_id":"16768be7","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c77ec-43cf-7339-97f3-afbe5c91351c","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T22:01:51.229Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-20","requested_time":"20:00","in_openings":true,"slot_exists":true,"active_bookings_count":1,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"16768be7"}
{"ts":"2026-02-19T22:01:51.229Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-20","closed":false,"openings_count":14,"requested_time":"20:00","available":true,"reason":null,"source":"vapi","request_id":"16768be7"}
{"ts":"2026-02-19T22:02:26.750Z","level":"info","event":"api_request","request_id":"dda9ff3c","method":"POST","path":"/api/create_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c77ec-43cf-7339-97f3-afbe5c91351c","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T22:02:27.526Z","level":"warn","event":"sheets_duplicate_booking_blocked","restaurant_id":"roma","day":"2026-02-20","time":"20:00","phone":"+39XXX...688","existing_booking_id":"ea6dd92a-bd69-45a2-a91e-22bb1b870e8f"}
{"ts":"2026-02-19T22:02:27.527Z","level":"warn","event":"create_booking_rejected","restaurant_id":"roma","day":"2026-02-20","time":"20:00","people":2,"phone":"+39XXX...688","error_code":"DUPLICATE_BOOKING","error_message":"Esiste già una prenotazione per 2026-02-20 alle 20:00 con questo numero.","source":"vapi","request_id":"dda9ff3c"}

---

### 22. RA2-v2 — Normalizzazione telefono (test aggiuntivo)

**Cliente dice:** "Vorrei prenotare per domani alle 20 per 2 persone. Il numero di telefono è 333 1234567, a nome Luigi."

**Obiettivo:** AI normalizza "333 1234567" in "+393331234567" (E.164) e usa quel numero per create_booking.

**Cosa verificare:**
- [ ] AI dice "userò questo numero" o simile (non legge cifra per cifra)
- [ ] Nel payload create_booking il phone è in formato E.164 (+39...)
- [ ] Prenotazione creata correttamente con il numero normalizzato

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Esito:**

**Risposte receptionist:**1.La prenotazione è confermata per venerdì 20 febbraio alle 20 per 2 persone a nome Luigi. Se bisogno di ulteriore assistenza non esiti a chiedere. - Cl: Va bene, ciao.;

**Log tool chiamati (Vapi):**1.Resolve Relative Day; 2.Resolve Relative Time; 3.Check Openings:{"restaurant_id":"roma","day":"2026-02-20","day_label":"venerdì 20 febbraio","closed":false,"requested_time":"20:00","time_human":"20","available":true,"reason":null,"nearest_slots_human":null,"max_people":8,"message":"Disponibile."}: 4.Create Booking: {"ok":true,"booking_id":"1476dca7-32bb-44da-bf78-56032c643c5a","day":"2026-02-20","time":"20:00","people":2,"name":"Luigi","phone":"+393331234567","notes":null,"event_id":"fmq288k92shc93creaebc7bl50","day_label":"venerdì 20 febbraio","time_human":"20","message":"Prenotazione confermata per venerdì 20 febbraio alle 20, 2 persone a nome Luigi."}; 5.End call;

**Log tool chiamati (Render):**{"ts":"2026-02-19T22:06:31.930Z","level":"info","event":"api_request","request_id":"e16566ab","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c77f0-7cc9-7dd6-bd26-d4a0008d7872","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T22:06:31.930Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"e16566ab","text":"domani","date":"2026-02-20","day_label":"venerdì 20 febbraio"}
{"ts":"2026-02-19T22:06:32.298Z","level":"info","event":"api_request","request_id":"4091618f","method":"POST","path":"/api/resolve_relative_time","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c77f0-7cc9-7dd6-bd26-d4a0008d7872","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T22:06:32.299Z","level":"info","event":"resolve_relative_time_success","restaurant_id":"roma","source":"vapi","request_id":"4091618f","text":"20","ok":true,"time":"20:00"}
{"ts":"2026-02-19T22:06:33.261Z","level":"info","event":"api_request","request_id":"b591f184","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c77f0-7cc9-7dd6-bd26-d4a0008d7872","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T22:06:33.698Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-20","requested_time":"20:00","in_openings":true,"slot_exists":true,"active_bookings_count":1,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"b591f184"}
{"ts":"2026-02-19T22:06:33.698Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-20","closed":false,"openings_count":14,"requested_time":"20:00","available":true,"reason":null,"source":"vapi","request_id":"b591f184"}
{"ts":"2026-02-19T22:06:34.739Z","level":"info","event":"api_request","request_id":"5ca710c3","method":"POST","path":"/api/create_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c77f0-7cc9-7dd6-bd26-d4a0008d7872","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-19T22:06:36.834Z","level":"info","event":"sheets_write_booking_row","restaurant_id":"roma","sheet_id":"1MnaSIGqhieZVnxtnw_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":14,"booking_id":"1476dca7-32bb-44da-bf78-56032c643c5a"}
{"ts":"2026-02-19T22:06:36.834Z","level":"info","event":"create_booking_success","restaurant_id":"roma","day":"2026-02-20","time":"20:00","people":2,"phone":"+39XXX...567","booking_id":"1476dca7-32bb-44da-bf78-56032c643c5a","source":"vapi","request_id":"5ca710c3"}

---

## Riepilogo Re-Test V2.1

| # | Test | Descrizione | Esito V2.1 | Note |
|---|------|-------------|------------|------|
| 16 | RG2-v2 | Orari venerdì pronuncia | PASS con difetto | Backend "12 e 30" ✅, AI riformula "12.30" (TTS OK) |
| 17 | RH2-v2 | Prenotazione flusso completo | PASS | Flusso perfetto, message usato, endCall OK |
| 18 | RC1-v2 | Lista prenotazioni TTS | PASS con difetto | Backend "20 e 30" ✅ (fix funziona), AI dice "20.30" (TTS OK) |
| 19 | RE1-v2 | Cancellazione + endCall | PASS | Cancellazione OK, endCall dopo saluto |
| 20 | RH3-v2 | Conferma ambigua + persone | PASS con difetto | **Persone conservate 2 ✅ (FIX OK)**, chiede slot ✅, TTS "tredici:trenta" |
| 21 | RH1-v2 | DUPLICATE_BOOKING | PASS | DUPLICATE gestito ✅, **log rejected ✅ (FIX OK)** |
| 22 | RA2-v2 | Normalizzazione telefono | PASS | Phone +393331234567 ✅ |

**Totale: 7 re-test V2.1**
**Passati: 7/7 (4 PASS puliti, 3 PASS con difetti cosmetici)**

**Fix V2.1 confermati funzionanti:**
- ✅ CONSERVAZIONE DATI (test 20: 2 persone mantenute, prima era 1)
- ✅ Fix logging (test 21: `create_booking_rejected` invece di `create_booking_success`)
- ✅ list_bookings `formatTimeHuman` (test 18: message "20 e 30" nel payload)
- ✅ endCall doppio ciao (test 19, 21: endCall dopo saluto finale)

**Difetto residuo (non critico):**
- AI riformula orari dal message ("12 e 30" → "12.30", "20 e 30" → "20.30") — comportamento del modello, TTS legge comunque in italiano

**Bug nuovo trovato durante i test:**
- endCall su "Salve" iniziale (prima risposta del cliente) → **fixato in v2.2** (REGOLA SALUTO INIZIALE) → **verificato: funziona ✅**
