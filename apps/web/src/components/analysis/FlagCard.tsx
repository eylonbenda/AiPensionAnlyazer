import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AnalysisFlag } from "@/lib/analysisTypes";
import { flagSeverityVariant } from "@/lib/analysisUi";

type FlagCardProps = {
  flag: AnalysisFlag;
  evidenceLabel: string;
  severityMap?: Record<AnalysisFlag["severity"], string>;
};

export function FlagCard({ flag, evidenceLabel, severityMap }: FlagCardProps) {
  return (
    <Card className="border-border/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-snug">{flag.title}</h3>
        <Badge variant={flagSeverityVariant(flag.severity)}>{severityMap?.[flag.severity] ?? flag.severity}</Badge>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{flag.message}</p>
      {flag.evidence ? (
        <div className="mt-4 rounded-lg border border-border/70 bg-muted/40 p-2.5 text-xs text-muted-foreground">
          {evidenceLabel}: {flag.evidence}
        </div>
      ) : null}
    </Card>
  );
}
