export type RuleType = 'VELOCITY' | 'AMOUNT' | 'LOCATION' | 'DEVICE' | 'BEHAVIORAL';

export type Operator = 
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'EXCEEDS_SPEED'
  | 'FREQUENCY_EXCEEDS'
  | 'NEW_DEVICE'
  | 'GEO_MISMATCH';

export interface Rule {
  id: string;
  name: string;
  description: string;
  weight: number;
  enabled: boolean;
  ruleType: RuleType;
  field: string;
  operator: Operator;
  threshold: string | number;
  createdAt: string;
  updatedAt: string;
}

export interface RuleFormData {
  name: string;
  ruleType: RuleType;
  field: string;
  operator: Operator;
  threshold: string;
  weight: number;
  enabled: boolean;
  description: string;
}
