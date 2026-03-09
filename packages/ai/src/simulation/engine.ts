import { PensionExtraction } from '../schema';
import {
  SimulationResult,
  SimulationScenario,
  SimulationSummary,
} from './types';

function safeSum(values: Array<number | null | undefined>): number | null {
  const nums = values.filter(
    (v): v is number => typeof v === 'number' && !Number.isNaN(v),
  );
  if (nums.length === 0) {
    return null;
  }
  return nums.reduce((acc, v) => acc + v, 0);
}

function pickOverrideOrGlobal(
  overrideValue: number | null | undefined,
  globalValue: number | null | undefined,
): number | null {
  if (overrideValue != null) {
    return overrideValue;
  }
  if (globalValue != null) {
    return globalValue;
  }
  return null;
}

export function runSimulation(
  extraction: PensionExtraction,
  scenario: SimulationScenario,
): SimulationResult {
  const plans = Array.isArray(extraction.plans) ? extraction.plans : [];
  const currency = extraction.currency || '';

  const baselineTotalProjectedWithDepositsFromPlans = safeSum(
    plans.map((p) => p.projectedBalanceWithDeposits),
  );

  const baselineTotalProjectedWithDeposits =
    baselineTotalProjectedWithDepositsFromPlans ??
    (extraction.totalProjectedSavings ?? null);

  const baselineTotalMonthlyPensionWithDeposits = safeSum(
    plans.map((p) => p.monthlyPensionWithDeposits),
  );

  const additionalEmployeePerPlan: number[] = [];
  const additionalEmployerPerPlan: number[] = [];

  const additionalProjectedBalancePerPlan: number[] = [];
  const additionalMonthlyPensionPerPlan: number[] = [];

  plans.forEach((plan, index) => {
    const baselineEmployee =
      typeof plan.lastMonthlyDepositEmployee === 'number' &&
      !Number.isNaN(plan.lastMonthlyDepositEmployee)
        ? Math.max(plan.lastMonthlyDepositEmployee, 0)
        : 0;

    const baselineEmployer =
      typeof plan.lastMonthlyDepositEmployer === 'number' &&
      !Number.isNaN(plan.lastMonthlyDepositEmployer)
        ? Math.max(plan.lastMonthlyDepositEmployer, 0)
        : 0;

    const override =
      Array.isArray(scenario.planOverrides) &&
      scenario.planOverrides.length > index
        ? scenario.planOverrides[index]
        : undefined;

    const employeeIncreasePercent = pickOverrideOrGlobal(
      override?.employeeIncreasePercent ?? null,
      scenario.globalEmployeeIncreasePercent ?? null,
    );
    const employerIncreasePercent = pickOverrideOrGlobal(
      override?.employerIncreasePercent ?? null,
      scenario.globalEmployerIncreasePercent ?? null,
    );

    const extraMonthlyEmployeeAmount = pickOverrideOrGlobal(
      override?.extraMonthlyEmployeeAmount ?? null,
      scenario.globalExtraMonthlyEmployeeAmount ?? null,
    );
    const extraMonthlyEmployerAmount = pickOverrideOrGlobal(
      override?.extraMonthlyEmployerAmount ?? null,
      scenario.globalExtraMonthlyEmployerAmount ?? null,
    );

    const employeeFromPercent =
      employeeIncreasePercent != null
        ? (baselineEmployee * employeeIncreasePercent) / 100
        : 0;
    const employerFromPercent =
      employerIncreasePercent != null
        ? (baselineEmployer * employerIncreasePercent) / 100
        : 0;

    const employeeFixed = extraMonthlyEmployeeAmount ?? 0;
    const employerFixed = extraMonthlyEmployerAmount ?? 0;

    const additionalEmployee = Math.max(
      0,
      employeeFromPercent + employeeFixed,
    );
    const additionalEmployer = Math.max(
      0,
      employerFromPercent + employerFixed,
    );

    additionalEmployeePerPlan[index] = additionalEmployee;
    additionalEmployerPerPlan[index] = additionalEmployer;

    const currentBalance =
      typeof plan.currentBalance === 'number' &&
      !Number.isNaN(plan.currentBalance)
        ? plan.currentBalance
        : null;
    const projectedBalanceWithDeposits =
      typeof plan.projectedBalanceWithDeposits === 'number' &&
      !Number.isNaN(plan.projectedBalanceWithDeposits)
        ? plan.projectedBalanceWithDeposits
        : null;

    let additionalPlanProjectedBalance: number | null = null;

    if (
      currentBalance != null &&
      currentBalance > 0 &&
      projectedBalanceWithDeposits != null &&
      projectedBalanceWithDeposits > 0
    ) {
      const growthMultiple = projectedBalanceWithDeposits / currentBalance;
      const totalAdditionalDeposit = additionalEmployee + additionalEmployer;
      if (totalAdditionalDeposit > 0) {
        additionalPlanProjectedBalance = totalAdditionalDeposit * growthMultiple;
      }
    }

    additionalProjectedBalancePerPlan[index] =
      additionalPlanProjectedBalance ?? 0;

    const monthlyPensionWithDeposits =
      typeof plan.monthlyPensionWithDeposits === 'number' &&
      !Number.isNaN(plan.monthlyPensionWithDeposits)
        ? plan.monthlyPensionWithDeposits
        : null;

    let additionalPlanMonthlyPension: number | null = null;

    if (
      monthlyPensionWithDeposits != null &&
      monthlyPensionWithDeposits > 0 &&
      projectedBalanceWithDeposits != null &&
      projectedBalanceWithDeposits > 0 &&
      additionalPlanProjectedBalance != null &&
      additionalPlanProjectedBalance > 0
    ) {
      const pensionPerBalance =
        monthlyPensionWithDeposits / projectedBalanceWithDeposits;
      additionalPlanMonthlyPension =
        additionalPlanProjectedBalance * pensionPerBalance;
    }

    additionalMonthlyPensionPerPlan[index] =
      additionalPlanMonthlyPension ?? 0;
  });

  const estimatedChangeInProjectedBalance = safeSum(
    additionalProjectedBalancePerPlan,
  );
  const estimatedChangeInMonthlyPension = safeSum(
    additionalMonthlyPensionPerPlan,
  );

  const totalAdditionalMonthlyDepositsEmployee = safeSum(
    additionalEmployeePerPlan,
  );
  const totalAdditionalMonthlyDepositsEmployer = safeSum(
    additionalEmployerPerPlan,
  );
  const totalAdditionalMonthlyDeposits = safeSum([
    totalAdditionalMonthlyDepositsEmployee,
    totalAdditionalMonthlyDepositsEmployer,
  ]);

  const simulatedTotalProjectedWithDeposits =
    baselineTotalProjectedWithDeposits != null &&
    estimatedChangeInProjectedBalance != null
      ? baselineTotalProjectedWithDeposits + estimatedChangeInProjectedBalance
      : baselineTotalProjectedWithDeposits;

  const simulatedTotalMonthlyPensionWithDeposits =
    baselineTotalMonthlyPensionWithDeposits != null &&
    estimatedChangeInMonthlyPension != null
      ? baselineTotalMonthlyPensionWithDeposits +
        estimatedChangeInMonthlyPension
      : baselineTotalMonthlyPensionWithDeposits;

  let estimatedChangeInProjectedBalancePercent: number | null = null;
  if (
    baselineTotalProjectedWithDeposits != null &&
    baselineTotalProjectedWithDeposits > 0 &&
    estimatedChangeInProjectedBalance != null
  ) {
    estimatedChangeInProjectedBalancePercent =
      (estimatedChangeInProjectedBalance /
        baselineTotalProjectedWithDeposits) *
      100;
  }

  let estimatedChangeInMonthlyPensionPercent: number | null = null;
  if (
    baselineTotalMonthlyPensionWithDeposits != null &&
    baselineTotalMonthlyPensionWithDeposits > 0 &&
    estimatedChangeInMonthlyPension != null
  ) {
    estimatedChangeInMonthlyPensionPercent =
      (estimatedChangeInMonthlyPension /
        baselineTotalMonthlyPensionWithDeposits) *
      100;
  }

  const summary: SimulationSummary = {
    baselineTotalProjectedWithDeposits,
    simulatedTotalProjectedWithDeposits: simulatedTotalProjectedWithDeposits,
    estimatedChangeInProjectedBalance,
    estimatedChangeInProjectedBalancePercent,
    baselineTotalMonthlyPensionWithDeposits,
    simulatedTotalMonthlyPensionWithDeposits,
    estimatedChangeInMonthlyPension,
    estimatedChangeInMonthlyPensionPercent,
    totalAdditionalMonthlyDepositsEmployee,
    totalAdditionalMonthlyDepositsEmployer,
    totalAdditionalMonthlyDeposits,
    currency,
  };

  return {
    scenario,
    summary,
  };
}

