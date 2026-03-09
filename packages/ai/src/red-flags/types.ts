export type Severity = 'high' | 'medium' | 'low';

export type RedFlagCategory = 'fees' | 'contributions' | 'coverage' | 'data-quality';

export interface RedFlag {
  id: string;
  severity: Severity;
  category: RedFlagCategory;
  message: string;
  field?: string;
  value?: unknown;
  threshold?: unknown;
}

export const FEE_SAVINGS_HIGH_THRESHOLD = 1.0;
export const FEE_PREMIUM_HIGH_THRESHOLD = 4.0;
export const FEE_TOP_LEVEL_HIGH_THRESHOLD = 1.5;

export const LOW_EMPLOYEE_CONTRIBUTION_THRESHOLD = 5.5;
export const LOW_EMPLOYER_CONTRIBUTION_THRESHOLD = 6.0;

export const NO_RECENT_DEPOSITS_MONTHS_THRESHOLD = 6;

