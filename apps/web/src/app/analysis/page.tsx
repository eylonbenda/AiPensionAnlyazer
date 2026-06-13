"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnalysisHero } from "@/components/analysis/AnalysisHero";
import { ActivePlansPieChart } from "@/components/analysis/ActivePlansPieChart";
import { AnalysisTabs, type AnalysisTab } from "@/components/analysis/AnalysisTabs";
import { FlagCard } from "@/components/analysis/FlagCard";
import { GapStatusCard } from "@/components/analysis/GapStatusCard";
import { PlansTable } from "@/components/analysis/PlansTable";
import { ProjectionCard } from "@/components/analysis/ProjectionCard";
import { SimulationCard } from "@/components/analysis/SimulationCard";
import { SummaryCard } from "@/components/analysis/SummaryCard";
import { TaskList } from "@/components/analysis/TaskList";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { analysisCopy } from "@/lib/analysisLocale";
import { detectInitialLocale, persistLocale, toggleLocale, type Locale } from "@/lib/locale";
import { getGapStatusLabel, getPlanStatusLabel, getTaskPriorityLabel, getTaskStatusLabel } from "@/lib/localeMaps";
import type { PensionAnalysis } from "@/lib/analysisTypes";
import { formatCurrency } from "@/lib/analysisUi";
import { mockAnalysisData } from "@/lib/mockAnalysisData";
import { useAuth } from "@/providers/AuthProvider";
import { apiGetAnalysisPlan, apiGetExtraction, apiGetJob, type AnalysisPlanResponse, type ExtractionResponse } from "@/lib/api";
import { getPlans, getRedFlags } from "@/lib/extractionParsing";

