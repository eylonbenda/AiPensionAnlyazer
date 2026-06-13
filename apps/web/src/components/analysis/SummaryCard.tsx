import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

type SummaryCardProps = {
  label: string;
  value: string;
  hint?: string;
  className?: string;
};

export function SummaryCard({ label, value, hint, className }: SummaryCardProps) {
  return (
    <Card
      className={cn(
        "group border-border/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
        <span className="rounded-md bg-primary/10 p-1 text-primary">
          <TrendingUp className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight sm:text-[2rem] xl:text-[2.1rem]">{value}</div>
      {hint ? <div className="mt-2 text-xs text-muted-foreground">{hint}</div> : null}
    </Card>
  );
}
