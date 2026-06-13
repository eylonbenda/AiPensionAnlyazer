import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Locale } from "@/lib/locale";
import type { GapInsight } from "@/lib/analysisTypes";
import { formatCurrency, gapStatusVariant, statusToneClasses } from "@/lib/analysisUi";

type GapStatusCardProps = {
  gapInsight?: GapInsight;
  currency: string;
  locale: Locale;
  labels: {
    title: string;
    noTarget: string;
    subtitle: string;
    targetMonthly: string;
    projectedMonthly: string;
    gapAmount: string;
    targetCoverage: string;
    belowTarget: string;
    alignedTarget: string;
    aboveTarget: string;
    statusMap?: Record<GapInsight["status"], string>;
  };
};

export function GapStatusCard({ gapInsight, currency, locale, labels }: GapStatusCardProps) {
  if (!gapInsight) {
    return (
      <Card className="border-border/80 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <h3 className="text-lg font-semibold">{labels.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{labels.noTarget}</p>
      </Card>
    );
  }

  const progressRatio = Math.min(
    1,
    Math.max(0, gapInsight.projectedMonthlyPension / Math.max(1, gapInsight.targetMonthlyPension)),
  );
  const progressPercent = Math.round(progressRatio * 100);

  return (
    <Card className={`border-border/80 p-6 shadow-[0_2px_6px_rgba(15,23,42,0.06)] ${statusToneClasses(gapInsight.status)}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold">{labels.title}</h3>
        <Badge variant={gapStatusVariant(gapInsight.status)}>{labels.statusMap?.[gapInsight.status] ?? gapInsight.status}</Badge>
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{labels.subtitle}</div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Metric label={labels.targetMonthly} value={formatCurrency(gapInsight.targetMonthlyPension, currency, locale)} />
        <Metric label={labels.projectedMonthly} value={formatCurrency(gapInsight.projectedMonthlyPension, currency, locale)} />
      </div>
      <div className="mt-5 rounded-xl border border-border/70 bg-card/70 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{labels.gapAmount}</div>
        <div className="mt-1 text-3xl font-semibold tracking-tight">{formatCurrency(gapInsight.gapAmount, currency, locale)}</div>
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>{labels.targetCoverage}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {gapInsight.status === "SHORTFALL"
            ? labels.belowTarget
            : gapInsight.status === "ON_TRACK"
              ? labels.alignedTarget
              : labels.aboveTarget}
        </div>
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
