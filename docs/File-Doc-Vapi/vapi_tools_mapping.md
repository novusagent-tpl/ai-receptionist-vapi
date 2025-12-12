\# Tools Mapping – VAPI → Backend  

Giornata 8 – Fase 2



Questa tabella definisce in modo RIGIDO come l’Agent VAPI deve chiamare i Tools HTTP del nostro backend.  

Nessuna invenzione. Nessuna variazione. Nessun campo extra.



---



\# 1. check\_openings



\## Nome tool

check\_openings



\## Metodo

POST



\## Endpoint

http://localhost:3000/api/check\_openings



\## Body richiesto

{

&nbsp; "restaurant\_id": "<string>",

&nbsp; "date": "<YYYY-MM-DD>"

}



\## Risposta attesa

{

&nbsp; "ok": true,

&nbsp; "restaurant\_id": "<string>",

&nbsp; "date": "<YYYY-MM-DD>",

&nbsp; "closed": false,

&nbsp; "slots": \["19:00", "19:30", "20:00"]

}



\## Errori

VALIDATION\_ERROR  

CHECK\_OPENINGS\_ERROR



\## Quando usarlo

\- Orari richiesti dal cliente  

\- “Siete aperti domani?”  

\- “Che disponibilità avete?”  



---



\# 2. create\_booking



\## Nome tool

create\_booking



\## Endpoint

http://localhost:3000/api/create\_booking



\## Body

{

&nbsp; "restaurant\_id": "<string>",

&nbsp; "day": "<YYYY-MM-DD>",

&nbsp; "time": "<HH:mm>",

&nbsp; "people": <number>,

&nbsp; "name": "<string>",

&nbsp; "phone": "<string>",

&nbsp; "notes": "<string or null>"

}



\## Risposta

{

&nbsp; "ok": true,

&nbsp; "booking\_id": "<string>",

&nbsp; "day": "<YYYY-MM-DD>",

&nbsp; "time": "<HH:mm>",

&nbsp; "people": <number>,

&nbsp; "name": "<string>",

&nbsp; "phone": "<string>",

&nbsp; "notes": "<string or null>",

&nbsp; "event\_id": "<string>"

}



\## Errori

VALIDATION\_ERROR  

MAX\_PEOPLE\_EXCEEDED  

CREATE\_BOOKING\_ERROR



\## Uso

\- Conferma finale del flusso prenotazione



---



\# 3. list\_bookings



\## Nome tool

list\_bookings



\## Endpoint

http://localhost:3000/api/list\_bookings



\## Body

{

&nbsp; "restaurant\_id": "<string>",

&nbsp; "phone": "<string>"

}



\## Risposta

{

&nbsp; "ok": true,

&nbsp; "results": \[

&nbsp;   {

&nbsp;     "booking\_id": "<string>",

&nbsp;     "day": "<YYYY-MM-DD>",

&nbsp;     "time": "<HH:mm>",

&nbsp;     "people": <number>,

&nbsp;     "name": "<string>",

&nbsp;     "phone": "<string>",

&nbsp;     "notes": "<string or null>"

&nbsp;   }

&nbsp; ]

}



\## Uso

\- Modifica prenotazione  

\- Cancellazione prenotazione  

\- Identificazione prenotazione del cliente  



---



\# 4. modify\_booking



\## Nome tool

modify\_booking



\## Endpoint  

http://localhost:3000/api/modify\_booking



\## Body

{

&nbsp; "restaurant\_id": "<string>",

&nbsp; "booking\_id": "<string>",

&nbsp; "new\_day": "<YYYY-MM-DD or null>",

&nbsp; "new\_time": "<HH:mm or null>",

&nbsp; "new\_people": <number or null>

}



\## Risposta

{

&nbsp; "ok": true,

&nbsp; "booking\_id": "<string>",

&nbsp; "day": "<YYYY-MM-DD>",

&nbsp; "time": "<HH:mm>",

&nbsp; "people": "<string or number>",

&nbsp; "name": "<string>",

&nbsp; "phone": "<string>",

&nbsp; "notes": "<string>"

}



\## Errori

VALIDATION\_ERROR  

MODIFY\_BOOKING\_ERROR  



\## Uso

\- Modificare giorno, ora o persone di una prenotazione



---



\# 5. cancel\_booking



\## Nome tool

cancel\_booking



\## Endpoint  

http://localhost:3000/api/cancel\_booking



\## Body

{

&nbsp; "restaurant\_id": "<string>",

&nbsp; "booking\_id": "<string>"

}



\## Risposta

{

&nbsp; "ok": true,

&nbsp; "booking\_id": "<string>",

&nbsp; "canceled": true

}



\## Errori

VALIDATION\_ERROR  

CANCEL\_BOOKING\_ERROR  



\## Uso

\- Cancellazione prenotazione



---



\# 6. faq



\## Nome tool

faq



\## Endpoint  

http://localhost:3000/api/faq



\## Body

{

&nbsp; "restaurant\_id": "<string>"

}



\## Risposta

{

&nbsp; "ok": true,

&nbsp; "restaurant\_id": "<string>",

&nbsp; "faqs": \[

&nbsp;   { "q": "<string>", "a": "<string>" }

&nbsp; ]

}



\## Errori

VALIDATION\_ERROR  

FAQ\_ERROR  



\## Uso

\- Domande generiche: senza glutine, parcheggio, tavoli esterni, ecc.



---



\# 7. send\_sms



\## Nome tool

send\_sms



\## Endpoint  

http://localhost:3000/api/send\_sms



\## Body

{

&nbsp; "restaurant\_id": "<string>",

&nbsp; "to": "<string>",

&nbsp; "message": "<string>"

}



\## Risposta (se Twilio NON configurato)

{

&nbsp; "ok": false,

&nbsp; "error\_code": "SMS\_NOT\_CONFIGURED"

}



\## Uso

\- Inviare SMS di conferma / modifica / cancellazione



---



\# Note finali



\- Tutti i tools sono POST.  

\- L’Agent non deve mai inventare campi.  

\- Ogni tool restituisce sempre ok:true/false.  

\- Se ok:false, l’Agent chiede chiarimento o indica un problema.  



