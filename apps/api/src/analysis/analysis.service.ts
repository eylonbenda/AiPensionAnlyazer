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
  async getDocumentAnalysis(documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

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

    const defaultSimulationScenario: SimulationScenario = {
      globalEmployeeIncreasePercent: 10,
    };

    const simulationResult =
      structured && typeof structured === 'object' && Array.isArray((structured as any).plans)
        ? runSimulation(structured as any, defaultSimulationScenario)
        : null;

    if (extraction && simulationResult) {
      const existingMeta = (extraction.meta ?? {}) as any;
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
        where: { id: extraction.id },
        data: { meta: updatedMeta },
      });
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
      simulation: simulationResult,
      tasks,
    };
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

  async getDocumentExtraction(documentId: string): Promise<ExtractionResponse> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

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
      const severity = flag?.severity;
      if (severity === 'high' || severity === 'medium' || severity === 'low') {
        result.bySeverity[severity] += 1;
      }
    }

    return result;
  }
}

