import type {
  AnalysisStatus,
  FlagSeverity,
  RetirementGapStatus,
  TaskPriority,
  TaskStatus,
} from "@/lib/analysisTypes";
import type { Locale } from "@/lib/locale";

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "high"
  | "medium"
  | "low"
  | "info"
  | "shortfall"
  | "ontrack"
  | "surplus";
export type GapTone = "shortfall" | "ontrack" | "surplus";

export function formatCurrency(value: number | undefined, currency = "ILS", locale: Locale = "en"): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return locale === "he" ? "לא זמין" : "N/A";
  }
  return new Intl.NumberFormat(locale === "he" ? "he-IL" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number | undefined, locale: Locale = "en"): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return locale === "he" ? "לא זמין" : "N/A";
  }
  return `${value}%`;
}

export function formatDate(dateIso: string, locale: Locale = "en"): string {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return locale === "he" ? "לא ידוע" : "Unknown";
  return new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function analysisStatusLabel(status: AnalysisStatus, locale: Locale = "en"): string {
  if (locale === "he") {
    if (status === "READY") return "מוכן";
    if (status === "PROCESSING") return "בעיבוד";
    return "נכשל";
  }
  if (status === "READY") return "Ready";
  if (status === "PROCESSING") return "Processing";
  return "Failed";
}

export function analysisStatusVariant(status: AnalysisStatus): BadgeVariant {
  if (status === "READY") return "low";
  if (status === "PROCESSING") return "info";
  return "destructive";
}

export function flagSeverityVariant(severity: FlagSeverity): BadgeVariant {
  if (severity === "HIGH") return "high";
  if (severity === "MEDIUM") return "medium";
  if (severity === "LOW") return "low";
  return "info";
}

export function taskStatusVariant(status: TaskStatus): BadgeVariant {
  if (status === "DONE") return "low";
  if (status === "IN_PROGRESS") return "info";
  if (status === "DISMISSED") return "secondary";
  return "outline";
}

export function taskPriorityVariant(priority: TaskPriority): BadgeVariant {
  if (priority === "HIGH") return "high";
  if (priority === "MEDIUM") return "medium";
  return "low";
}

export function gapStatusVariant(status: RetirementGapStatus): BadgeVariant {
  if (status === "SURPLUS") return "surplus";
  if (status === "ON_TRACK") return "ontrack";
  return "shortfall";
}

export function statusToneClasses(status: RetirementGapStatus): string {
  if (status === "SURPLUS") return "border-teal-200/80 bg-teal-50/70";
  if (status === "ON_TRACK") return "border-emerald-200/80 bg-emerald-50/70";
  return "border-rose-200/80 bg-rose-50/70";
}

export function gapTone(status: RetirementGapStatus): GapTone {
  if (status === "SURPLUS") return "surplus";
  if (status === "ON_TRACK") return "ontrack";
  return "shortfall";
}
