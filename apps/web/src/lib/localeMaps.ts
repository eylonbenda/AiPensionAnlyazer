import type { PlanStatus, RetirementGapStatus, TaskPriority, TaskStatus } from '@/lib/analysisTypes';
import type { Locale } from '@/lib/locale';

const gapStatusLabelMap: Record<Locale, Record<RetirementGapStatus, string>> = {
  en: { SHORTFALL: 'SHORTFALL', ON_TRACK: 'ON_TRACK', SURPLUS: 'SURPLUS' },
  he: { SHORTFALL: 'חסר', ON_TRACK: 'במסלול', SURPLUS: 'עודף' },
};

const taskStatusLabelMap: Record<Locale, Record<TaskStatus, string>> = {
  en: { TODO: 'TODO', IN_PROGRESS: 'IN_PROGRESS', DONE: 'DONE', DISMISSED: 'DISMISSED' },
  he: { TODO: 'לביצוע', IN_PROGRESS: 'בתהליך', DONE: 'בוצע', DISMISSED: 'נסגר' },
};

const taskPriorityLabelMap: Record<Locale, Record<TaskPriority, string>> = {
  en: { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' },
  he: { LOW: 'נמוכה', MEDIUM: 'בינונית', HIGH: 'גבוהה' },
};

const planStatusLabelMap: Record<Locale, Record<PlanStatus, string>> = {
  en: { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE', UNKNOWN: 'UNKNOWN' },
  he: { ACTIVE: 'פעילה', INACTIVE: 'לא פעילה', UNKNOWN: 'לא ידוע' },
};

export function getGapStatusLabel(locale: Locale, status: RetirementGapStatus): string {
  return gapStatusLabelMap[locale][status];
}

export function getTaskStatusLabel(locale: Locale, status: TaskStatus): string {
  return taskStatusLabelMap[locale][status];
}

export function getTaskPriorityLabel(locale: Locale, priority: TaskPriority): string {
  return taskPriorityLabelMap[locale][priority];
}

export function getPlanStatusLabel(locale: Locale, status: PlanStatus): string {
  return planStatusLabelMap[locale][status];
}

export function getSeverityLabel(locale: Locale, severity: string): string {
  if (locale === 'en') return severity;
  const s = severity.toLowerCase();
  if (s.includes('high')) return severity.replace(/high/gi, 'גבוה');
  if (s.includes('medium')) return severity.replace(/medium/gi, 'בינוני');
  if (s.includes('low')) return severity.replace(/low/gi, 'נמוך');
  if (s.includes('info')) return severity.replace(/info/gi, 'מידע');
  return severity;
}
