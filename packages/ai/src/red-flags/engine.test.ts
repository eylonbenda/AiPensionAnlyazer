import { describe, it, expect } from 'vitest';
import { PensionExtractionSchema } from '../schema';
import { computeRedFlags } from './engine';

describe('computeRedFlags', () => {
  it('returns no flags for an empty minimal extraction', () => {
    const extraction = PensionExtractionSchema.parse({});

    const flags = computeRedFlags(extraction);

    expect(flags.length).toBe(0);
  });

  it('detects multiple fee and contribution issues on a single plan', () => {
    const extraction = PensionExtractionSchema.parse({
      currency: 'ILS',
      managementFeePercent: 2.0,
      plans: [
        {
          productType: 'קרן פנסיה',
          status: 'פעיל',
          managementFeeFromSavingsPercent: 1.2,
          managementFeeFromPremiumPercent: 5.0,
          employeeContributionPercent: 3.0,
          employerContributionPercent: 4.0,
          ytdReturnPercent: -2.5,
          currentBalance: 100_000,
          projectedBalanceNoDeposits: null,
          projectedBalanceWithDeposits: null,
          lastDepositDate: '01/01/2023',
          disabilityPension: null,
        },
      ],
    });

    const flags = computeRedFlags(extraction);
    const ids = flags.map((f) => f.id).sort();

    expect(ids).toContain('high-top-level-fee');
    expect(ids).toContain('high-savings-fee');
    expect(ids).toContain('high-premium-fee');
    expect(ids).toContain('low-employee-contribution');
    expect(ids).toContain('low-employer-contribution');
    expect(ids).toContain('missing-projected-savings');
    expect(ids).toContain('no-recent-deposits');
    expect(ids).toContain('no-disability-pension');
    expect(ids).toContain('negative-ytd-return');
  });

  it('does not flag inactive plan with zero balance for fees', () => {
    const extraction = PensionExtractionSchema.parse({
      plans: [
        {
          status: 'לא פעיל',
          currentBalance: 0,
          managementFeeFromSavingsPercent: 1.99,
        },
      ],
    });

    const flags = computeRedFlags(extraction);
    const ids = flags.map((f) => f.id);

    expect(ids).not.toContain('inactive-plan-with-balance');
    expect(ids).not.toContain('high-savings-fee');
  });

  it('does not flag no-recent-deposits when deposit amounts exist', () => {
    const extraction = PensionExtractionSchema.parse({
      plans: [
        {
          status: 'פעיל',
          lastDepositDate: '',
          lastMonthlyDepositEmployee: 1572.6,
          lastMonthlyDepositEmployer: 3886.96,
          currentBalance: 405_000,
        },
      ],
    });

    const flags = computeRedFlags(extraction);
    const ids = flags.map((f) => f.id);

    expect(ids).not.toContain('no-recent-deposits');
  });

  it('does not flag missing-contribution-rates when deposit amounts exist', () => {
    const extraction = PensionExtractionSchema.parse({
      plans: [
        {
          status: 'פעיל',
          lastMonthlyDepositEmployee: 25342.06,
          lastMonthlyDepositEmployer: 76026.02,
          currentBalance: 102_949,
        },
      ],
    });

    const flags = computeRedFlags(extraction);
    const ids = flags.map((f) => f.id);

    expect(ids).not.toContain('missing-contribution-rates');
  });

  it('correctly parses MM/YYYY deposit dates as recent', () => {
    const extraction = PensionExtractionSchema.parse({
      plans: [
        {
          status: 'פעיל',
          lastDepositDate: '01/2026',
          currentBalance: 102_949,
        },
        {
          status: 'פעיל',
          lastDepositDate: '12/2025',
          currentBalance: 39_567,
        },
      ],
    });

    const flags = computeRedFlags(extraction);
    const ids = flags.map((f) => f.id);

    expect(ids).not.toContain('no-recent-deposits');
  });
});
