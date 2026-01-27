S1 - Orari Semplici (NO prenotazione) / Qui sembra tutto ok però non capisco qual è il senso del primo log
1.Siete aperti stasera ? - Siamo aperti stasera dalle 19 alle 22.30 A che ora preferisce?
2.E a che ora chiudete ? - Chiudiamo stasera alle 22.30 Posso aiutarla con qualcos'altro?

QUESTI sono i log: {"ts":"2026-01-26T21:02:05.866Z","level":"error","event":"check\_openings\_validation\_error","restaurant\_id":null,"day":"2026-01-26","time":null,"source":"vapi","request\_id":null,"message":"restaurant\_id e day sono obbligatori"}

{"ts":"2026-01-26T21:02:06.830Z","level":"info","event":"resolve\_relative\_day\_success","restaurant\_id":"roma","source":"vapi","request\_id":null,"text":"oggi","date":"2026-01-26"}
{"ts":"2026-01-26T21:02:07.800Z","level":"info","event":"check\_openings\_success","restaurant\_id":"roma","day":"2026-01-26","closed":false,"openings\_count":8,"requested\_time":null,"available":null,"reason":null,"source":"vapi","request\_id":null}

S2 — Prenotazione completa (happy path) / Qui sembra tutto apposto

1.Vorrei prenotare domani alle 21. - Siamo aperti domani dalle 19 alle ventidue:trenta. Abbiamo disponibilità alle 21. Quante persone saranno?
2. Siamo in 4, nome Marco, telefono 3331234567. - La prenotazione è stata confermata per domani 27 gennaio, alle 21 per 4 persone a nome Marco Se hai bisogno di ulteriore assistenza

QUESTI sono i log:
{"ts":"2026-01-26T21:06:02.096Z","level":"info","event":"resolve\_relative\_day\_success","restaurant\_id":"roma","source":"vapi","request\_id":null,"text":"domani","date":"2026-01-27"}

{"ts":"2026-01-26T21:06:02.191Z","level":"info","event":"resolve\_relative\_time\_error","restaurant\_id":"roma","source":"vapi","request\_id":null,"text":"21","error\_code":"UNSUPPORTED\_RELATIVE\_TIME","error\_message":"Espressione orario non riconosciuta."}

{"ts":"2026-01-26T21:06:03.987Z","level":"info","event":"capacity\_check\_success","restaurant\_id":"roma","day":"2026-01-27","requested\_time":"21:00","in\_openings":true,"slot\_exists":true,"active\_bookings\_count":4,"max\_concurrent\_bookings":10,"avg\_stay\_minutes":60,"available":true,"reason":null,"nearest\_slots\_count":0,"source":"vapi","request\_id":null}

{"ts":"2026-01-26T21:06:03.987Z","level":"info","event":"check\_openings\_success","restaurant\_id":"roma","day":"2026-01-27","closed":false,"openings\_count":8,"requested\_time":"21:00","available":true,"reason":null,"source":"vapi","request\_id":null}

{"ts":"2026-01-26T21:06:24.932Z","level":"info","event":"sheets\_write\_booking\_row","restaurant\_id":"roma","sheet\_id":"1MnaSIGqhieZVnxtnw\_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":24,"booking\_id":"ae1221f0-ecb9-4b71-915d-ec6050e061af"}

