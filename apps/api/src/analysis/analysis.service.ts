import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma, JobStatus } from '@pension-analyzer/database';
import {
  computeProjection,
  runSimulation,
  SimulationScenario,
} from '@pension-analyzer/ai';

export interface ExtractionResponse {
  id: string;
  documentId: string;
  text: string;
  textStorageKey: string | null;
  meta: unknown;
  structured: unknown;
  analysisError: string | null;
  createdAt: Date;
}

@Injectable()
export class AnalysisService {
  private async getDocumentForUser(documentId: string, userId: string) {
    const document = await prisma.document.findFirst({
      where: { id: documentId, userId },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return document;
  }

  async getDocumentAnalysis(
    documentId: string,
    userId: string,
    targetMonthlyPension: number | null = null,
  ) {
    const document = await this.getDocumentForUser(documentId, userId);

    const [latestJob] = await prisma.job.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    const extraction = await prisma.extraction.findFirst({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });

    const hasText = !!extraction?.text && extraction.text.length > 0;

    const structured = (extraction?.structured as unknown) ?? null;
    const analysisError = extraction?.analysisError ?? null;
    const redFlags = (extraction?.redFlags as unknown) ?? null;

    const summary = this.buildSummary(structured);
    const redFlagSummary = this.buildRedFlagSummary(redFlags);

    const projectionResult =
      structured && typeof structured === 'object'
        ? computeProjection(structured as any)
        : null;

    const retirementGap =
      projectionResult && targetMonthlyPension
        ? this.computeRetirementGap(
            projectionResult.summary,
            targetMonthlyPension,
          )
        : null;

    const defaultSimulationScenario: SimulationScenario = {
      globalEmployeeIncreasePercent: 10,
    };

    const simulationResult =
      structured && typeof structured === 'object' && Array.isArray((structured as any).plans)
        ? runSimulation(structured as any, defaultSimulationScenario)
        : null;

    if (extraction && simulationResult) {
      await this.appendSimulationMeta(extraction.id, simulationResult);
    }

    const tasks = await prisma.task.findMany({
      where: { documentId },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    return {
      documentId: document.id,
      job: latestJob
        ? {
            id: latestJob.id,
            status: latestJob.status as JobStatus,
            attempts: latestJob.attempts,
            error: latestJob.error,
            createdAt: latestJob.createdAt,
            updatedAt: latestJob.updatedAt,
            startedAt: latestJob.startedAt,
            finishedAt: latestJob.finishedAt,
          }
        : null,
      hasText,
      structured,
      analysisError,
      redFlags,
      redFlagCount: redFlagSummary.total,
      redFlagsBySeverity: redFlagSummary.bySeverity,
      summary,
      projection: projectionResult?.summary ?? null,
      projectionGaps: projectionResult?.gaps ?? [],
      projectionGapCount: projectionResult?.gaps.length ?? 0,
      retirementGap,
      simulation: simulationResult,
      tasks,
    };
  }

  async runCustomSimulation(
    documentId: string,
    userId: string,
    scenario: SimulationScenario,
  ) {
    await this.getDocumentForUser(documentId, userId);

    const extraction = await prisma.extraction.findFirst({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });

    if (
      !extraction ||
      !extraction.structured ||
      typeof extraction.structured !== 'object' ||
      !Array.isArray((extraction.structured as any).plans)
    ) {
      throw new NotFoundException('Structured extraction with plans not found for this document');
    }

    const simulationResult = runSimulation(
      extraction.structured as any,
      scenario,
    );

    await this.appendSimulationMeta(extraction.id, simulationResult);

    return simulationResult;
  }

  private buildSummary(structured: any): string | null {
    if (!structured) {
      return null;
    }

    const parts: string[] = [];
    const currency = structured.currency || '';

    if (structured.pensionProviderName) {
      parts.push(`Provider: ${structured.pensionProviderName}`);
    }

    if (structured.planType) {
      parts.push(`Plan type: ${structured.planType}`);
    }

    if (structured.totalCurrentSavings != null) {
      parts.push(`Total current savings: ${structured.totalCurrentSavings} ${currency}`.trim());
    }

    if (structured.totalProjectedSavings != null) {
      parts.push(`Total projected: ${structured.totalProjectedSavings} ${currency}`.trim());
    }

    if (structured.currentBalance != null && structured.totalCurrentSavings == null) {
      parts.push(`Current balance: ${structured.currentBalance} ${currency}`.trim());
    }

    if (structured.employeeContributionRate != null) {
      parts.push(`Employee contribution: ${structured.employeeContributionRate}%`);
    }

    if (structured.employerContributionRate != null) {
      parts.push(`Employer contribution: ${structured.employerContributionRate}%`);
    }

    if (Array.isArray(structured.plans) && structured.plans.length > 0) {
      parts.push(`Plans: ${structured.plans.length}`);
    }

    if (structured.statementDate) {
      parts.push(`As of: ${structured.statementDate}`);
    }

    if (structured.reportDate) {
      parts.push(`Report date: ${structured.reportDate}`);
    }

    if (parts.length === 0) {
      return 'Structured extraction completed; no key fields identified in the document.';
    }

    return parts.join(' | ');
  }

  async getDocumentExtraction(
    documentId: string,
    userId: string,
  ): Promise<ExtractionResponse> {
    await this.getDocumentForUser(documentId, userId);

    const extraction = await prisma.extraction.findFirst({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });

    if (!extraction) {
      throw new NotFoundException('No extraction found for this document');
    }

    return {
      id: extraction.id,
      documentId: extraction.documentId,
      text: extraction.text,
      textStorageKey: extraction.textStorageKey,
      meta: extraction.meta,
      structured: extraction.structured,
      analysisError: extraction.analysisError,
      createdAt: extraction.createdAt,
    };
  }

  private buildRedFlagSummary(redFlags: any): {
    total: number;
    bySeverity: { high: number; medium: number; low: number };
  } {
    const result = {
      total: 0,
      bySeverity: { high: 0, medium: 0, low: 0 },
    };

    if (!Array.isArray(redFlags)) {
      return result;
    }

    result.total = redFlags.length;

    for (const flag of redFlags) {
      const severity = flag?.severity as string | undefined;
      if (severity === 'high' || severity === 'medium' || severity === 'low') {
        result.bySeverity[severity] += 1;
      }
    }

    return result;
  }

  private async appendSimulationMeta(
    extractionId: string,
    simulationResult: {
      scenario: SimulationScenario;
      summary: unknown;
    },
  ) {
    const extraction = await prisma.extraction.findUnique({
      where: { id: extractionId },
      select: { meta: true },
    });

    const existingMeta = (extraction?.meta ?? {}) as any;
    const simulationsArray = Array.isArray(existingMeta.simulations)
      ? existingMeta.simulations
      : [];

    const updatedMeta = {
      ...existingMeta,
      simulations: [
        ...simulationsArray,
        {
          scenario: simulationResult.scenario,
          summary: simulationResult.summary,
          runAt: new Date().toISOString(),
        },
      ],
    };

    await prisma.extraction.update({
      where: { id: extractionId },
      data: { meta: updatedMeta },
    });
  }

  private computeRetirementGap(
    projectionSummary: {
      totalMonthlyPensionWithDeposits: number | null;
      totalProjectedWithDeposits: number | null;
      currency: string;
    },
    targetMonthlyPension: number,
  ) {
    if (!projectionSummary || !targetMonthlyPension || targetMonthlyPension <= 0) {
      return null;
    }

    const {
      totalMonthlyPensionWithDeposits,
      totalProjectedWithDeposits,
      currency,
    } = projectionSummary;

    let projectedMonthlyPension = totalMonthlyPensionWithDeposits;

    if (
      projectedMonthlyPension == null &&
      totalProjectedWithDeposits != null &&
      totalProjectedWithDeposits > 0
    ) {
      // Conservative approximation as described in PROJECT_CONTEXT.md
      projectedMonthlyPension = totalProjectedWithDeposits / 200;
    }

    if (projectedMonthlyPension == null) {
      return null;
    }

    const gapAmount = targetMonthlyPension - projectedMonthlyPension;
    const gapPercent =
      targetMonthlyPension > 0 ? (gapAmount / targetMonthlyPension) * 100 : null;

    let status: 'SHORTFALL' | 'ON_TRACK' | 'SURPLUS';
    if (projectedMonthlyPension < targetMonthlyPension) {
      status = 'SHORTFALL';
    } else if (projectedMonthlyPension > targetMonthlyPension) {
      status = 'SURPLUS';
    } else {
      status = 'ON_TRACK';
    }

    return {
      targetMonthlyPension,
      projectedMonthlyPension,
      gapAmount,
      gapPercent,
      status,
      currency,
    };
  }
}

