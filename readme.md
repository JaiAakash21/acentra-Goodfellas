# FraudLens

An explainable, configurable fraud decision and reviewer platform built for the Acentra Build to Care hackathon.

## Overview

FraudLens evaluates financial transactions against configurable, rule-based detection policies in real time. Instead of relying solely on black-box scoring, it generates transparent, metric-level evidence breakdowns for every triggered rule. Reviewers can investigate flagged anomalies, triage cases through a dedicated review queue, and trace end-to-end decisions with full audit logging.

## Key Features

- **VEL001 (Velocity Spike)**: Flags rapid transaction frequency surges within short time windows.
- **AMT001 (Amount Anomaly)**: Detects transactions significantly exceeding historical spending baselines.
- **GEO001 (Impossible Travel)**: Calculates geodesic speed between consecutive locations to catch physical transit anomalies.
- **NIGHT001 (Off-Hours Activity)**: Identifies high-value transactions initiated outside normal operational hours.
- **Explainable Evidence**: Delivers plain-language, evidence-backed breakdowns for each triggered rule.
- **Review Queue & Investigation Docket**: Reviewer console with risk filtering, transaction dossiers, spatial hops, and one-click adjudication (`REVIEWED` / `CLEARED`).
- **Rule Studio & Attack Simulator**: Declarative policy editor with live enable/disable toggles and 5 synthetic attack scenario generators.
- **Audit Workflow**: Chronological event tracking from initial ingestion to analyst adjudication.

## Architecture

```
React Console → FastAPI Backend → Fraud Engine → Database / Mock Persistence → Notification Mock
```

Transactions are received by FastAPI, transformed into engine models, evaluated across active rules in the Fraud Engine, and scored by the risk aggregator. For hackathon demonstration purposes, persistent storage includes a resilient local database fallback and cloud notifications (AWS SNS/SES) are mocked by default.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts
- **Backend**: FastAPI, Python 3, Pydantic v2
- **Engine**: Python, Rule Registry, Generic Evaluator, Risk Aggregator
- **Demo / Infrastructure**: SQLite / PostgreSQL fallback persistence, Mock AWS SNS/SES

## Risk Scoring

- **0–29**: LOW (Auto-approved / Safe)
- **30–59**: MEDIUM (Monitored / Under Review)
- **60–79**: HIGH (Flagged for Review)
- **80–100**: CRITICAL (Quarantined / Immediate Review)

### Multi-Signal Scoring Example:
- `VEL001` (Velocity Spike): **+30**
- `AMT001` (Amount Anomaly): **+25**
- `GEO001` (Impossible Travel): **+30**
- **Composite Score**: **85 / 100 &rarr; CRITICAL**

## Demo Flow

```
Transaction → Rule Evaluation → Risk Score → Review Queue → Investigation → Audit
```

1. **Transaction**: Ingested via API, the `/transactions/new` form, or pre-configured scenarios.
2. **Rule Evaluation**: Evaluated against active rules (`VEL001`, `AMT001`, `GEO001`, `NIGHT001`).
3. **Risk Score**: Compiled by the aggregator into a 0–100 score and categorical risk tier.
4. **Review Queue**: Flagged cases are queued at `/reviews` for triage.
5. **Investigation**: Analysts review evidence cards, spatial transit vectors, and submit decisions.
6. **Audit**: System and analyst actions are permanently recorded in the audit trail.

## Quickstart

### Backend
```bash
pip install -r requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```
- API Docs: `http://127.0.0.1:8000/docs`

### Frontend
```bash
npm install
npm run dev
```
- Console: `http://localhost:5173`

## Validation

- **Engine Unit Tests**: 15/15 passing (`python -m pytest tests/ -v`)
- **Frontend Build**: TypeScript type-check and Vite production bundle passing (`npm run build`)

## Team

**Team Goodfellas** (Acentra Build to Care Hackathon)
