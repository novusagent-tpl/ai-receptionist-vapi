S0 — Prenotazione stasera + orario
Vorrei prenotare stasera alle 21 - L'orario che mi ha indicato è già passato. Può scegliere un orario più avanti?
/Qui non chiama nessun tool e risponde direttamente cosi senza nessun controllo, prendeno in calcolo che ora sono le 18:05 al momento della chiamata ed il orario non è passato

S1 - Orari Semplici (NO prenotazione) 
1.Siete aperti stasera ? - Siamo aperti stasera dalle 19 alle 22.30. A che ora preferisci
2.E a che ora chiudete ? - Chiudiamo stasera alle ventidue:trenta, vuoi prenotare per un orario specifico?

QUESTI sono i log:
{"ts":"2026-01-28T16:34:43.645Z","level":"info","event":"check\_openings\_success","restaurant\_id":"roma","day":"2026-01-28","closed":false,"openings\_count":8,"requested\_time":null,"available":null,"reason":null,"source":"vapi","request\_id":null}


S2 — Prenotazione completa (happy path) 

1.Vorrei prenotare domani alle 21. - Domani siamo aperti a cena dalle 19 alle 22.30 e ho disponibilità per la tua prenotazione. Alle 21. Quante persone saranno?
2. Siamo in 4, nome Marco, telefono 3331234567. - La tua prenotazione è confermata per domani 29 gennaio alle 21 per 4 persone a nome Marco. Se hai bisogno di ulteriore aiuto, non esitare a chiedere.
QUESTI sono i log:
{"ts":"2026-01-28T16:37:11.658Z","level":"info","event":"resolve\_relative\_day\_success","restaurant\_id":"roma","source":"vapi","request\_id":null,"text":"domani","date":"2026-01-29"}

{"ts":"2026-01-28T16:37:13.276Z","level":"info","event":"capacity\_check\_success","restaurant\_id":"roma","day":"2026-01-29","requested\_time":"21:00","in\_openings":true,"slot\_exists":true,"active\_bookings\_count":0,"max\_concurrent\_bookings":3,"avg\_stay\_minutes":60,"available":true,"reason":null,"nearest\_slots\_count":0,"source":"vapi","request\_id":null}

{"ts":"2026-01-28T16:37:13.276Z","level":"info","event":"check\_openings\_success","restaurant\_id":"roma","day":"2026-01-29","closed":false,"openings\_count":8,"requested\_time":"21:00","available":true,"reason":null,"source":"vapi","request\_id":null}

{"ts":"2026-01-28T16:37:34.993Z","level":"info","event":"sheets\_write\_booking\_row","restaurant\_id":"roma","sheet\_id":"1MnaSIGqhieZVnxtnw\_lSC-Uz1wNzHbTWgWg8WC9s1Lk","tab":"Bookings","row":34,"booking\_id":"24d390a9-4189-4179-9be0-ad3fbd66674f"}

{"ts":"2026-01-28T16:37:34.993Z","level":"info","event":"create\_booking\_success","restaurant\_id":"roma","day":"2026-01-29","time":"21:00","people":4,"phone":"+393331234567","booking\_id":"24d390a9-4189-4179-9be0-ad3fbd66674f","source":"vapi","request\_id":null}



S3 — Cutoff
1.Vorrei prenotare domani alle 22:30. - Domani è domenica. Verifichiamo se abbiamo disponibilità per domani alle ventidue:trenta. Un momento per favore. 
- Siamo aperti domani fino alle 22 e 30. Ma non accettiamo prenotazioni così a ridosso della chiusura. Posso proporle alcuni orari le 22 le 21 e 30 o le 21. Va bene uno di questi?
2.Allora alle 22:00 va bene. - Perfetto, posso avere il suo nome per favore?
QUESTI sono i log:
{"ts":"2026-01-28T16:43:33.912Z","level":"info","event":"capacity\_check\_success","restaurant\_id":"roma","day":"2026-01-29","requested\_time":"22:30","in\_openings":true,"slot\_exists":false,"active\_bookings\_count":null,"max\_concurrent\_bookings":3,"avg\_stay\_minutes":60,"available":false,"reason":"cutoff","nearest\_slots\_count":3,"source":"vapi","request\_id":null}

