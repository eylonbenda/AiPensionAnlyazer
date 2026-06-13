import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", {
  variants: {
    variant: {
      default: "border-border bg-muted text-foreground",
      secondary: "border-border bg-muted text-muted-foreground",
      outline: "bg-transparent border-border text-foreground",
      destructive: "border-destructive/30 bg-destructive/10 text-destructive",
      high: "border-destructive/30 bg-destructive/10 text-destructive",
      medium: "border-accent/30 bg-accent/10 text-accent",
      low: "border-emerald-400/30 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300",
      info: "border-primary/30 bg-primary/10 text-primary",
      shortfall: "border-rose-200 bg-rose-50 text-rose-700",
      ontrack: "border-emerald-200 bg-emerald-50 text-emerald-700",
      surplus: "border-teal-200 bg-teal-50 text-teal-700",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

