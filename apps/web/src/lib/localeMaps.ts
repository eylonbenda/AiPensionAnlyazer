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

const taskCopyMap: Record<string, { title: string; description: string }> = {
  UPLOAD_LATEST_REPORT: {
    title: 'העלאת דוח הפנסיה העדכני',
    description: 'העלו את דוח הפנסיה העדכני ביותר כדי שהניתוח ישקף מידע מעודכן.',
  },
  CHECK_MULTIPLE_PLANS: {
    title: 'לוודא שאין לכם מספר תוכניות פעילות',
    description: 'נראה שיש לכם מספר תוכניות. כדאי לבדוק האם כולן נחוצות והאם קיימת כפילות.',
  },
  CHECK_MGMT_FEES_SAVINGS: {
    title: 'בדיקת דמי ניהול מהחיסכון',
    description: 'דמי הניהול מהחיסכון נראים גבוהים באחת התוכניות לפחות. כדאי לבקש הצעת דמי ניהול מעודכנת או השוואה.',
  },
  CHECK_MGMT_FEES_PREMIUM: {
    title: 'בדיקת דמי ניהול מהפרמיה',
    description: 'דמי הניהול מהפרמיה נראים גבוהים באחת התוכניות לפחות. כדאי לבקש הצעת דמי ניהול מעודכנת או השוואה.',
  },
  REQUEST_FEES_INFO: {
    title: 'בקשת פירוט דמי ניהול מלא',
    description: 'מידע על דמי הניהול חסר או חלקי. כדאי לבקש מהגוף המנהל פירוט מלא של דמי הניהול.',
  },
  VERIFY_DEPOSITS_STATUS: {
    title: 'אימות הפקדות אחרונות ופרטי הפרשות',
    description: 'בחלק מהתוכניות נראה שמידע על הפקדות והפרשות חסר או לא מעודכן. כדאי לוודא שההפקדות מתבצעות כצפוי.',
  },
  VERIFY_PLAN_STATUS: {
    title: 'אימות סטטוס ויתרות התוכניות',
    description: 'חלק מהתוכניות נראות לא פעילות או עם סטטוס לא ברור, אך עדיין מציגות יתרה. כדאי לוודא את הסטטוס וכיצד מתנהלות התוכניות הללו.',
  },
  REVIEW_RETIREMENT_TARGET: {
    title: 'בחינת יעד הפרישה מול הקצבה הצפויה',
    description: 'הקצבה החודשית הצפויה נמוכה מהיעד שלכם. כדאי לבחון את ההנחות, רמת ההפקדה וסטטוס התוכניות מול איש מקצוע.',
  },
};

export function getTaskCopy(
  locale: Locale,
  taskKey: string | undefined,
  fallback: { title: string; description: string },
): { title: string; description: string } {
  if (locale !== 'he' || !taskKey) return fallback;
  return taskCopyMap[taskKey] ?? fallback;
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
