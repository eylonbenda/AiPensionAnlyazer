import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Locale } from "@/lib/locale";
import type { PensionPlan } from "@/lib/analysisTypes";
import { formatCurrency, formatPercent } from "@/lib/analysisUi";

type PlanCardProps = {
  plan: PensionPlan;
  currency: string;
  locale: Locale;
  labels: {
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

export function PlanCard({ plan, currency, locale, labels }: PlanCardProps) {
  return (
    <Card className="border-border/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{plan.planName ?? labels.unnamedPlan}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {[plan.providerCompany, plan.productType].filter(Boolean).join(" - ") || labels.missingProvider}
          </p>
        </div>
        <Badge variant="outline">{plan.status ? (labels.statusMap?.[plan.status] ?? plan.status) : labels.unknownStatus}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Metric label={labels.currentBalance} value={formatCurrency(plan.currentBalance, currency, locale)} />
        <Metric label={labels.projectedBalance} value={formatCurrency(plan.projectedBalanceWithDeposits, currency, locale)} />
        <Metric label={labels.monthlyPension} value={formatCurrency(plan.monthlyPensionWithDeposits, currency, locale)} />
        <Metric label={labels.savingsFee} value={formatPercent(plan.managementFeeFromSavingsPercent, locale)} />
        <Metric label={labels.premiumFee} value={formatPercent(plan.managementFeeFromPremiumPercent, locale)} />
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-semibold tracking-tight">{value}</div>
    </div>
  );
}
