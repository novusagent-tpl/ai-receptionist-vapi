\# Test Finale Onboarding – AI Receptionist VAPI

Questo documento contiene la procedura di test completa e ripetibile per validare l’onboarding tecnico di un nuovo ristorante prima della messa online.



---



\# 1. Obiettivo del test

Verificare che l’intero flusso funzioni correttamente:



Numero → Vapi → Backend → Tools API → Sheets → Calendar



---



\# 2. Prerequisiti

Prima di iniziare i test, assicurarsi che:



\- `kb/<restaurant\_id>.json` esista ed è compilato correttamente.

\- `src/config/ristoranti.json` contiene l’entry corretta.

\- Foglio Google è stato creato con colonne:

booking\_id | day | time | people | name | phone | notes | created\_at | event\_id

- Calendar dedicato è creato e condiviso col Service Account.

\- Tutti i \*\*7 Tools API\*\* sono configurati nell'assistente Vapi:

\- check\_openings

\- create\_booking

\- list\_bookings

\- modify\_booking

\- cancel\_booking

\- faq

\- send\_sms

\- L’assistente risponde correttamente in chat Vapi.



---



\# 3. Test di prenotazione vocale (LIVE)



1\. Chiama il numero assegnato al ristorante.

2\. Attendi il saluto e verifica:

&nbsp;- Nome ristorante corretto

&nbsp;- Nessuna latenza anomala

3\. Pronuncia:

&nbsp;> "Vorrei prenotare un tavolo."



4\. Completa il flusso:

&nbsp;- Nome: “Test AI”

&nbsp;- Numero: il tuo

&nbsp;- Giorno: domani

&nbsp;- Ora: 20:00

&nbsp;- Persone: 2



\### Verifiche immediate:



\#### Google Sheet:

\- nuova riga creata

\- campi compilati correttamente:

\- `booking\_id`

\- `day`

\- `time`

\- `people`

\- `name`

\- `phone`

\- `created\_at`

\- `event\_id`

\- nessun campo vuoto anomalo



\#### Google Calendar:

\- evento creato nel giorno/orario giusto

\- titolo con nome cliente

\- descrizione coerente (se presente)



---



\# 4. Test di modifica prenotazione



1\. Richiama il numero.

2\. Pronuncia:

&nbsp;> "Vorrei modificare la prenotazione a nome Test AI."



3\. Cambia un parametro (es. ora 21:00).



\### Verifiche:



\#### Sheet:

\- riga modificata, non creata nuova

\- valori aggiornati correttamente



\#### Calendar:

\- evento spostato alla nuova ora



---



\# 5. Test di cancellazione prenotazione



1\. Chiama il numero.

2\. Pronuncia:

&nbsp;> "Vorrei cancellare la mia prenotazione."



\### Verifiche:



\#### Sheet:

\- riga aggiornata come cancellata (secondo logica backend)



\#### Calendar:

\- evento eliminato



---



\# 6. Test orari \& FAQ



Chiama il numero e chiedi:



\- “Quali sono i vostri orari?”  

\- “Avete opzioni senza glutine?”  



\### Verifiche:

\- Risposte coerenti con KB

\- Nessuna fantasia o informazione non autorizzata



---



\# 7. Test strumenti backend (opzionale ma consigliato)



\### Check Openings:

Invoca manualmente via Postman:

POST /api/check\_openings





\### Create Booking:

POST /api/create\_booking





\### Modify Booking:

POST /api/modify\_booking





\### Cancel Booking:

POST /api/cancel\_booking





\### FAQ:

POST /api/faq





\### Send SMS:

POST /api/send\_sms





Tutti devono rispondere con:

\- `ok: true` in caso di successo

\- errori coerenti in caso di input sbagliato



---



\# 8. Criteri di superamento test



L’onboarding è considerato \*\*VALIDATO\*\* solo se:



\- Prenotazione → OK  

\- Modifica → OK  

\- Cancellazione → OK  

\- FAQ → OK  

\- Orari → OK  

\- Sheet e Calendar sempre coerenti  

\- Nessun errore nei log backend  



---



\# 9. Fine test



Se tutto è corretto → il ristorante è pronto per la messa online.





