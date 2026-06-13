export type StructuredExtraction = {
  plans?: Array<Record<string, unknown>>;
  thingsToCheck?: Array<{ label: string }>;
  currency?: string;
};

export type RedFlagLike = {
  id?: string;
  severity?: string;
  category?: string;
  message?: string;
  field?: string;
  value?: unknown;
  threshold?: unknown;
};

export function getThingsToCheck(structured: unknown): string[] {
  const s = structured as Partial<StructuredExtraction> | null;
  if (!s || !Array.isArray(s.thingsToCheck)) return [];

  return s.thingsToCheck
    .map((x) => {
      if (!x || typeof x !== 'object') return null;
      const obj = x as Record<string, unknown>;
      const label = obj.label;
      return typeof label === 'string' ? label : null;
    })
    .filter((v): v is string => v != null && v.trim().length > 0);
}

export function getPlans(structured: unknown): Array<Record<string, unknown>> {
  const s = structured as Partial<StructuredExtraction> | null;
  if (!s || !Array.isArray(s.plans)) return [];
  return s.plans.filter((p) => p && typeof p === 'object') as Array<Record<string, unknown>>;
}

export function getRedFlags(redFlags: unknown): RedFlagLike[] {
  if (!Array.isArray(redFlags)) return [];
  return redFlags
    .filter((f) => f && typeof f === 'object')
    .map((f) => f as RedFlagLike);
}

