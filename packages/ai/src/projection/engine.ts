import { PensionExtraction } from '../schema';
import { GapFlag, ProjectionResult, ProjectionSummary } from './types';

function safeSum(values: Array<number | null | undefined>): number | null {
  const nums = values.filter(
    (v): v is number => typeof v === 'number' && !Number.isNaN(v),
  );
  if (nums.length === 0) {
    return null;
  }
  return nums.reduce((acc, v) => acc + v, 0);
}

function computeGrowthPercent(
  current: number | null,
  projected: number | null,
): number | null {
  if (current == null || projected == null || current === 0) {
    return null;
  }
  return ((projected - current) / current) * 100;
}

function computeDifference(
  withDeposits: number | null,
  noDeposits: number | null,
): number | null {
  if (withDeposits == null || noDeposits == null) {
    return null;
  }
  return withDeposits - noDeposits;
}

export function computeProjection(extraction: PensionExtraction): ProjectionResult {
  const plans = Array.isArray(extraction.plans) ? extraction.plans : [];

  const planCurrentBalances = plans.map((p) => p.currentBalance);
  const currentFromPlans = safeSum(planCurrentBalances);

  const totalCurrentBalance =
    currentFromPlans ??
    (extraction.totalCurrentSavings ?? extraction.currentBalance ?? null);

  const projectedWithFromPlans = safeSum(
    plans.map((p) => p.projectedBalanceWithDeposits),
  );
  const totalProjectedWithDeposits =
    projectedWithFromPlans ?? (extraction.totalProjectedSavings ?? null);

  const totalProjectedNoDeposits = safeSum(
    plans.map((p) => p.projectedBalanceNoDeposits),
  );

  const totalMonthlyPensionWithDeposits = safeSum(
    plans.map((p) => p.monthlyPensionWithDeposits),
  );
  const totalMonthlyPensionNoDeposits = safeSum(
    plans.map((p) => p.monthlyPensionNoDeposits),
  );

  const projectedGrowthPercent = computeGrowthPercent(
    totalCurrentBalance,
    totalProjectedWithDeposits,
  );

  const depositImpactOnBalance = computeDifference(
    totalProjectedWithDeposits,
    totalProjectedNoDeposits,
  );

  const depositImpactOnPension = computeDifference(
    totalMonthlyPensionWithDeposits,
    totalMonthlyPensionNoDeposits,
  );

  const plansWithProjections = plans.filter((p) => {
    return (
      p.projectedBalanceWithDeposits != null ||
      p.projectedBalanceNoDeposits != null ||
      p.monthlyPensionWithDeposits != null ||
      p.monthlyPensionNoDeposits != null
    );
  }).length;

  const totalPlans = plans.length;

  const currency = extraction.currency || '';

  const summary: ProjectionSummary = {
    totalCurrentBalance,
    totalProjectedWithDeposits,
    totalProjectedNoDeposits,
    totalMonthlyPensionWithDeposits,
    totalMonthlyPensionNoDeposits,
    projectedGrowthPercent,
    depositImpactOnBalance,
    depositImpactOnPension,
    plansWithProjections,
    totalPlans,
    currency,
  };

  const gaps: GapFlag[] = [];

  const hasAnyProjectionValue =
    totalProjectedWithDeposits != null ||
    totalProjectedNoDeposits != null ||
    totalMonthlyPensionWithDeposits != null ||
    totalMonthlyPensionNoDeposits != null;

  const hasAnyCurrentIndicator =
    totalPlans > 0 ||
    extraction.totalCurrentSavings != null ||
    extraction.currentBalance != null;

  if (!hasAnyProjectionValue && hasAnyCurrentIndicator) {
    gaps.push({
      id: 'no-projection-data',
      severity: 'high',
      category: 'data-completeness',
      message:
        'No projected balance or monthly pension values were identified in the available data.',
    });
  }

  if (totalPlans > 0) {
    const plansWithCurrentBalance = plans.filter(
      (p) => p.currentBalance != null,
    );
    const plansWithCurrentAndProjection = plansWithCurrentBalance.filter(
      (p) =>
        p.projectedBalanceWithDeposits != null ||
        p.projectedBalanceNoDeposits != null,
    );

    if (
      plansWithCurrentBalance.length > 0 &&
      plansWithCurrentAndProjection.length > 0 &&
      plansWithCurrentAndProjection.length < plansWithCurrentBalance.length
    ) {
      gaps.push({
        id: 'partial-plan-projections',
        severity: 'medium',
        category: 'data-completeness',
        message:
          'For some plans with a current balance, projected balance information was not identified.',
      });
    }
  }

  if (
    totalMonthlyPensionWithDeposits == null &&
    totalMonthlyPensionNoDeposits == null &&
    totalPlans > 0
  ) {
    gaps.push({
      id: 'no-monthly-pension-data',
      severity: 'medium',
      category: 'data-completeness',
      message:
        'No monthly pension projection amounts were identified for the plans in this document.',
    });
  }

  if (totalProjectedWithDeposits != null && totalProjectedWithDeposits > 0) {
    const diff = depositImpactOnBalance;
    if (diff != null) {
      const impactPercent = (diff / totalProjectedWithDeposits) * 100;
      if (impactPercent >= 30) {
        gaps.push({
          id: 'significant-deposit-cessation-impact',
          severity: 'info',
          category: 'projection-gap',
          message:
            'In the available data, the projection with ongoing deposits is substantially higher than the projection without deposits.',
          field: 'projectedBalanceWithDeposits',
          value: { impactPercent },
        });
      }
    }
  } else if (
    totalMonthlyPensionWithDeposits != null &&
    totalMonthlyPensionWithDeposits > 0
  ) {
    const diff = depositImpactOnPension;
    if (diff != null) {
      const impactPercent = (diff / totalMonthlyPensionWithDeposits) * 100;
      if (impactPercent >= 30) {
        gaps.push({
          id: 'significant-deposit-cessation-impact',
          severity: 'info',
          category: 'projection-gap',
          message:
            'In the available data, the projected monthly pension with ongoing deposits is substantially higher than without deposits.',
          field: 'monthlyPensionWithDeposits',
          value: { impactPercent },
        });
      }
    }
  }

  return {
    summary,
    gaps,
  };
}

