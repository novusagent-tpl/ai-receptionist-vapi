# Test Vapi – Roma (Google Sheets/Calendar)

Test vocali specifici per l'assistente **Roma** con backend **Google Sheets/Calendar**. Verifica il flusso completo incluso l'enforcement server-side (capacita, orari, cutoff).

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

---

## RA. PRENOTAZIONE – Flow completo

### RA1. Prenotazione semplice

**Cliente dice:** "Buongiorno, vorrei prenotare un tavolo per stasera alle 20 per 3 persone, il nome e Anna Blu."

**Obiettivo:** Flow completo. resolve_relative_day → check_openings → create_booking. Verificare che la prenotazione appaia su Google Sheets e su Google Calendar.

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Esito:**

**Risposte receptionist:**1.Abbiamo disponibilità per stasera alle 20. Posso procedere con la prenotazione per 3 persone a nome di Anna Blu, Mi conferma il numero di telefono che userò per la prenotazione?; 2.La prenotazione è stata confermata per stasera alle 20 per 3 persone a nome di Anna Blu. Il numero di telefono utilizzato è da 3 9 3 4 9 2 6 3 4. 363. Arrivederci e buona giornata.

**Log tool chiamati:**{"ts":"2026-02-16T14:28:08.854Z","level":"info","event":"api_request","request_id":"0473c997","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c66d9-ce67-7553-8496-135c16ddf1db","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T14:28:09.730Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-16","requested_time":"20:00","in_openings":true,"slot_exists":true,"active_bookings_count":0,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"0473c997"}
{"ts":"2026-02-16T14:28:09.730Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-16","closed":false,"openings_count":8,"requested_time":"20:00","available":true,"reason":null,"source":"vapi","request_id":"0473c997"}
{"ts":"2026-02-16T14:28:32.488Z","level":"info","event":"api_request","request_id":"ecf08744","method":"POST","path":"/api/create_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c66d9-ce67-7553-8496-135c16ddf1db","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T14:28:35.454Z","level":"info","event":"sheets_write_booking_row","restaurant_id":"roma","sheet_id":"1MnaSIGqhieZVnxtnw_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":36,"booking_id":"1d4d0672-4dc6-42e4-9def-91e4c1a9a501"}
{"ts":"2026-02-16T14:28:35.454Z","level":"info","event":"create_booking_success","restaurant_id":"roma","day":"2026-02-16","time":"20:00","people":3,"phone":"+39XXX...363","booking_id":"1d4d0672-4dc6-42e4-9def-91e4c1a9a501","source":"vapi","request_id":"ecf08744"}

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

**Esito:**

**Risposte receptionist:**1.Certo, per quando desidera prenotare,; 2.Perfetto, venerdì. A che ora preferisce prenotare?; 3.Siamo aperti a pranzo dalle 12.30 alle 14.30. La prenotazione per venerdì alle 13 è disponibile. Quante persone saranno?; 4.Perfetto, posso avere il suo nome per favore?; 5.Grazie Marco. Infine userò il numero che chiamato. Procedo con la prenotazione per venerdì 20 febbraio alle 13 per 5 persone. Conferma?; 6.La prenotazione è confermata per venerdì 20 febbraio alle 13 per 5 persone a nome di Marco Verdi. Arrivederci e buona giornata!

