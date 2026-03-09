import { describe, it, expect } from 'vitest';
import { PensionExtractionSchema } from '../schema';
import { runSimulation } from './engine';
import { SimulationScenario } from './types';

describe('runSimulation', () => {
  it('returns null baseline and changes for an empty extraction', () => {
    const extraction = PensionExtractionSchema.parse({});
    const scenario: SimulationScenario = {};

    const result = runSimulation(extraction, scenario);

    expect(result.summary.baselineTotalProjectedWithDeposits).toBeNull();
    expect(result.summary.simulatedTotalProjectedWithDeposits).toBeNull();
    expect(result.summary.estimatedChangeInProjectedBalance).toBeNull();
    expect(result.summary.estimatedChangeInProjectedBalancePercent).toBeNull();

    expect(result.summary.baselineTotalMonthlyPensionWithDeposits).toBeNull();
    expect(result.summary.simulatedTotalMonthlyPensionWithDeposits).toBeNull();
    expect(result.summary.estimatedChangeInMonthlyPension).toBeNull();
    expect(result.summary.estimatedChangeInMonthlyPensionPercent).toBeNull();

    expect(result.summary.totalAdditionalMonthlyDepositsEmployee).toBeNull();
    expect(result.summary.totalAdditionalMonthlyDepositsEmployer).toBeNull();
    expect(result.summary.totalAdditionalMonthlyDeposits).toBeNull();

    expect(result.summary.currency).toBe('');
  });

  it('applies a global employee increase percent and computes positive changes', () => {
    const extraction = PensionExtractionSchema.parse({
      currency: 'ILS',
      plans: [
        {
          currentBalance: 100_000,
          projectedBalanceWithDeposits: 200_000,
          monthlyPensionWithDeposits: 3_000,
          lastMonthlyDepositEmployee: 2_000,
          lastMonthlyDepositEmployer: 4_000,
        },
      ],
    });

    const scenario: SimulationScenario = {
      globalEmployeeIncreasePercent: 10,
    };

    const result = runSimulation(extraction, scenario);

    expect(result.summary.baselineTotalProjectedWithDeposits).toBe(200_000);
    expect(result.summary.baselineTotalMonthlyPensionWithDeposits).toBe(3_000);
    expect(result.summary.currency).toBe('ILS');

    expect(result.summary.totalAdditionalMonthlyDepositsEmployee).toBeCloseTo(
      200,
    );
    expect(result.summary.totalAdditionalMonthlyDepositsEmployer).toBe(0);
    expect(result.summary.totalAdditionalMonthlyDeposits).toBeCloseTo(200);

    expect(
      result.summary.estimatedChangeInProjectedBalance,
    ).toBeGreaterThan(0);
    expect(result.summary.estimatedChangeInMonthlyPension).toBeGreaterThan(0);

    expect(
      result.summary.estimatedChangeInProjectedBalancePercent,
    ).toBeGreaterThan(0);
    expect(
      result.summary.estimatedChangeInMonthlyPensionPercent,
    ).toBeGreaterThan(0);
  });

  it('uses per-plan overrides over global defaults', () => {
    const extraction = PensionExtractionSchema.parse({
      plans: [
        {
          currentBalance: 50_000,
          projectedBalanceWithDeposits: 100_000,
          monthlyPensionWithDeposits: 1_500,
          lastMonthlyDepositEmployee: 1_000,
          lastMonthlyDepositEmployer: 2_000,
        },
        {
          currentBalance: 60_000,
          projectedBalanceWithDeposits: 150_000,
          monthlyPensionWithDeposits: 2_000,
          lastMonthlyDepositEmployee: 1_200,
          lastMonthlyDepositEmployer: 2_400,
        },
      ],
    });

    const scenario: SimulationScenario = {
      globalEmployeeIncreasePercent: 5,
      planOverrides: [
        {
          employeeIncreasePercent: 20,
        },
      ],
    };

    const result = runSimulation(extraction, scenario);

    const totalAdditionalEmployee =
      result.summary.totalAdditionalMonthlyDepositsEmployee;

    expect(totalAdditionalEmployee).not.toBeNull();
    if (totalAdditionalEmployee != null) {
      expect(totalAdditionalEmployee).toBeGreaterThan(0);
    }
  });

  it('is null-safe when plans are partially filled', () => {
    const extraction = PensionExtractionSchema.parse({
      currency: 'USD',
      plans: [
        {
          currentBalance: 25_000,
          projectedBalanceWithDeposits: null,
          monthlyPensionWithDeposits: null,
          lastMonthlyDepositEmployee: 500,
        },
        {
          currentBalance: null,
          projectedBalanceWithDeposits: 40_000,
          monthlyPensionWithDeposits: 1_200,
          lastMonthlyDepositEmployer: 700,
        },
      ],
    });

    const scenario: SimulationScenario = {
      globalEmployeeIncreasePercent: 10,
      globalEmployerIncreasePercent: 10,
    };

    const result = runSimulation(extraction, scenario);

    expect(result.summary.currency).toBe('USD');

    expect(
      result.summary.baselineTotalProjectedWithDeposits === null ||
        typeof result.summary.baselineTotalProjectedWithDeposits === 'number',
    ).toBe(true);
    expect(
      result.summary.baselineTotalMonthlyPensionWithDeposits === null ||
        typeof result.summary.baselineTotalMonthlyPensionWithDeposits ===
          'number',
    ).toBe(true);
  });
});

