from typing import Any, Dict

from backend.app.engine.models import Transaction, FraudDecision
from backend.app.engine.registry import RuleRegistry
from backend.app.engine.evaluator import GenericEvaluator
from backend.app.engine.aggregator import RiskAggregator
from backend.app.rules.velocity import TransactionVelocityRule
from backend.app.rules.amount import UnusualAmountRule
from backend.app.rules.geography import ImpossibleGeographyRule


class FraudEngine:
    """
    Main entrypoint for Member 2 integration.
    Ties together the Registry, Evaluator, and Aggregator.
    """
    
    def __init__(self, registry: RuleRegistry = None):
        self.registry = registry or RuleRegistry()
        self.evaluator = GenericEvaluator()
        self.aggregator = RiskAggregator()
        
        if not registry:
            self.registry.register(TransactionVelocityRule())
            self.registry.register(UnusualAmountRule())
            self.registry.register(ImpossibleGeographyRule())

    def evaluate(self, transaction: Transaction, rules: Dict[str, Dict[str, Any]], context: Dict[str, Any]) -> FraudDecision:
        """
        Evaluate the transaction and return the final FraudDecision.
        
        Args:
            transaction: The current transaction to evaluate.
            rules: A dictionary where keys are rule IDs and values are dictionaries of rule-specific settings.
                   Can also contain an "active_rules" list.
            context: Supplemental history or data (e.g. 'history', 'previous_transaction', 'historical_average')
        """
        active_rule_ids = rules.get("active_rules", [rule.rule_id for rule in self.registry.list_rules()])
        active_rules = self.registry.get_active_rules(active_rule_ids)
        
        rule_results = self.evaluator.evaluate(transaction, active_rules, rules, context)
        
        risk_score, risk_level = self.aggregator.aggregate(rule_results)
        decision_status = self.aggregator.determine_decision(risk_level)
        
        return FraudDecision(
            transaction_id=transaction.id,
            risk_score=risk_score,
            risk_level=risk_level,
            decision=decision_status,
            rule_results=rule_results
        )
