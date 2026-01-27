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

1. "Vorrei prenotare domani alle 20:00." - A quell'ora non abbiamo disponibilità posso proporle alcuni orari vicini 19 30 o 22 Va bene uno di questi?
2. "OK alle 21:00." - Perfetto, abbiamo disponibilità per le 22 Quante persone saranno?

   Le risposte sembrano tutto ok...


Tools: {"ts":"2026-01-27T12:46:54.079Z","level":"info","event":"resolve\_relative\_day\_success","restaurant\_id":"roma","source":"vapi","request\_id":null,"text":"oggi","date":"2026-01-27"}

{"ts":"2026-01-27T12:46:54.093Z","level":"info","event":"resolve\_relative\_time\_error","restaurant\_id":"roma","source":"vapi","request\_id":null,"text":"alle 20","error\_code":"UNSUPPORTED\_RELATIVE\_TIME","error\_message":"Espressione orario non riconosciuta."}

{"ts":"2026-01-27T12:46:55.356Z","level":"info","event":"capacity\_check\_success","restaurant\_id":"roma","day":"2026-01-27","requested\_time":"20:00","in\_openings":true,"slot\_exists":true,"active\_bookings\_count":3,"max\_concurrent\_bookings":3,"avg\_stay\_minutes":60,"available":false,"reason":"full","nearest\_slots\_count":3,"source":"vapi","request\_id":null}

{"ts":"2026-01-27T12:46:55.356Z","level":"info","event":"check\_openings\_success","restaurant\_id":"roma","day":"2026-01-27","closed":false,"openings\_count":8,"requested\_time":"20:00","available":false,"reason":"full","source":"vapi","request\_id":null}

{"ts":"2026-01-27T12:47:12.868Z","level":"info","event":"resolve\_relative\_day\_success","restaurant\_id":"roma","source":"vapi","request\_id":null,"text":"oggi","date":"2026-01-27"}

{"ts":"2026-01-27T12:47:13.340Z","level":"info","event":"capacity\_check\_success","restaurant\_id":"roma","day":"2026-01-27","requested\_time":"22:00","in\_openings":true,"slot\_exists":true,"active\_bookings\_count":2,"max\_concurrent\_bookings":3,"avg\_stay\_minutes":60,"available":true,"reason":null,"nearest\_slots\_count":0,"source":"vapi","request\_id":null}

