export interface SimulationPlanOverride {
  planId?: string;
  employeeIncreasePercent?: number | null;
  employerIncreasePercent?: number | null;
  extraMonthlyEmployeeAmount?: number | null;
  extraMonthlyEmployerAmount?: number | null;
}

export interface SimulationScenario {
  globalEmployeeIncreasePercent?: number | null;
  globalEmployerIncreasePercent?: number | null;
  globalExtraMonthlyEmployeeAmount?: number | null;
  globalExtraMonthlyEmployerAmount?: number | null;
  planOverrides?: SimulationPlanOverride[];
}

export interface SimulationSummary {
  baselineTotalProjectedWithDeposits: number | null;
  simulatedTotalProjectedWithDeposits: number | null;
  estimatedChangeInProjectedBalance: number | null;
  estimatedChangeInProjectedBalancePercent: number | null;

  baselineTotalMonthlyPensionWithDeposits: number | null;
  simulatedTotalMonthlyPensionWithDeposits: number | null;
  estimatedChangeInMonthlyPension: number | null;
  estimatedChangeInMonthlyPensionPercent: number | null;

  totalAdditionalMonthlyDepositsEmployee: number | null;
  totalAdditionalMonthlyDepositsEmployer: number | null;
  totalAdditionalMonthlyDeposits: number | null;

  currency: string;
}

export interface SimulationResult {
  scenario: SimulationScenario;
  summary: SimulationSummary;
}