{"ts":"2026-01-28T16:43:33.912Z","level":"info","event":"check\_openings\_success","restaurant\_id":"roma","day":"2026-01-29","closed":false,"openings\_count":8,"requested\_time":"22:30","available":false,"reason":"cutoff","source":"vapi","request\_id":null}





S4 — Full (capacity)

1. "Vorrei prenotare domani alle 20:00." - A quell'ora non abbiamo disponibilità posso proporle alcuni orari vicini 19 30 o 22 Va bene uno di questi?
2. "OK alle 21:00." - Perfetto, Quante persone saranno?

   Tools:

   

   S5 — Orario fuori openings (not\_in\_openings)
   1.“Vorrei prenotare domani alle 16:20.” - A quell'ora non siamo aperti. Posso proporle alcuni orari vicini 19 o diciannove:trenta? Va bene uno di questi.

   2.Sì va bene. - Quante persone saranno?

   3.Saremo in 5 - A nome di chi posso registrare la prenotazione,
   4.Luca - Userò il numero plus 3 9 3 4 9 2 6 7 4 6 8 8 per la prenotazione. Mi conferma che vuole prenotare per 5 persone domani 28 gennaio alle 19 a nome Luca.

   Tool:

   

   S6 — Ambiguo 10/22

   1.“Vorrei prenotare domani alle 10.” - Intende alle 10 del mattino alle 22 di sera?
   2.“Di sera.” -  Siamo aperti domani alle 22 quante persone saranno?
   3.“In 2, nome Luca.” - Posso confermare la prenotazione per 2 persone domani alle ventidue:zero a nome Luca Mi conferma?
   4."Si" - La prenotazione è confermata per 2 persone domani alle 22 a nome Luca. La aspettiamo.

   Tool:

   

   S7 — Cambio idea a metà

   1.“Domani alle 21… anzi no venerdì alle 20:30.” - Siamo aperti venerdì 30 gennaio dalle 19 alle 23 e abbiamo disponibilità per le 20 30. Quante persone saranno?

   

   Tools:

   

   S8 — Modifica prenotazione (identificazione) /Sembra ok tranne il fatto che ha detto l'anno che non è molto utile, e l'ha detto pure in inglese

   “Vorrei spostare la prenotazione.” - Mi può fornire il numero di telefono utilizzato per la prenotazione

   2\. “Numero 3331234567.” -  trovato diverse prenotazioni per il giorno 27 gennaio 2026. Può indicarmi a quale prenotazione desidera apportare modifiche Ecco le opzioni: uno. Cliente 3 persone alle 20. 2. Valentina Boscaiolo 2 persone alle 20, 3 parla a bolle, 2 persone alle 22, 4
   attenta, nome, parla bolle data 29 gennaio, 2026 orario 22 persone 2

   3\. per Valentina Boscaiolo. - Perfetto, desidera modificare il giorno, l'orario o il numero di persone per la prenotazione di Valentina Boscaiolo

   4\. “Alle 21:00.” - A quell'ora non abbiamo disponibilità posso proporle alcuni orari vicini alle 22 o alle diciannove:zero 30.

   

   Tool:

   

   S9 — Cancellazione prenotazione

   1.“Voglio cancellare la prenotazione.”

   2.“Telefono 3331234567.”

   3.“Sì, confermo.”

   Tool:

   

   S10 — FAQ (parcheggio, cani, allergie, menu)

   1.“Avete parcheggio?”

   2.“E piatti senza glutine avete?”

   Tool:

   S11 — “Tra un’ora” (relativo)
   1.“Tra un’ora siete aperti?”

   2\.“Ok, allora prenoto.”
   Tool: 

   S12 — Errore tecnico / config

   1\.“Vorrei prenotare” (usa restaurant\_id errato in test ambiente)
   Tool:

