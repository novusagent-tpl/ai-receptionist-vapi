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



S4 — Full (capacity)
1. "Vorrei prenotare domani alle 20:00." - 

2. "OK alle 21:00."


S5 — Orario fuori openings (not\_in\_openings)
1. “Vorrei prenotare domani alle 16:20.” - 


S6 — Ambiguo 10/22
1. “Vorrei prenotare domani alle 10.” -



2\. “Di sera.” - 



3\. “In 2, nome Luca.” - 



S7 — Cambio idea a metà
1. “Domani alle 21… anzi no venerdì alle 20:30.” - 


S8 — Modifica prenotazione (identificazione)
1. “Vorrei spostare la prenotazione.” -



2\. “Numero 3331234567.” -



3\. “Alle 21:00.” -

