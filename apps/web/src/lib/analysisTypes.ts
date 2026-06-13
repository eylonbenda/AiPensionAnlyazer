export type AnalysisStatus = "PROCESSING" | "READY" | "FAILED";

export type RetirementGapStatus = "SHORTFALL" | "ON_TRACK" | "SURPLUS";

export type FlagSeverity = "HIGH" | "MEDIUM" | "LOW" | "INFO";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "DISMISSED";

export type TaskPriority = "HIGH" | "MEDIUM" | "LOW";

export type PlanStatus = "ACTIVE" | "INACTIVE" | "UNKNOWN";

export type PensionPlan = {
  id: string;
  providerCompany?: string;
  planName?: string;
  productType?: string;
  currentBalance?: number;
  projectedBalanceWithDeposits?: number;
  monthlyPensionWithDeposits?: number;
  managementFeeFromSavingsPercent?: number;
  managementFeeFromPremiumPercent?: number;
  status?: PlanStatus;
};

export type StructuredData = {
  plans: PensionPlan[];
};

export type AnalysisFlag = {
  id: string;
  severity: FlagSeverity;
  title: string;
  message: string;
  evidence?: string;
};

export type ProjectionData = {
  totalCurrentBalance: number;
  totalProjectedBalance: number;
  totalMonthlyPensionProjected: number;
  dataCompletenessScore: number;
  calculationVersion: string;
};

export type GapInsight = {
  targetMonthlyPension: number;
  projectedMonthlyPension: number;
  gapAmount: number;
  status: RetirementGapStatus;
};

export type SimulationSnapshot = {
  projectedMonthlyPension: number;
};

export type SimulationData = {
  baseline: SimulationSnapshot;
  simulated: SimulationSnapshot;
  delta: SimulationSnapshot;
  notes: string[];
};

export type AnalysisTask = {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
};

export type PensionAnalysis = {
  id: string;
  reportTitle: string;
  providerSummary?: string;
  status: AnalysisStatus;
  lastUpdatedAt: string;
  currency: string;
  structuredData: StructuredData;
  flags: AnalysisFlag[];
  projection: ProjectionData;
  gapInsight?: GapInsight;
  simulation?: SimulationData;
  tasks: AnalysisTask[];
};
