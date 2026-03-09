export interface ProjectionSummary {
  totalCurrentBalance: number | null;
  totalProjectedWithDeposits: number | null;
  totalProjectedNoDeposits: number | null;
  totalMonthlyPensionWithDeposits: number | null;
  totalMonthlyPensionNoDeposits: number | null;
  projectedGrowthPercent: number | null;
  depositImpactOnBalance: number | null;
  depositImpactOnPension: number | null;
  plansWithProjections: number;
  totalPlans: number;
  currency: string;
}

export type GapSeverity = 'high' | 'medium' | 'low' | 'info';

export type GapCategory = 'projection-gap' | 'data-completeness';

export interface GapFlag {
  id: string;
  severity: GapSeverity;
  category: GapCategory;
  message: string;
  field?: string;
  value?: unknown;
}

export interface ProjectionResult {
  summary: ProjectionSummary;
  gaps: GapFlag[];
}

