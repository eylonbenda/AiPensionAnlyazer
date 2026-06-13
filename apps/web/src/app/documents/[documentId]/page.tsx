'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/providers/AuthProvider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  apiGetAnalysisPlan,
  apiGetExtraction,
  apiGetJob,
  apiUpdateTaskStatus,
  type AnalysisPlanResponse,
  type ExtractionResponse,
  type ProjectionGapFlag,
  type Task,
  type TaskStatus,
} from '@/lib/api';
import { detectInitialLocale, persistLocale, toggleLocale, type Locale } from '@/lib/locale';
import { getSeverityLabel, getTaskStatusLabel } from '@/lib/localeMaps';

import { getPlans, getRedFlags, getThingsToCheck } from '@/lib/extractionParsing';

const copy = {
  en: {
    na: 'N/A',
    noTasks: 'No tasks found for this document.',
    taskUpdateFailed: 'Task update failed',
    updating: 'Updating...',
    priority: 'Priority',
    source: 'Source',
    status: 'Status',
    noRedFlags: 'No red flags detected.',
    other: 'other',
    field: 'Field',
    noProjectionGaps: 'No projection gaps detected.',
    noPlans: 'No plan entries found in the extracted data.',
    plan: 'Plan',
    currentBalance: 'Current balance',
    projectedWith: 'Projected (with deposits)',
    projectedNo: 'Projected (no deposits)',
    monthlyWith: 'Monthly pension (with deposits)',
    monthlyNo: 'Monthly pension (no deposits)',
    noThingsToCheck: 'No "things to check" found.',
    retirementGap: 'Retirement gap',
    target: 'Target',
    projected: 'Projected',
    gapAmount: 'Gap amount',
    retirementGapHint: 'Retirement gap will appear after you provide a target monthly pension.',
    totalProjectionUnavailable: 'Total projection is not available for this document.',
    total: 'Total',
    projectedGrowth: 'Projected growth',
    monthlyPension: 'Monthly pension',
    withDeposits: 'With deposits',
    noDeposits: 'No deposits',
    depositsImpact: 'Deposits impact',
    balanceImpact: 'Balance impact',
    pensionImpact: 'Pension impact',
    thingsToCheck: 'Things to check',
    redFlags: 'Red flags',
    projectionGaps: 'Projection gaps',
    document: 'Document',
    uploadAnother: 'Upload another PDF',
    missingJobId: 'Missing job id',
    uploadFirst: 'Upload a document first (no `jobId` query param was provided).',
    jobStatus: 'Job status',
    summary: 'Summary',
    totalProjection: 'Total projection',
    targetOptional: 'Target monthly pension (optional)',
    targetLabel: 'Target',
    targetPlaceholder: 'e.g. 4000',
    recalculating: 'Recalculating...',
    recalculate: 'Recalculate',
    clear: 'Clear',
    retirementGapUsage: 'Used only to compute `retirementGap`.',
    plans: 'Plan',
    issuesToCheck: 'Issue to checks',
    tasksToDo: 'Tasks to do',
    extractionError: 'Extraction error',
    analysisFailed: 'Analysis failed',
    jobPollingFailed: 'Job polling failed',
    jobFailed: 'Job failed',
    failedLoad: 'Failed to load analysis',
    failedTask: 'Failed to update task',
    failedPolling: 'Job polling failed',
    langToggle: 'עברית',
  },
  he: {
    na: 'לא זמין',
    noTasks: 'לא נמצאו משימות למסמך זה.',
    taskUpdateFailed: 'עדכון המשימה נכשל',
    updating: 'מעדכן...',
    priority: 'עדיפות',
    source: 'מקור',
    status: 'סטטוס',
    noRedFlags: 'לא זוהו דגלים אדומים.',
    other: 'אחר',
    field: 'שדה',
    noProjectionGaps: 'לא זוהו פערי תחזית.',
    noPlans: 'לא נמצאו תוכניות בנתונים שחולצו.',
    plan: 'תוכנית',
    currentBalance: 'יתרה נוכחית',
    projectedWith: 'צפוי (עם הפקדות)',
    projectedNo: 'צפוי (ללא הפקדות)',
    monthlyWith: 'קצבה חודשית (עם הפקדות)',
    monthlyNo: 'קצבה חודשית (ללא הפקדות)',
    noThingsToCheck: 'לא נמצאו "נקודות לבדיקה".',
    retirementGap: 'פער פרישה',
    target: 'יעד',
    projected: 'צפוי',
    gapAmount: 'סכום הפער',
    retirementGapHint: 'פער הפרישה יוצג לאחר הזנת יעד קצבה חודשית.',
    totalProjectionUnavailable: 'התחזית הכוללת אינה זמינה למסמך זה.',
    total: 'סה"כ',
    projectedGrowth: 'צמיחה צפויה',
    monthlyPension: 'קצבה חודשית',
    withDeposits: 'עם הפקדות',
    noDeposits: 'ללא הפקדות',
    depositsImpact: 'השפעת הפקדות',
    balanceImpact: 'השפעה על היתרה',
    pensionImpact: 'השפעה על הקצבה',
    thingsToCheck: 'נקודות לבדיקה',
    redFlags: 'דגלים אדומים',
    projectionGaps: 'פערי תחזית',
    document: 'מסמך',
    uploadAnother: 'העלאת PDF נוסף',
    missingJobId: 'חסר מזהה Job',
    uploadFirst: 'יש להעלות קודם מסמך (לא הועבר `jobId` ב-query).',
    jobStatus: 'סטטוס Job',
    summary: 'סיכום',
    totalProjection: 'תחזית כוללת',
    targetOptional: 'יעד קצבה חודשית (אופציונלי)',
    targetLabel: 'יעד',
    targetPlaceholder: 'למשל 4000',
    recalculating: 'מחשב מחדש...',
    recalculate: 'חשב מחדש',
    clear: 'נקה',
    retirementGapUsage: 'משמש רק לחישוב `retirementGap`.',
    plans: 'תוכניות',
    issuesToCheck: 'סוגיות לבדיקה',
    tasksToDo: 'משימות לביצוע',
    extractionError: 'שגיאת חילוץ',
    analysisFailed: 'הניתוח נכשל',
    jobPollingFailed: 'Polling של Job נכשל',
    jobFailed: 'ה-Job נכשל',
    failedLoad: 'טעינת הניתוח נכשלה',
    failedTask: 'עדכון המשימה נכשל',
    failedPolling: 'Polling של Job נכשל',
    langToggle: 'English',
  },
} as const;

