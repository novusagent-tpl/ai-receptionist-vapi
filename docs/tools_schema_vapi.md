\# Tools API – Schema JSON (MVP VAPI)



Questo documento definisce lo schema JSON standard per tutti i tools che l'Agent Vapi può chiamare.



Regole generali:

\- Tutte le richieste sono POST con Content-Type: application/json.

\- Tutti i tool accettano restaurant\_id per gestire il multi-ristorante.

\- Formato data: YYYY-MM-DD.

\- Formato ora: HH:MM 24h.

\- Telefoni in formato E.164 (+39…).

\- Risposte: ok:true per successo, ok:false con error\_code + error\_message per errore.



------------------------------------------------------------

1\. check\_openings

Endpoint: POST /api/check\_openings



Request JSON:

{ "restaurant\_id": "roma", "date": "2025-02-14" }



Response JSON (successo):

{ "ok": true, "date": "2025-02-14", "slots": \["19:00","19:30","20:00"], "closed": false, "notes": null }



Response JSON (errore):

{ "ok": false, "error\_code": "INVALID\_DATE", "error\_message": "La data fornita non è valida." }



------------------------------------------------------------

2\. create\_booking

Endpoint: POST /api/create\_booking



Request JSON:

{ "restaurant\_id": "roma", "day": "2025-02-14", "time": "20:00", "people": 2, "name": "Mario Rossi", "phone": "+393331234567", "notes": "Compleanno" }



Response JSON (successo):

{ "ok": true, "booking\_id": "abc123", "restaurant\_id": "roma", "day": "2025-02-14", "time": "20:00", "people": 2, "name": "Mario Rossi", "phone": "+393331234567", "notes": "Compleanno" }



Response JSON (errore):

{ "ok": false, "error\_code": "CLOSED\_OR\_FULL", "error\_message": "Per il giorno e orario richiesti non ci sono disponibilità." }



------------------------------------------------------------

3\. list\_bookings

Endpoint: POST /api/list\_bookings



Request JSON:

{ "restaurant\_id": "roma", "phone": "+393331234567" }



Response JSON (successo):

{ "ok": true, "results": \[ { "booking\_id": "abc123", "day": "2025-02-14", "time": "20:00", "people": 2, "name": "Mario Rossi", "phone": "+393331234567", "notes": "Compleanno" }, { "booking\_id": "xyz789", "day": "2025-02-20", "time": "21:00", "people": 4, "name": "Mario Rossi", "phone": "+393331234567", "notes": null } ] }



Response JSON (errore):

{ "ok": false, "error\_code": "LOOKUP\_ERROR", "error\_message": "Impossibile recuperare le prenotazioni in questo momento." }



------------------------------------------------------------

4\. modify\_booking

Endpoint: POST /api/modify\_booking



Request JSON:

{ "restaurant\_id": "roma", "booking\_id": "abc123", "new\_day": "2025-02-14", "new\_time": "21:00", "new\_people": 3 }



Response JSON (successo):

{ "ok": true, "booking\_id": "abc123", "restaurant\_id": "roma", "day": "2025-02-14", "time": "21:00", "people": 3, "name": "Mario Rossi", "phone": "+393331234567", "notes": "Compleanno" }



Response JSON (errore):

{ "ok": false, "error\_code": "BOOKING\_NOT\_FOUND", "error\_message": "La prenotazione indicata non esiste." }



------------------------------------------------------------

5\. cancel\_booking

Endpoint: POST /api/cancel\_booking



Request JSON:

{ "restaurant\_id": "roma", "booking\_id": "abc123" }



Response JSON (successo):

{ "ok": true, "booking\_id": "abc123", "restaurant\_id": "roma", "day": "2025-02-14", "time": "20:00", "people": 2, "name": "Mario Rossi", "phone": "+393331234567", "notes": "Compleanno", "canceled": true }



Response JSON (errore):

{ "ok": false, "error\_code": "BOOKING\_NOT\_FOUND", "error\_message": "Non ho trovato la prenotazione da cancellare." }



------------------------------------------------------------

6\. faq

Endpoint: POST /api/faq



Request JSON:

{ "restaurant\_id": "roma", "question": "Avete opzioni senza glutine?" }



Response JSON (successo):

{ "ok": true, "answer": "Sì, abbiamo alcune opzioni senza glutine.", "source": "kb" }



Response JSON (successo senza info):

{ "ok": true, "answer": null, "source": null }



Response JSON (errore):

{ "ok": false, "error\_code": "FAQ\_ERROR", "error\_message": "Problema nel recupero delle informazioni." }



------------------------------------------------------------

7\. send\_sms (opzionale)

Endpoint: POST /api/send\_sms



Request JSON:

{ "restaurant\_id": "roma", "phone": "+393331234567", "message": "La tua prenotazione per il 14/02 alle 20:00 è confermata." }



Response JSON (successo):

{ "ok": true, "sid": "SMXXXXXXXXXXXXXXXXXXXXXXXXXXXX" }



Response JSON (errore):

{ "ok": false, "error\_code": "TWILIO\_ERROR", "error\_message": "Invio SMS non riuscito." }