export default function AnalysisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<AnalysisTab>("overview");
  const [locale, setLocale] = useState<Locale>("en");
  const [analysis, setAnalysis] = useState<PensionAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const copy = analysisCopy[locale];

  useEffect(() => {
    setLocale(detectInitialLocale());
  }, []);

  useEffect(() => {
    persistLocale(locale);
  }, [locale]);

  useEffect(() => {
    if (!loading && !token) {
      router.replace("/login?next=%2Fanalysis");
    }
  }, [loading, token, router]);

  useEffect(() => {
    const qpDocumentId = searchParams.get("documentId");
    const qpJobId = searchParams.get("jobId");
    const storedDocumentId = typeof window !== "undefined" ? window.localStorage.getItem("last_document_id") : null;
    const resolvedDocumentId = qpDocumentId ?? storedDocumentId;
    if (!resolvedDocumentId) {
      setSelectedDocumentId(null);
      setAnalysis(localizeAnalysisContent(mockAnalysisData, locale));
      return;
    }
    const documentIdValue = resolvedDocumentId;
    setSelectedDocumentId(documentIdValue);

    let cancelled = false;
    let intervalId: number | null = null;

    async function loadAnalysis() {
      if (!token) return;
      setLoadingAnalysis(true);
      setAnalysisError(null);
      try {
        const [analysisRes, extractionRes] = await Promise.all([
          apiGetAnalysisPlan(token, documentIdValue),
          apiGetExtraction(token, documentIdValue),
        ]);
        if (cancelled) return;
        const mapped = mapApiToPensionAnalysis(analysisRes, extractionRes);
        setAnalysis(localizeAnalysisContent(mapped, locale));
      } catch (err) {
        if (cancelled) return;
        setAnalysisError(err instanceof Error ? err.message : "Failed to load analysis");
      } finally {
        if (!cancelled) setLoadingAnalysis(false);
      }
    }

    async function pollJobUntilDone(jobId: string) {
      if (!token) return;
      const job = await apiGetJob(token, jobId);
      if (cancelled) return;
      if (job.status === "DONE" || job.status === "FAILED") {
        if (intervalId != null) window.clearInterval(intervalId);
        await loadAnalysis();
      }
    }

    if (qpJobId) {
      intervalId = window.setInterval(() => {
        void pollJobUntilDone(qpJobId);
      }, 2500);
      void pollJobUntilDone(qpJobId);
    } else {
      void loadAnalysis();
    }

    return () => {
      cancelled = true;
      if (intervalId != null) window.clearInterval(intervalId);
    };
  }, [searchParams, token, locale]);

  const topCards = useMemo(
    () => [
      {
        label: copy.topCards.totalCurrentBalance,
        value: formatCurrency(analysis?.projection.totalCurrentBalance, analysis?.currency ?? "ILS", locale),
      },
      {
        label: copy.topCards.totalProjectedBalance,
        value: formatCurrency(analysis?.projection.totalProjectedBalance, analysis?.currency ?? "ILS", locale),
      },
      {
        label: copy.topCards.projectedMonthlyPension,
        value: formatCurrency(analysis?.projection.totalMonthlyPensionProjected, analysis?.currency ?? "ILS", locale),
      },
      {
        label: copy.topCards.retirementStatus,
        value:
          analysis?.gapInsight?.status == null
            ? locale === "he"
              ? "לא זמין"
              : "N/A"
            : locale === "he"
              ? getGapStatusLabel(locale, analysis.gapInsight.status)
              : analysis.gapInsight.status,
        hint: analysis?.gapInsight
          ? `${copy.topCards.gapPrefix}: ${formatCurrency(analysis.gapInsight.gapAmount, analysis.currency, locale)}`
          : copy.topCards.noTarget,
      },
    ],
    [analysis, copy, locale],
  );

  if (loading || !token) {
    return null;
  }

  if (!analysis) {
    return (
      <main dir={copy.dir} className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setLocale(toggleLocale(locale))}>
            {copy.language}
          </Button>
        </div>
        <Card className="border-border/80 p-6">
          <div className="text-lg font-semibold">
            {selectedDocumentId
              ? loadingAnalysis
                ? locale === "he"
                  ? "טוען ניתוח..."
                  : "Loading analysis..."
                : locale === "he"
                  ? "לא ניתן היה לטעון את הניתוח"
                  : "Could not load analysis"
              : locale === "he"
                ? "אין עדיין מסמך מנותח"
                : "No analyzed document yet"}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {analysisError ??
              (locale === "he" ? "העלו דוח חדש כדי להתחיל." : "Upload a new report to get started.")}
          </div>
          <div className="mt-4">
            <Button variant="primary" onClick={() => router.push("/documents/new")}>
              {locale === "he" ? "העלאת דוח" : "Upload report"}
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main dir={copy.dir} className="mx-auto w-full max-w-7xl space-y-9 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setLocale(toggleLocale(locale))}>
          {copy.language}
        </Button>
      </div>
      <AnalysisHero analysis={analysis} locale={locale} reportLabel={copy.heroLabel} updatedLabel={copy.updated} />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
        {topCards.map((item) => (
          <SummaryCard key={item.label} label={item.label} value={item.value} hint={item.hint} />
        ))}
      </section>

      <AnalysisTabs value={activeTab} onChange={setActiveTab} labels={copy.tabs} />

      {(activeTab === "overview" || activeTab === "issues") && (
        <Section title={copy.sections.flagsTitle} description={copy.sections.flagsDesc}>
          {analysis.flags.length ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {analysis.flags.map((flag) => (
                <FlagCard
                  key={flag.id}
                  flag={flag}
                  evidenceLabel={locale === "he" ? "ראיה" : "Evidence"}
                  severityMap={locale === "he" ? { HIGH: "גבוהה", MEDIUM: "בינונית", LOW: "נמוכה", INFO: "מידע" } : undefined}
                />
              ))}
            </div>
          ) : (
            <EmptyState message={copy.sections.noIssues} />
          )}
        </Section>
      )}

      {(activeTab === "overview" || activeTab === "projection") && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <Section title={copy.sections.projectionTitle} description={copy.sections.projectionDesc} className="xl:col-span-5">
            <ProjectionCard
              projection={analysis.projection}
              currency={analysis.currency}
              locale={locale}
              labels={{
                title: locale === "he" ? "תמונת תחזית" : "Projection snapshot",
                currentBalance: locale === "he" ? "יתרה נוכחית" : "Current balance",
                projectedBalance: locale === "he" ? "יתרה צפויה" : "Projected balance",
                projectedMonthlyPension: locale === "he" ? "קצבה חודשית צפויה" : "Projected monthly pension",
                dataCompleteness: locale === "he" ? "שלמות נתונים" : "Data completeness",
                calculationVersion: locale === "he" ? "גרסת חישוב" : "Calculation version",
              }}
            />
          </Section>
          <Section title={copy.sections.gapTitle} description={copy.sections.gapDesc} className="xl:col-span-7">
            <GapStatusCard
              gapInsight={analysis.gapInsight}
              currency={analysis.currency}
              locale={locale}
              labels={{
                title: locale === "he" ? "פער פרישה" : "Retirement gap",
                noTarget:
                  locale === "he" ? "עדיין לא הוגדרה קצבת יעד. הוסיפו יעד כדי לחשב מוכנות." : "No target pension yet. Add a target to compute readiness.",
                subtitle:
                  locale === "he"
                    ? "תמונת מצב מיידית מול יעד הקצבה החודשי שלכם."
                    : "At-a-glance readiness against your monthly pension target.",
                targetMonthly: locale === "he" ? "קצבת יעד חודשית" : "Target monthly pension",
                projectedMonthly: locale === "he" ? "קצבה חודשית צפויה" : "Projected monthly pension",
                gapAmount: locale === "he" ? "סכום הפער" : "Gap amount",
                targetCoverage: locale === "he" ? "כיסוי יעד" : "Target coverage",
                belowTarget: locale === "he" ? "התחזית הנוכחית נמוכה מהיעד." : "Current projection is below target.",
                alignedTarget: locale === "he" ? "התחזית הנוכחית מיושרת עם היעד." : "Current projection is aligned with target.",
                aboveTarget: locale === "he" ? "התחזית הנוכחית גבוהה מהיעד." : "Current projection is above target.",
                statusMap:
                  locale === "he"
                    ? {
                        SHORTFALL: getGapStatusLabel(locale, "SHORTFALL"),
                        ON_TRACK: getGapStatusLabel(locale, "ON_TRACK"),
                        SURPLUS: getGapStatusLabel(locale, "SURPLUS"),
                      }
                    : undefined,
              }}
            />
          </Section>
        </div>
      )}

      {(activeTab === "overview" || activeTab === "projection") && (
        <Section title={copy.sections.simulationTitle} description={copy.sections.simulationDesc}>
          <SimulationCard
            simulation={analysis.simulation}
            currency={analysis.currency}
            locale={locale}
            labels={{
              title: locale === "he" ? "השוואת סימולציה" : "Simulation comparison",
              noData: locale === "he" ? "אין נתוני סימולציה זמינים לדוח זה." : "No simulation data available for this report.",
              baseline: locale === "he" ? "קצבה צפויה בבסיס" : "Baseline projected pension",
              simulated: locale === "he" ? "קצבה צפויה בסימולציה" : "Simulated projected pension",
              delta: locale === "he" ? "שינוי" : "Delta",
            }}
          />
        </Section>
      )}

      {(activeTab === "overview" || activeTab === "tasks") && (
        <Section title={copy.sections.tasksTitle} description={copy.sections.tasksDesc}>
          <TaskList
            tasks={analysis.tasks}
            labels={{
              nextSteps: locale === "he" ? "צעדים הבאים" : "Next steps",
              noTasks:
                locale === "he" ? "כרגע אין משימות פתוחות. אתם במצב תקין." : "No tasks available yet. You are currently in a clean state.",
              priorityPrefix: locale === "he" ? "עדיפות" : "Priority",
              statusMap:
                locale === "he"
                  ? {
                      TODO: getTaskStatusLabel(locale, "TODO"),
                      IN_PROGRESS: getTaskStatusLabel(locale, "IN_PROGRESS"),
                      DONE: getTaskStatusLabel(locale, "DONE"),
                      DISMISSED: getTaskStatusLabel(locale, "DISMISSED"),
                    }
                  : undefined,
              priorityMap:
                locale === "he"
                  ? {
                      LOW: getTaskPriorityLabel(locale, "LOW"),
                      MEDIUM: getTaskPriorityLabel(locale, "MEDIUM"),
                      HIGH: getTaskPriorityLabel(locale, "HIGH"),
                    }
                  : undefined,
            }}
          />
        </Section>
      )}

      {(activeTab === "overview" || activeTab === "plans") && (
        <Section title={copy.sections.plansTitle} description={copy.sections.plansDesc}>
          <ActivePlansPieChart
            plans={analysis.structuredData.plans}
            currency={analysis.currency}
            locale={locale}
            labels={{
              title: locale === "he" ? "התפלגות יתרות בתוכניות פעילות" : "Active plans balance distribution",
              subtitle: locale === "he" ? "חלוקה לפי יתרה נוכחית בכל תוכנית פעילה." : "Split by current balance across active plans.",
              noData: locale === "he" ? "אין מספיק נתונים להצגת תרשים לתוכניות פעילות." : "Not enough data to render active plans chart.",
              totalActive: locale === "he" ? "סה\"כ יתרה בתוכניות פעילות" : "Total active balance",
              share: locale === "he" ? "חלק יחסי" : "Share",
            }}
          />
          <PlansTable
            plans={analysis.structuredData.plans}
            currency={analysis.currency}
            locale={locale}
            labels={{
              noPlans:
                locale === "he" ? "לא נמצאו תוכניות בנתונים המובנים שחולצו." : "No plans found in the extracted structured data.",
              unnamed: locale === "he" ? "ללא שם" : "Unnamed",
              noProvider: locale === "he" ? "לא זמין" : "N/A",
              unknownStatus: locale === "he" ? getPlanStatusLabel(locale, "UNKNOWN") : "UNKNOWN",
              statusMap:
                locale === "he"
                  ? {
                      ACTIVE: getPlanStatusLabel(locale, "ACTIVE"),
                      INACTIVE: getPlanStatusLabel(locale, "INACTIVE"),
                      UNKNOWN: getPlanStatusLabel(locale, "UNKNOWN"),
                    }
                  : undefined,
              columns: {
                plan: locale === "he" ? "תוכנית" : "Plan",
                provider: locale === "he" ? "ספק" : "Provider",
                current: locale === "he" ? "נוכחי" : "Current",
                projected: locale === "he" ? "צפוי" : "Projected",
                monthlyPension: locale === "he" ? "קצבה חודשית" : "Monthly pension",
                savingsFee: locale === "he" ? "דמי ניהול חיסכון" : "Savings fee",
                premiumFee: locale === "he" ? "דמי ניהול פרמיה" : "Premium fee",
                status: locale === "he" ? "סטטוס" : "Status",
              },
              card: {
                unnamedPlan: locale === "he" ? "תוכנית ללא שם" : "Unnamed plan",
                missingProvider: locale === "he" ? "פרטי ספק לא זמינים" : "Provider details unavailable",
                unknownStatus: locale === "he" ? getPlanStatusLabel(locale, "UNKNOWN") : "UNKNOWN",
                currentBalance: locale === "he" ? "יתרה נוכחית" : "Current balance",
                projectedBalance: locale === "he" ? "יתרה צפויה" : "Projected balance",
                monthlyPension: locale === "he" ? "קצבה חודשית" : "Monthly pension",
                savingsFee: locale === "he" ? "דמי ניהול חיסכון" : "Fee from savings",
                premiumFee: locale === "he" ? "דמי ניהול פרמיה" : "Fee from premium",
                statusMap:
                  locale === "he"
                    ? {
                        ACTIVE: getPlanStatusLabel(locale, "ACTIVE"),
                        INACTIVE: getPlanStatusLabel(locale, "INACTIVE"),
                        UNKNOWN: getPlanStatusLabel(locale, "UNKNOWN"),
                      }
                    : undefined,
              },
            }}
          />
        </Section>
      )}
    </main>
  );
}

