# FraudLens Engine (Member 1 Integration Guide)

This package contains the core Fraud Engine. It is completely independent of FastAPI, SQLAlchemy, and AWS.

## Handoff for Member 2

As Member 2, you will integrate this engine into the FastAPI layer. Here is how:

### 1. Import the Engine
```python
from backend.app.engine.engine import FraudEngine
from backend.app.engine.models import Transaction

# Instantiate once at application startup
fraud_engine = FraudEngine()
```

### 2. Construct the Transaction and Context
When an API request comes in, validate it with Pydantic, then convert it into the engine's `Transaction` domain model.

Next, query your database to build the evaluation `context`. The engine expects the caller to provide history to avoid DB coupling.

```python
tx = Transaction(
    id="uuid-from-db",
    account_id=api_request.accountId,
    amount=api_request.amount,
    currency=api_request.currency,
    timestamp=api_request.timestamp,
    latitude=api_request.latitude,
    longitude=api_request.longitude,
    location_name=api_request.locationName,
    merchant=api_request.merchant,
    device_id=api_request.deviceId,
    ip_address=api_request.ipAddress
)

# Fetch context from your repositories
context = {
    "history": [], # List of previous Transaction models for this account
    "previous_transaction": None, # The single most recent Transaction model
    "historical_average": 5000.0
}

# Configuration (eventually coming from Member 4's Rule Studio DB)
config = {
    "VELOCITY_001": {"threshold": 5, "window_minutes": 10, "weight": 30},
    "AMOUNT_001": {"mode": "absolute", "threshold": 50000, "weight": 25},
    "GEO_001": {"speed_limit_kmh": 900, "weight": 30}
}
```

### 3. Evaluate the Transaction
```python
decision = fraud_engine.evaluate(tx, context, config)
```

### 4. Construct the API Response
The `decision` is a `FraudDecision` object. Map it to the frozen frontend contract:

```python
# Create FraudFlag for DB/API
fraud_flag = FraudFlag(
    id="new-uuid",
    transactionId=decision.transaction_id,
    riskScore=decision.risk_score,
    riskLevel=decision.risk_level.value,
    status="PENDING_REVIEW" if decision.decision in ["REVIEW", "PRIORITY_REVIEW"] else "CLEARED",
    triggeredRuleCount=sum(1 for r in decision.rule_results if r.triggered),
    createdAt=datetime.utcnow()
)

# RuleResults are also available inside `decision.rule_results`.
```

## Example Scenarios

- **NORMAL (Low Risk)**: No rules trigger. `risk_score` = 0. `risk_level` = "LOW".
- **SUSPICIOUS (Medium/High)**: Velocity triggers. `risk_score` = 30. `risk_level` = "MEDIUM".
- **HIGH RISK (Critical)**: Velocity, Amount, and Geo trigger. `risk_score` = 85. `risk_level` = "CRITICAL".
