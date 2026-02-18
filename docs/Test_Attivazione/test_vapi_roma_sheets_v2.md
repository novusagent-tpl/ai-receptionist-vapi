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
