import unittest
from typing import Any, Dict

from backend.app.engine.engine import FraudEngine
from backend.app.engine.models import Transaction, RuleResult, RiskLevel
from backend.app.rules.base import BaseRule
import datetime

class NewDeviceRule(BaseRule):
    """A custom test-only rule to prove extensibility."""
    @property
    def rule_id(self) -> str:
        return "DEVICE_001"
        
    @property
    def rule_name(self) -> str:
        return "New Device Rule"

    def evaluate(self, transaction: Transaction, context: Dict[str, Any], config: Dict[str, Any]) -> RuleResult:
        known_devices = context.get("known_devices", [])
        weight = config.get("weight", 40)
        
        triggered = transaction.device_id not in known_devices
        score = weight if triggered else 0
        evidence = f"Device {transaction.device_id} is new." if triggered else "Device known."
        
        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            triggered=triggered,
            score=score,
            evidence=evidence,
            transaction_id=transaction.id
        )

class TestExtensibility(unittest.TestCase):
    def test_custom_rule_integration(self):
        engine = FraudEngine()
        
        engine.registry.register(NewDeviceRule())
        
        tx = Transaction(
            id="tx-ext", account_id="acc-1", amount=100.0, currency="INR",
            timestamp=datetime.datetime.now(datetime.timezone.utc), 
            latitude=0.0, longitude=0.0, location_name="NA", merchant="NA",
            device_id="unknown-device", ip_address="1.1.1.1"
        )
        
        context = {"known_devices": ["device-1", "device-2"]}
        config = {
            "DEVICE_001": {"weight": 40}
        }
        
        decision = engine.evaluate(tx, context, config)
        
        custom_result = next((r for r in decision.rule_results if r.rule_id == "DEVICE_001"), None)
        self.assertIsNotNone(custom_result)
        self.assertTrue(custom_result.triggered)
        self.assertEqual(custom_result.score, 40)
        
        self.assertEqual(decision.risk_score, 40)
        self.assertEqual(decision.risk_level, RiskLevel.MEDIUM)
