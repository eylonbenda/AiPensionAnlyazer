import { describe, it, expect } from 'vitest';
import { PensionExtractionSchema } from '../schema';
import { computeProjection } from './engine';

describe('computeProjection', () => {
  it('returns null summary fields and no gaps for an empty minimal extraction', () => {
    const extraction = PensionExtractionSchema.parse({});

    const result = computeProjection(extraction);

    expect(result.summary.totalCurrentBalance).toBeNull();
    expect(result.summary.totalProjectedWithDeposits).toBeNull();
    expect(result.summary.totalProjectedNoDeposits).toBeNull();
    expect(result.summary.totalMonthlyPensionWithDeposits).toBeNull();
    expect(result.summary.totalMonthlyPensionNoDeposits).toBeNull();
    expect(result.summary.projectedGrowthPercent).toBeNull();
    expect(result.summary.depositImpactOnBalance).toBeNull();
    expect(result.summary.depositImpactOnPension).toBeNull();
    expect(result.summary.plansWithProjections).toBe(0);
    expect(result.summary.totalPlans).toBe(0);
    expect(result.summary.currency).toBe('');
    expect(result.gaps).toHaveLength(0);
  });

  it('aggregates plan-level projections and computes derived metrics', () => {
    const extraction = PensionExtractionSchema.parse({
      currency: 'ILS',
      totalCurrentSavings: 100_000,
      totalProjectedSavings: 300_000,
      plans: [
        {
          currentBalance: 60_000,
          projectedBalanceWithDeposits: 180_000,
          projectedBalanceNoDeposits: 120_000,
          monthlyPensionWithDeposits: 3_000,
          monthlyPensionNoDeposits: 2_000,
        },
        {
          currentBalance: 40_000,
          projectedBalanceWithDeposits: 120_000,
          projectedBalanceNoDeposits: 80_000,
          monthlyPensionWithDeposits: 2_000,
          monthlyPensionNoDeposits: 1_500,
        },
      ],
    });

    const result = computeProjection(extraction);

    expect(result.summary.totalCurrentBalance).toBe(100_000);
    expect(result.summary.totalProjectedWithDeposits).toBe(300_000);
    expect(result.summary.totalProjectedNoDeposits).toBe(200_000);
    expect(result.summary.totalMonthlyPensionWithDeposits).toBe(5_000);
    expect(result.summary.totalMonthlyPensionNoDeposits).toBe(3_500);
    expect(result.summary.currency).toBe('ILS');
    expect(result.summary.plansWithProjections).toBe(2);
    expect(result.summary.totalPlans).toBe(2);

    expect(result.summary.projectedGrowthPercent).toBeCloseTo(200);
    expect(result.summary.depositImpactOnBalance).toBe(100_000);
    expect(result.summary.depositImpactOnPension).toBe(1_500);

    const gapIds = result.gaps.map((g) => g.id);
    expect(gapIds).toContain('significant-deposit-cessation-impact');
  });

  it('falls back to top-level totals when plan balances are missing', () => {
    const extraction = PensionExtractionSchema.parse({
      currency: 'EUR',
      totalCurrentSavings: 50_000,
      totalProjectedSavings: 70_000,
      plans: [
        {
          currentBalance: null,
          projectedBalanceWithDeposits: null,
          projectedBalanceNoDeposits: null,
        },
      ],
    });

    const result = computeProjection(extraction);

    expect(result.summary.totalCurrentBalance).toBe(50_000);
    expect(result.summary.totalProjectedWithDeposits).toBe(70_000);
    expect(result.summary.totalProjectedNoDeposits).toBeNull();
    expect(result.summary.currency).toBe('EUR');
  });

  it('flags partial-plan-projections when some plans have projections and others do not', () => {
    const extraction = PensionExtractionSchema.parse({
      plans: [
        {
          currentBalance: 40_000,
          projectedBalanceWithDeposits: 100_000,
        },
        {
          currentBalance: 20_000,
          projectedBalanceWithDeposits: null,
          projectedBalanceNoDeposits: null,
        },
      ],
    });

    const result = computeProjection(extraction);

    const gapIds = result.gaps.map((g) => g.id);
    expect(gapIds).toContain('partial-plan-projections');
  });

  it('flags no-monthly-pension-data when no monthly pension projections are present', () => {
    const extraction = PensionExtractionSchema.parse({
      plans: [
        {
          currentBalance: 10_000,
          projectedBalanceWithDeposits: 20_000,
        },
      ],
    });

    const result = computeProjection(extraction);

    const gapIds = result.gaps.map((g) => g.id);
    expect(gapIds).toContain('no-monthly-pension-data');
  });

  it('is null-safe for partially filled plan data', () => {
    const extraction = PensionExtractionSchema.parse({
      currency: 'USD',
      plans: [
        {
          currentBalance: 25_000,
          projectedBalanceWithDeposits: null,
          monthlyPensionWithDeposits: null,
        },
        {
          currentBalance: null,
          projectedBalanceWithDeposits: 40_000,
          monthlyPensionWithDeposits: 1_200,
        },
      ],
    });

    const result = computeProjection(extraction);

    expect(result.summary.totalCurrentBalance).toBe(25_000);
    expect(result.summary.totalProjectedWithDeposits).toBe(40_000);
    expect(result.summary.totalProjectedNoDeposits).toBeNull();
    expect(result.summary.totalMonthlyPensionWithDeposits).toBe(1_200);
    expect(result.summary.totalMonthlyPensionNoDeposits).toBeNull();
    expect(result.summary.currency).toBe('USD');
  });
});