function Section({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`space-y-4 ${className ?? ""}`}>
      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="border-border/80 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <p className="text-sm text-muted-foreground">{message}</p>
    </Card>
  );
}

function localizeAnalysisContent(analysis: PensionAnalysis, locale: Locale): PensionAnalysis {
  if (locale !== "he") return analysis;

  const flagMap: Record<string, { title: string; message: string; evidence?: string }> = {
    flag_1: {
      title: "דמי ניהול גבוהים בתוכנית ותיקה",
      message: "באחת התוכניות דמי הניהול מהחיסכון גבוהים מ-1%.",
      evidence: "תוכנית ותיקה מגדל: 1.2%",
    },
    flag_2: {
      title: "זוהתה תוכנית לא פעילה",
      message: "נראה שמוצר פנסיוני ישן לא פעיל ודורש בדיקה.",
      evidence: "סטטוס תוכנית ותיקה מגדל: לא פעילה",
    },
    flag_3: {
      title: "חוסר התאמה בנתוני הפקדות מעסיק",
      message: "נמצאה סטייה קטנה בין תלושים שנתיים למטא-דאטה בדוח.",
    },
  };

  const taskMap: Record<string, { title: string; description: string }> = {
    task_1: {
      title: "בדיקת תנאי דמי ניהול בתוכנית ותיקה",
      description: "לבקש ממגדל הצעת דמי ניהול מעודכנת ולהשוות חלופות.",
    },
    task_2: {
      title: "אימות סטטוס תוכנית לא פעילה",
      description: "לוודא האם עדיין מוזרמות הפקדות שכר למוצר הלא פעיל.",
    },
    task_3: {
      title: "הוספת דוח שנתי חסר",
      description: "להעלות דוח חסר כדי לשפר את ציון שלמות הנתונים.",
    },
  };

  const planMap: Record<string, { planName?: string; productType?: string }> = {
    plan_1: { planName: "פנסיית מנהלים", productType: "קרן פנסיה" },
    plan_2: { planName: "חיסכון משלים", productType: "קופת גמל" },
    plan_3: { planName: "תוכנית ותיקה", productType: "ביטוח פנסיוני" },
  };

  return {
    ...analysis,
    reportTitle: "דוח פנסיה שנתי 2025",
    providerSummary: "תצוגה מאוחדת של כלל + מנורה + מגדל",
    flags: analysis.flags.map((flag) => ({
      ...flag,
      title: flagMap[flag.id]?.title ?? flag.title,
      message: flagMap[flag.id]?.message ?? flag.message,
      evidence: flagMap[flag.id]?.evidence ?? flag.evidence,
    })),
    tasks: analysis.tasks.map((task) => ({
      ...task,
      title: taskMap[task.id]?.title ?? task.title,
      description: taskMap[task.id]?.description ?? task.description,
    })),
    simulation: analysis.simulation
      ? {
          ...analysis.simulation,
          notes: [
            "הסימולציה מניחה גידול שכר שנתי של 3%.",
            "ההפקדה החודשית גדלה ב-8% החל מהרבעון הבא.",
            "הנחות תשואת השוק נותרו ללא שינוי.",
          ],
        }
      : analysis.simulation,
    structuredData: {
      ...analysis.structuredData,
      plans: analysis.structuredData.plans.map((plan) => ({
        ...plan,
        planName: planMap[plan.id]?.planName ?? plan.planName,
        productType: planMap[plan.id]?.productType ?? plan.productType,
      })),
    },
  };
}