function SeverityBadge({ severity, locale }: { severity: string; locale: Locale }) {
  const normalized = severity.toLowerCase();
  const label = getSeverityLabel(locale, severity);
  if (normalized.includes('high')) return <Badge variant="high">{label}</Badge>;
  if (normalized.includes('medium')) return <Badge variant="medium">{label}</Badge>;
  if (normalized.includes('low')) return <Badge variant="low">{label}</Badge>;
  if (normalized.includes('info')) return <Badge variant="info">{label}</Badge>;
  return <Badge>{label}</Badge>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <Card className="p-4">
        <h2 className="mb-2 text-lg font-semibold">{title}</h2>
        {children}
      </Card>
    </section>
  );
}

function NullableNumber({ value, suffix, locale }: { value: number | null; suffix?: string; locale: Locale }) {
  if (value == null) return <span className="text-muted-foreground">{copy[locale].na}</span>;
  return (
    <span>
      {value}
      {suffix ?? ''}
    </span>
  );
}

function TaskStatusSelect({
  task,
  onChange,
  disabled,
  locale,
}: {
  task: Task;
  onChange: (nextStatus: TaskStatus) => void;
  disabled: boolean;
  locale: Locale;
}) {
  const options: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'DISMISSED'];
  return (
    <select
      className="h-10 rounded-[var(--radius)] border border-border bg-card px-2 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50"
      value={task.status}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as TaskStatus)}
    >
      {options.map((s) => (
        <option key={s} value={s}>
          {getTaskStatusLabel(locale, s)}
        </option>
      ))}
    </select>
  );
}

