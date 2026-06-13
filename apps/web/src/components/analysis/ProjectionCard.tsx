import { Card } from "@/components/ui/card";
import type { Locale } from "@/lib/locale";
import type { ProjectionData } from "@/lib/analysisTypes";
import { formatCurrency } from "@/lib/analysisUi";

type ProjectionCardProps = {
  projection: ProjectionData;
  currency: string;
  locale: Locale;
  labels: {
    title: string;
    currentBalance: string;
    projectedBalance: string;
    projectedMonthlyPension: string;
    dataCompleteness: string;
    calculationVersion: string;
  };
};

export function ProjectionCard({ projection, currency, locale, labels }: ProjectionCardProps) {
  return (
    <Card className="border-border/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <h3 className="text-lg font-semibold">{labels.title}</h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Metric label={labels.currentBalance} value={formatCurrency(projection.totalCurrentBalance, currency, locale)} />
        <Metric label={labels.projectedBalance} value={formatCurrency(projection.totalProjectedBalance, currency, locale)} />
        <Metric
          label={labels.projectedMonthlyPension}
          value={formatCurrency(projection.totalMonthlyPensionProjected, currency, locale)}
        />
        <Metric label={labels.dataCompleteness} value={`${projection.dataCompletenessScore}%`} />
      </div>
      <div className="mt-4 text-xs text-muted-foreground">
        {labels.calculationVersion}: {projection.calculationVersion}
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}
