import unittest
from datetime import datetime, timedelta, timezone

from backend.app.engine.models import Transaction
from backend.app.rules.velocity import TransactionVelocityRule
from backend.app.rules.amount import UnusualAmountRule
from backend.app.rules.geography import ImpossibleGeographyRule

class TestRules(unittest.TestCase):
    def setUp(self):
        self.now = datetime.now(timezone.utc)
        self.tx = Transaction(
            id="tx-curr",
            account_id="acc-123",
            amount=60000.0,
            currency="INR",
            timestamp=self.now,
            latitude=12.9716,
            longitude=77.5946,
            location_name="Bengaluru",
            merchant="Amazon",
            device_id="dev-1",
            ip_address="192.168.1.1"
        )
        
    def test_velocity_rule_triggers(self):
        rule = TransactionVelocityRule()
        history = [
            Transaction(id=f"tx-{i}", account_id="acc-123", amount=100.0, currency="INR", 
                        timestamp=self.now - timedelta(minutes=i), latitude=0.0, longitude=0.0, 
                        location_name="None", merchant="None", device_id="None", ip_address="None")
            for i in range(1, 6)
        ]
        context = {"history": history}
        config = {"threshold": 5, "window_minutes": 10, "weight": 30}
        
        result = rule.evaluate(self.tx, context, config)
        self.assertTrue(result.triggered)
        self.assertEqual(result.score, 30)

    def test_velocity_rule_no_trigger(self):
        rule = TransactionVelocityRule()
        history = [
            Transaction(id=f"tx-{i}", account_id="acc-123", amount=100.0, currency="INR", 
                        timestamp=self.now - timedelta(minutes=i), latitude=0.0, longitude=0.0, 
                        location_name="None", merchant="None", device_id="None", ip_address="None")
            for i in range(1, 3) 
        ]
        context = {"history": history}
        config = {"threshold": 5}
        
        result = rule.evaluate(self.tx, context, config)
        self.assertFalse(result.triggered)
        self.assertEqual(result.score, 0)
        
    def test_amount_rule_absolute(self):
        rule = UnusualAmountRule()
        config = {"mode": "absolute", "threshold": 50000, "weight": 25}
        result = rule.evaluate(self.tx, {}, config)
        self.assertTrue(result.triggered)
        self.assertEqual(result.score, 25)
        
    def test_amount_rule_relative(self):
        rule = UnusualAmountRule()
        config = {"mode": "relative", "multiplier": 5.0, "weight": 25}
        context = {"historical_average": 10000.0}
        result = rule.evaluate(self.tx, context, config)
        self.assertTrue(result.triggered)
        
    def test_geography_rule_triggers(self):
        rule = ImpossibleGeographyRule()
        prev_tx = Transaction(
            id="tx-prev", account_id="acc-123", amount=100.0, currency="INR", 
            timestamp=self.now - timedelta(hours=1), latitude=28.7041, longitude=77.1025, 
            location_name="Delhi", merchant="None", device_id="None", ip_address="None"
        )
        context = {"previous_transaction": prev_tx}
        config = {"speed_limit_kmh": 900, "weight": 30}
        
        result = rule.evaluate(self.tx, context, config)
        self.assertTrue(result.triggered)
        self.assertEqual(result.score, 30)

    def test_geography_rule_no_trigger(self):
        rule = ImpossibleGeographyRule()
        prev_tx = Transaction(
            id="tx-prev", account_id="acc-123", amount=100.0, currency="INR", 
            timestamp=self.now - timedelta(hours=1), latitude=12.9716, longitude=77.5946, 
            location_name="Bengaluru", merchant="None", device_id="None", ip_address="None"
        )
        context = {"previous_transaction": prev_tx}
        config = {"speed_limit_kmh": 900}
        
        result = rule.evaluate(self.tx, context, config)
        self.assertFalse(result.triggered)