function TasksList({
  token,
  tasks,
  setTasks,
  locale,
}: {
  token: string;
  tasks: Task[];
  setTasks: (next: Task[]) => void;
  locale: Locale;
}) {
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onStatusChange(taskId: string, nextStatus: TaskStatus) {
    setError(null);
    setUpdatingTaskId(taskId);
    try {
      const updated = await apiUpdateTaskStatus(token, taskId, nextStatus);
      setTasks(tasks.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : copy[locale].failedTask);
    } finally {
      setUpdatingTaskId(null);
    }
  }

  if (!tasks.length) {
    return <div className="text-sm text-muted-foreground">{copy[locale].noTasks}</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <Alert variant="destructive" className="p-3">
          <AlertTitle>{copy[locale].taskUpdateFailed}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {tasks.map((task) => (
        <Card key={task.id} className="p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-[220px]">
              <div className="text-sm font-semibold">{task.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{task.description}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary">{copy[locale].priority}: {task.priority}</Badge>
                <Badge variant="secondary">{copy[locale].source}: {task.sourceType}</Badge>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-xs text-muted-foreground">{copy[locale].status}</div>
              <TaskStatusSelect
                task={task}
                disabled={updatingTaskId === task.id}
                onChange={(next) => onStatusChange(task.id, next)}
                locale={locale}
              />
              {updatingTaskId === task.id ? (
                <div className="text-xs text-muted-foreground">{copy[locale].updating}</div>
              ) : null}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function RedFlagsList({
  redFlags,
  redFlagsBySeverity,
  locale,
}: {
  redFlags: unknown;
  redFlagsBySeverity?: AnalysisPlanResponse['redFlagsBySeverity'];
  locale: Locale;
}) {
  const flags = getRedFlags(redFlags);
  const safeCounts = redFlagsBySeverity ?? { high: 0, medium: 0, low: 0 };

  const grouped = useMemo(() => {
    const by: Record<string, typeof flags> = { high: [], medium: [], low: [], other: [] };
    for (const f of flags) {
      const sev = (f.severity ?? '').toString().toLowerCase();
      if (sev === 'high' || sev === 'medium' || sev === 'low') {
        by[sev].push(f);
      } else {
        by.other.push(f);
      }
    }
    return by;
  }, [flags]);

  if (!flags.length) {
    return <div className="text-sm text-muted-foreground">{copy[locale].noRedFlags}</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <SeverityBadge severity={`high (${safeCounts.high})`} locale={locale} />
        <SeverityBadge severity={`medium (${safeCounts.medium})`} locale={locale} />
        <SeverityBadge severity={`low (${safeCounts.low})`} locale={locale} />
      </div>

      {(['high', 'medium', 'low', 'other'] as const).map((k) => {
        if (!grouped[k].length) return null;
        return (
          <div key={k} className="flex flex-col gap-2">
            <div className="text-sm font-semibold capitalize">{k === 'other' ? copy[locale].other : getSeverityLabel(locale, k)}</div>
            <div className="flex flex-col gap-2">
              {grouped[k].map((f, idx) => (
                <Card key={`${f.id ?? k}-${idx}`} className="p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={(f.severity ?? 'unknown').toString()} locale={locale} />
                    {f.category ? <Badge variant="outline">{f.category}</Badge> : null}
                  </div>
                  {f.message ? <div className="mt-2 text-sm font-medium">{f.message}</div> : null}
                  {f.field ? <div className="mt-1 text-xs text-muted-foreground">{copy[locale].field}: {f.field}</div> : null}
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProjectionGapsList({ gaps, locale }: { gaps: ProjectionGapFlag[]; locale: Locale }) {
  if (!gaps.length) {
    return <div className="text-sm text-muted-foreground">{copy[locale].noProjectionGaps}</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {gaps.map((gap) => (
        <Card key={gap.id} className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={gap.severity} locale={locale} />
            <Badge variant="outline">{gap.category}</Badge>
          </div>
          <div className="mt-2 text-sm font-medium">{gap.message}</div>
          {gap.field ? <div className="mt-1 text-xs text-muted-foreground">{copy[locale].field}: {gap.field}</div> : null}
        </Card>
      ))}
    </div>
  );
}

function PlanList({ extraction, locale }: { extraction: ExtractionResponse; locale: Locale }) {
  const plans = getPlans(extraction.structured);

  if (!plans.length) {
    return <div className="text-sm text-muted-foreground">{copy[locale].noPlans}</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {plans.map((plan, idx) => {
        const planName = (plan.planName ?? plan.plan_name ?? plan.plan ?? '').toString();
        const provider = (plan.providerCompany ?? '').toString();
        const status = (plan.status ?? '').toString();
        const currency = (() => {
          const structured = extraction.structured as Record<string, unknown> | null;
          const c = structured?.currency;
          return typeof c === 'string' ? c : '';
        })();

        const currentBalance = typeof plan.currentBalance === 'number' ? (plan.currentBalance as number) : null;
        const projectedWith = typeof plan.projectedBalanceWithDeposits === 'number' ? (plan.projectedBalanceWithDeposits as number) : null;
        const projectedNo = typeof plan.projectedBalanceNoDeposits === 'number' ? (plan.projectedBalanceNoDeposits as number) : null;

        const monthlyWith = typeof plan.monthlyPensionWithDeposits === 'number' ? (plan.monthlyPensionWithDeposits as number) : null;
        const monthlyNo = typeof plan.monthlyPensionNoDeposits === 'number' ? (plan.monthlyPensionNoDeposits as number) : null;

        return (
          <Card key={idx} className="p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">
                  {(provider ? `${provider} - ` : '') + (planName || `${copy[locale].plan} ${idx + 1}`)}
                </div>
                {status ? <div className="mt-1 text-xs text-muted-foreground">{copy[locale].status}: {status}</div> : null}
              </div>
              <div className="text-xs text-muted-foreground">{copy[locale].plan} #{idx + 1}</div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <div className="text-xs text-muted-foreground">{copy[locale].currentBalance}</div>
                <div className="text-sm font-medium">
                  <NullableNumber value={currentBalance} suffix={currency ? ` ${currency}` : ''} locale={locale} />
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{copy[locale].projectedWith}</div>
                <div className="text-sm font-medium">
                  <NullableNumber value={projectedWith} suffix={currency ? ` ${currency}` : ''} locale={locale} />
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{copy[locale].projectedNo}</div>
                <div className="text-sm font-medium">
                  <NullableNumber value={projectedNo} suffix={currency ? ` ${currency}` : ''} locale={locale} />
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{copy[locale].monthlyWith}</div>
                <div className="text-sm font-medium">
                  <NullableNumber value={monthlyWith} suffix={currency ? ` ${currency}` : ''} locale={locale} />
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-muted-foreground">{copy[locale].monthlyNo}</div>
                <div className="text-sm font-medium">
                  <NullableNumber value={monthlyNo} suffix={currency ? ` ${currency}` : ''} locale={locale} />
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ThingsToCheck({ structured, locale }: { structured: unknown; locale: Locale }) {
  const things = getThingsToCheck(structured);

  if (!things.length) {
    return <div className="text-sm text-muted-foreground">{copy[locale].noThingsToCheck}</div>;
  }

  return (
    <ul className="list-disc pl-5 text-sm text-foreground">
      {things.map((t, idx) => (
        <li key={`${t}-${idx}`} className="mb-1">
          {t}
        </li>
      ))}
    </ul>
  );
}

function SummaryCard({ analysis, locale }: { analysis: AnalysisPlanResponse; locale: Locale }) {
  return (
    <div className="flex flex-col gap-3">
      {analysis.summary ? <Card className="p-3 text-sm">{analysis.summary}</Card> : null}

      {analysis.retirementGap ? (
        <Card className="p-3">
          <div className="text-sm font-semibold">{copy[locale].retirementGap}</div>
          <div className="mt-2 text-sm text-muted-foreground">
            {copy[locale].target}: {analysis.retirementGap.targetMonthlyPension} {analysis.retirementGap.currency}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {copy[locale].projected}: {analysis.retirementGap.projectedMonthlyPension} {analysis.retirementGap.currency}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {copy[locale].gapAmount}: {analysis.retirementGap.gapAmount} {analysis.retirementGap.currency}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {copy[locale].status}: <span className="font-semibold">{analysis.retirementGap.status}</span>
          </div>
        </Card>
      ) : (
        <div className="text-sm text-muted-foreground">{copy[locale].retirementGapHint}</div>
      )}
    </div>
  );
}

function ProjectionCard({ analysis, locale }: { analysis: AnalysisPlanResponse; locale: Locale }) {
  if (!analysis.projection) {
    return <div className="text-sm text-muted-foreground">{copy[locale].totalProjectionUnavailable}</div>;
  }

  const p = analysis.projection;
  const currencySuffix = p.currency ? ` ${p.currency}` : '';

  return (
    <div className="flex flex-col gap-3">
      <Card className="p-3 text-sm">
        <div className="font-semibold">{copy[locale].total}</div>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">{copy[locale].currentBalance}</div>
            <div className="text-sm font-medium">
              <NullableNumber value={p.totalCurrentBalance} suffix={currencySuffix} locale={locale} />
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{copy[locale].projectedWith}</div>
            <div className="text-sm font-medium">
              <NullableNumber value={p.totalProjectedWithDeposits} suffix={currencySuffix} locale={locale} />
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{copy[locale].projectedNo}</div>
            <div className="text-sm font-medium">
              <NullableNumber value={p.totalProjectedNoDeposits} suffix={currencySuffix} locale={locale} />
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{copy[locale].projectedGrowth}</div>
            <div className="text-sm font-medium">
              <NullableNumber value={p.projectedGrowthPercent} suffix={p.projectedGrowthPercent != null ? '%' : ''} locale={locale} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-3 text-sm">
        <div className="font-semibold">{copy[locale].monthlyPension}</div>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">{copy[locale].withDeposits}</div>
            <div className="text-sm font-medium">
              <NullableNumber value={p.totalMonthlyPensionWithDeposits} suffix={currencySuffix} locale={locale} />
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{copy[locale].noDeposits}</div>
            <div className="text-sm font-medium">
              <NullableNumber value={p.totalMonthlyPensionNoDeposits} suffix={currencySuffix} locale={locale} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-3 text-sm">
        <div className="font-semibold">{copy[locale].depositsImpact}</div>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">{copy[locale].balanceImpact}</div>
            <div className="text-sm font-medium">
              <NullableNumber value={p.depositImpactOnBalance} suffix={currencySuffix} locale={locale} />
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{copy[locale].pensionImpact}</div>
            <div className="text-sm font-medium">
              <NullableNumber value={p.depositImpactOnPension} suffix={currencySuffix} locale={locale} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function IssueToChecks({ analysis, extraction, locale }: { analysis: AnalysisPlanResponse; extraction: ExtractionResponse; locale: Locale }) {
  return (
    <div className="flex flex-col gap-4">
      <Section title={copy[locale].thingsToCheck}>
        <ThingsToCheck structured={extraction.structured} locale={locale} />
      </Section>

      <Section title={copy[locale].redFlags}>
        <RedFlagsList redFlags={analysis.redFlags} redFlagsBySeverity={analysis.redFlagsBySeverity} locale={locale} />
      </Section>

      <Section title={copy[locale].projectionGaps}>
        <ProjectionGapsList gaps={analysis.projectionGaps} locale={locale} />
      </Section>
    </div>
  );
}

function DocumentViewInner() {
  const router = useRouter();
  const params = useParams<{ documentId: string }>();
  const searchParams = useSearchParams();
  const { token } = useAuth();

  const documentId = params.documentId;
  const jobId = searchParams.get('jobId');

  const [job, setJob] = useState<Awaited<ReturnType<typeof apiGetJob>> | null>(null);
  const [jobPollError, setJobPollError] = useState<string | null>(null);
  const pollingActiveRef = useRef(false);
  const hasFetchedResultsRef = useRef(false);
  const fetchInFlightRef = useRef(false);

  const [analysis, setAnalysis] = useState<AnalysisPlanResponse | null>(null);
  const [extraction, setExtraction] = useState<ExtractionResponse | null>(null);
  const [loadingResult, setLoadingResult] = useState(false);
  const [resultError, setResultError] = useState<string | null>(null);

  const [targetInput, setTargetInput] = useState<string>('');
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    setLocale(detectInitialLocale());
  }, []);

  useEffect(() => {
    persistLocale(locale);
  }, [locale]);

  const parsedTarget = useMemo(() => {
    if (!targetInput.trim()) return null;
    const n = Number(targetInput);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }, [targetInput]);

  async function fetchAnalysisAndExtraction(target: number | null): Promise<boolean> {
    if (!token || !documentId) return false;
    setLoadingResult(true);
    setResultError(null);
    try {
      const [analysisRes, extractionRes] = await Promise.all([
        apiGetAnalysisPlan(token, documentId, { targetMonthlyPension: target }),
        apiGetExtraction(token, documentId),
      ]);
      setAnalysis(analysisRes);
      setExtraction(extractionRes);
      return true;
    } catch (err) {
      setResultError(err instanceof Error ? err.message : copy[locale].failedLoad);
      return false;
    } finally {
      setLoadingResult(false);
    }
  }

  useEffect(() => {
    if (!token || !documentId || !jobId) return;
    const tokenValue = token;
    const jobIdValue = jobId;
    if (pollingActiveRef.current) return;

    let cancelled = false;
    pollingActiveRef.current = true;
    let intervalId: number | null = null;

    async function pollOnce() {
      try {
        const j = await apiGetJob(tokenValue, jobIdValue as string);
        if (cancelled) return;
        setJob(j);

        if (j.status === 'DONE') {
          // Stop polling immediately after DONE; fetch results exactly once.
          if (intervalId != null) window.clearInterval(intervalId);
          pollingActiveRef.current = false;

          if (!hasFetchedResultsRef.current && !fetchInFlightRef.current) {
            fetchInFlightRef.current = true;
            const ok = await fetchAnalysisAndExtraction(parsedTarget);
            hasFetchedResultsRef.current = ok;
            fetchInFlightRef.current = false;
          }
        } else if (j.status === 'FAILED') {
          if (intervalId != null) window.clearInterval(intervalId);
          pollingActiveRef.current = false;
        }
      } catch (err) {
        if (cancelled) return;
        setJobPollError(err instanceof Error ? err.message : copy[locale].failedPolling);
      }
    }

    intervalId = window.setInterval(() => {
      void pollOnce();
    }, 2500);

    // Initial fetch, then poll.
    void pollOnce();

    return () => {
      cancelled = true;
      pollingActiveRef.current = false;
      if (intervalId != null) window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, documentId, jobId]);

  async function onRecalculate() {
    await fetchAnalysisAndExtraction(parsedTarget);
  }

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-col">
        <div className="text-sm text-muted-foreground">{copy[locale].document}</div>
        <div className="text-xl font-semibold">{documentId}</div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" type="button" onClick={() => setLocale(toggleLocale(locale))}>
          {copy[locale].langToggle}
        </Button>
        <Button variant="outline" size="sm" type="button" onClick={() => router.push('/documents/new')}>
          {copy[locale].uploadAnother}
        </Button>
      </div>
    </div>
  );

  if (!jobId) {
    return (
      <RequireAuth>
        <div className="space-y-4">
          {header}
          <Alert variant="destructive" className="p-4">
            <AlertTitle>{copy[locale].missingJobId}</AlertTitle>
            <AlertDescription>{copy[locale].uploadFirst}</AlertDescription>
          </Alert>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="space-y-6" dir={locale === 'he' ? 'rtl' : 'ltr'}>
        {header}

        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <span className="text-muted-foreground">{copy[locale].jobStatus}:</span>{' '}
              <span className="font-semibold">{job?.status ?? 'UNKNOWN'}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">JobId:</span> <span className="font-medium">{jobId}</span>
            </div>
          </div>

          {jobPollError ? (
            <div className="mt-2">
              <Alert variant="destructive" className="p-3">
                <AlertTitle>{copy[locale].jobPollingFailed}</AlertTitle>
                <AlertDescription>{jobPollError}</AlertDescription>
              </Alert>
            </div>
          ) : null}
          {job?.status === 'FAILED' && job?.error ? (
            <div className="mt-2">
              <Alert variant="destructive" className="p-3">
                <AlertTitle>{copy[locale].jobFailed}</AlertTitle>
                <AlertDescription>{job.error}</AlertDescription>
              </Alert>
            </div>
          ) : null}
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[420px_1fr]">
          <div className="flex flex-col gap-4">
            <Section title={copy[locale].summary}>
              {analysis ? (
                <SummaryCard analysis={analysis} locale={locale} />
              ) : (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-2/3" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              )}
            </Section>

            <Section title={copy[locale].totalProjection}>
              {analysis ? (
                <ProjectionCard analysis={analysis} locale={locale} />
              ) : (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              )}
            </Section>

            <Section title={copy[locale].targetOptional}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="targetMonthlyPension">{copy[locale].targetLabel}</Label>
                <Input
                  id="targetMonthlyPension"
                  type="number"
                  min={0}
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  placeholder={copy[locale].targetPlaceholder}
                />
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    disabled={loadingResult}
                    onClick={onRecalculate}
                  >
                    {loadingResult ? copy[locale].recalculating : copy[locale].recalculate}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    disabled={loadingResult}
                    onClick={() => {
                      setTargetInput('');
                      // fire-and-forget; we rely on parsedTarget null on next render
                      fetchAnalysisAndExtraction(null);
                    }}
                  >
                    {copy[locale].clear}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">{copy[locale].retirementGapUsage}</div>
              </div>
            </Section>
          </div>

          <div className="flex flex-col gap-4">
            <Section title={copy[locale].plans}>
              {extraction ? (
                <PlanList extraction={extraction} locale={locale} />
              ) : (
                <div className="space-y-3">
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
                </div>
              )}
            </Section>

            <Section title={copy[locale].issuesToCheck}>
              {analysis && extraction ? (
                <IssueToChecks analysis={analysis} extraction={extraction} locale={locale} />
              ) : (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-28 w-full" />
                </div>
              )}
            </Section>

            <Section title={copy[locale].tasksToDo}>
              {token && analysis ? (
                <TasksList token={token} tasks={analysis.tasks} setTasks={(next) => setAnalysis({ ...analysis, tasks: next })} locale={locale} />
              ) : (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              )}
            </Section>

            {extraction?.analysisError ? (
              <Alert variant="destructive" className="p-4">
                <AlertTitle>{copy[locale].extractionError}</AlertTitle>
                <AlertDescription>{extraction.analysisError}</AlertDescription>
              </Alert>
            ) : null}

            {resultError ? (
              <Alert variant="destructive" className="p-4">
                <AlertTitle>{copy[locale].analysisFailed}</AlertTitle>
                <AlertDescription>{resultError}</AlertDescription>
              </Alert>
            ) : null}
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}

export default function DocumentViewPage() {
  return <DocumentViewInner />;
}

