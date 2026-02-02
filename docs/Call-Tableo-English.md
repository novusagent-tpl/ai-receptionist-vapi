# Call with Tableo – Script and Questions (English)

Use this file during your online meeting with Tableo: intro script, what we need from their system, and questions to understand how their platform works and whether we can connect our AI phone receptionist to it (including for Italian restaurants).

---

## 1. Short intro (opening script)

You can say something like:

*"Good morning / afternoon, thank you for your time. I'm reaching out because I'm developing an **AI-powered phone chatbot** for restaurants: when a customer contact the restaurant, an AI answers and can take reservations, give information (hours, menu, policies), and handle changes or cancellations.*

*Our backend can currently use an italian managment for reservations, but we'd like to **connect to a restaurant management platform via API**, so the restaurateur has everything in one place (your dashboard or app) and the AI writes reservations directly into your system.*

*I'd like to understand **how your platform works**, whether you have **documented APIs** to create, list, modify, and cancel reservations, and whether it's **suitable for Italian restaurants** and can integrate with our system."*

---

## 2. What we need (minimum requirements)

To connect our phone receptionist to your platform we need, **via API**, at least these operations:

| Operation | What we need |
|-----------|--------------|
| **Create reservation** | Send: date, time, number of guests, name, phone, notes. Receive: reservation ID. |
| **List reservations by phone** | Given the customer's phone number, get their upcoming reservations (for modify/cancel). |
| **List reservations by day** | Given the restaurant and date, get all reservations for that day (to calculate availability). |
| **Modify reservation** | Given the reservation ID, update date, time and/or number of guests. |
| **Cancel reservation** | Given the reservation ID, cancel it. |

Optional but useful: an **"available slots"** endpoint for a given date/time to simplify availability checks; otherwise we compute it ourselves from the day's reservation list.

---

## 3. General questions (how the platform works)

Use these to understand how the platform works and whether we can integrate.

### How the platform works

1. In short, how does the reservation flow work in your system? (Where do customers book from? Where does the restaurateur see reservations?)
2. Can a restaurant have multiple "rooms" or "tables"? How are they handled in reservations?
3. Do you support **Reserve with Google**? And a widget for the restaurant's website?

### API and integrations

4. **Do you have public APIs** for developers (REST or similar) to manage reservations?
5. If yes: **where is the documentation** (link, Postman, etc.)? Is it available after subscription or also for trial?
6. **How does authentication work** (API key, OAuth, Client ID/Secret)? Are there **sandbox/test** environments to try the API before going live?
7. Do the APIs allow **creating** a reservation, **listing** reservations (by customer phone and by day), **modifying** and **cancelling**? With which endpoints or methods?
8. Is there a **rate limit** or a limit on reservations per month depending on the plan? Which plan includes API access?

### Italian market and Italian restaurants

9. Is the platform **usable for restaurants in Italy**? (language, currency, support, compliance)
10. Do you have **customers or partners in Italy**? Support in Italian (documentation, help)?
11. **Billing**: can you invoice for Italy (VAT, SDI, etc.)? Are there setup costs or only a monthly subscription?

### Connecting our receptionist

12. Do you already have **integrations with phone booking systems or AI**? If yes, how do they work (webhook, API, etc.)?
13. To connect our backend (which calls your API when the AI takes a reservation by phone): **is there anything we cannot do** or that requires a special agreement (partner, IP whitelist, etc.)?
14. Do reservations created via API **appear the same as others** in the restaurant's dashboard (same view, same filters)? Can the restaurateur edit/cancel them from the dashboard like any other reservation?

---

## 4. Tableo-specific questions

(With Tableo we're evaluating whether APIs exist and cover our full requirements.)

1. **Do you have REST APIs** (or similar) for external integrations? If yes, **where is the documentation** and how do we get access (plan, partner request, etc.)?
2. Do the APIs allow **creating** a reservation with date, time, guests, name, phone, notes? And **listing** reservations **by customer phone** and **by day**?
3. Can we **modify** (change date/time/guests) and **cancel** a reservation via API?
4. **Authentication**: how does it work (API key, OAuth, etc.)? Is there a **test/sandbox** environment?
5. Is the platform **suitable for Italian restaurants**? (language, support, billing in Italy)
6. Do you already have **integrations with phone receptionist or AI**? If not, are there technical or commercial constraints to connecting a system like ours?

---

## 5. After the call – what to note

For the call, it's useful to note (even briefly):

- **Yes/No** on: APIs available, documentation accessible, create/list/modify/cancel reservations, list by phone, list by day.
- **Where** to find: documentation, credentials (Client ID/Secret or API key), restaurant ID.
- **Plan** that includes APIs and cost (monthly, any setup fees).
- **Sandbox/test**: if available and how to enable it.
- **Italian market**: support, billing, any limitations.
- **Useful contacts** (technical support, account manager) for next steps.

You can use this file as a reminder during the call and then update the project summary (`docs/RIEPILOGO-PROGETTO-FAQ-e-OctoTable.md`) with the answers you get.
