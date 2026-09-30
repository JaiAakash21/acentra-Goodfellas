# FraudLens — Backend API Contract & Integration Specifications

> **Target Audience**: Member 1 (FastAPI Backend Lead) & Member 2 (PostgreSQL / Fraud Engine Lead)  
> **Author**: Member 3 (Frontend / Reviewer Console Lead)  
> **Status**: APPROVED CONTRACT (Phase 2 Integration)  
> **Default Base URL**: `http://localhost:8000` (configurable via `VITE_API_BASE_URL`)

---

## 1. Overview & Architectural Principles

1. **Decoupled Frontend**: The reviewer console interacts with the backend strictly via standard JSON REST endpoints over HTTP.
2. **Persistence Engine**: PostgreSQL with SQLAlchemy ORM.
3. **No External Client SDKs**: No Firebase or Firestore dependencies. All realtime or background communications occur via FastAPI.
4. **Normalized Error Handling**: The frontend standardizes error handling for both FastAPI Pydantic validation exceptions (`{ "detail": "..." }`) and explicit domain errors (`{ "message": "...", "code": "..." }`).

---

## 2. Global Error Response Standard

### Standard FastAPI Validation Error (422 Unprocessable Entity)
```json
{
  "detail": [
    {
      "loc": ["body", "amount"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### Standard Domain Error (400, 404, 500)
```json
{
  "message": "Transaction TX-98421 not found in registry",
  "code": "TRANSACTION_NOT_FOUND"
}
```

---

## 3. Data Models & Schemas

### 3.1 Transaction Model (`Transaction`)
```typescript
interface Transaction {
  id: string;             // Primary Key (e.g. "TX-98421")
  accountId: string;      // Customer Account Reference (e.g. "ACC-884920")
  amount: number;         // Monetary value (e.g. 87500)
  currency: string;       // Currency code (e.g. "INR", "USD")
  timestamp: string;      // ISO 8601 string (e.g. "2026-09-30T10:42:15Z")
  latitude: number;       // Ingestion latitude (e.g. 51.5074)
  longitude: number;      // Ingestion longitude (e.g. -0.1278)
  locationName: string;   // Human-readable location (e.g. "London, United Kingdom")
  merchant: string;       // Entity or Merchant Name (e.g. "Apex Luxury Tech Ltd")
  deviceId: string;       // Hardware fingerprint ID (e.g. "DEV-F89A-0921")
  ipAddress: string;      // Origin IPv4/IPv6 (e.g. "185.220.101.42")
}
```

### 3.2 Fraud Flag Model (`FraudFlag`)
```typescript
interface FraudFlag {
  id: string;             // Primary Key (e.g. "FLAG-98421")
  transactionId: string;  // Foreign Key to Transaction.id
  riskScore: number;      // Composite score 0 - 100
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "PENDING_REVIEW" | "REVIEWED" | "CLEARED";
  triggeredRuleCount: number;
  createdAt: string;      // ISO 8601 string
}
```

### 3.3 Rule Evaluation Result (`RuleResult`)
```typescript
interface RuleResult {
  id: string;             // Unique evaluation ID (e.g. "RES-98421-1")
  transactionId: string;  // Foreign Key to Transaction.id
  ruleId: string;         // Foreign Key to Rule.id
  ruleName: string;       // Plaintext rule name (e.g. "IMPOSSIBLE TRAVEL")
  triggered: boolean;     // Whether rule threshold was breached
  score: number;          // Weight/score contributed (e.g. 30)
  evidence: Record<string, unknown>; // Granular metric evidence payload
}
```

#### Expected `evidence` Payload Structure Examples:
- **Velocity Rule**:
  ```json
  {
    "description": "6 transactions detected within 10 minutes",
    "metric": "Transaction Frequency",
    "velocityData": { "windowMinutes": 10, "txCount": 6, "threshold": 4 }
  }
  ```
- **Amount Rule**:
  ```json
  {
    "description": "₹87,500 is 7.3x the customer's historical average",
    "amountData": { "amount": 87500, "historicalAvg": 12000, "multiplier": 7.3 }
  }
  ```
- **Impossible Travel Rule**:
  ```json
  {
    "description": "Previous location: Chennai | Current location: London | Elapsed time: 25 minutes | Speed: 5,420 km/h",
    "locations": {
      "prevLocation": "Chennai, India",
      "currLocation": "London, United Kingdom",
      "timeDiffMinutes": 25,
      "speedKmh": 5420
    }
  }
  ```

### 3.4 Review Adjudication Model (`Review`)
```typescript
interface Review {
  id: string;             // Primary Key (e.g. "REV-98409")
  fraudFlagId: string;    // Foreign Key to FraudFlag.id
  reviewer: string;       // Analyst Name or ID (e.g. "Keshv (Senior Fraud Lead)")
  status: "REVIEWED" | "CLEARED";
  comment: string;        // Reviewer notes / justification
  reviewedAt: string;     // ISO 8601 timestamp
}
```

### 3.5 Declarative Rule AST Model (`Rule`)
```typescript
interface Rule {
  id: string;             // Primary Key (e.g. "RULE-VEL-01")
  name: string;           // Name (e.g. "High Transaction Velocity")
  description: string;    // Description / rationale
  type: string;           // "VELOCITY" | "AMOUNT" | "LOCATION" | "DEVICE" | "BEHAVIORAL"
  config: Record<string, unknown>; // Configuration AST consumed by fraud engine
  weight: number;         // Score weight contributed if triggered (1-100)
  enabled: boolean;       // Active evaluation flag
  version: number;        // Policy version integer (e.g. 1)
  createdAt: string;      // ISO 8601 string
  updatedAt: string;      // ISO 8601 string
}
```

### 3.6 Dashboard Summary Stats (`DashboardStats`)
```typescript
interface DashboardStats {
  totalTransactions: number;
  flaggedTransactions: number;
  highRisk: number;
  critical: number;
  pendingReviews: number;
}
```

---

## 4. REST Endpoints Specification

### 4.1 Transactions

#### `GET /api/transactions`
- **Description**: Returns transactions list. Supports filtering by risk level and review status.
- **Query Parameters**:
  - `risk_level` (optional): `CRITICAL` | `HIGH` | `MEDIUM` | `LOW`
  - `status` (optional): `PENDING_REVIEW` | `REVIEWED` | `CLEARED`
  - `q` (optional): search query string matching ID, Account ID, Merchant, or Location.
- **Response `200 OK`**:
  ```json
  [
    {
      "id": "TX-98421",
      "accountId": "ACC-884920",
      "amount": 87500,
      "currency": "INR",
      "timestamp": "2026-09-30T10:42:15Z",
      "latitude": 51.5074,
      "longitude": -0.1278,
      "locationName": "London, United Kingdom",
      "merchant": "Apex Luxury Tech Ltd",
      "deviceId": "DEV-F89A-0921",
      "ipAddress": "185.220.101.42"
    }
  ]
  ```

#### `GET /api/transactions/{id}`
- **Description**: Returns single transaction details by ID.
- **Response `200 OK`**: Single `Transaction` object.
- **Response `404 Not Found`**: `{ "message": "Transaction not found", "code": "NOT_FOUND" }`

---

### 4.2 Fraud Flags & Explainability

#### `GET /api/fraud-flags`
- **Description**: Returns all fraud flags evaluated by engine.
- **Response `200 OK`**: Array of `FraudFlag` objects.

#### `GET /api/fraud-flags/{id}`
- **Description**: Returns fraud flag details by Flag ID or Transaction ID.
- **Response `200 OK`**: Single `FraudFlag` object.

#### `GET /api/fraud-flags/{id}/rules`
- **Description**: Returns granular explainable rule evaluations for a specific flag/transaction.
- **Response `200 OK`**: Array of `RuleResult` objects.

---

### 4.3 Reviews & Case Adjudication

#### `GET /api/reviews/pending`
- **Description**: Returns transactions currently in `PENDING_REVIEW` state.
- **Response `200 OK`**: Array of `Transaction` objects.

#### `POST /api/reviews/{id}/review`
- **Description**: Submits reviewer action: Marks flag as `REVIEWED`.
- **Request Body**:
  ```json
  {
    "comment": "Confirmed customer legitimate travel via secondary callback.",
    "reviewer": "Keshv (Senior Fraud Lead)"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "flag": { /* updated FraudFlag with status: "REVIEWED" */ },
    "review": { /* created Review object */ },
    "auditEvent": { /* AuditEvent recorded in PostgreSQL */ }
  }
  ```

#### `POST /api/reviews/{id}/clear`
- **Description**: Submits reviewer action: Clears case (`CLEARED`).
- **Request Body**:
  ```json
  {
    "comment": "False positive biometric mismatch resolved.",
    "reviewer": "Keshv (Senior Fraud Lead)"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "flag": { /* updated FraudFlag with status: "CLEARED" */ },
    "review": { /* created Review object */ },
    "auditEvent": { /* AuditEvent recorded in PostgreSQL */ }
  }
  ```

---

### 4.4 Declarative Rule Studio

#### `GET /api/rules`
- **Description**: Returns all declarative rules from PostgreSQL store.
- **Response `200 OK`**: Array of `Rule` objects.

#### `POST /api/rules`
- **Description**: Compiles and registers new declarative rule policy.
- **Request Body**:
  ```json
  {
    "name": "Midnight Crypto Burst Velocity",
    "description": "High frequency off-ramping during non-business hours",
    "type": "VELOCITY",
    "config": {
      "field": "transaction_count",
      "operator": "FREQUENCY_EXCEEDS",
      "threshold": 5
    },
    "weight": 25,
    "enabled": true
  }
  ```
- **Response `201 Created`**: Created `Rule` object with `id`, `version: 1`, `createdAt`.

#### `PUT /api/rules/{id}`
- **Description**: Updates rule configuration, weighting, or active status.
- **Request Body**: Partial `Rule` fields.
- **Response `200 OK`**: Updated `Rule` with incremented `version`.

#### `DELETE /api/rules/{id}`
- **Description**: Deletes or archives rule.
- **Response `200 OK`**: `{ "success": true, "deletedId": "..." }`

#### `POST /api/rules/{id}/simulate`
- **Description**: Tests single rule against synthetic payload without persisting results.
- **Request Body**: `{ "payload": { ... } }`
- **Response `200 OK`**:
  ```json
  {
    "ruleId": "RULE-VEL-01",
    "passed": true,
    "details": {
      "observedValue": 6.8,
      "threshold": 4,
      "impactScore": "+30 points",
      "status": "TRIGGERED_ANOMALY"
    }
  }
  ```

---

### 4.5 Executive Dashboard & Simulator

#### `GET /api/dashboard/stats`
- **Description**: Aggregates top-level KPI metrics for reviewer console.
- **Response `200 OK`**:
  ```json
  {
    "totalTransactions": 12480,
    "flaggedTransactions": 438,
    "highRisk": 121,
    "critical": 38,
    "pendingReviews": 64
  }
  ```

#### `POST /api/simulator/run`
- **Description**: Evaluates predefined synthetic attack scenario through full fraud pipeline.
- **Request Body**:
  ```json
  {
    "scenario": "multi-signal-critical"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "scenarioName": "Multi-Signal Critical Fraud",
    "transaction": { /* simulated Transaction */ },
    "breakdown": {
      "velocity": 30,
      "amount": 25,
      "location": 30,
      "total": 85
    },
    "ruleResults": [ /* Array of RuleResults */ ],
    "riskScore": 85,
    "riskLevel": "CRITICAL",
    "decision": "MANUAL REVIEW",
    "explanation": "Simultaneous breaches across velocity, amount multiplier, and geographic vector."
  }
  ```

---

## 5. Notes for Member 1 & Member 2

1. **CORS Configuration**: Ensure FastAPI allows origin `http://localhost:5173` (Vite dev server) with headers `["*"]` and methods `["*"]`.
2. **Database Engine**: All entities map directly to PostgreSQL tables via SQLAlchemy ORM.
3. **AWS SNS / SES Alerts**: On creation of a `CRITICAL` risk flag (`riskScore >= 80`), the backend can trigger AWS SNS/SES notifications asynchronously.
