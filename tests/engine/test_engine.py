import unittest
from datetime import datetime, timezone

from backend.app.engine.engine import FraudEngine
from backend.app.engine.models import Transaction, RiskLevel

class TestFraudEngine(unittest.TestCase):
    def setUp(self):
        self.engine = FraudEngine()
        self.now = datetime.now(timezone.utc)
        self.tx = Transaction(
            id="tx-100", account_id="acc-999", amount=100000.0, currency="INR",
            timestamp=self.now, latitude=12.9716, longitude=77.5946,
            location_name="Bengaluru", merchant="Apple", device_id="dev-1", ip_address="1.1.1.1"
        )
        
    def test_engine_evaluate_all_trigger(self):
        import datetime as dt
        history = [
            Transaction(id=f"h{i}", account_id="acc-999", amount=10.0, currency="INR",
                        timestamp=self.now - dt.timedelta(minutes=i), latitude=0.0, longitude=0.0,
                        location_name="NA", merchant="NA", device_id="NA", ip_address="NA")
            for i in range(1, 6)
        ]
        prev_tx = Transaction(
            id="prev", account_id="acc-999", amount=10.0, currency="INR",
            timestamp=self.now - dt.timedelta(hours=1), latitude=28.7041, longitude=77.1025,
            location_name="Delhi", merchant="NA", device_id="NA", ip_address="NA"
        )
        
        context = {
            "history": history,
            "previous_transaction": prev_tx,
            "historical_average": 5000.0
        }
        
        config = {
            "VEL001": {"threshold": 5, "weight": 30},
            "AMT001": {"mode": "absolute", "threshold": 50000, "weight": 30},
            "GEO001": {"speed_limit_kmh": 900, "weight": 30}
        }
        
        decision = self.engine.evaluate(self.tx, config, context)
        
        self.assertEqual(decision.transaction_id, "tx-100")
        self.assertEqual(decision.risk_score, 90)
        self.assertEqual(decision.risk_level, RiskLevel.CRITICAL)
        self.assertEqual(decision.decision, "PRIORITY_REVIEW")
        
        triggered_rules = [r for r in decision.rule_results if r.triggered]
        self.assertEqual(len(triggered_rules), 3)

    def test_engine_evaluate_disabled_rule(self):
        config = {
            "AMT001": {"enabled": False}
        }
        decision = self.engine.evaluate(self.tx, config, {})
        
        self.assertEqual(decision.risk_score, 0)
        self.assertEqual(decision.risk_level, RiskLevel.LOW)
        self.assertEqual(decision.decision, "APPROVE")
        self.assertEqual(len(decision.rule_results), 2)

