import { PensionExtraction, PlanEntry } from '../schema';
import {
  FEE_PREMIUM_HIGH_THRESHOLD,
  FEE_SAVINGS_HIGH_THRESHOLD,
  FEE_TOP_LEVEL_HIGH_THRESHOLD,
  LOW_EMPLOYEE_CONTRIBUTION_THRESHOLD,
  LOW_EMPLOYER_CONTRIBUTION_THRESHOLD,
  NO_RECENT_DEPOSITS_MONTHS_THRESHOLD,
  RedFlag,
} from './types';

function createFlag(partial: Omit<RedFlag, 'category'> & { category: RedFlag['category'] }): RedFlag {
  return partial;
}

function hasRecentDepositAmounts(plan: PlanEntry): boolean {
  return (plan.lastMonthlyDepositEmployee != null && plan.lastMonthlyDepositEmployee > 0) ||
         (plan.lastMonthlyDepositEmployer != null && plan.lastMonthlyDepositEmployer > 0);
}

function normalizeStatus(status: string | undefined | null): string {
  return (status ?? '').toLowerCase();
}

function isInactiveStatus(status: string | undefined | null): boolean {
  const s = normalizeStatus(status);
  if (!s) return false;
  return s.includes('לא פעיל') || s.includes('inactive') || s.includes('closed');
}

function isActivePlan(plan: PlanEntry): boolean {
  const status = normalizeStatus(plan.status);
  if (!status) {
    return true;
  }
  return !isInactiveStatus(status);
}

function isPensionFundProductType(productType: string | undefined | null): boolean {
  const t = (productType ?? '').toLowerCase();
  if (!t) return false;
  return t.includes('פנסיה') || t.includes('pension');
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  const parts = trimmed.split('/');

  // Formats like DD/MM/YYYY
  if (parts.length === 3) {
    const [d, m, y] = parts.map((p) => Number(p));
    if (!Number.isNaN(d) && !Number.isNaN(m) && !Number.isNaN(y)) {
      const date = new Date(y, m - 1, d);
      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }
  }

  // Formats like MM/YYYY – month-level dates that appear in deposit summaries
  if (parts.length === 2) {
    const [m, y] = parts.map((p) => Number(p));
    if (!Number.isNaN(m) && !Number.isNaN(y)) {
      const date = new Date(y, m - 1, 1);
      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }
  }

  const iso = new Date(trimmed);
  if (!Number.isNaN(iso.getTime())) {
    return iso;
  }
  return null;
}

function monthsBetween(from: Date, to: Date): number {
  const years = to.getFullYear() - from.getFullYear();
  const months = to.getMonth() - from.getMonth();
  const totalMonths = years * 12 + months;
  if (to.getDate() < from.getDate()) {
    return totalMonths - 1;
  }
  return totalMonths;
}

export function evaluateFeeFlags(extraction: PensionExtraction): RedFlag[] {
  const flags: RedFlag[] = [];

  if (extraction.managementFeePercent != null && extraction.managementFeePercent > FEE_TOP_LEVEL_HIGH_THRESHOLD) {
    flags.push(
      createFlag({
        id: 'high-top-level-fee',
        category: 'fees',
        severity: 'medium',
        message: `Top-level management fee (${extraction.managementFeePercent}%) is above ${FEE_TOP_LEVEL_HIGH_THRESHOLD}%.`,
        field: 'managementFeePercent',
        value: extraction.managementFeePercent,
        threshold: FEE_TOP_LEVEL_HIGH_THRESHOLD,
      }),
    );
  }

  if (!Array.isArray(extraction.plans)) {
    return flags;
  }

  extraction.plans.forEach((plan, index) => {
    const inactiveAndEmpty = isInactiveStatus(plan.status) &&
      (plan.currentBalance == null || plan.currentBalance === 0);
    if (inactiveAndEmpty) {
      return;
    }

    if (
      plan.managementFeeFromSavingsPercent != null &&
      plan.managementFeeFromSavingsPercent > FEE_SAVINGS_HIGH_THRESHOLD
    ) {
      flags.push(
        createFlag({
          id: 'high-savings-fee',
          category: 'fees',
          severity: 'high',
          message: `Plan ${index + 1} management fee from savings (${plan.managementFeeFromSavingsPercent}%) is above ${FEE_SAVINGS_HIGH_THRESHOLD}%.`,
          field: `plans[${index}].managementFeeFromSavingsPercent`,
          value: plan.managementFeeFromSavingsPercent,
          threshold: FEE_SAVINGS_HIGH_THRESHOLD,
        }),
      );
    }

    if (
      plan.managementFeeFromPremiumPercent != null &&
      plan.managementFeeFromPremiumPercent > FEE_PREMIUM_HIGH_THRESHOLD
    ) {
      flags.push(
        createFlag({
          id: 'high-premium-fee',
          category: 'fees',
          severity: 'high',
          message: `Plan ${index + 1} management fee from premiums (${plan.managementFeeFromPremiumPercent}%) is above ${FEE_PREMIUM_HIGH_THRESHOLD}%.`,
          field: `plans[${index}].managementFeeFromPremiumPercent`,
          value: plan.managementFeeFromPremiumPercent,
          threshold: FEE_PREMIUM_HIGH_THRESHOLD,
        }),
      );
    }
  });

  return flags;
}

