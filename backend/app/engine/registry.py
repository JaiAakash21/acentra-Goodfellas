from typing import Dict, List

try:
    from backend.app.rules.base import BaseRule
except ImportError:
    from app.rules.base import BaseRule



class RuleRegistry:
    """Registry to manage and retrieve available fraud rules dynamically."""
    
    def __init__(self):
        self._rules: Dict[str, BaseRule] = {}

    def register(self, rule: BaseRule) -> None:
        """Register a new rule instance. Raises ValueError on duplicate IDs."""
        if rule.rule_id in self._rules:
            raise ValueError(f"Rule with ID {rule.rule_id} is already registered.")
        self._rules[rule.rule_id] = rule

    def get_rule(self, rule_id: str) -> BaseRule:
        """Retrieve a rule by its ID."""
        if rule_id not in self._rules:
            raise KeyError(f"Rule with ID {rule_id} not found.")
        return self._rules[rule_id]

    def list_rules(self) -> List[BaseRule]:
        """List all registered rules."""
        return list(self._rules.values())

    def get_active_rules(self, active_rule_ids: List[str]) -> List[BaseRule]:
        """Retrieve a list of rules that are marked as active in configuration."""
        active_rules = []
        for rule_id in active_rule_ids:
            if rule_id in self._rules:
                active_rules.append(self._rules[rule_id])
        return active_rules