function mapApiToPensionAnalysis(analysis: AnalysisPlanResponse, extraction: ExtractionResponse): PensionAnalysis {
  const structured = (extraction.structured as Record<string, unknown> | null) ?? {};
  const plansRaw = getPlans(extraction.structured);
  const flagsRaw = getRedFlags(analysis.redFlags);

  return {
    id: analysis.documentId,
    reportTitle: `Document ${analysis.documentId}`,
    providerSummary: analysis.summary ?? undefined,
    status: analysis.job?.status === "FAILED" ? "FAILED" : analysis.job?.status === "DONE" ? "READY" : "PROCESSING",
    lastUpdatedAt: analysis.job?.updatedAt ?? new Date().toISOString(),
    currency: analysis.projection?.currency || (typeof structured.currency === "string" ? structured.currency : "ILS"),
    structuredData: {
      plans: plansRaw.map((plan, idx) => ({
        id: `plan_${idx + 1}`,
        providerCompany: typeof plan.providerCompany === "string" ? plan.providerCompany : undefined,
        planName:
          typeof plan.planName === "string"
            ? plan.planName
            : typeof plan.plan_name === "string"
              ? plan.plan_name
              : undefined,
        productType: typeof plan.productType === "string" ? plan.productType : undefined,
        currentBalance: typeof plan.currentBalance === "number" ? plan.currentBalance : undefined,
        projectedBalanceWithDeposits:
          typeof plan.projectedBalanceWithDeposits === "number" ? plan.projectedBalanceWithDeposits : undefined,
        monthlyPensionWithDeposits:
          typeof plan.monthlyPensionWithDeposits === "number" ? plan.monthlyPensionWithDeposits : undefined,
        managementFeeFromSavingsPercent:
          typeof plan.managementFeeFromSavingsPercent === "number" ? plan.managementFeeFromSavingsPercent : undefined,
        managementFeeFromPremiumPercent:
          typeof plan.managementFeeFromPremiumPercent === "number" ? plan.managementFeeFromPremiumPercent : undefined,
        status:
          typeof plan.status === "string" && (plan.status === "ACTIVE" || plan.status === "INACTIVE" || plan.status === "UNKNOWN")
            ? plan.status
            : "UNKNOWN",
      })),
    },
    flags: flagsRaw.map((flag, idx) => ({
      id: flag.id ?? `flag_${idx + 1}`,
      severity: normalizeSeverity(flag.severity),
      title: typeof flag.category === "string" ? flag.category : `Flag ${idx + 1}`,
      message: typeof flag.message === "string" ? flag.message : "Please review this issue.",
      evidence: typeof flag.field === "string" ? `${flag.field}` : undefined,
    })),
    projection: {
      totalCurrentBalance: analysis.projection?.totalCurrentBalance ?? 0,
      totalProjectedBalance: analysis.projection?.totalProjectedWithDeposits ?? 0,
      totalMonthlyPensionProjected: analysis.projection?.totalMonthlyPensionWithDeposits ?? 0,
      dataCompletenessScore:
        analysis.projection?.totalPlans && analysis.projection.totalPlans > 0
          ? Math.round((analysis.projection.plansWithProjections / analysis.projection.totalPlans) * 100)
          : 0,
      calculationVersion: "v1",
    },
    gapInsight: analysis.retirementGap
      ? {
          targetMonthlyPension: analysis.retirementGap.targetMonthlyPension,
          projectedMonthlyPension: analysis.retirementGap.projectedMonthlyPension,
          gapAmount: analysis.retirementGap.gapAmount,
          status: analysis.retirementGap.status,
        }
      : undefined,
    simulation: undefined,
    tasks: analysis.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
    })),
  };
}

function normalizeSeverity(severity: unknown): "HIGH" | "MEDIUM" | "LOW" | "INFO" {
  const s = typeof severity === "string" ? severity.toUpperCase() : "";
  if (s.includes("HIGH")) return "HIGH";
  if (s.includes("MEDIUM")) return "MEDIUM";
  if (s.includes("LOW")) return "LOW";
  return "INFO";
}