{"ts":"2026-01-26T21:06:24.932Z","level":"info","event":"create\_booking\_success","restaurant\_id":"roma","day":"2026-01-27","time":"21:00","people":4,"phone":"+39303528607","booking\_id":"ae1221f0-ecb...



S3 — Cutoff
1.Vorrei prenotare domani alle 22:30. - Siamo aperti domani ma per le prenotazioni non accettiamo così a ridosso della chiusura Posso proporle alcuni orari vicini 22 o 2130 Va bene uno di questi?
2.Allora alle 22:00 va bene. - Quante persone saranno per la prenotazione? Alle 22 di domani.

QUESTI sono i log:
{"ts":"2026-01-26T21:13:43.923Z","level":"info","event":"resolve\_relative\_day\_success","restaurant\_id":"roma","source":"vapi","request\_id":null,"text":"domani","date":"2026-01-27"}

{"ts":"2026-01-26T21:13:44.006Z","level":"info","event":"resolve\_relative\_time\_error","restaurant\_id":"roma","source":"vapi","request\_id":null,"text":"alle 22:30","error\_code":"UNSUPPORTED\_RELATIVE\_TIME","error\_message":"Espressione orario non riconosciuta."}

{"ts":"2026-01-26T21:13:45.295Z","level":"info","event":"capacity\_check\_success","restaurant\_id":"roma","day":"2026-01-27","requested\_time":"22:30","in\_openings":true,"slot\_exists":false,"active\_bookings\_count":null,"max\_concurrent\_bookings":10,"avg\_stay\_minutes":60,"available":false,"reason":"cutoff","nearest\_slots\_count":3,"source":"vapi","request\_id":null}

{"ts":"2026-01-26T21:13:45.295Z","level":"info","event":"check\_openings\_success","restaurant\_id":"roma","day":"2026-01-27","closed":false,"openings\_count":8,"requested\_time":"22:30","available":false,"reason":"cutoff","source":"vapi","request\_id":null}

{"ts":"2026-01-26T21:14:51.966Z","level":"info","event":"sheets\_write\_booking\_row","restaurant\_id":"roma","sheet\_id":"1MnaSIGqhieZVnxtnw\_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":25,"booking\_id":"ef9b3520-d26c-4120-80e5-b76ef7728189"}

{"ts":"2026-01-26T21:14:51.966Z","level":"info","event":"create\_booking\_success","restaurant\_id":"roma","day":"2026-01-27","time":"22:00","people":2,"phone":"+393492674688","booking\_id":"ef9b3520-d26c


Test DOPO la Patch Prompt Fase 2: 


S4 — Full (capacity)

1. "Vorrei prenotare domani alle 20:00." - A quell'ora non abbiamo disponibilità posso proporle alcuni orari vicini 19 30 o 22 Va bene uno di questi?
2. "OK alle 21:00." - Perfetto, Quante persone saranno?

   Le risposte sembrano tutto ok...

   

   Tools: {"ts":"2026-01-27T14:18:54.855Z","level":"info","event":"resolve\_relative\_time\_error","restaurant\_id":"roma","source":"vapi","request\_id":null,"text":"20:00","error\_code":"UNSUPPORTED\_RELATIVE\_TIME","error\_message":"Espressione orario non riconosciuta."}

   {"ts":"2026-01-27T14:18:54.869Z","level":"error","event":"resolve\_relative\_day\_error","restaurant\_id":"roma","source":"vapi","request\_id":null,"text":"stasera","message":"Espressione giorno non riconosciuta. Usa domani/dopodomani/lunedì/tra X giorni oppure indica una data (YYYY-MM-DD)."}

   {"ts":"2026-01-27T14:18:57.029Z","level":"info","event":"capacity\_check\_success","restaurant\_id":"roma","day":"2026-01-27","requested\_time":"20:00","in\_openings":true,"slot\_exists":true,"active\_bookings\_count":3,"max\_concurrent\_bookings":3,"avg\_stay\_minutes":60,"available":false,"reason":"full","nearest\_slots\_count":3,"source":"vapi","request\_id":null}

   {"ts":"2026-01-27T14:18:57.030Z","level":"info","event":"check\_openings\_success","restaurant\_id":"roma","day":"2026-01-27","closed":false,"openings\_count":8,"requested\_time":"20:00","available":false,"reason":"full","source":"vapi","request\_id":null}

   {"ts":"2026-01-27T14:19:52.301Z","level":"info","event":"sheets\_write\_booking\_row","restaurant\_id":"roma","sheet\_id":"1MnaSIGqhieZVnxtnw\_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":28,"booking\_id":"a7781675-7a06-4571-9eef-b7429fac3b8f"}

   {"ts":"2026-01-27T14:19:52.301Z","level":"info","event":"create\_booking\_success","restaurant\_id":"roma","day":"2026-01-27","time":"19:30","people":2,"phone":"+393492674688","booking\_id":"a7781675-7a06-4571-9ee

   

   S5 — Orario fuori openings (not\_in\_openings)

1. “Vorrei prenotare domani alle 16:20.” - A quell'ora non siamo aperti. Posso proporle alcuni orari vicini 19 o diciannove:trenta? Va bene uno di questi.
2. Sì va bene. - Quante persone saranno?
3. Saremo in 5 - A nome di chi posso registrare la prenotazione,
   Luca - Userò il numero plus 3 9 3 4 9 2 6 7 4 6 8 8 per la prenotazione. Mi conferma che vuole prenotare per 5 persone domani 28 gennaio alle 19 a nome Luca

   Tool: {"ts":"2026-01-27T14:24:17.603Z","level":"info","event":"resolve\_relative\_day\_success","restaurant\_id":"roma","source":"vapi","request\_id":null,"text":"domani","date":"2026-01-28"}

   {"ts":"2026-01-27T14:24:18.467Z","level":"info","event":"capacity\_check\_success","restaurant\_id":"roma","day":"2026-01-28","requested\_time":"16:20","in\_openings":false,"slot\_exists":false,"active\_bookings\_count":null,"max\_concurrent\_bookings":3,"avg\_stay\_minutes":60,"available":false,"reason":"not\_in\_openings","nearest\_slots\_count":3,"source":"vapi","request\_id":null}

   {"ts":"2026-01-27T14:24:18.467Z","level":"info","event":"check\_openings\_success","restaurant\_id":"roma","day":"2026-01-28","closed":false,"openings\_count":8,"requested\_time":"16:20","available":false,"reason":"not\_in\_openings","source":"vapi","request\_id":null}

   {"ts":"2026-01-27T14:25:45.232Z","level":"info","event":"sheets\_write\_booking\_row","restaurant\_id":"roma","sheet\_id":"1MnaSIGqhieZVnxtnw\_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":29,"booking\_id":"4a2fa9e7-98ea-4c65-af1b-3c98d4280291"}

   {"ts":"2026-01-27T14:25:45.233Z","level":"info","event":"create\_booking\_success","restaurant\_id":"roma","day":"2026-01-28","time":"19:00","people":5,"phone":"+393492674688","booking\_id":"4a2fa9e7-98e

   

   S6 — Ambiguo 10/22

1. “Vorrei prenotare domani alle 10.” - Intende alle 10 del mattino alle 22 di sera?

   2\. “Di sera.” -  Siamo aperti domani alle 22 quante persone saranno?

   3\. “In 2, nome Luca.” - Posso confermare la prenotazione per 2 persone domani alle ventidue:zero a nome Luca Mi conferma?
   4. "Si" - La prenotazione è confermata per 2 persone domani alle 22 a nome Luca. La aspettiamo.

   Tool: {"ts":"2026-01-27T14:28:39.223Z","level":"info","event":"resolve\_relative\_day\_success","restaurant\_id":"roma","source":"vapi","request\_id":null,"text":"domani","date":"2026-01-28"}

   {"ts":"2026-01-27T14:28:40.261Z","level":"info","event":"resolve\_relative\_time\_error","restaurant\_id":"roma","source":"vapi","request\_id":null,"text":"10:00","error\_code":"UNSUPPORTED\_RELATIVE\_TIME","error\_message":"Espressione orario non riconosciuta."}

   {"ts":"2026-01-27T14:28:49.895Z","level":"info","event":"capacity\_check\_success","restaurant\_id":"roma","day":"2026-01-28","requested\_time":"22:00","in\_openings":true,"slot\_exists":true,"active\_bookings\_count":0,"max\_concurrent\_bookings":3,"avg\_stay\_minutes":60,"available":true,"reason":null,"nearest\_slots\_count":0,"source":"vapi","request\_id":null}

   {"ts":"2026-01-27T14:28:49.895Z","level":"info","event":"check\_openings\_success","restaurant\_id":"roma","day":"2026-01-28","closed":false,"openings\_count":8,"requested\_time":"22:00","available":true,"reason":null,"source":"vapi","request\_id":null}

   {"ts":"2026-01-27T14:29:14.313Z","level":"info","event":"sheets\_write\_booking\_row","restaurant\_id":"roma","sheet\_id":"1MnaSIGqhieZVnxtnw\_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":30,"booking\_id":"717a5ee8-09e4-41e3-bcfb-7bfc0e1c2d0b"}

   {"ts":"2026-01-27T14:29:14.313Z","level":"info","event":"create\_booking\_success","restaurant\_id":"roma","day":"2026-01-28","time":"22:00","people":2,"phone":"+393492674688","booking\_id":"717a5ee8-09e4
   

   S7 — Cambio idea a metà

   1.“Domani alle 21… anzi no venerdì alle 20:30.” - Siamo aperti venerdì 30 gennaio dalle 19 alle 23 e abbiamo disponibilità per le 20 30. Quante persone saranno?

   Tools: {"ts":"2026-01-27T14:32:12.701Z","level":"info","event":"resolve\_relative\_time\_error","restaurant\_id":"roma","source":"vapi","request\_id":null,"text":"20:30","error\_code":"UNSUPPORTED\_RELATIVE\_TIME","error\_message":"Espressione orario non riconosciuta."}

   {"ts":"2026-01-27T14:32:12.706Z","level":"info","event":"resolve\_relative\_day\_success","restaurant\_id":"roma","source":"vapi","request\_id":null,"text":"venerdì","date":"2026-01-30"}

   {"ts":"2026-01-27T14:32:14.259Z","level":"info","event":"capacity\_check\_success","restaurant\_id":"roma","day":"2026-01-30","requested\_time":"20:30","in\_openings":true,"slot\_exists":true,"active\_bookings\_count":0,"max\_concurrent\_bookings":3,"avg\_stay\_minutes":60,"available":true,"reason":null,"nearest\_slots\_count":0,"source":"vapi","request\_id":null}

   {"ts":"2026-01-27T14:32:14.260Z","level":"info","event":"check\_openings\_success","restaurant\_id":"roma","day":"2026-01-30","closed":false,"openings\_count":14,"requested\_time":"20:30","available":true
   

   S8 — Modifica prenotazione (identificazione) /Sembra ok tranne il fatto che ha detto l'anno che non è molto utile, e l'ha detto pure in inglese 

   “Vorrei spostare la prenotazione.” - Mi può fornire il numero di telefono utilizzato per la prenotazione

   2\. “Numero 3331234567.” -  trovato diverse prenotazioni per il giorno 27 gennaio 2026. Può indicarmi a quale prenotazione desidera apportare modifiche Ecco le opzioni: uno. Cliente 3 persone alle 20. 2. Valentina Boscaiolo 2 persone alle 20, 3 parla a bolle, 2 persone alle 22, 4
   attenta, nome, parla bolle data 29 gennaio, 2026 orario 22 persone 2

   3\. per Valentina Boscaiolo. - Perfetto, desidera modificare il giorno, l'orario o il numero di persone per la prenotazione di Valentina Boscaiolo

   4\. “Alle 21:00.” - A quell'ora non abbiamo disponibilità posso proporle alcuni orari vicini alle 22 o alle diciannove:zero 30.
   

   Tool:{"ts":"2026-01-27T14:35:34.560Z","level":"info","event":"list\_bookings\_success","restaurant\_id":"roma","phone":"+393492674688","count":0,"source":"vapi","request\_id":null}

   {"ts":"2026-01-27T14:36:22.039Z","level":"info","event":"capacity\_check\_success","restaurant\_id":"roma","day":"2026-01-27","requested\_time":"21:00","in\_openings":true,"slot\_exists":true,"active\_bookings\_count":5,"max\_concurrent\_bookings":3,"avg\_stay\_minutes":60,"available":false,"reason":"full","nearest\_slots\_count":3,"source":"vapi","request\_id":null}

   {"ts":"2026-01-27T14:36:22.039Z","level":"info","event":"check\_openings\_success","restaurant\_id":"roma","day":"2026-01-27","closed":false,"openings\_count":8,"requested\_time":"21:00","available":false,

