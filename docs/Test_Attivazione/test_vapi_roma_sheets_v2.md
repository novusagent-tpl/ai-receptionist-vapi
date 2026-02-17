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

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### RC2. Nessuna prenotazione

**Cliente dice:** "Ho una prenotazione per sabato?" [telefono senza prenotazioni per Roma]

**Obiettivo:** list_bookings → results vuoto. Comunicare e proporre di prenotare.

**Tool attesi:** list_bookings

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

## RD. MODIFICA PRENOTAZIONE

### RD1. Modifica orario

**Precondizione:** Prenotazione attiva (da RA1).

**Cliente dice:** "Ho una prenotazione per [giorno RA1] alle 20. Potrei spostarla alle 21?"

**Obiettivo:** list_bookings → identificare; check_openings(21:00); modify_booking. Verificare che Sheets E Calendar siano aggiornati.

**Tool attesi:** list_bookings, check_openings, modify_booking

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### RD2. Modifica numero persone

**Cliente dice:** "Vorrei cambiare da 3 a 6 persone per la mia prenotazione."

**Obiettivo:** 6 <= max_people (8) → OK. modify_booking con new_people=6.

**Tool attesi:** list_bookings, modify_booking

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### RD3. Modifica a giorno chiuso

**Cliente dice:** "Posso spostare la prenotazione a domenica?"

**Obiettivo:** check_openings(domenica) → closed=true, reason="closed", next_open_day. Non modificare. Proporre altro giorno.

**Tool attesi:** list_bookings, resolve_relative_day, check_openings (closed)

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

## RE. CANCELLAZIONE

### RE1. Cancellazione prenotazione

**Precondizione:** Prenotazione attiva (da RA1/RA2/RA3).

**Cliente dice:** "Vorrei cancellare la mia prenotazione."

**Obiettivo:** list_bookings → identificare; cancel_booking. Verificare che sia rimossa sia da Sheets che da Calendar.

**Tool attesi:** list_bookings, cancel_booking

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### RE2. Cancellazione senza prenotazioni

**Cliente dice:** "Vorrei cancellare la prenotazione del 17."

**Obiettivo:** list_bookings → count=0. Comunicare e chiedere conferma numero.

**Tool attesi:** list_bookings

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

## RF. FAQ

### RF1. Parcheggio

**Cliente dice:** "Avete parcheggio?"

**Obiettivo:** Risposta dal KB roma. Verificare che le FAQ siano separate da modena01.

**Tool attesi:** Knowledge Base Vapi

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### RF2. Domanda senza risposta

**Cliente dice:** "Fate catering per eventi?"

**Obiettivo:** KB → answer non trovata. Non inventare.

**Tool attesi:** Knowledge Base Vapi

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

## RG. ORARI

### RG1. "Siete aperti?"

**Cliente dice:** "Siete aperti adesso?"

**Obiettivo:** is_open_now. Comunicare orari senza avviare prenotazione.

**Tool attesi:** is_open_now

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### RG2. "A che ora aprite venerdi?"

**Cliente dice:** "A che ora aprite venerdi?"

**Obiettivo:** Venerdi Roma ha pranzo + cena. Comunicare entrambe le fasce.

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### RG3. Giorno chiuso — solo orari

**Cliente dice:** "Siete aperti domenica?"

**Obiettivo:** check_openings → closed=true, reason="closed", next_open_day. Dire che domenica e chiuso e proporre prossimo giorno aperto.

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

## RH. EDGE CASES

### RH1. "Stasera" riconosciuto

**Cliente dice:** "Vorrei prenotare per stasera alle 20 per 2 persone."

**Obiettivo:** resolve_relative_day("stasera") → oggi. Fix B2 funziona anche su Roma.

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

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

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### RH3. Conferma ambigua ("si" senza specificare slot)

**Contesto:** check_openings propone 2 slot alternativi.

**Cliente dice:** "Va bene allora." [senza dire quale orario]

**Obiettivo:** NON assumere. Chiedere "Preferisce alle X o alle Y?"

**Tool attesi:** check_openings (gia fatto)

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### RH4. endCall dopo saluto

**Cliente dice:** "Ok grazie, arrivederci."

**Obiettivo:** Receptionist saluta e chiama endCall nella STESSA risposta. La chiamata si chiude subito, senza aspettare altro turno.

**Tool attesi:** endCall

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

## RJ. HANDOVER

### RJ1. Handover — ristorante aperto

**Cliente dice:** "Vorrei parlare con qualcuno del ristorante."

**Obiettivo:** is_open_now → se aperto, transfer.

**Tool attesi:** is_open_now, transfer_call_tool

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### RJ2. Handover — ristorante chiuso

**Cliente dice:** "Vorrei parlare con qualcuno." [ristorante chiuso]

**Obiettivo:** is_open_now → chiuso. NON fare transfer. Dire chiuso + offrire aiuto AI.

**Tool attesi:** is_open_now

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

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
