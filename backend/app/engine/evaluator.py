import logging
from typing import Any, Dict, List

from backend.app.engine.models import Transaction, RuleResult
from backend.app.rules.base import BaseRule

logger = logging.getLogger(__name__)


class GenericEvaluator:
    """Executes registered rules against a transaction."""
    
    def evaluate(self, transaction: Transaction, active_rules: List[BaseRule], rules_config: Dict[str, Dict[str, Any]], context: Dict[str, Any]) -> List[RuleResult]:
        """
        Evaluate a transaction across a list of rules.
        rules_config contains configuration for each rule keyed by rule_id.
        """
        results = []
        
        for rule in active_rules:
            config = rules_config.get(rule.rule_id, {})
            # Skip if explicitly disabled
            if config.get("enabled", True) is False:
                continue
                
            try:
                result = rule.evaluate(transaction, context, config)
                results.append(result)
            except Exception as e:
                logger.error(f"Rule {rule.rule_id} failed during evaluation: {str(e)}")
                raise RuntimeError(f"Evaluation of rule {rule.rule_id} failed: {str(e)}") from e
                
        return results
