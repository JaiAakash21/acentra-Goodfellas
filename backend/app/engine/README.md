# FraudLens Engine (Member 1 Integration Guide)

## 1. What FraudLens Member 1 Provides
Member 1 provides the core, deterministic Fraud Decision Engine. It evaluates financial transactions against multiple independent fraud rules (Velocity, Amount, Geography) and produces an aggregated risk score and decision. The engine is entirely decoupled from databases, APIs, or specific frameworks.

## 2. Architecture
```
Transaction
    ↓
Rule Registry (Active Rules Loaded)
    ↓
Generic Evaluator (Executes Rules Independently)
    ↓
RuleResult[]
    ↓
Risk Aggregator
    ↓
FraudDecision
```

## 3. Exact engine.evaluate Signature
```python
def evaluate(self, transaction: Transaction, rules: Dict[str, Dict[str, Any]], context: Dict[str, Any]) -> FraudDecision:
```

## 4. Transaction Input
`transaction` must be an instance of `backend.app.engine.models.Transaction`. It perfectly mirrors the incoming API contract:
```python
Transaction(
    id="...",
    account_id="...",
    amount=100.0,
    currency="USD",
    timestamp=datetime.now(timezone.utc),
    latitude=40.7128,
    longitude=-74.0060,
    location_name="NY",
    merchant="Store",
    device_id="dev-123",
    ip_address="192.168.1.1"
)
```

## 5. rules Configuration
`rules` is the active/configured rule manifest supplied dynamically (expected to eventually come from Member 4's DB configurations).
```python
rules = {
    "active_rules": ["VELOCITY_001", "AMOUNT_001", "GEO_001"],
    "VELOCITY_001": {"threshold": 5, "window_minutes": 10, "weight": 30},
    "AMOUNT_001": {"mode": "absolute", "threshold": 50000, "weight": 25},
    "GEO_001": {"speed_limit_kmh": 900, "weight": 30}
}
```

## 6. context Structure
`context` provides external historical data supplied by Member 2 to prevent database coupling within the engine.
```python
context = {
    # List of previous Transaction models (unsorted is fine)
    # The Velocity rule calculates based on these
    "history": [Transaction(...), ...],
    
    # The single most recent Transaction model
    # The Geography rule uses this to calculate speed
    "previous_transaction": Transaction(...),
    
    # Historical average amount for the account (float)
    # Used by the relative Amount rule
    "historical_average": 5000.0
}
```

## 7. FraudDecision Output
The engine returns a `FraudDecision` object:
```python
{
    "transaction_id": "...",
    "risk_score": 85,
    "risk_level": <RiskLevel.CRITICAL>,
    "decision": "PRIORITY_REVIEW",
    "rule_results": [...] # List of RuleResult objects
}
```

## 8. RuleResult Mapping
The internal `RuleResult` contains:
`rule_id`, `rule_name`, `triggered`, `score`, `evidence`, `transaction_id`.

**RuleResult.id Gap**: Member 1 produces the engine-level `RuleResult` without persistence identity. Member 2 may assign/persist the UUID/primary key `id` at the API/database boundary to perfectly match the Frontend Contract.

## 9. Risk Levels
The final aggregated score (capped 0-100) resolves to a Risk Level:
- LOW: 0–29
- MEDIUM: 30–59
- HIGH: 60–79
- CRITICAL: 80–100

## 10. Decision Mapping
- `LOW` → `APPROVE`
- `MEDIUM` → `MONITOR`
- `HIGH` → `REVIEW`
- `CRITICAL` → `PRIORITY_REVIEW`

## 11. Three Sample Scenarios
### SCENARIO 1 — NORMAL
- **Input**: Low amount, nearby geography, minimal history.
- **Output**: 0 triggered rules, `risk_score` = 0, `risk_level` = LOW, `decision` = APPROVE.
### SCENARIO 2 — SUSPICIOUS
- **Input**: 6 transactions in 10 minutes.
- **Output**: 1 triggered rule (VELOCITY_001), `risk_score` = 30, `risk_level` = MEDIUM, `decision` = MONITOR. Evidence: "6 transactions detected for account_id 'acc-123' within 10 minutes; configured threshold is 5."
### SCENARIO 3 — CRITICAL
- **Input**: Fast velocity, 100k amount (threshold 50k), impossible speed since previous tx.
- **Output**: 3 triggered rules, `risk_score` = 85 (30+25+30), `risk_level` = CRITICAL, `decision` = PRIORITY_REVIEW. 3 explainable RuleResults.

## 12. Timezone Assumption
All `Transaction` timestamps and historical timestamps reaching Member 1 must be timezone-aware (e.g., `datetime.now(timezone.utc)`). The engine expects normalized UTC timestamps and does not silently convert naive ones.

## 13. Error Behavior
If an individual rule crashes due to bad data, the `GenericEvaluator` will explicitly raise a `RuntimeError` wrapped around the exception. It fails loudly so integration issues are highly debuggable.

## 14. How to Run Tests
From the project root:
`python -m unittest discover -s tests`
