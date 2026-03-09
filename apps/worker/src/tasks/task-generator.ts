import { PensionExtraction } from '@pension-analyzer/ai';
import type { RedFlag } from '@pension-analyzer/ai';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskSourceType = 'FLAG' | 'GAP' | 'SYSTEM';

export interface TaskDefinition {
  taskKey: string;
  title: string;
  description: string;
  priority: TaskPriority;
  sourceType: TaskSourceType;
  sourceRef?: string;
  relatedPlanIndexes?: number[];
}

function parsePlanIndexFromField(field?: string): number | null {
  if (!field) return null;
  const match = field.match(/plans\[(\d+)\]/);
  if (!match) return null;
  const idx = Number.parseInt(match[1], 10);
  return Number.isNaN(idx) ? null : idx;
}

function collectPlanIndexesForFlagId(flags: RedFlag[], id: string): number[] {
  const indexes = new Set<number>();
  for (const flag of flags) {
    if (flag.id !== id) continue;
    const idx = parsePlanIndexFromField(flag.field);
    if (idx != null) {
      indexes.add(idx);
    }
  }
  return Array.from(indexes).sort((a, b) => a - b);
}

function hasAnyFlag(flags: RedFlag[], id: string): boolean {
  return flags.some((f) => f.id === id);
}

