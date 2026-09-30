# FraudLens — Explainable, Configurable Fraud Decision & Review Platform

> **Acentra Build to Care Hackathon** — *Team Goodfellas*  
> An enterprise-grade, explainable fraud detection engine and security-operations review console built for fintech risk teams.

[![Tests](https://img.shields.io/badge/pytest-26%20passed-brightgreen.svg)]()
[![Frontend](https://img.shields.io/badge/frontend-React%2018%20%7C%20TypeScript%20%7C%20Tailwind-blue.svg)]()
[![Backend](https://img.shields.io/badge/backend-FastAPI%20%7C%20SQLAlchemy%20%7C%20PostgreSQL-darkgreen.svg)]()
[![Engine](https://img.shields.io/badge/engine-Pure%20Python%20%7C%20AST%20Rules-orange.svg)]()
[![AWS](https://img.shields.io/badge/cloud-AWS%20SNS%20%26%20SES%20Ready-232f3e.svg)]()

---

## 📌 Executive Overview

FraudLens bridges the gap between **autonomous fraud detection** and **human investigator explainability**. Rather than relying solely on opaque ML black-box scoring, FraudLens runs an extensible, declarative rule evaluation engine that outputs deterministic, human-readable rationales with mathematical evidence breakdowns (e.g., velocity frequency surges, statistical amount anomalies, and supersonic geographic travel vectors).

Investigators triage, adjudicate, and audit suspicious activity through a high-information-density dark-theme console, while risk engineers author and simulate new detection policies in real time without downtime.

---

## 🏛️ End-to-End System Architecture

```
                                  +------------------------------------------------------+
                                  |                 FRAUDLENS PLATFORM                   |
                                  +------------------------------------------------------+
                                                             |
            +------------------------------------------------+-----------------------------------------------+
            |                                                |                                               |
            v                                                v                                               v
+-----------------------+                        +-----------------------+                       +-----------------------+
|  MEMBER 1: CORE       |                        |  MEMBER 2: BACKEND    |                       |  MEMBER 3: FRONTEND   |
|  FRAUD ENGINE         |                        |  & INFRASTRUCTURE     |                       |  REVIEWER CONSOLE     |
+-----------------------+                        +-----------------------+                       +-----------------------+
| • FraudEngine Core    |  Invoked by Adapter    | • FastAPI Application |  REST API / CORS      | • React 18 + TS Vite  |
| • RuleRegistry        |<-----------------------| • SQLAlchemy ORM      |<----------------------| • Dark Fintech UX     |
| • GenericEvaluator    |  Evaluated via Rules   | • PostgreSQL / SQLite |  JSON DTOs            | • High-Density Queue  |
| • RiskAggregator      |----------------------->| • AWS SNS & SES Alerts|---------------------->| • Forensic Dossier    |
| • Canonical Rules:    |  Returns FraudDecision | • Audit Trail Logging |  Visual Live Updates  | • Rule Studio UI      |
|   - VEL001 (Velocity) |                        | • Demo Scenario Seeder|                       | • Attack Simulator    |
|   - AMT001 (Amount)   |                        | • OpenAPI Docs (/docs)|                       | • Dual Live/Mock Mode |
|   - GEO001 (Distance) |                        +-----------------------+                       +-----------------------+
|   - NIGHT001 (Hours)  |                                    |
+-----------------------+                                    v
                                                 +-----------------------+
                                                 | CLOUD & NOTIFICATIONS |
                                                 | • AWS SNS (High Risk) |
                                                 | • AWS SES (Digests)   |
                                                 +-----------------------+
```

### Data & Decision Flow
1. **Ingestion**: Transaction submitted via `POST /api/transactions` or generated via the Attack Simulator.
2. **Adapter Transformation**: FastAPI service converts the API model to the engine's strict transaction schema (`transaction_to_engine_model`).
3. **Engine Evaluation**: The Member 1 `FraudEngine` iterates registered rules in priority order through `GenericEvaluator`.
4. **Risk Aggregation**: Triggered weights are compiled by `RiskAggregator` into a 0–100 composite score, generating categorical recommendations:
   - `0 - 29`: **LOW** &rarr; `PASS` / `APPROVE`
   - `30 - 59`: **MEDIUM** &rarr; `PASS` or `FLAG`
   - `60 - 79`: **HIGH** &rarr; `FLAG` / `MANUAL REVIEW`
   - `80 - 100`: **CRITICAL** &rarr; `MANUAL REVIEW` / `BLOCK`
5. **Persistence & Audit**: Transaction, rule trigger results, and timestamped audit logs are committed via SQLAlchemy.
6. **Alert Dispatch**: Critical events trigger automated dispatch through AWS SNS topics or SES email alerts.
7. **Forensic Review**: Reviewers inspect the evidence breakdown, view spatial flight vectors, and submit adjudication decisions (`REVIEWED`, `CLEARED`) from the console.

---

## 👥 Hackathon Team Contributions & Branch Integration

This repository unifies the specialized deliverables of all three team members:

| Member / Branch | Primary Responsibility | Key Modules & Deliverables |
|---|---|---|
| **Member 1**<br>`kar-branch` | **Fraud Engine Core & Rules Engine** | `backend/app/engine/`<br>• `FraudEngine`, `RuleRegistry`, `GenericEvaluator`, `RiskAggregator`<br>• Canonical rules: `VEL001`, `AMT001`, `GEO001`, `DynamicConditionRule`<br>• 15 standalone engine unit tests |
| **Member 2**<br>`Abishek-Backend` | **FastAPI Backend & Infrastructure** | `backend/app/`<br>• REST APIs: `/transactions`, `/rules`, `/reviews`, `/audit`, `/demo`<br>• SQLAlchemy models & migrations with resilient PostgreSQL/SQLite fallback<br>• AWS SNS/SES notification services<br>• Demo scenario seeder & OpenAPI docs |
| **Member 3**<br>`jk-branch` | **React Reviewer Console Frontend** | `src/`<br>• Security-operations dark-mode console (Tailwind CSS, Lucide, Recharts)<br>• Review queue, Forensic Investigation dossier with travel vectors<br>• Declarative Rule Studio & Attack Vector Simulator<br>• Unified `api.ts` client with seamless live FastAPI mode & fallback |
| **Unified**<br>`integration/fraudlens` | **Production Integration** | • Normalized canonical rule IDs (`VEL001`, `AMT001`, `GEO001`)<br>• Clean schema adapter connecting API to Member 1 engine<br>• Deterministic judge demo endpoints<br>• 26/26 backend pytest test suite passing |

---

## ⚡ Canonical Fraud Rules

| Rule ID | Rule Name | Category | Condition / Threshold | Default Weight | Description & Explainability |
|---|---|---|---|---|---|
| **`VEL001`** | High Velocity Burst | Velocity | `count(txns, 10m) > 5` | `+30` | Detects sudden high-frequency bursts from the same account within a short window. |
| **`AMT001`** | Unusual High Amount | Amount | `amount > $5,000` | `+25` | Flags transactions exceeding high single-transaction thresholds or customer baseline. |
| **`GEO001`** | Impossible Travel Anomaly | Geolocation | `calculated_speed > 800 km/h` | `+30` | Uses Haversine distance over elapsed time to catch physically impossible physical transit. |
| **`NIGHT001`** | Off-Hours Activity | Behavior | `hour between 01:00 and 05:00` | `+15` | Flags unusual overnight activity outside normal operating patterns. |

---

## 🎯 Deterministic Judge Demo Scenarios

Run these deterministic scenarios via the **Attack Simulator (`/simulator`)** or directly via REST endpoints (`POST /api/demo/scenario/{scenario_name}`):

| Scenario ID | Name | Expected Triggers | Composite Score | Tier | Adjudication Action |
|---|---|---|---|---|---|
| `DEMO-NORMAL-001` | Normal Transaction | *None* | `0 / 100` | `LOW` | `APPROVE` / `PASS` |
| `DEMO-AMOUNT-001` | High Amount Outlier | `AMT001` (+25) | `25 / 100` | `LOW` | `PASS` (Monitored) |
| `DEMO-VELOCITY-001` | Velocity Burst | `VEL001` (+30) | `30 / 100` | `MEDIUM` | `FLAG` (Under Review) |
| `DEMO-GEO-001` | Impossible Travel | `GEO001` (+30) | `30 / 100` | `MEDIUM` | `FLAG` (Under Review) |
| `DEMO-CRITICAL-001` | Multi-Signal Attack | `VEL001` (+30)<br>`AMT001` (+25)<br>`GEO001` (+30) | **`85 / 100`** | **`CRITICAL`** | **`MANUAL REVIEW` / `BLOCK`** |

---

## 🖥️ Reviewer Console Screens

1. **Executive Risk Overview (`/dashboard`)**:
   - Real-time KPI summary (Total Ingested, Flagged, High Risk, Critical Interceptions, Pending Review).
   - Recharts 24-hour volume vs. fraud spike area graph & risk tier distribution breakdown.
   - Recent high-risk interceptions table with one-click navigation to forensic dossiers.
   - Live audit stream logging ingestion, evaluation, and investigator triage.

2. **Fraud Review Queue (`/reviews`)**:
   - High-throughput operational review table with instant full-text search across Transaction ID, Account ID, and Merchant.
   - Fast filtering by risk tier (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) and status (`PENDING`, `REVIEWED`, `CLEARED`).

3. **Forensic Investigation Dossier (`/investigation/:id`)**:
   - Comprehensive transaction metadata (Device fingerprint, IP, coordinates, payment method).
   - High-impact **Risk Score Badge** (e.g. `85 / 100 CRITICAL`) with confidence metrics.
   - **"Why was this transaction flagged?"** granular explainability cards detailing rule triggers and evidence.
   - **Forensic Spatial Vector Diagram**: Visual representation of geographic hops (e.g., Chennai &rarr; London in 25 minutes = 5,420 km/h anomaly).
   - Chronological audit timeline from ingestion to analyst sign-off.
   - Reviewer decision adjudication panel with notes and one-click actions (`MARK AS REVIEWED`, `CLEAR CASE`).

4. **Declarative Rule Studio (`/rules`)**:
   - Visual inspection and editing of declarative rule policies.
   - Live toggle switches to activate or deactivate rules in the running engine.
   - AST rule simulation sandbox to test custom thresholds against candidate transactions.
   - `+ Create Rule` modal to register new dynamic rules.

5. **Attack Vector Simulator (`/simulator`)**:
   - One-click trigger for the 5 deterministic attack scenarios.
   - Interactive 4-stage visual pipeline: **Ingestion &rarr; Rules Evaluating &rarr; Scoring &rarr; Final Decision**.
   - Direct link to inspect the generated dossier in the review queue.

---

## 🛠️ Complete Tech Stack

| Domain | Technologies |
|---|---|
| **Frontend UI** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts |
| **API Backend** | FastAPI, Uvicorn, Pydantic v2 |
| **Database & ORM** | PostgreSQL, SQLite (resilient fallback), SQLAlchemy 2.0 |
| **Rule & Scoring Engine** | Pure Python 3, AST Evaluator, Modular Rule Registry, Haversine Geodesic Math |
| **Cloud Notifications** | AWS SNS (SMS / Topic alerts), AWS SES (Email alerts) with mock-safe dev fallback |
| **Testing & Quality** | Pytest (26 unit + integration tests), TypeScript strict compiler |

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js**: v18.x or v20.x
- **Python**: v3.10, v3.11, or v3.12
- **Git**

---

### Step 1: Clone and Checkout Branch

```bash
git clone https://github.com/JaiAakash21/acentra-Goodfellas.git
cd acentra-Goodfellas
git checkout integration/fraudlens
```

---

### Step 2: Backend Setup & Launch

1. **Create and activate a virtual environment**:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the FastAPI server**:
   ```bash
   uvicorn backend.app.main:app --reload --port 8000
   ```

   - API Base URL: **[http://127.0.0.1:8000](http://127.0.0.1:8000)**
   - Interactive Swagger API Docs: **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**
   - ReDoc Documentation: **[http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)**

> **Note on Database**: FraudLens defaults to connecting to PostgreSQL (`DATABASE_URL`). If PostgreSQL is not running locally, the backend automatically and seamlessly initializes a local SQLite database (`backend/app/fraudlens.db`) with complete schema tables, ensuring zero friction for hackathon evaluators.

---

### Step 3: Frontend Setup & Launch

In a separate terminal:

1. **Install Node dependencies**:
   ```bash
   npm install
   ```

2. **Start Vite development server**:
   ```bash
   npm run dev
   ```

   - Reviewer Console: **[http://localhost:5173](http://localhost:5173)**

---

### Step 4: Run Automated Verification Tests

```bash
# Run all backend unit & integration tests (26 passing tests)
pytest -v

# Run frontend TypeScript type-check and production build
npm run build
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status check |
| `POST` | `/api/transactions` | Ingest and evaluate a new transaction through the fraud engine |
| `GET` | `/api/transactions` | List all historical transactions with pagination |
| `GET` | `/api/transactions/{id}` | Retrieve transaction details, rule triggers, and risk score |
| `GET` | `/api/rules` | Fetch all registered rules from the engine |
| `POST` | `/api/rules` | Create and register a new declarative fraud rule |
| `PUT` | `/api/rules/{id}` | Update rule threshold, weight, or enable/disable state |
| `POST` | `/api/rules/simulate` | Test candidate transaction against the rules engine |
| `GET` | `/api/reviews/pending` | Fetch pending transactions awaiting investigator triage |
| `GET` | `/api/reviews` | List all reviewed or flagged transactions |
| `POST` | `/api/reviews/{id}/review` | Adjudicate transaction (`REVIEWED` or `ESCALATED`) |
| `POST` | `/api/reviews/{id}/clear` | Clear transaction false positive (`CLEARED`) |
| `GET` | `/api/dashboard/stats` | Aggregate dashboard KPI metrics and risk tier distributions |
| `GET` | `/api/audit-log` | Paginated audit trail events |
| `POST` | `/api/demo/seed` | Seed initial demo data (transactions, reviews, audit logs) |
| `POST` | `/api/demo/scenario/{name}` | Execute a deterministic judge attack scenario |

---

## ⚙️ Environment Configuration

Configuration options can be supplied in a `.env` file at the root:

```env
# Application
PROJECT_NAME="FraudLens"
API_V1_STR="/api"

# Database Configuration (PostgreSQL with auto-fallback to SQLite)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fraudlens

# Frontend API Configuration
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_USE_MOCK=false

# AWS Cloud Notification Settings (Optional / Mocked in Dev)
AWS_REGION=us-east-1
AWS_SNS_TOPIC_ARN=
AWS_SES_SENDER_EMAIL=
MOCK_NOTIFICATIONS=true
```

---

## 🔒 Security & Compliance

- **Auditing**: Every analyst action, rule modification, and engine decision is logged with timestamps, reviewer ID, and previous states.
- **Fail-Safe Adjudication**: Critical transactions trigger defensive quarantine (`MANUAL REVIEW`), preventing automated processing until human sign-off.
- **Zero Opaque ML**: Every decision is accompanied by explainability tokens detailing rule parameters and metric differentials.

---

## 📜 License

Built for the **Acentra Build to Care Hackathon 2026** by Team Goodfellas.  
All rights reserved.
