import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Locale } from "@/lib/locale";
import type { PensionAnalysis } from "@/lib/analysisTypes";
import { analysisStatusLabel, analysisStatusVariant, formatDate } from "@/lib/analysisUi";

type AnalysisHeroProps = {
  analysis: PensionAnalysis;
  locale: Locale;
  reportLabel: string;
  updatedLabel: string;
};

export function AnalysisHero({ analysis, locale, reportLabel, updatedLabel }: AnalysisHeroProps) {
  return (
    <Card className="border-border/80 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{reportLabel}</div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{analysis.reportTitle}</h1>
          {analysis.providerSummary ? (
            <p className="max-w-3xl text-sm text-muted-foreground">{analysis.providerSummary}</p>
          ) : null}
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Badge variant={analysisStatusVariant(analysis.status)}>{analysisStatusLabel(analysis.status, locale)}</Badge>
          <div className="text-xs text-muted-foreground">
            {updatedLabel} {formatDate(analysis.lastUpdatedAt, locale)}
          </div>
        </div>
      </div>
    </Card>
  );
}
