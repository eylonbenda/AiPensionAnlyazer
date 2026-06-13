import { Card } from "@/components/ui/card";
import type { Locale } from "@/lib/locale";
import type { PensionPlan } from "@/lib/analysisTypes";
import { formatCurrency } from "@/lib/analysisUi";

type ActivePlansPieChartProps = {
  plans: PensionPlan[];
  currency: string;
  locale: Locale;
  labels: {
    title: string;
    subtitle: string;
    noData: string;
    totalActive: string;
    share: string;
  };
};

const PIE_COLORS = ["#1e40af", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function ActivePlansPieChart({ plans, currency, locale, labels }: ActivePlansPieChartProps) {
  const activePlans = plans
    .filter((p) => p.status === "ACTIVE")
    .map((plan) => ({
      id: plan.id,
      name: plan.planName ?? (locale === "he" ? "תוכנית ללא שם" : "Unnamed plan"),
      value: typeof plan.currentBalance === "number" ? plan.currentBalance : 0,
    }))
    .filter((p) => p.value > 0);

  const total = activePlans.reduce((sum, p) => sum + p.value, 0);
  if (!activePlans.length || total <= 0) {
    return (
      <Card className="border-border/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <h3 className="text-lg font-semibold">{labels.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{labels.noData}</p>
      </Card>
    );
  }

  let start = 0;
  const slices = activePlans.map((plan, idx) => {
    const percent = (plan.value / total) * 100;
    const end = start + percent;
    const slice = { ...plan, color: PIE_COLORS[idx % PIE_COLORS.length], percent, start, end };
    start = end;
    return slice;
  });

  const gradient = slices
    .map((slice) => `${slice.color} ${slice.start.toFixed(2)}% ${slice.end.toFixed(2)}%`)
    .join(", ");

  return (
    <Card className="border-border/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <h3 className="text-lg font-semibold">{labels.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{labels.subtitle}</p>

      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-[180px_1fr] sm:items-center">
        <div className="mx-auto h-44 w-44 rounded-full border border-border/70 bg-muted/30 p-2">
          <div
            className="h-full w-full rounded-full"
            style={{
              background: `conic-gradient(${gradient})`,
            }}
            aria-label={labels.title}
          />
        </div>

        <div className="space-y-2">
          {slices.map((slice) => (
            <div key={slice.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/70 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                <span className="text-sm font-medium">{slice.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{formatCurrency(slice.value, currency, locale)}</div>
                <div className="text-xs text-muted-foreground">
                  {labels.share}: {slice.percent.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}

          <div className="pt-1 text-sm text-muted-foreground">
            {labels.totalActive}: <span className="font-semibold text-foreground">{formatCurrency(total, currency, locale)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
