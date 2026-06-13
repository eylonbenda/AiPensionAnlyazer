"use client";

import { cn } from "@/lib/utils";

export const analysisTabItems = ["overview", "plans", "issues", "projection", "tasks"] as const;

export type AnalysisTab = (typeof analysisTabItems)[number];

type AnalysisTabsProps = {
  value: AnalysisTab;
  onChange: (next: AnalysisTab) => void;
  labels?: Record<AnalysisTab, string>;
};

export function AnalysisTabs({ value, onChange, labels }: AnalysisTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-border/80 bg-card p-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {analysisTabItems.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "rounded-xl border px-4 py-2 text-sm font-medium transition-all",
            value === tab
              ? "border-primary/20 bg-primary/10 text-primary shadow-[0_1px_2px_rgba(30,64,175,0.12)]"
              : "border-transparent bg-transparent text-muted-foreground hover:border-border/80 hover:bg-muted/45 hover:text-foreground",
          )}
          aria-pressed={value === tab}
        >
          {labels?.[tab] ?? tab}
        </button>
      ))}
    </div>
  );
}
