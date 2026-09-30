from abc import ABC, abstractmethod
from typing import Any, Dict

from backend.app.engine.models import Transaction, RuleResult


class BaseRule(ABC):
    """
    Abstract base contract for all FraudLens rules.
    Every new rule must inherit from this class and implement the evaluate method.
    """
    
    @property
    @abstractmethod
    def rule_id(self) -> str:
        """Unique identifier for this rule."""
        pass
        
    @property
    @abstractmethod
    def rule_name(self) -> str:
        """Human-readable name for this rule."""
        pass

    @abstractmethod
    def evaluate(self, transaction: Transaction, context: Dict[str, Any], config: Dict[str, Any]) -> RuleResult:
        """
        Evaluate the transaction using the supplied context and configuration.
        Returns a RuleResult indicating if the rule triggered, score, and evidence.
        """
        pass
