\# Procedura di Attivazione LIVE per un Ristorante – AI Receptionist VAPI

Questa è la procedura operativa standard per portare un ristorante configurato in produzione sulle chiamate reali.



---



\# 1. Prerequisiti LIVE (devono essere già completi)



\- KB del ristorante (`kb/<restaurant\_id>.json`) valido.

\- Config del ristorante (`src/config/ristoranti.json`) completata.

\- Foglio Google con struttura:

booking\_id | day | time | people | name | phone | notes | created\_at | event\_id

- Calendar dedicato creato e condiviso.

\- Backend su Render attivo (`/status` = ok).

\- Assistant Vapi:

\- `restaurant\_id` corretto

\- 7 Tools HTTP configurati:

&nbsp; - check\_openings  

&nbsp; - create\_booking  

&nbsp; - list\_bookings  

&nbsp; - modify\_booking  

&nbsp; - cancel\_booking  

&nbsp; - faq  

&nbsp; - send\_sms  

\- Test in chat superati.



---



\# 2. Collegamento numero telefonico in Vapi



1\. Entra in Vapi → \*\*Phone Numbers\*\*.

2\. Scegli:

&nbsp;- numero Vapi  

&nbsp;- oppure importa numero Twilio

3\. Apri il numero → sezione Routing.

4\. Imposta:

&nbsp;- \*\*Assistant = assistant del ristorante\*\*

5\. Salva.



Risultato: ogni chiamata viene gestita da questo assistente.



---



\# 3. Test LIVE di prenotazione



1\. Chiama il numero dal tuo telefono.

2\. Verifica saluto + nome ristorante.

3\. Completa una prenotazione test:

&nbsp;- Nome: Test AI

&nbsp;- Telefono: il tuo

&nbsp;- Data: domani

&nbsp;- Ora: 20:00

&nbsp;- Persone: 2



\### Verifica immediata:



\#### Sheet:

\- riga creata correttamente

\- tutti i campi valorizzati



\#### Calendar:

\- evento creato nell'orario previsto



---



\# 4. Test LIVE di modifica



1\. Chiama il numero.

2\. Pronuncia:

&nbsp;> “Vorrei modificare la prenotazione Test AI.”

3\. Cambia l'orario.



\#### Verifica:

\- Sheet aggiornato nella stessa riga

\- Calendar aggiornato correttamente



---



\# 5. Test LIVE di cancellazione



1\. Chiama il numero.

2\. Pronuncia:

&nbsp;> “Vorrei cancellare la prenotazione.”



\#### Verifica:

\- Sheet aggiornato come cancellato

\- Evento rimosso dal Calendar



---



\# 6. Test FAQ \& Orari



Domande consigliate:



\- “Quali sono i vostri orari?”  

\- “Avete opzioni senza glutine?”



Devono rispondere in coerenza con KB.



---



\# 7. Consegna al ristorante



Invia:

\- `istruzioni\_per\_ristorante.md`

\- Comunicazione di go-live



Consiglia al ristorante di:

\- controllare giornalmente Sheet + Calendar

\- segnalarci anomalie entro 24h



---



\# 8. Monitoraggio post–go-live



Per 48–72 ore:

\- controllare i log backend

\- verificare flussi di prenotazione reali

\- confermare con il ristorante che tutto funziona



---



\# 9. Procedura di fallback (emergenza)



Se il ristorante segnala problemi:



\### Opzione 1 (consigliata)

In Vapi → Phone Numbers:

\- disassocia temporaneamente il numero dall’assistente



\### Opzione 2

Reindirizza il numero verso una linea umana (se configurata).



\### Opzione 3

Disabilita temporaneamente la pubblicità del numero.



Dopo il fix tecnico, riattiva l’assistente.



---



\# 10. Attivazione completata



Il ristorante è considerato LIVE quando:



\- Prenotazione → OK  

\- Modifica → OK  

\- Cancellazione → OK  

\- FAQ → OK  

\- Sheet + Calendar coerenti  

\- Nessun errore critico nei log  

\- Ristoratore soddisfatto  



A questo punto il sistema può essere utilizzato dai clienti finali.