export function evaluateContributionFlags(extraction: PensionExtraction): RedFlag[] {
  const flags: RedFlag[] = [];
  if (!Array.isArray(extraction.plans)) {
    return flags;
  }

  const now = new Date();

  extraction.plans.forEach((plan, index) => {
    const active = isActivePlan(plan);

    if (active) {
      const lastDepositDate = parseDate(plan.lastDepositDate);
      const recentByDate = lastDepositDate != null && monthsBetween(lastDepositDate, now) <= NO_RECENT_DEPOSITS_MONTHS_THRESHOLD;
      const recentByAmounts = hasRecentDepositAmounts(plan);

      if (!recentByDate && !recentByAmounts) {
        flags.push(
          createFlag({
            id: 'no-recent-deposits',
            category: 'contributions',
            severity: 'high',
            message: `Plan ${index + 1} appears active but last deposit date is missing or older than ${NO_RECENT_DEPOSITS_MONTHS_THRESHOLD} months and no recent deposit amounts found.`,
            field: `plans[${index}].lastDepositDate`,
            value: plan.lastDepositDate,
            threshold: `${NO_RECENT_DEPOSITS_MONTHS_THRESHOLD} months`,
          }),
        );
      }
    }

    if (plan.employeeContributionPercent != null && plan.employeeContributionPercent < LOW_EMPLOYEE_CONTRIBUTION_THRESHOLD) {
      flags.push(
        createFlag({
          id: 'low-employee-contribution',
          category: 'contributions',
          severity: 'medium',
          message: `Plan ${index + 1} employee contribution rate (${plan.employeeContributionPercent}%) is below ${LOW_EMPLOYEE_CONTRIBUTION_THRESHOLD}%.`,
          field: `plans[${index}].employeeContributionPercent`,
          value: plan.employeeContributionPercent,
          threshold: LOW_EMPLOYEE_CONTRIBUTION_THRESHOLD,
        }),
      );
    }

    if (plan.employerContributionPercent != null && plan.employerContributionPercent < LOW_EMPLOYER_CONTRIBUTION_THRESHOLD) {
      flags.push(
        createFlag({
          id: 'low-employer-contribution',
          category: 'contributions',
          severity: 'medium',
          message: `Plan ${index + 1} employer contribution rate (${plan.employerContributionPercent}%) is below ${LOW_EMPLOYER_CONTRIBUTION_THRESHOLD}%.`,
          field: `plans[${index}].employerContributionPercent`,
          value: plan.employerContributionPercent,
          threshold: LOW_EMPLOYER_CONTRIBUTION_THRESHOLD,
        }),
      );
    }

    if (
      active &&
      plan.employeeContributionPercent == null &&
      plan.employerContributionPercent == null &&
      !hasRecentDepositAmounts(plan)
    ) {
      flags.push(
        createFlag({
          id: 'missing-contribution-rates',
          category: 'contributions',
          severity: 'low',
          message: `Plan ${index + 1} appears active but both employee and employer contribution rates are missing and no recent deposit amounts found.`,
          field: `plans[${index}].employeeContributionPercent|employerContributionPercent`,
        }),
      );
    }
  });

  return flags;
}

export function evaluateCoverageFlags(extraction: PensionExtraction): RedFlag[] {
  const flags: RedFlag[] = [];
  if (!Array.isArray(extraction.plans)) {
    return flags;
  }

  extraction.plans.forEach((plan, index) => {
    if (isPensionFundProductType(plan.productType) && plan.disabilityPension == null) {
      flags.push(
        createFlag({
          id: 'no-disability-pension',
          category: 'coverage',
          severity: 'medium',
          message: `Pension fund plan ${index + 1} has no disability pension value.`,
          field: `plans[${index}].disabilityPension`,
        }),
      );
    }
  });

  return flags;
}

export function evaluateDataQualityFlags(extraction: PensionExtraction): RedFlag[] {
  const flags: RedFlag[] = [];
  if (!Array.isArray(extraction.plans)) {
    return flags;
  }

  extraction.plans.forEach((plan, index) => {
    if (isInactiveStatus(plan.status) && plan.currentBalance != null && plan.currentBalance > 0) {
      flags.push(
        createFlag({
          id: 'inactive-plan-with-balance',
          category: 'data-quality',
          severity: 'low',
          message: `Inactive plan ${index + 1} still shows a positive balance (${plan.currentBalance}).`,
          field: `plans[${index}].currentBalance`,
          value: plan.currentBalance,
        }),
      );
    }

    if (plan.ytdReturnPercent != null && plan.ytdReturnPercent < 0) {
      flags.push(
        createFlag({
          id: 'negative-ytd-return',
          category: 'data-quality',
          severity: 'low',
          message: `Plan ${index + 1} has a negative year-to-date return (${plan.ytdReturnPercent}%).`,
          field: `plans[${index}].ytdReturnPercent`,
          value: plan.ytdReturnPercent,
        }),
      );
    }

    const active = isActivePlan(plan);
    if (
      active &&
      plan.projectedBalanceNoDeposits == null &&
      plan.projectedBalanceWithDeposits == null
    ) {
      flags.push(
        createFlag({
          id: 'missing-projected-savings',
          category: 'data-quality',
          severity: 'low',
          message: `Active plan ${index + 1} is missing projected savings values.`,
          field: `plans[${index}].projectedBalanceNoDeposits|projectedBalanceWithDeposits`,
        }),
      );
    }
  });

  return flags;
}

