from typing import Any, Dict

from backend.app.engine.models import Transaction, RuleResult
from backend.app.rules.base import BaseRule


class UnusualAmountRule(BaseRule):
    @property
    def rule_id(self) -> str:
        return "AMOUNT_001"

    @property
    def rule_name(self) -> str:
        return "Unusual Transaction Amount"

    def evaluate(self, transaction: Transaction, context: Dict[str, Any], config: Dict[str, Any]) -> RuleResult:
        mode = config.get("mode", "absolute")
        weight = config.get("weight", 25)

        if mode == "absolute":
            threshold = config.get("threshold", 50000)
            if transaction.amount > threshold:
                evidence = (f"Transaction amount {transaction.amount} {transaction.currency} "
                            f"exceeds the absolute threshold of {threshold}.")
                triggered = True
            else:
                evidence = (f"Transaction amount {transaction.amount} {transaction.currency} "
                            f"is within the absolute threshold of {threshold}.")
                triggered = False
                
        elif mode == "relative":
            multiplier = config.get("multiplier", 5.0)
            historical_average = context.get("historical_average", 0.0)
            
            if historical_average <= 0:
                return RuleResult(
                    rule_id=self.rule_id,
                    rule_name=self.rule_name,
                    triggered=False,
                    score=0,
                    evidence="Insufficient or zero historical average to calculate relative threshold.",
                    transaction_id=transaction.id
                )
                
            threshold = historical_average * multiplier
            if transaction.amount > threshold:
                ratio = round(transaction.amount / historical_average, 2)
                evidence = (f"Transaction amount {transaction.amount} {transaction.currency} is {ratio}x "
                            f"the historical average of {historical_average}; configured multiplier is {multiplier}x.")
                triggered = True
            else:
                evidence = (f"Transaction amount {transaction.amount} {transaction.currency} does not exceed "
                            f"the historical average of {historical_average} with multiplier {multiplier}x.")
                triggered = False
        else:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                triggered=False,
                score=0,
                evidence=f"Unknown rule mode: {mode}.",
                transaction_id=transaction.id
            )

        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            triggered=triggered,
            score=weight if triggered else 0,
            evidence=evidence,
            transaction_id=transaction.id
        )
