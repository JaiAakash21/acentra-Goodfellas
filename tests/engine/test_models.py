import unittest
from datetime import datetime, timezone

from backend.app.engine.models import Transaction, RuleResult, FraudDecision, RiskLevel


class TestModels(unittest.TestCase):
    def test_transaction_creation(self):
        tx = Transaction(
            id="tx-123",
            account_id="acc-456",
            amount=500.0,
            currency="INR",
            timestamp=datetime.now(timezone.utc),
            latitude=12.9716,
            longitude=77.5946,
            location_name="Bengaluru",
            merchant="Amazon",
            device_id="dev-789",
            ip_address="192.168.1.1"
        )
        self.assertEqual(tx.id, "tx-123")
        self.assertEqual(tx.amount, 500.0)

    def test_rule_result_creation(self):
        result = RuleResult(
            rule_id="VELOCITY_001",
            rule_name="Transaction Velocity",
            triggered=True,
            score=30,
            evidence="6 transactions in 10 minutes",
            transaction_id="tx-123"
        )
        self.assertTrue(result.triggered)
        self.assertEqual(result.score, 30)

    def test_fraud_decision_creation(self):
        result = RuleResult(
            rule_id="VELOCITY_001",
            rule_name="Transaction Velocity",
            triggered=True,
            score=30,
            evidence="6 transactions in 10 minutes",
            transaction_id="tx-123"
        )
        
        decision = FraudDecision(
            transaction_id="tx-123",
            risk_score=30,
            risk_level=RiskLevel.MEDIUM,
            decision="REVIEW",
            rule_results=[result]
        )
        
        self.assertEqual(decision.risk_score, 30)
        self.assertEqual(decision.risk_level, RiskLevel.MEDIUM)
        self.assertEqual(len(decision.rule_results), 1)
        self.assertEqual(decision.rule_results[0].rule_id, "VELOCITY_001")


if __name__ == '__main__':
    unittest.main()
