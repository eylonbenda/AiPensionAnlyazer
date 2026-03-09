import { z } from 'zod';

/** Single plan/product (e.g. קרן פנסיה, קופת גמל, קרן השתלמות) from a pension report */
export const PlanEntrySchema = z.object({
  providerCompany: z.string().max(256).nullable().optional().transform((v) => v ?? ''),
  planName: z.string().max(512).nullable().optional().transform((v) => v ?? ''),
  productType: z.string().max(128).nullable().optional().transform((v) => v ?? ''),
  policyNumber: z.string().max(64).nullable().optional().transform((v) => v ?? ''),
  status: z.string().max(64).nullable().optional().transform((v) => v ?? ''),

  currentBalance: z.number().nullable().optional(),
  projectedBalanceNoDeposits: z.number().nullable().optional(),
  projectedBalanceWithDeposits: z.number().nullable().optional(),
  monthlyPensionNoDeposits: z.number().nullable().optional(),
  monthlyPensionWithDeposits: z.number().nullable().optional(),

  managementFeeFromSavingsPercent: z.number().min(0).max(100).nullable().optional(),
  managementFeeFromPremiumPercent: z.number().min(0).max(100).nullable().optional(),
  ytdReturnPercent: z.number().nullable().optional(),

  lastMonthlyDepositEmployee: z.number().nullable().optional(),
  lastMonthlyDepositEmployer: z.number().nullable().optional(),
  lastDepositDate: z.string().max(32).nullable().optional().transform((v) => v ?? ''),
  employeeContributionPercent: z.number().min(0).max(100).nullable().optional(),
  employerContributionPercent: z.number().min(0).max(100).nullable().optional(),

  withdrawalEligibilityDate: z.string().max(64).nullable().optional().transform((v) => v ?? ''),
  disabilityPension: z.number().nullable().optional(),

  joinDate: z.string().max(32).nullable().optional().transform((v) => v ?? ''),
  firstJoinDate: z.string().max(32).nullable().optional().transform((v) => v ?? ''),
  dataAsOfDate: z.string().max(32).nullable().optional().transform((v) => v ?? ''),
});
export type PlanEntry = z.infer<typeof PlanEntrySchema>;

export const PensionExtractionSchema = z.object({
  pensionProviderName: z.string().max(256).nullable().optional().transform((v) => v ?? ''),
  planType: z.string().max(256).nullable().optional().transform((v) => v ?? ''),
  country: z.string().max(128).nullable().optional().transform((v) => v ?? ''),
  currency: z.string().max(16).nullable().optional().transform((v) => v ?? ''),

  statementDate: z.string().max(32).nullable().optional().transform((v) => v ?? ''),
  reportDate: z.string().max(32).nullable().optional().transform((v) => v ?? ''),
  vestingDate: z.string().max(32).nullable().optional().transform((v) => v ?? ''),

  totalCurrentSavings: z.number().nonnegative().nullable().optional(),
  totalProjectedSavings: z.number().nonnegative().nullable().optional(),

  currentBalance: z.number().nonnegative().nullable().optional(),
  employeeContributionRate: z.number().min(0).max(100).nullable().optional(),
  employerContributionRate: z.number().min(0).max(100).nullable().optional(),
  managementFeePercent: z.number().min(0).max(100).nullable().optional(),

  plans: z.array(PlanEntrySchema).optional(),

  funds: z
    .array(
      z.object({
        name: z.string().max(256).nullable().optional().transform((v) => v ?? ''),
        isin: z.string().max(32).optional(),
        allocationPercent: z.number().min(0).max(100).nullable().optional(),
        managementFeePercent: z.number().min(0).max(100).nullable().optional(),
      }),
    )
    .optional(),

  thingsToCheck: z
    .array(
      z.object({
        label: z.string().min(1).max(512),
      }),
    )
    .optional(),
});

export type PensionExtraction = z.infer<typeof PensionExtractionSchema>;