{"ts":"2026-01-27T12:47:13.340Z","level":"info","event":"check\_openings\_success","restaurant\_id":"roma","day":"2026-01-27","closed":false,"openings\_count":8,"requested\_time":"22:00","available":true,"r...

/ Inoltre in questa chiamata ho osservato delle cose: 1. Se non capisce o non sente quello che dico sta zitta e non dice nulla e poi se passa x secondi chiude la chiamata in automatico, questo non va bene e non è umano per niente quindi va risolta anche questa cosa. 2.Inoltre dovrebbe rispondere e dire gli orari in un modo più normale, per esempio ha fatto 2 test in cui ho detto alle venti e mezza e non ha capito e ha detto di dire in formato hh:mm però dovrebbe chiedere in formato ore e minuti, inoltre in questo test dovrebbe capire il orario venti e mezza, però poi ho fatto un altro test e l'ha capito quindi non so cosa dire, dobbiamo fare in modo che capisca sempre e non crei questi problemi e anche se non capisce dopo aver pensato o usato i tool dovrebbe chiedere di nuovo per sicurezza.


S5 — Orario fuori openings (not\_in\_openings)

1. “Vorrei prenotare domani alle 16:20.” - A quell'ora non siamo aperti. Posso proporle alcuni orari vicini 19 19 30 o 20 Va bene uno di questi?                        
2. Sì va bene. - Quante persone saranno?
3. Saremo in 5 - A che nome posso registrare la prenotazione?
4. Luca - Userò il numero 3 9 3 4 9 2 6 7 4 6 8 8 per la prenotazione. Mi conferma che vuole prenotare per 5 persone domani 28 gennaio alle 19 a nome Luca

   Tool: {"ts":"2026-01-27T12:58:12.562Z","level":"info","event":"resolve\_relative\_day\_success","restaurant\_id":"roma","source":"vapi","request\_id":null,"text":"domani","date":"2026-01-28"}
   {"ts":"2026-01-27T12:58:12.895Z","level":"info","event":"capacity\_check\_success","restaurant\_id":"roma","day":"2026-01-28","requested\_time":"16:20","in\_openings":false,"slot\_exists":false,"active\_bookings\_count":null,"max\_concurrent\_bookings":3,"avg\_stay\_minutes":60,"available":false,"reason":"not\_in\_openings","nearest\_slots\_count":3,"source":"vapi","request\_id":null}
   {"ts":"2026-01-27T12:58:12.895Z","level":"info","event":"check\_openings\_success","restaurant\_id":"roma","day":"2026-01-28","closed":false,"openings\_count":8,"requested\_time":"16:20","available":false,"reason":"not\_in\_openings","source":"vapi","request\_id":null}
   {"ts":"2026-01-27T13:08:00.105Z","level":"info","event":"resolve\_relative\_day\_success","restaurant\_id":"roma","source":"vapi","request\_id":null,"text":"domani","date":"2026-01-28"}

{"ts":"2026-01-27T13:08:00.566Z","level":"info","event":"resolve\_relative\_time\_error","restaurant\_id":"roma","source":"vapi","request\_id":null,"text":"10","error\_code":"UNSUPPORTED\_RELATIVE\_TIME","err

/Allora anche qui ho osservato una cosa che bisogna risolvere, secondo me non dovrebbe proppore orari vicini se il orario che chiede il cliente il ristorante è chiuso, perché lui mi ha risposto con A quell'ora non siamo aperti. Posso proporle alcuni orari vicini 19 19 30 o 20 Va bene uno di questi? e io ho detto si dai e poi lui ha detto Quante persone saranno?, però il orario non è definito è sono andato avanti con la prenotazione è quando ha confermato tutto come orario ha preso le 19. Dovrebbe essere molto più rigido sulla questione delle prenotazioni secondo me. 2) Un altra cosa è che prima di confermare una prenotazione dice cosi : Userò il numero 3 9 3 4 9 2 6 7 4 6 8 8 per la prenotazione.(inoltre sarebbe utile che non specificasse il +39 quanto dice il numero) Mi conferma che vuole prenotare per 5 persone domani 28 gennaio alle 19 a nome Luca. che è utile però sarebbe meglio anche se potrebbe dire che come numero usa quello da cui sta chiamando che secondo me è più pulito però solo se il cliente non dice nulla riguardo al numero, solo se lo dice prima o se viuole usare un altro numero poi per la conferma è utile ripeterlo.

Secondo me la cosa migliore è fare uno schema rigido che deve seguire per ogni prenotazione cosi segue sempre quella e non può sbagliare mai, o l'abbiamo già fatto questo. Tu cosa consigli che sia la scelta migliore? Perché la maggior parte dei clienti diciamo che è anche in eta quindi anziani/adulti quindi tutto il sistema ovvero la receptionist dovrebbe essere semplice e facile da capire ma che comunque dovrebbe essere rigida e professionale.

Io non capisco se il problema è che le istruzioni che diamo alla receptionist siano troppo rigide o non siano rigide abbastanza. Forse dobbiamo fare in modo che il modo che le istruzioni siano rigide come orari/prenotazioni/date/SLOTS, DISPONIBILITÀ, CUTOFF ma il modo in cui parla sia più libero è umano in modo che riesca a parlare in modo più semplice ma anche più chiaro, cosa ne pensi ?



S6 — Ambiguo 10/22

1. “Vorrei prenotare domani alle 10.” - L'orario che mi indicato non è riconosciuto come valido Puoi indicarmi l'orario esatto. Se 10.



2\. “Di sera.” - \*Ho chiuso la chiamata e non ho più continuato\*



3\. “In 2, nome Luca.” -...

Tool: {"ts":"2026-01-27T13:08:15.662Z","level":"info","event":"resolve\_relative\_day\_success","restaurant\_id":"roma","source":"vapi","request\_id":null,"text":"domani","date":"2026-01-28"}

{"ts":"2026-01-27T13:08:16.909Z","level":"info","event":"capacity\_check\_success","restaurant\_id":"roma","day":"2026-01-28","requested\_time":"10:00","in\_openings":false,"slot\_exists":false,"active\_bookings\_count":null,"max\_concurrent\_bookings":3,"avg\_stay\_minutes":60,"available":false,"reason":"not\_in\_openings","nearest\_slots\_count":3,"source":"vapi","request\_id":null}

{"ts":"2026-01-27T13:08:16.909Z","level":"info","event":"check\_openings\_success","restaurant\_id":"roma","day":"2026-01-28","closed":false,"openings\_count":8,"requested\_time":"10:00","available":false,"r

/Qui non agisce per niente come dovrebbe e prende il orario matinale senza chiedere se si riferisce a quello matinale o serale, non va bene. BIsogna risolvere anche questo



S7 — Cambio idea a metà

1. “Domani alle 21… anzi no venerdì alle 20:30.” - Siamo aperti a cena dalle 19 alle 23 Ci sono disponibilità per domani venerdì, alle venti:trenta. Quante persone saranno?

   Tools: {"ts":"2026-01-27T13:13:47.892Z","level":"info","event":"resolve\_relative\_time\_error","restaurant\_id":"roma","source":"vapi","request\_id":null,"text":"venti e trenta","error\_code":"UNSUPPORTED\_RELATIVE\_TIME","error\_message":"Espressione orario non riconosciuta."}
   {"ts":"2026-01-27T13:13:47.895Z","level":"info","event":"resolve\_relative\_day\_success","restaurant\_id":"roma","source":"vapi","request\_id":null,"text":"venerdì","date":"2026-01-30"}
   {"ts":"2026-01-27T13:13:49.520Z","level":"info","event":"capacity\_check\_success","restaurant\_id":"roma","day":"2026-01-30","requested\_time":"20:30","in\_openings":true,"slot\_exists":true,"active\_bookings\_count":0,"max\_concurrent\_bookings":3,"avg\_stay\_minutes":60,"available":true,"reason":null,"nearest\_slots\_count":0,"source":"vapi","request\_id":null}

{"ts":"2026-01-27T13:13:49.520Z","level":"info","event":"check\_openings\_success","restaurant\_id":"roma","day":"2026-01-30","closed":false,"openings\_count":14,"requested\_time":"20:30","available":true,"reas

/qui non ha alcun senso perché domani non è venerdì e non è nemmeno quello l'orario del ristorante, sembra sfasata la receptionist. Dobbiamo risolvere questi problemi una volta per tutti.



S8 — Modifica prenotazione (identificazione)

1. “Vorrei spostare la prenotazione.” - Posso aiutarla con questo? Mi può fornire il numero di telefono utilizzato per la prenotazione?



2\. “Numero 3331234567.” - Ho trovato diverse prenotazioni associate a questo numero Può indicarmi quale prenotazione desidera modificare ecco I dettagli uno. Nome. Cliente data 27 gennaio toothan26 orario. 20 anni, persone 3 2 nome Valentina Boscaiolo data 28 gennaio 2026 orario venta persone pandol duo tret, attenta, nome, parla bolle data 29 gennaio, 2026 orario 22 persone 2



3\. “Alle 21:00.” -

Tool: {"ts":"2026-01-27T13:20:08.105Z","level":"info","event":"list\_bookings\_success","restaurant\_id":"roma","phone":"+393492674688","count":0,"source":"vapi","request\_id":null}

/Qui un altro problema grande è che su questo numero ho più prenotazione nei prossimi giorni quindi ha iniziato a elencarmi tutte le prenotazioni in modo strano e pre niente in modo umano, e io quando volevo interomperla non si fermava. Il modo migliore sarebbe chiedere l'orario o il giorno della prenotazione che vorebbbe modificare il cliente prima di tutto senza mai fare l'elenco di tutte le prenotazione con tutti i dati, o almeno sarebbe utile dire solo il giorno o il nome e oraio