export function buildTasksFromAnalysis(input: {
  structured: PensionExtraction | null;
  redFlags: RedFlag[] | null;
  gapInsight?: unknown | null;
}): TaskDefinition[] {
  const { structured, redFlags, gapInsight } = input;
  const tasks: TaskDefinition[] = [];

  const flags: RedFlag[] = Array.isArray(redFlags) ? redFlags : [];

  // System-level: upload latest report
  tasks.push({
    taskKey: 'UPLOAD_LATEST_REPORT',
    title: 'Upload the latest pension report',
    description: 'Upload the most recent pension statement so that the analysis reflects up-to-date information.',
    priority: 'LOW',
    sourceType: 'SYSTEM',
  });

  // MULTIPLE_PLANS → CHECK_MULTIPLE_PLANS (system-derived from structured data)
  if (structured && Array.isArray(structured.plans) && structured.plans.length > 1) {
    const relatedPlanIndexes: number[] = [];
    structured.plans.forEach((plan, index) => {
      // Treat plans with any non-null balance as relevant
      if (plan.currentBalance != null && !Number.isNaN(plan.currentBalance)) {
        relatedPlanIndexes.push(index);
      }
    });

    tasks.push({
      taskKey: 'CHECK_MULTIPLE_PLANS',
      title: "Verify you don't have multiple active plans",
      description:
        'You appear to have multiple plans. Consider verifying whether they are all needed and whether there is duplication.',
      priority: 'MEDIUM',
      sourceType: 'SYSTEM',
      sourceRef: 'MULTIPLE_PLANS',
      relatedPlanIndexes: relatedPlanIndexes.length > 0 ? relatedPlanIndexes : undefined,
    });
  }

  // HIGH_MGMT_FEE_SAVINGS → CHECK_MGMT_FEES_SAVINGS (from high-savings-fee flags)
  if (hasAnyFlag(flags, 'high-savings-fee')) {
    const relatedPlanIndexes = collectPlanIndexesForFlagId(flags, 'high-savings-fee');

    tasks.push({
      taskKey: 'CHECK_MGMT_FEES_SAVINGS',
      title: 'Check management fees from savings',
      description:
        'Management fees from savings look high in at least one plan. Consider requesting an updated fee quote or comparison.',
      priority: 'MEDIUM',
      sourceType: 'FLAG',
      sourceRef: 'high-savings-fee',
      relatedPlanIndexes: relatedPlanIndexes.length > 0 ? relatedPlanIndexes : undefined,
    });
  }

  // HIGH_MGMT_FEE_PREMIUM → CHECK_MGMT_FEES_PREMIUM (from high-premium-fee flags)
  if (hasAnyFlag(flags, 'high-premium-fee')) {
    const relatedPlanIndexes = collectPlanIndexesForFlagId(flags, 'high-premium-fee');

    tasks.push({
      taskKey: 'CHECK_MGMT_FEES_PREMIUM',
      title: 'Check management fees from premiums',
      description:
        'Management fees from premiums look high in at least one plan. Consider requesting an updated fee quote or comparison.',
      priority: 'MEDIUM',
      sourceType: 'FLAG',
      sourceRef: 'high-premium-fee',
      relatedPlanIndexes: relatedPlanIndexes.length > 0 ? relatedPlanIndexes : undefined,
    });
  }

  // MISSING_FEES_INFO → REQUEST_FEES_INFO (system-derived when there is no fee information at all)
  if (structured) {
    const hasTopLevelFee =
      typeof structured.managementFeePercent === 'number' &&
      !Number.isNaN(structured.managementFeePercent);
    const hasPlanLevelFee =
      Array.isArray(structured.plans) &&
      structured.plans.some(
        (plan) =>
          (typeof plan.managementFeeFromSavingsPercent === 'number' &&
            !Number.isNaN(plan.managementFeeFromSavingsPercent)) ||
          (typeof plan.managementFeeFromPremiumPercent === 'number' &&
            !Number.isNaN(plan.managementFeeFromPremiumPercent)),
      );

    if (!hasTopLevelFee && !hasPlanLevelFee) {
      tasks.push({
        taskKey: 'REQUEST_FEES_INFO',
        title: 'Request detailed management fee information',
        description:
          'Management fee information is missing or incomplete. Consider requesting a detailed breakdown of management fees from your provider.',
        priority: 'LOW',
        sourceType: 'SYSTEM',
        sourceRef: 'MISSING_FEES_INFO',
      });
    }
  }

  // NO_DEPOSITS_INFO → VERIFY_DEPOSITS_STATUS (from no-recent-deposits / missing-contribution-rates flags)
  if (hasAnyFlag(flags, 'no-recent-deposits') || hasAnyFlag(flags, 'missing-contribution-rates')) {
    const relatedPlanIndexes = [
      ...collectPlanIndexesForFlagId(flags, 'no-recent-deposits'),
      ...collectPlanIndexesForFlagId(flags, 'missing-contribution-rates'),
    ];
    const uniqueIndexes =
      relatedPlanIndexes.length > 0
        ? Array.from(new Set(relatedPlanIndexes)).sort((a, b) => a - b)
        : undefined;

    tasks.push({
      taskKey: 'VERIFY_DEPOSITS_STATUS',
      title: 'Verify recent deposits and contribution details',
      description:
        'Some plans appear to have missing or outdated deposit and contribution information. Consider verifying that deposits are being made as expected.',
      priority: 'LOW',
      sourceType: 'FLAG',
      sourceRef: 'NO_DEPOSITS_INFO',
      relatedPlanIndexes: uniqueIndexes,
    });
  }

  // INACTIVE_OR_UNKNOWN_STATUS → VERIFY_PLAN_STATUS (from inactive-plan-with-balance and missing/unknown status)
  const inactiveIndexes = collectPlanIndexesForFlagId(flags, 'inactive-plan-with-balance');
  const unknownStatusIndexes: number[] = [];
  if (structured && Array.isArray(structured.plans)) {
    structured.plans.forEach((plan, index) => {
      const status = (plan.status ?? '').trim().toLowerCase();
      if (!status || status.includes('unknown')) {
        unknownStatusIndexes.push(index);
      }
    });
  }
  const combinedStatusIndexes =
    inactiveIndexes.length > 0 || unknownStatusIndexes.length > 0
      ? Array.from(new Set([...inactiveIndexes, ...unknownStatusIndexes])).sort((a, b) => a - b)
      : [];

  if (combinedStatusIndexes.length > 0) {
    tasks.push({
      taskKey: 'VERIFY_PLAN_STATUS',
      title: 'Verify plan status and balances',
      description:
        'Some plans appear inactive or have an unclear status while still showing balances. Consider confirming the status and how these plans are being handled.',
      priority: 'LOW',
      sourceType: 'FLAG',
      sourceRef: 'INACTIVE_OR_UNKNOWN_STATUS',
      relatedPlanIndexes: combinedStatusIndexes,
    });
  }

  // From gapInsight → REVIEW_RETIREMENT_TARGET (if available)
  if (gapInsight && typeof gapInsight === 'object') {
    const status = (gapInsight as any).status as string | undefined;
    if (status === 'SHORTFALL') {
      tasks.push({
        taskKey: 'REVIEW_RETIREMENT_TARGET',
        title: 'Review retirement target vs projected pension',
        description:
          'Your projected monthly pension appears to be below your target. Consider reviewing assumptions, deposit level, and plan status with a professional.',
        priority: 'HIGH',
        sourceType: 'GAP',
        sourceRef: 'SHORTFALL',
      });
    }
  }

  return tasks;
}

