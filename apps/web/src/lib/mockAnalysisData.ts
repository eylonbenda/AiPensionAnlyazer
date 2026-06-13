import type { PensionAnalysis } from "@/lib/analysisTypes";

export const mockAnalysisData: PensionAnalysis = {
  id: "analysis_demo_01",
  reportTitle: "Annual Pension Statement 2025",
  providerSummary: "Clal + Menora + Migdal consolidated view",
  status: "READY",
  lastUpdatedAt: "2026-03-20T12:30:00.000Z",
  currency: "ILS",
  structuredData: {
    plans: [
      {
        id: "plan_1",
        providerCompany: "Clal",
        planName: "Executive Pension",
        productType: "Pension Fund",
        currentBalance: 412000,
        projectedBalanceWithDeposits: 1350000,
        monthlyPensionWithDeposits: 7800,
        managementFeeFromSavingsPercent: 0.65,
        managementFeeFromPremiumPercent: 1.9,
        status: "ACTIVE",
      },
      {
        id: "plan_2",
        providerCompany: "Menora",
        planName: "Supplemental Savings",
        productType: "Provident Fund",
        currentBalance: 168000,
        projectedBalanceWithDeposits: 510000,
        monthlyPensionWithDeposits: 2100,
        managementFeeFromSavingsPercent: 0.8,
        managementFeeFromPremiumPercent: 0,
        status: "ACTIVE",
      },
      {
        id: "plan_3",
        providerCompany: "Migdal",
        planName: "Legacy Plan",
        productType: "Insurance Pension",
        currentBalance: 56000,
        projectedBalanceWithDeposits: 123000,
        monthlyPensionWithDeposits: 420,
        managementFeeFromSavingsPercent: 1.2,
        managementFeeFromPremiumPercent: 2.3,
        status: "INACTIVE",
      },
    ],
  },
  flags: [
    {
      id: "flag_1",
      severity: "HIGH",
      title: "High management fee in legacy plan",
      message: "One plan has management fee from savings above 1%.",
      evidence: "Migdal Legacy Plan: 1.2%",
    },
    {
      id: "flag_2",
      severity: "MEDIUM",
      title: "Inactive plan detected",
      message: "An old pension product appears inactive and may need review.",
      evidence: "Migdal Legacy Plan status: INACTIVE",
    },
    {
      id: "flag_3",
      severity: "LOW",
      title: "Data mismatch in employer contributions",
      message: "Small variance found between annual slips and report metadata.",
    },
  ],
  projection: {
    totalCurrentBalance: 636000,
    totalProjectedBalance: 1983000,
    totalMonthlyPensionProjected: 10320,
    dataCompletenessScore: 84,
    calculationVersion: "v1",
  },
  gapInsight: {
    targetMonthlyPension: 15000,
    projectedMonthlyPension: 10320,
    gapAmount: 4680,
    status: "SHORTFALL",
  },
  simulation: {
    baseline: {
      projectedMonthlyPension: 10320,
    },
    simulated: {
      projectedMonthlyPension: 11690,
    },
    delta: {
      projectedMonthlyPension: 1370,
    },
    notes: [
      "Simulation assumes a 3% annual salary growth.",
      "Monthly contribution increased by 8% starting next quarter.",
      "Market return assumptions remain unchanged.",
    ],
  },
  tasks: [
    {
      id: "task_1",
      title: "Review fee terms for legacy plan",
      description: "Ask Migdal for an updated fee offer and compare alternatives.",
      priority: "HIGH",
      status: "TODO",
    },
    {
      id: "task_2",
      title: "Validate inactive plan status",
      description: "Confirm if payroll contributions still flow to the inactive product.",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
    },
    {
      id: "task_3",
      title: "Add missing annual statement",
      description: "Upload missing statement to improve data completeness score.",
      priority: "LOW",
      status: "DONE",
    },
  ],
};
