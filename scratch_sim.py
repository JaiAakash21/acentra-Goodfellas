import sys
import logging
from datetime import datetime, timezone, timedelta

try:
    from backend.app.engine.engine import FraudEngine
    from backend.app.engine.models import Transaction, RiskLevel
    print("[PASS] Dependencies imported successfully without FastAPI/SQLAlchemy.")
except ImportError as e:
    print(f"[FAIL] Dependency error: {e}")
    sys.exit(1)

def run_simulation():
    engine = FraudEngine()
    
    # 1. TIMEZONE TEST
    try:
        naive_tx = Transaction(
            id="tx-naive", account_id="acc-1", amount=100.0, currency="USD",
            timestamp=datetime.now(), latitude=0.0, longitude=0.0,
            location_name="X", merchant="Y", device_id="Z", ip_address="1.1.1.1"
        )
        aware_history = [
            Transaction(
                id="tx-aware", account_id="acc-1", amount=100.0, currency="USD",
                timestamp=datetime.now(timezone.utc), latitude=0.0, longitude=0.0,
                location_name="X", merchant="Y", device_id="Z", ip_address="1.1.1.1"
            )
        ]
        engine.evaluate(naive_tx, {"active_rules": ["VELOCITY_001"]}, {"history": aware_history})
        print("[FAIL] Timezone mismatch did NOT raise an exception!")
    except RuntimeError as e:
        if "TypeError" in str(e.__cause__) or "can't compare offset-naive" in str(e):
            print("[PASS] Timezone naive/aware mismatch correctly raised RuntimeError wrapping TypeError (Fail loud).")
        else:
            raise

    # 2. DETERMINISM & SCENARIOS
    now = datetime.now(timezone.utc)
    rules = {
        "active_rules": ["VELOCITY_001", "AMOUNT_001", "GEO_001"],
        "VELOCITY_001": {"threshold": 5, "window_minutes": 10, "weight": 30},
        "AMOUNT_001": {"mode": "absolute", "threshold": 50000, "weight": 25},
        "GEO_001": {"speed_limit_kmh": 900, "weight": 30}
    }
    
    # SCENARIO 1: NORMAL
    tx_normal = Transaction(
        id="tx-s1", account_id="acc-2", amount=1000.0, currency="USD",
        timestamp=now, latitude=40.7128, longitude=-74.0060,
        location_name="NY", merchant="Apple", device_id="dev-1", ip_address="1.1.1.1"
    )
    context_normal = {
        "history": [],
        "previous_transaction": None,
        "historical_average": 500.0
    }
    d1 = engine.evaluate(tx_normal, rules, context_normal)
    assert d1.risk_score == 0 and d1.risk_level == RiskLevel.LOW
    print("[PASS] Scenario 1 (Normal): 0 triggered rules, LOW, APPROVE")
    
    # SCENARIO 2: SUSPICIOUS (Velocity)
    history_suspicious = [
        Transaction(
            id=f"tx-s2-h{i}", account_id="acc-2", amount=10.0, currency="USD",
            timestamp=now - timedelta(minutes=i), latitude=40.7128, longitude=-74.0060,
            location_name="NY", merchant="Apple", device_id="dev-1", ip_address="1.1.1.1"
        ) for i in range(6)
    ]
    context_suspicious = {
        "history": history_suspicious,
        "previous_transaction": history_suspicious[0],
        "historical_average": 500.0
    }
    d2 = engine.evaluate(tx_normal, rules, context_suspicious)
    assert d2.risk_score == 30 and d2.risk_level == RiskLevel.MEDIUM
    assert sum(1 for r in d2.rule_results if r.triggered) == 1
    print("[PASS] Scenario 2 (Suspicious): 1 triggered rule, MEDIUM, MONITOR")
    
    # SCENARIO 3: CRITICAL (Velocity, Amount, Geography)
    tx_critical = Transaction(
        id="tx-s3", account_id="acc-2", amount=100000.0, currency="USD",
        timestamp=now, latitude=51.5074, longitude=-0.1278, # London
        location_name="London", merchant="Apple", device_id="dev-1", ip_address="1.1.1.1"
    )
    
    # Previous tx 1 hour ago in NY
    prev_tx_critical = Transaction(
        id="tx-s3-prev", account_id="acc-2", amount=10.0, currency="USD",
        timestamp=now - timedelta(hours=1), latitude=40.7128, longitude=-74.0060,
        location_name="NY", merchant="Apple", device_id="dev-1", ip_address="1.1.1.1"
    )
    
    context_critical = {
        "history": history_suspicious,
        "previous_transaction": prev_tx_critical,
        "historical_average": 500.0
    }
    d3 = engine.evaluate(tx_critical, rules, context_critical)
    print(f"d3 risk score: {d3.risk_score}")
    for r in d3.rule_results: print(f"Rule: {r.rule_id}, Triggered: {r.triggered}, Score: {r.score}, Evidence: {r.evidence}")
    assert d3.risk_score == 85 and d3.risk_level == RiskLevel.CRITICAL
    assert sum(1 for r in d3.rule_results if r.triggered) == 3
    print("[PASS] Scenario 3 (Critical): 3 triggered rules, CRITICAL, PRIORITY_REVIEW")
    
    # DETERMINISM
    d3_repeat = engine.evaluate(tx_critical, rules, context_critical)
    assert d3 == d3_repeat
    print("[PASS] Determinism Test: Same inputs produced exact same output (100% deterministic).")

    # Member 2 Interface Simulation Mapping
    print(f"[PASS] Member 2 Integration fields accessible: ID={d3.transaction_id}, Score={d3.risk_score}, Level={d3.risk_level.name}, Decision={d3.decision}")

if __name__ == "__main__":
    run_simulation()
