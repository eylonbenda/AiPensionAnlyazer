import { Card } from "@/components/ui/card";
import type { Locale } from "@/lib/locale";
import type { SimulationData } from "@/lib/analysisTypes";
import { formatCurrency } from "@/lib/analysisUi";

type SimulationCardProps = {
  simulation?: SimulationData;
  currency: string;
  locale: Locale;
  labels: {
    title: string;
    noData: string;
    baseline: string;
    simulated: string;
    delta: string;
  };
};

export function SimulationCard({ simulation, currency, locale, labels }: SimulationCardProps) {
  if (!simulation) {
    return (
      <Card className="border-border/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <h3 className="text-lg font-semibold">{labels.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{labels.noData}</p>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <h3 className="text-lg font-semibold">{labels.title}</h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Metric label={labels.baseline} value={formatCurrency(simulation.baseline.projectedMonthlyPension, currency, locale)} />
        <Metric label={labels.simulated} value={formatCurrency(simulation.simulated.projectedMonthlyPension, currency, locale)} />
        <Metric label={labels.delta} value={formatCurrency(simulation.delta.projectedMonthlyPension, currency, locale)} />
      </div>
      {simulation.notes.length ? (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {simulation.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
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
