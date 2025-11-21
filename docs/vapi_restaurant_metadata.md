\# Metadata Ristorante – VAPI → Backend

Giornata 8 – Fase 3



Obiettivo: 1 solo Agent VAPI multi-ristorante.  

Il ristorante attivo è deciso dal numero Twilio che il cliente chiama.



---



\## 1. Regola generale



\- Esiste un \*\*solo Agent VAPI\*\*.

\- Ogni ristorante ha \*\*un numero Twilio dedicato\*\*.

\- Twilio, quando inoltra la chiamata a VAPI, passa il numero chiamato (es. `to = +39...`).

\- In VAPI, per ogni numero Twilio, viene impostato un metadata fisso:

&nbsp; - `restaurant\_id = "<id\_ristorante>"`



L’Agent NON decide mai il restaurant\_id.  

Lo riceve già pronto e lo usa nei Tools.



---



\## 2. Esempio mapping numeri → restaurant\_id



\- `+39 06 1234567` → `restaurant\_id = "roma"`

\- `+39 02 7654321` → `restaurant\_id = "milano\_centro"`

\- `+39 011 9998888` → `restaurant\_id = "torino\_brera"`



(Per l’MVP abbiamo solo `roma`, ma la struttura è pronta per più ristoranti.)



---



\## 3. Regola di utilizzo nei Tools



L’Agent deve SEMPRE includere il `restaurant\_id` nel body JSON di TUTTI i tools:



\- `check\_openings`

\- `create\_booking`

\- `list\_bookings`

\- `modify\_booking`

\- `cancel\_booking`

\- `faq`

\- `send\_sms`



Esempio di chiamata CORRETTA:



```json

{

&nbsp; "restaurant\_id": "roma",

&nbsp; "day": "2025-12-01",

&nbsp; "time": "20:00",

&nbsp; "people": 2,

&nbsp; "name": "Mario",

&nbsp; "phone": "+393471234567",

&nbsp; "notes": null

}



