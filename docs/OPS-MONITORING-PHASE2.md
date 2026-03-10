# OPS Monitoring Phase 2 (S3 + S4)

Implementazione pratica da fare subito dopo la prima settimana pilota.

---

## Obiettivi

- **S3:** riconciliare eventi backend con stato reale prenotazioni
- **S4:** inviare alert automatici hourly quando qualcosa degrada

---

## S3 — Riconciliazione automatica

### Logica minima

Ogni ora, per ciascun tenant live:
1. Cerca i `create_booking_success` dell'ultima ora.
2. Per ogni evento, verifica che `booking_id` esista davvero nel provider:
   - Sheets: ricerca riga `booking_id`
   - resOS: verifica prenotazione con id
   - OctoTable: verifica prenotazione con id
3. Se manca, registra mismatch.

### Output job

Esempio JSON:
```json
{
  "ok": true,
  "checked": 14,
  "mismatch_count": 1,
  "mismatches": [
    { "restaurant_id": "roma", "booking_id": "abc123", "reason": "not_found_in_provider" }
  ]
}
```

### KPI target

- mismatch_count = 0 normale
- mismatch_count > 0 critico

---

## S4 — Alert automatici

### Trigger alert (hourly)

Invia alert immediato se:
- mismatch_count > 0
- error_rate_percent sopra soglia (es. > 5%)
- provider_failures > 0
- picco `create_booking_error` oltre soglia

### Canali alert

Ordine consigliato:
1. Telegram bot (piu rapido)
2. Email
3. Slack (se usato)

### Messaggio alert

Formato breve:
```
[ALERT] AI Receptionist
tenant: roma
window: last_60m
mismatch: 1
error_rate: 7.3%
action: switch FAQ+transfer if unresolved in 10m
```

---

## Architettura consigliata

- Cron esterno ogni ora -> `GET /cron/ops-health`
- Endpoint backend:
  - calcola KPI da log/metrics
  - lancia riconciliazione S3
  - invia alert S4 se soglia superata

---

## Rollout S3/S4

1. Attiva su 1 tenant pilota
2. Verifica 72h senza falsi positivi
3. Estendi a tutti i tenant live

---

## Done criteria

S3/S4 sono considerati completati quando:
- 7 giorni continui senza mismatch non spiegati
- alert ricevuti correttamente durante test controllato
- runbook emergenza usato almeno 1 volta in simulazione

