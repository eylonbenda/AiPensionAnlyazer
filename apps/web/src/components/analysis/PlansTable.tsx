import { PlanCard } from "@/components/analysis/PlanCard";
import { Card } from "@/components/ui/card";
import type { Locale } from "@/lib/locale";
import type { PensionPlan } from "@/lib/analysisTypes";
import { formatCurrency, formatPercent } from "@/lib/analysisUi";

type PlansTableProps = {
  plans: PensionPlan[];
  currency: string;
  locale: Locale;
  labels: {
    noPlans: string;
    unnamed: string;
    noProvider: string;
    unknownStatus: string;
    statusMap?: Record<string, string>;
    columns: {
      plan: string;
      provider: string;
      current: string;
      projected: string;
      monthlyPension: string;
      savingsFee: string;
      premiumFee: string;
      status: string;
    };
    card: {
      unnamedPlan: string;
      missingProvider: string;
      unknownStatus: string;
      currentBalance: string;
      projectedBalance: string;
      monthlyPension: string;
      savingsFee: string;
      premiumFee: string;
      statusMap?: Record<string, string>;
    };
  };
};

export function PlansTable({ plans, currency, locale, labels }: PlansTableProps) {
  if (!plans.length) {
    return (
      <Card className="border-border/80 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <p className="text-sm text-muted-foreground">{labels.noPlans}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 lg:hidden">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} currency={currency} locale={locale} labels={labels.card} />
        ))}
      </div>

      <Card className="hidden overflow-x-auto border-border/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/35 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">{labels.columns.plan}</th>
              <th className="px-4 py-3 font-medium">{labels.columns.provider}</th>
              <th className="px-4 py-3 text-right font-medium">{labels.columns.current}</th>
              <th className="px-4 py-3 text-right font-medium">{labels.columns.projected}</th>
              <th className="px-4 py-3 text-right font-medium">{labels.columns.monthlyPension}</th>
              <th className="px-4 py-3 text-right font-medium">{labels.columns.savingsFee}</th>
              <th className="px-4 py-3 text-right font-medium">{labels.columns.premiumFee}</th>
              <th className="px-4 py-3 font-medium">{labels.columns.status}</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id} className="border-b border-border/70 transition-colors hover:bg-muted/35 last:border-b-0">
                <td className="px-4 py-3 font-semibold">{plan.planName ?? labels.unnamed}</td>
                <td className="px-4 py-3 text-muted-foreground">{plan.providerCompany ?? labels.noProvider}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(plan.currentBalance, currency, locale)}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(plan.projectedBalanceWithDeposits, currency, locale)}</td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(plan.monthlyPensionWithDeposits, currency, locale)}
                </td>
                <td className="px-4 py-3 text-right">{formatPercent(plan.managementFeeFromSavingsPercent, locale)}</td>
                <td className="px-4 py-3 text-right">{formatPercent(plan.managementFeeFromPremiumPercent, locale)}</td>
                <td className="px-4 py-3">
                  {plan.status ? (labels.statusMap?.[plan.status] ?? plan.status) : labels.unknownStatus}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
