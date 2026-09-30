from typing import List

try:
    from backend.app.engine.models import RiskLevel, RuleResult
except ImportError:
    from app.engine.models import RiskLevel, RuleResult


class RiskAggregator:
    """Aggregates scores from individual rules and determines final risk level."""
    
    def aggregate(self, rule_results: List[RuleResult]) -> tuple[int, RiskLevel]:
        """
        Calculate final risk score capped at 100, and assign a RiskLevel.
        """
        total_score = sum(result.score for result in rule_results if result.triggered)
        
        total_score = max(0, min(100, total_score))
        
        if total_score >= 80:
            level = RiskLevel.CRITICAL
        elif total_score >= 60:
            level = RiskLevel.HIGH
        elif total_score >= 25:
            level = RiskLevel.MEDIUM
        else:
            level = RiskLevel.LOW

            
        return total_score, level

    def determine_decision(self, risk_level: RiskLevel) -> str:
        """Map risk level to an internal decision status."""
        if risk_level == RiskLevel.CRITICAL:
            return "PRIORITY_REVIEW"
        elif risk_level == RiskLevel.HIGH:
            return "REVIEW"
        elif risk_level == RiskLevel.MEDIUM:
            return "MONITOR"
        else:
            return "APPROVE"
