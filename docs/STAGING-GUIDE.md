# Guida Staging Environment

Come testare senza toccare i dati reali dei ristoranti.

---

## 1. I 3 ambienti

| Ambiente | Dove gira | NODE_ENV | Scopo |
|----------|-----------|----------|-------|
| **Dev (locale)** | Il tuo PC | `development` | Sviluppo e debug. Endpoint `/debug` attivi. |
| **Staging** | Render (secondo servizio) oppure locale | `staging` | Test pre-deploy. Usa tenant `demo01`. |
| **Produzione** | Render (servizio principale) | `production` | Ristoranti veri. Endpoint `/debug` bloccati. |

---

## 2. Tenant di test: `demo01`

Il tenant `demo01` è un ristorante fittizio già configurato:
- **Config:** `ristoranti.json` → `demo01`
- **KB:** `kb/demo01.json` (orari, FAQ di esempio)
- **Backend:** `sheets` (senza sheet_id reale — non scrive da nessuna parte)
- **Nessun dato reale** viene toccato

### Come usarlo

Nelle richieste API, passa `restaurant_id: "demo01"`:

```json
{
  "restaurant_id": "demo01",
  "day": "2026-03-15",
  "time": "20:00",
  "people": 2
}
```

I tool che leggono solo la KB (check_openings, faq, is_open_now, resolve_relative_day/time) funzionano normalmente. I tool che scrivono (create_booking, ecc.) falliranno perché non c'è un foglio Google collegato — ed è giusto così: in staging testi la logica, non le prenotazioni reali.

---

## 3. Regression test su staging

```bash
# Test contro il server locale
npm test

# Test contro Render staging
node scripts/regression-tests.js https://tuo-staging.onrender.com
```

---

## 4. Opzione: secondo servizio Render per staging

Se vuoi un ambiente staging separato su Render:

1. Su Render, crea un **nuovo Web Service** dallo stesso repo GitHub
2. Chiamalo `ai-receptionist-staging`
3. Imposta le environment variables:
   - `NODE_ENV=staging`
   - Le stesse chiavi API (oppure chiavi di test separate)
4. Deploy — avrai un URL separato (es. `ai-receptionist-staging.onrender.com`)

**Workflow:**
1. Fai le modifiche al codice
2. Push su GitHub
3. Staging si aggiorna automaticamente → testi li
4. Se tutto OK, deploy su produzione

**Per ora non è necessario** — basta usare `demo01` in locale o sul server di produzione. Crea lo staging separato quando hai 5+ ristoranti.

---

## 5. Regola d'oro

> **Mai testare con `restaurant_id: "modena01"` o `"roma"` se stai sperimentando.**
> Usa sempre `"demo01"` per prove e demo.
