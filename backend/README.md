# FraudLens Backend (Member 2)

FastAPI + PostgreSQL + SQLAlchemy. Receives transactions, calls the fraud engine, stores results,
serves the review queue, dashboard stats, rules and simulations.

## Run it (Windows PowerShell)

```powershell
cd backend
python -m venv venv            # only the first time
.\venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
copy .env.example .env         # then edit DATABASE_URL (password!)
uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000/docs. Load demo data: `POST /api/demo/seed` in Swagger,
or `python -m scripts.seed`. Run tests: `python -m pytest -q` (uses a temporary SQLite file).

Tables are created automatically on startup. No PostgreSQL yet? Set
`DATABASE_URL=sqlite:///./fraudlens.db` in `.env`.

## Folder layout

```
backend/app/
  main.py               app + CORS + startup (tables, default rules)
  models.py             transactions, rules, fraud_flags, rule_results, reviews, audit_log
  schemas.py            API contract (Pydantic)
  api/                  health, transactions, rules, reviews, dashboard, audit, demo
  services/
    fraud_service.py    ONLY place that calls the engine (Member 1's, or the mock fallback)
    mock_engine.py      fallback engine, follows the contract below
    transaction_service.py  engine -> save -> flag -> audit -> notify
    simulation_service.py   rule what-if replay (writes nothing)
    notification_service.py MockProvider / SNSProvider / SESProvider
    seed_data.py, rule_service.py, audit.py
```

## Contract with Member 1 (fraud engine)

Put the engine in `fraud_engine/` at the REPO ROOT (next to `backend/`) and export `evaluate`
from `fraud_engine/__init__.py`. The backend picks it up automatically (health shows which engine is used).

```python
evaluate(transaction: dict, history: list[dict], rules: list[dict]) -> dict
```

* `transaction` / `history[i]`: `customer_id, amount, currency, merchant, category, city, country, latitude, longitude, timestamp` (ISO-8601 string). `history` = this customer's previous transactions, oldest first.
* `rules[i]`: `rule_id, name, rule_type, config, score, enabled`
* returns:

```json
{
  "risk_score": 85,
  "risk_level": "CRITICAL",
  "rule_results": [
    {"rule_id": "VEL001", "triggered": true, "score": 30, "evidence": "6 transactions within 10 minutes"}
  ]
}
```

Levels: LOW 0-24, MEDIUM 25-59, HIGH 60-79, CRITICAL 80+. MEDIUM and above are flagged for review;
HIGH/CRITICAL also send a notification. `mock_engine.py` is a working reference implementation.

Default rule configs: `VEL001` `{window_minutes:10, max_transactions:5}`, `AMT001` `{multiplier:5, min_history:3}`,
`GEO001` `{max_speed_kmh:900, min_distance_km:100}`. Custom rules use `rule_type: "CONDITION"`:

```json
{"match": "all", "conditions": [
  {"field": "amount", "op": ">", "value": 50000},
  {"field": "hour", "op": "between", "value": [0, 3]}]}
```

Fields: amount, hour (IST 0-23), day_of_week (Mon=0), category, merchant, city, country, currency.
Operators: `> >= < <= == != in between`.

## Endpoints (all under /api)

| Method | Path | Notes |
|---|---|---|
| POST | /transactions | score + store; returns full detail |
| GET | /transactions | filters: risk_level, flagged, customer_id, review_status, search, skip, limit -> `{total, items}` |
| GET | /transactions/{id} | rule_results with evidence, reviews, audit_trail |
| GET | /rules, GET /rules/{rule_id} | rule_id is the code, e.g. `VEL001` |
| POST | /rules | create a rule (no engine change) |
| PUT | /rules/{rule_id} | edit / `{"enabled": false}` |
| POST | /rules/{rule_id}/simulate | optional body `{config, score, limit}` |
| POST | /rules/simulate | body `{rule: {...}, limit}` - try an unsaved draft rule |
| GET | /reviews/pending | highest risk first |
| GET | /reviews?status=CLEARED | any status |
| POST | /reviews/{flag_id}/review | body optional `{reviewer, comment}` |
| POST | /reviews/{flag_id}/clear | same |
| GET | /dashboard/stats | counts |
| GET | /audit-log | filters: entity_type, entity_id, action |
| POST | /demo/seed?reset=true | synthetic data |
| POST | /demo/scenario/{velocity\|amount\|geography\|combined\|night} | one-click suspicious generator |

`{id}` in `/reviews/{id}/...` is the case id (`flag_id`). Case status: PENDING -> REVIEWED -> CLEARED
(PENDING can go straight to CLEARED; repeating an action returns 409). All timestamps are UTC.

## Notifications

`NOTIFICATION_PROVIDER=mock` (default) prints alerts to the server console and records
`NOTIFICATION_LOGGED` in the audit log. For AWS: `pip install boto3`, set `NOTIFICATION_PROVIDER=sns`
(+ `SNS_TOPIC_ARN`) or `ses` (+ `SES_SENDER`, `SES_RECIPIENTS`). If AWS fails to start, it falls back to mock.
