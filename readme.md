# FraudLens — Explainable, Configurable Fraud Decision & Review Platform

FraudLens is a next-generation fraud decisioning and reviewer console built for the **Acentra Build to Care** hackathon. It combines real-time transaction scoring with explainable rule evaluation, deep forensic spatial analysis, a declarative Rule Studio, and an interactive attack vector simulator.

---

## 🚀 Key Highlights & Architectural Strengths

- **High-Information-Density Fintech UX**: Modern dark theme crafted with customized palettes, zero cartoonish UI, and semantic color signaling (red/orange exclusively for critical risk states, green for safe/cleared transactions, indigo for interactions).
- **Explainable Decision Engine**: Moves beyond black-box ML scoring by providing granular, plain-language and metric-rich rationales for every triggered rule.
- **Decoupled Service Layer**: Zero backend dependencies required to review or demo. All API operations (`src/services/api.ts`) interface cleanly with mock/local state and can be swapped for live FastAPI endpoints without changing any UI component.
- **Declarative Rule Studio**: Treats rules as pure JSON policy ASTs (field, operator, threshold, weight) consumed dynamically by generic evaluation engines.

---

## 🖥️ Console Screens & Capabilities

1. **Executive Risk Overview (`/dashboard`)**
   - High-level KPIs: Total Transactions (12,480), Flagged (438), High Risk (121), Critical (38), Pending Review (64).
   - Recharts 24-hour volume vs. fraud spike area graph & risk tier distribution chart.
   - Recent critical interceptions table with quick-jump links.
   - Real-time audit log stream with millisecond timestamps.

2. **Fraud Review Queue (`/reviews`)**
   - High-throughput operational review table with search by Transaction ID, Account ID, and Merchant.
   - Multi-select risk level filters (`All`, `Critical`, `High`, `Medium`) and status filters (`Pending`, `Reviewed`, `Cleared`).
   - Clickable rows routing directly to forensic investigation dossiers.

3. **Investigation Docket (`/investigation/:transactionId`)**
   - Primary reviewer screen displaying transaction metadata (Account, Amount, Merchant, Lat/Lon, Device ID, IP).
   - High-impact Risk Score Card (e.g., `85 / 100 CRITICAL`) with confidence metrics.
   - **"WHY WAS THIS TRANSACTION FLAGGED?"** explainability cards (High Velocity `+30`, Unusual Amount `+25`, Impossible Travel `+30`).
   - Forensic evidence panel with flight vector diagram (e.g., Chennai to London in 25 mins &rarr; 5,420 km/h anomaly).
   - Chronological audit timeline from ingestion to analyst adjudication.
   - Reviewer decision box with notes and action buttons (`MARK AS REVIEWED`, `CLEAR CASE`).

4. **Rule Studio (`/rules`)**
   - Visual configuration of declarative fraud rules.
   - Live enable/disable toggles with instant state synchronization.
   - AST rule simulation and test runner.
   - `+ Create Rule` modal form to author new rules.

5. **Fraud Engine Simulator (`/simulator`)**
   - 5 preset attack vectors:
     1. Normal Transaction
     2. High Amount Outlier
     3. Velocity Attack Burst
     4. Impossible Travel Anomaly
     5. Multi-Signal Critical Fraud
   - 4-stage pipeline execution: Ingestion &rarr; Rules Evaluating &rarr; Scoring &rarr; Final Decision.
   - Multi-signal composite scoring breakdown: Velocity +30, Amount +25, Impossible Travel +30 = 85 (CRITICAL &rarr; MANUAL REVIEW).

---

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + Custom Dark Theme
- **Routing**: React Router v6
- **Data Visualizations**: Recharts
- **Iconography**: Lucide React
- **Cloud Telemetry**: Firebase SDK (mock-safe fallback)

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation & Run

```bash
# Install dependencies
npm install

# Run Vite development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
