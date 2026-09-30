from datetime import timedelta
from typing import Any, Dict

from backend.app.engine.models import Transaction, RuleResult
from backend.app.rules.base import BaseRule


class TransactionVelocityRule(BaseRule):
    @property
    def rule_id(self) -> str:
        return "VELOCITY_001"
        
    @property
    def rule_name(self) -> str:
        return "Transaction Velocity"

    def evaluate(self, transaction: Transaction, context: Dict[str, Any], config: Dict[str, Any]) -> RuleResult:
        subject_field = config.get("subject", "account_id")
        window_minutes = config.get("window_minutes", 10)
        threshold = config.get("threshold", 5)
        weight = config.get("weight", 30)

        history = context.get("history", [])

        subject_val = getattr(transaction, subject_field, None)
        if subject_val is None:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                triggered=False,
                score=0,
                evidence=f"Missing subject field '{subject_field}' on transaction.",
                transaction_id=transaction.id
            )

        window_start = transaction.timestamp - timedelta(minutes=window_minutes)
        
        valid_history = []
        for h_tx in history:
            h_subject_val = getattr(h_tx, subject_field, None)
            if h_subject_val == subject_val and h_tx.id != transaction.id:
                if window_start <= h_tx.timestamp <= transaction.timestamp:
                    valid_history.append(h_tx)

        total_count = len(valid_history) + 1
        triggered = total_count > threshold
        score = weight if triggered else 0

        if triggered:
            evidence = (f"{total_count} transactions detected for {subject_field} '{subject_val}' "
                        f"within {window_minutes} minutes; configured threshold is {threshold}.")
        else:
            evidence = (f"{total_count} transactions detected for {subject_field} '{subject_val}' "
                        f"within {window_minutes} minutes. Did not exceed threshold {threshold}.")

        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            triggered=triggered,
            score=score,
            evidence=evidence,
            transaction_id=transaction.id
        )
