import type { Locale } from "@/lib/locale";

export type FlagParams = {
  id?: string;
  category?: string;
  message?: string;
  field?: string;
  value?: unknown;
  threshold?: unknown;
};

const categoryLabel: Record<Locale, Record<string, string>> = {
  en: { fees: "Fees", contributions: "Contributions", coverage: "Coverage", "data-quality": "Data quality" },
  he: { fees: "דמי ניהול", contributions: "הפקדות", coverage: "כיסוי ביטוחי", "data-quality": "איכות נתונים" },
};

/** Plan number (1-based) parsed from a field path like "plans[2].currentBalance". */
function planNumberFromField(field?: string): number | null {
  if (!field) return null;
  const match = field.match(/plans\[(\d+)\]/);
  if (!match) return null;
  const idx = Number.parseInt(match[1], 10);
  return Number.isNaN(idx) ? null : idx + 1;
}

function str(value: unknown): string {
  if (value == null) return "";
  return String(value);
}

/** Hebrew message templates keyed by flag id. Returns null when no template matches. */
function hebrewMessage(params: FlagParams): string | null {
  const n = planNumberFromField(params.field);
  const v = str(params.value);
  const t = str(params.threshold);

  switch (params.id) {
    case "high-top-level-fee":
      return `דמי ניהול כלליים (${v}%) גבוהים מ-${t}%.`;
    case "high-savings-fee":
      return `דמי ניהול מהחיסכון בתוכנית ${n} (${v}%) גבוהים מ-${t}%.`;
    case "high-premium-fee":
      return `דמי ניהול מהפרמיה בתוכנית ${n} (${v}%) גבוהים מ-${t}%.`;
    case "no-recent-deposits":
      return `תוכנית ${n} נראית פעילה אך תאריך ההפקדה האחרון חסר או ישן מהסף שנקבע, ולא נמצאו הפקדות אחרונות.`;
    case "low-employee-contribution":
      return `שיעור הפקדת העובד בתוכנית ${n} (${v}%) נמוך מ-${t}%.`;
    case "low-employer-contribution":
      return `שיעור הפקדת המעסיק בתוכנית ${n} (${v}%) נמוך מ-${t}%.`;
    case "missing-contribution-rates":
      return `תוכנית ${n} נראית פעילה אך חסרים שיעורי הפקדה של העובד והמעסיק ולא נמצאו הפקדות אחרונות.`;
    case "no-disability-pension":
      return `לתוכנית קרן הפנסיה ${n} אין ערך פנסיית נכות.`;
    case "inactive-plan-with-balance":
      return `תוכנית לא פעילה ${n} עדיין מציגה יתרה חיובית (${v}).`;
    case "negative-ytd-return":
      return `לתוכנית ${n} תשואה שלילית מתחילת השנה (${v}%).`;
    case "missing-projected-savings":
      return `לתוכנית פעילה ${n} חסרים ערכי חיסכון צפוי.`;
    default:
      return null;
  }
}

/** Localize a red flag's title and message. English keeps the engine-provided strings. */
export function formatFlag(
  locale: Locale,
  params: FlagParams,
): { title: string; message: string } {
  const fallbackTitle = params.category ?? "";
  const fallbackMessage = params.message ?? "";

  if (locale !== "he") {
    return {
      title: (params.category && categoryLabel.en[params.category]) || fallbackTitle,
      message: fallbackMessage,
    };
  }

  return {
    title: (params.category && categoryLabel.he[params.category]) || fallbackTitle,
    message: hebrewMessage(params) ?? fallbackMessage,
  };
}
