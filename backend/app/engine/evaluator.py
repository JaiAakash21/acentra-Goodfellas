import logging
from typing import Any, Dict, List

from backend.app.engine.models import Transaction, RuleResult
from backend.app.rules.base import BaseRule

logger = logging.getLogger(__name__)


class GenericEvaluator:
    """Executes registered rules against a transaction."""
    
    def evaluate(self, transaction: Transaction, rules: List[BaseRule], context: Dict[str, Any], rule_configs: Dict[str, Dict[str, Any]]) -> List[RuleResult]:
        """
        Evaluate a transaction across a list of rules.
        rule_configs contains configuration for each rule keyed by rule_id.
        """
        results = []
        
        for rule in rules:
            config = rule_configs.get(rule.rule_id, {})
            # Skip if explicitly disabled
            if config.get("enabled", True) is False:
                continue
                
            try:
                result = rule.evaluate(transaction, context, config)
                results.append(result)
            except Exception as e:
                logger.error(f"Rule {rule.rule_id} failed during evaluation: {str(e)}")
                results.append(RuleResult(
                    rule_id=rule.rule_id,
                    rule_name=rule.rule_name,
                    triggered=False,
                    score=0,
                    evidence=f"Rule evaluation failed due to internal error: {str(e)}",
                    transaction_id=transaction.id
                ))
                
        return results