**Log tool chiamati:**{"ts":"2026-02-16T14:34:39.435Z","level":"info","event":"api_request","request_id":"9cdbf1e1","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c66df-bbb9-7553-8499-42a0152aad17","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T14:34:39.436Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"9cdbf1e1","text":"venerdì","date":"2026-02-20"}
{"ts":"2026-02-16T14:34:49.977Z","level":"info","event":"api_request","request_id":"d07fb435","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c66df-bbb9-7553-8499-42a0152aad17","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T14:34:50.526Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-20","requested_time":"13:00","in_openings":true,"slot_exists":true,"active_bookings_count":0,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"d07fb435"}
{"ts":"2026-02-16T14:34:50.526Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-20","closed":false,"openings_count":14,"requested_time":"13:00","available":true,"reason":null,"source":"vapi","request_id":"d07fb435"}
{"ts":"2026-02-16T14:35:37.951Z","level":"info","event":"api_request","request_id":"952d382c","method":"POST","path":"/api/create_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c66df-bbb9-7553-8499-42a0152aad17","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T14:35:41.070Z","level":"info","event":"sheets_write_booking_row","restaurant_id":"roma","sheet_id":"1MnaSIGqhieZVnxtnw_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":37,"booking_id":"c3ef13ab-35e2-4576-bbc0-95f74db8fd16"}
{"ts":"2026-02-16T14:35:41.070Z","level":"info","event":"create_booking_success","restaurant_id":"roma","day":"2026-02-20","time":"13:00","people":5,"phone":"+39XXX...688","booking_id":"c3ef13ab-35e2-4576-bbc0-95f74db8fd16","source":"vapi","request_id":"952d382c"}

---

### RA3. Prenotazione con giorno della settimana

**Cliente dice:** "Avete posto giovedi prossimo per cena? Saremmo in 6, vorremmo le 21."

**Obiettivo:** resolve_relative_day("giovedi prossimo"), check_openings, create_booking. Roma max_people=8 quindi 6 e OK.

**Tool attesi:** resolve_relative_day, check_openings, create_booking

**Esito:** Allora qui è andato tutto bene però c'è un problema, l'assistente ha chiuso la chiamata da solo dopo aver confermato i dati della prenotazione senza che io abbia detto nulla. Ed è successo questo anche nella chiamata di priam, ha fatto tutto bene però alla fine ha chiuso la chiamata dopo la conferma della prenotazione e i dati. Secondo me la regola per end_call è troppo dura e severa. Cosa consigli di fare ora ?

**Risposte receptionist:**1.Siamo aperti giovedì prossimo il 19 febbraio, e abbiamo disponibilità per cena alle 21, Posso procedere con la prenotazione per 6 persone. Mi conferma il suo nome e il numero di telefono?; 2.La prenotazione è stata confermata per giovedì 19 febbraio alle ventuno:zero per 6 persone a nome Mauro. Arrivederci e buona giornata.

**Log tool chiamati:**{"ts":"2026-02-16T14:41:15.795Z","level":"info","event":"api_request","request_id":"89ac5143","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c66e5-afad-766c-9f50-adf70a0ce62f","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T14:41:15.795Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"89ac5143","text":"giovedì prossimo","date":"2026-02-19"}
{"ts":"2026-02-16T14:41:15.809Z","level":"info","event":"api_request","request_id":"ff34b2c1","method":"POST","path":"/api/resolve_relative_time","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c66e5-afad-766c-9f50-adf70a0ce62f","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T14:41:15.811Z","level":"info","event":"resolve_relative_time_error","restaurant_id":"roma","source":"vapi","request_id":"ff34b2c1","text":"21","error_code":"UNSUPPORTED_RELATIVE_TIME","error_message":"Espressione orario non riconosciuta."}
{"ts":"2026-02-16T14:41:17.341Z","level":"info","event":"api_request","request_id":"214d61be","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c66e5-afad-766c-9f50-adf70a0ce62f","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T14:41:18.271Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-19","requested_time":"21:00","in_openings":true,"slot_exists":true,"active_bookings_count":0,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"214d61be"}
{"ts":"2026-02-16T14:41:18.271Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-19","closed":false,"openings_count":8,"requested_time":"21:00","available":true,"reason":null,"source":"vapi","request_id":"214d61be"}
{"ts":"2026-02-16T14:41:47.774Z","level":"info","event":"api_request","request_id":"af6932a5","method":"POST","path":"/api/send_sms","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c66e5-afad-766c-9f50-adf70a0ce62f","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T14:41:50.398Z","level":"info","event":"api_request","request_id":"60d50c60","method":"POST","path":"/api/create_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c66e5-afad-766c-9f50-adf70a0ce62f","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T14:41:53.680Z","level":"info","event":"sheets_write_booking_row","restaurant_id":"roma","sheet_id":"1MnaSIGqhieZVnxtnw_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":38,"booking_id":"b691445f-51c6-44fc-a480-6400151d9a38"}
{"ts":"2026-02-16T14:41:53.680Z","level":"info","event":"create_booking_success","restaurant_id":"roma","day":"2026-02-19","time":"21:00","people":6,"phone":"+39XXX...423","booking_id":"b691445f-51c6-44fc-a480-6400151d9a38","source":"vapi","request_id":"60d50c60"}

---

## RB. CASI PARTICOLARI

### RB1. Giorno chiuso (domenica)

**Cliente dice:** "Vorrei prenotare per domenica alle 20, 2 persone."

**Obiettivo:** check_openings → closed=true. Dire che domenica e chiuso. Il backend blocca anche se l'AI sbaglia (enforcement OUTSIDE_HOURS).

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**Allora qui è sucessa una cosa interessante, ti lascio tutta la conversazione cosi capisci qual è potrebbe essere il problema. E ci sono più errori non solo uno. 1.Non dovrebbe dire, mi dispiace domenica alle 20 non possiamo accetare prenotazioni, dovrebbe dire che domenica il ristorante è chiuso, inoltre o avrebbe potuto aggiungere alla fine: perché il ristorante è chiuso.(Cosa possiamo fare per risolvere nel modo milgiore questo, Questa cosa si può risolvere con il backend in modo rigido e che non capiti o no?) 2.Perchè per lunedì ha preso Lunedi 20 se oggi è il 16 febbraio è il 20 è un venerdì, Avrebbe dovuto prendere il 23 o il 16...

**Risposte receptionist:**Cliente: Salve vorrei prenotare per domenica alle 20 a 2 persone.; 1.Mi dispiace, ma domenica alle 20 non possiamo accettare prenotazioni. Posso aiutarla a trovare un altro orario. - Cliente: Si va bene.; 2.Mi dispiace, ma domenica alle 20 non possiamo accettare prenotazioni. Posso aiutarla a trovare un altro orario.- Cliente: Alle 21.;
3.Perfetto, posso avere il suo nome per favore? - Cliente: Si Mario; 4.E per quanti ospiti desidera prenotare? - Cliente: Per 2 persone.; 5.Infine userò il numero di telefono che chiamato. Procedo con la prenotazione per domenica 22 febbraio alle 21 per 2 persone a nome Mario. - CLiente: Si va bene; 6.Mi dispiace, ma il ristorante è chiuso domenica 22 febbraio. Posso aiutarla a trovare un altro giorno per la prenotazione? - Cliente: Va bene.; 7.Quale giorno preferisce per la prenotazione? - CLiente: Lunedì.; 8.A che ora preferisce prenotare per lunedì? Le disponibilità sono 19 19, 30, 20, 20, 30, 21, 21, 30, 22, 22, 30.23. - Cliente:Facciamo alle 20.; 9.Perfetto, posso avere il suo nome per favore? - Cliente: Sì, mi chiamo Giulio.;
10.Per quanti ospiti desidera prenotare? - Cliente: Per 2 persone; 11.Procedo con la prenotazione per lunedì 20 febbraio.... alle venti:zero per 2 persone a nome Giulio....Userò il numero di telefono che chiamato. Confermo? - Cliente: Si.; 12.La prenotazione è confermata per lunedì 20 febbraio alle 20 per 2 persone a nome Giulio. Arrivederci e buona giornata.

**Log tool chiamati:**{"ts":"2026-02-16T14:49:32.350Z","level":"info","event":"api_request","request_id":"6c940cbc","method":"POST","path":"/api/resolve_relative_time","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c66ed-67c5-7cc9-ba9d-072b7cc86c62","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T14:49:32.351Z","level":"info","event":"resolve_relative_time_error","restaurant_id":"roma","source":"vapi","request_id":"6c940cbc","text":"20","error_code":"UNSUPPORTED_RELATIVE_TIME","error_message":"Espressione orario non riconosciuta."}
{"ts":"2026-02-16T14:49:32.785Z","level":"info","event":"api_request","request_id":"dd2fb2ec","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c66ed-67c5-7cc9-ba9d-072b7cc86c62","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T14:49:32.785Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"dd2fb2ec","text":"domenica","date":"2026-02-22"}
{"ts":"2026-02-16T14:49:33.946Z","level":"info","event":"api_request","request_id":"4f4ed6ed","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c66ed-67c5-7cc9-ba9d-072b7cc86c62","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T14:49:34.959Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-22","requested_time":"20:00","in_openings":false,"slot_exists":false,"active_bookings_count":null,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":false,"reason":"not_in_openings","nearest_slots_count":0,"source":"vapi","request_id":"4f4ed6ed"}
{"ts":"2026-02-16T14:49:34.960Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-22","closed":true,"openings_count":0,"requested_time":"20:00","available":false,"reason":"not_in_openings","source":"vapi","request_id":"4f4ed6ed"}
{"ts":"2026-02-16T14:50:45.871Z","level":"info","event":"api_request","request_id":"58879882","method":"POST","path":"/api/create_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c66ed-67c5-7cc9-ba9d-072b7cc86c62","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T14:50:46.223Z","level":"info","event":"create_booking_success","restaurant_id":"roma","day":"2026-02-22","time":"21:00","people":2,"phone":"+39XXX...688","source":"vapi","request_id":"58879882"}
{"ts":"2026-02-16T14:50:46.223Z","level":"warn","event":"sheets_create_blocked_closed","restaurant_id":"roma","day":"2026-02-22","time":"21:00"}
{"ts":"2026-02-16T14:51:19.558Z","level":"info","event":"api_request","request_id":"7cf658bf","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c66ed-67c5-7cc9-ba9d-072b7cc86c62","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T14:51:19.560Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-20","closed":false,"openings_count":14,"requested_time":null,"available":null,"reason":null,"source":"vapi","request_id":"7cf658bf"}
{"ts":"2026-02-16T14:52:43.970Z","level":"info","event":"api_request","request_id":"677f0c62","method":"POST","path":"/api/create_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c66ed-67c5-7cc9-ba9d-072b7cc86c62","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T14:52:46.243Z","level":"info","event":"sheets_write_booking_row","restaurant_id":"roma","sheet_id":"1MnaSIGqhieZVnxtnw_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":39,"booking_id":"6c157a90-5d45-4397-b14a-ceb0ee719946"}
{"ts":"2026-02-16T14:52:46.244Z","level":"info","event":"create_booking_success","restaurant_id":"roma","day":"2026-02-20","time":"20:00","people":2,"phone":"+39XXX...688","booking_id":"6c157a90-5d45-4397-b14a-ceb0ee719946","source":"vapi","request_id":"677f0c62"}

---

### RB2. Orario fuori slot (es. 16:00 di giovedi — no pranzo)

**Cliente dice:** "Vorrei prenotare per giovedi alle 16 per 2 persone."

**Obiettivo:** Giovedi Roma ha solo cena (19:00-22:30), non pranzo. check_openings → available=false, reason=not_in_openings. Deve proporre gli orari di cena, non dire "siamo chiusi".

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**Qui voglio capire una cosa, c'è qualche modo dal backend da fare in modo permamnente che non sbagli mai gli orari di apertura con quelli disponibili per la prenotazione o quelli di nearest_slots, perché prima di questo test ho fatto un altro test uguale e quando mi ha chiesto quale orario desidero ho detto le 20 e mi diceva che quel orario non è disponibile, ho provato anche altri orari ma solo con 19 e 19:30 funzionava visto che sono gli orari di nearest_slots, perché è sucesso questo e come facciamo a risolvere questo in modo rigido e che non capiti mai. 

**Risposte receptionist:**1.Non accettiamo prenotazioni esattamente a quell'orario. Posso proporle le 19 o le diciannove:trenta. Va bene uno di questi? - Cliente: No, non va bene.;  2.Va bene, se desidera puoi indicarmi un altro orario che preferisce per la prenotazione. - Cliente: Alle 20.;  3.Abbiamo disponibilità per le 20, Per confermare la prenotazione, posso avere il suo nome e il numero di telefono per favore?... - Ho chiuso la chiamata

**Log tool chiamati:**{"ts":"2026-02-16T16:51:28.226Z","level":"info","event":"api_request","request_id":"62c09059","method":"POST","path":"/api/resolve_relative_time","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c675d-0f09-7ff7-ae39-d90faab94ea0","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T16:51:28.227Z","level":"info","event":"resolve_relative_time_error","restaurant_id":"roma","source":"vapi","request_id":"62c09059","text":"16","error_code":"UNSUPPORTED_RELATIVE_TIME","error_message":"Espressione orario non riconosciuta."}
{"ts":"2026-02-16T16:51:28.247Z","level":"info","event":"api_request","request_id":"6fe82c53","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c675d-0f09-7ff7-ae39-d90faab94ea0","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T16:51:28.248Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"6fe82c53","text":"giovedì","date":"2026-02-19"}
{"ts":"2026-02-16T16:51:29.158Z","level":"info","event":"api_request","request_id":"c42c58ed","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c675d-0f09-7ff7-ae39-d90faab94ea0","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T16:51:29.573Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-19","requested_time":"16:00","in_openings":false,"slot_exists":false,"active_bookings_count":null,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":false,"reason":"not_in_openings","nearest_slots_count":2,"source":"vapi","request_id":"c42c58ed"}
{"ts":"2026-02-16T16:51:29.573Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-19","closed":false,"openings_count":8,"requested_time":"16:00","available":false,"reason":"not_in_openings","source":"vapi","request_id":"c42c58ed"}
{"ts":"2026-02-16T16:51:58.595Z","level":"info","event":"api_request","request_id":"f9a1eb90","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c675d-0f09-7ff7-ae39-d90faab94ea0","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T16:51:58.913Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-19","requested_time":"20:00","in_openings":true,"slot_exists":true,"active_bookings_count":0,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"f9a1eb90"}
Menu
{"ts":"2026-02-16T16:51:58.913Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-19","closed":false,"openings_count":8,"requested_time":"20:00","available":true,"reason":null,"source":"vapi","request_id":"f9a1eb90"}

---

### RB3. Pranzo in giorno senza pranzo

**Cliente dice:** "Vorrei prenotare per mercoledi a pranzo, verso le 13."

**Obiettivo:** Mercoledi Roma ha solo cena. check_openings → not_in_openings. Dire che mercoledi non c'e servizio a pranzo, proporre cena o venerdi/sabato per pranzo.

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**

**Risposte receptionist:**Cliente: Vorrei prenotare per mercoledì a pranzo verso le 13; 1.Ho trovato la data per mercoledì che è il 18 febbraio 2026. Tuttavia, l'orario verso le 13 non è preciso. Può indicarmi un orario esatto? Per favore? - Cliente: Alle 13.; 2.Mi dispiace, ma non accettiamo prenotazioni esattamente alle 13. Posso proporle alcuni orari alternativi, le 19 o le diciannove:trenta. Va bene uno. - Cliente: Perché non accettate a pranzo?; 3.Il ristorante non accetta prenotazioni a pranzo in quel giorno specifico. Specifico. Siamo disponibili solo per la cena, posso aiutarla a prenotare per le 19 o le 19.30? -  Ho chiuso la chiamata.

**Log tool chiamati:**{"ts":"2026-02-16T17:01:12.230Z","level":"info","event":"api_request","request_id":"3af62ff3","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6765-f26e-7227-9d0d-c5823be08468","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T17:01:12.230Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"3af62ff3","text":"mercoledì","date":"2026-02-18"}
{"ts":"2026-02-16T17:01:12.553Z","level":"info","event":"api_request","request_id":"8a2af446","method":"POST","path":"/api/resolve_relative_time","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6765-f26e-7227-9d0d-c5823be08468","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T17:01:12.553Z","level":"info","event":"resolve_relative_time_error","restaurant_id":"roma","source":"vapi","request_id":"8a2af446","text":"verso le 13","error_code":"VAGUE_TIME","error_message":"Orario non preciso. Indichi un orario esatto (es. 20:00)."}
{"ts":"2026-02-16T17:01:33.261Z","level":"info","event":"api_request","request_id":"8685d295","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6765-f26e-7227-9d0d-c5823be08468","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T17:01:33.744Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-18","requested_time":"13:00","in_openings":false,"slot_exists":false,"active_bookings_count":null,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":false,"reason":"not_in_openings","nearest_slots_count":2,"source":"vapi","request_id":"8685d295"}
{"ts":"2026-02-16T17:01:33.744Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-18","closed":false,"openings_count":8,"requested_time":"13:00","available":false,"reason":"not_in_openings","source":"vapi","request_id":"8685d295"}

---

### RB4. Max persone superato (roma max=8)

**Cliente dice:** "Vorrei prenotare per venerdi alle 20 per 12 persone, nome Andrea."

**Obiettivo:** 12 > max_people (8). L'AI deve comunicarlo SUBITO (da check_openings max_people) senza raccogliere nome/telefono. Offrire handover se aperto.

**Tool attesi:** resolve_relative_day, check_openings (contiene max_people=8)

**Esito:**

**Risposte receptionist:**1.Per le prenotazioni online il massimo è di 8 persone. Desidera prenotare per 8 persone? - Cliente: No; 2.Capisco, se desidera prenotare per un numero maggiore di persone posso metterla in contatto con il ristorante per verificare la disponibilità Vuole procedere in questo modo? - Cliente: Sì certo.;  3.Il ristorante è attualmente chiuso e riaprirà alle 19. Posso aiutarla io con altre informazioni o prenotazioni? - Cliente: No allora chiamerò alle 19.; *Ho chiuso la chiamata

**Log tool chiamati:**{"ts":"2026-02-16T17:08:58.112Z","level":"info","event":"api_request","request_id":"6473a75d","method":"POST","path":"/api/resolve_relative_day","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c676d-0fa9-7cc6-89a3-33eceff3c389","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T17:08:58.113Z","level":"info","event":"resolve_relative_day_success","restaurant_id":"roma","source":"vapi","request_id":"6473a75d","text":"venerdì","date":"2026-02-20"}
{"ts":"2026-02-16T17:08:58.497Z","level":"info","event":"api_request","request_id":"e9447c30","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c676d-0fa9-7cc6-89a3-33eceff3c389","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T17:08:58.946Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-17","requested_time":"20:00","in_openings":true,"slot_exists":true,"active_bookings_count":0,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"e9447c30"}
{"ts":"2026-02-16T17:08:58.946Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-17","closed":false,"openings_count":8,"requested_time":"20:00","available":true,"reason":null,"source":"vapi","request_id":"e9447c30"}
{"ts":"2026-02-16T17:09:34.788Z","level":"info","event":"api_request","request_id":"9e778a46","method":"POST","path":"/api/is_open_now","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c676d-0fa9-7cc6-89a3-33eceff3c389","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
Menu
{"ts":"2026-02-16T17:09:34.789Z","level":"info","event":"is_open_now","restaurant_id":"roma","aperto_ora":false,"prossima_apertura":"19:00"}

---

### RB5. Cutoff — orario troppo vicino a chiusura

**Cliente dice:** "Vorrei prenotare per giovedi alle 22 e 30 per 2 persone."

**Obiettivo:** Roma cena giovedi chiude alle 22:30, cutoff 45 min. Le 22:30 sono nell'ultimo slot ma oltre il cutoff (22:30 + 45 = 23:15 > 23:00). check_openings → available=false, reason=cutoff. Il backend blocca anche in create_booking (enforcement). Proporre le 22:00 o le 21:30.

**Tool attesi:** resolve_relative_day, check_openings

**Esito:**Allora qui ha iniziato bene, mi ha detto subito che a quel ora non è disponibile però poi mi ha consigliato come orario per la prenotazione le 22 o le 22:30 solo alla fine della chiamata ha capito e non ha conislgiato piu le 22 e 30, perché e sucesso questo e inoltre ha letto l'orario 22.30 in inglese. Secondo te questa cosa dei numeri/date letti in inglese non potrebbe essere a causa del impostazione su vapi del agente in Transcriber: Use Numerals - Convert numbers from words to digits in transcription. , c'entra qualcosa con questo o no, questa aiuta o no?

**Risposte receptionist:**1.Giovedì alle 22.30 non accettiamo prenotazioni esattamente a quell'orario. Posso proporle le 22 o le 22.30. Va bene uno di questi? - Cliente: Si va bene; 2.Preferisci alle 22 o alle 22 poi 3 0? - Cliente: alle 22.30.; 3.Posso confermare la prenotazione per giovedì alle 202 point 30 per 2 persone. Mi conferma il suo nome per favore? - Cliente: Sì mi chiamo Gianca.; 4.Grazie, Gianca. Infine, posso avere il numero di telefono che utilizzerò per la prenotazione - Cliente: Questo da cui chiamo?; 5.Sì, userò questo numero. Procedo con la prenotazione per giovedì alle 22.30 per 2 persone a nome Gianca. Un momento per favore.... Siamo aperti. Giovedì alle 22 point 3 0, ma non accettiamo prenotazioni così a ridosso della chiusura. Posso proporle alcuni orari, le 22 o le 21.30, Va bene uno di questi?

**Log tool chiamati:**{"ts":"2026-02-16T17:14:38.425Z","level":"info","event":"api_request","request_id":"f77778ea","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6771-8111-755f-9bf9-c69a0be172aa","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T17:14:38.858Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-16","requested_time":"22:30","in_openings":true,"slot_exists":false,"active_bookings_count":null,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":false,"reason":"cutoff","nearest_slots_count":2,"source":"vapi","request_id":"f77778ea"}
Menu
{"ts":"2026-02-16T17:14:38.858Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-16","closed":false,"openings_count":8,"requested_time":"22:30","available":false,"reason":"cutoff","source":"vapi","request_id":"f77778ea"}

---

### RB6. Duplicato (stessa prenotazione esistente)

**Precondizione:** Esiste gia una prenotazione per quel telefono, giorno e orario (creata in RA1).

**Cliente dice:** "Vorrei prenotare per [stesso giorno di RA1] alle 20. (per 3 persone, Anna Blu.)"

**Obiettivo:** Backend restituisce DUPLICATE_BOOKING. Receptionist comunica che esiste gia.

**Tool attesi:** check_openings, create_booking (DUPLICATE_BOOKING)

**Esito:**

**Risposte receptionist:**1.Siamo aperti stasera e abbiamo disponibilità alle 20. Quante persone saranno? - CLiente:Saremmo 3 persone.; 2.Perfetto, posso avere il suo nome per favore? - Cliente: Anna Blu.; 3.Grazie Anna. Infine userò il numero di telefono che sta chiamando per la prenotazione. Va bene? -  Cliente: Si; 4.Risulta già una prenotazione per stasera alle 20 con questo numero. Desidera modificarla o verificare I dettagli? - Cliente: no, se c'è già va bene lo stesso.; 5.Va bene, allora non procedo con ulteriori modifiche. Prego, buona giornata.

**Log tool chiamati:**{"ts":"2026-02-16T17:39:03.852Z","level":"info","event":"api_request","request_id":"a797bef2","method":"POST","path":"/api/check_openings","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6788-9dc8-7aa8-a7bf-09cc8ebd498d","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T17:39:04.179Z","level":"info","event":"capacity_check_success","restaurant_id":"roma","day":"2026-02-16","requested_time":"20:00","in_openings":true,"slot_exists":true,"active_bookings_count":1,"max_concurrent_bookings":3,"avg_stay_minutes":60,"available":true,"reason":null,"nearest_slots_count":0,"source":"vapi","request_id":"a797bef2"}
{"ts":"2026-02-16T17:39:04.179Z","level":"info","event":"check_openings_success","restaurant_id":"roma","day":"2026-02-16","closed":false,"openings_count":8,"requested_time":"20:00","available":true,"reason":null,"source":"vapi","request_id":"a797bef2"}
{"ts":"2026-02-16T17:39:33.999Z","level":"info","event":"api_request","request_id":"016d0a5e","method":"POST","path":"/api/create_booking","restaurant_id":"roma","backend_used":"sheets","prompt_version":"v1.0","call_id":"019c6788-9dc8-7aa8-a7bf-09cc8ebd498d","conversation_id":"672fd893-dc2f-4bb0-81bb-699f38256cd3"}
{"ts":"2026-02-16T17:39:34.316Z","level":"warn","event":"sheets_duplicate_booking_blocked","restaurant_id":"roma","day":"2026-02-16","time":"20:00","phone":"+39XXX...688","existing_booking_id":"cdfc7566-c304-4499-963d-65832a14424d"}
{"ts":"2026-02-16T17:39:34.316Z","level":"info","event":"create_booking_success","restaurant_id":"roma","day":"2026-02-16","time":"20:00","people":3,"phone":"+39XXX...688","source":"vapi","request_id":"016d0a5e"}

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

**Obiettivo:** check_openings(domenica) → closed=true. Non modificare. Proporre altro giorno.

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

**Tool attesi:** faq (o knowledge base Vapi)

**Esito:**

**Risposte receptionist:**

**Log tool chiamati:**

---

### RF2. Domanda senza risposta

**Cliente dice:** "Fate catering per eventi?"

**Obiettivo:** faq → answer=null. Non inventare.

**Tool attesi:** faq

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

**Obiettivo:** check_openings → closed=true. Dire che domenica e chiuso.

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

## Riepilogo esiti Roma

| Test | Descrizione | Esito |
|------|-------------|-------|
| RA1 | Prenotazione semplice | |
| RA2 | Prenotazione step-by-step | |
| RA3 | Prenotazione giorno settimana | |
| RB1 | Giorno chiuso (domenica) | |
| RB2 | Fuori orario (16:00 giovedi) | |
| RB3 | Pranzo in giorno senza pranzo | |
| RB4 | Max persone superato (>8) | |
| RB5 | Cutoff (22:30 con cutoff 45 min) | |
| RB6 | Duplicato | |
| RC1 | Lista prenotazioni | |
| RC2 | Nessuna prenotazione | |
| RD1 | Modifica orario | |
| RD2 | Modifica persone | |
| RD3 | Modifica a giorno chiuso | |
| RE1 | Cancellazione | |
| RE2 | Cancellazione senza prenotazioni | |
| RF1 | FAQ parcheggio | |
| RF2 | FAQ senza risposta | |
| RG1 | Siete aperti? | |
| RG2 | Orari venerdi (pranzo+cena) | |
| RG3 | Domenica chiuso | |
| RH1 | "Stasera" riconosciuto | |
| RH2 | Orari in italiano (no inglese) | |
| RH3 | Conferma ambigua | |
| RH4 | endCall dopo saluto | |
| RJ1 | Handover aperto | |
| RJ2 | Handover chiuso | |

**Totale: 27 test**

---

*Dopo ogni test: compilare Esito, Risposte receptionist, Log tool chiamati. Verificare anche su Google Sheets e Calendar che le prenotazioni create/modificate/cancellate siano corrette.*
