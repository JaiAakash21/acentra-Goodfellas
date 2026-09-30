export interface Rule {
  id: string;
  name: string;
  description: string;
  type: string;
  config: Record<string, unknown>;
  weight: number;
  enabled: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface RuleFormData {
  name: string;
  description: string;
  type: string;
  field: string;
  operator: string;
  threshold: string;
  weight: number;
  enabled: boolean;
}
