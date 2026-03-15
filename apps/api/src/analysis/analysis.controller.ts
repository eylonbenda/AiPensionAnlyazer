import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AnalysisService, ExtractionResponse } from './analysis.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@pension-analyzer/domain';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get(':id/analysis')
  async getDocumentAnalysis(
    @Param('id') id: string,
    @CurrentUser() user: Pick<User, 'id' | 'email' | 'name' | 'createdAt' | 'updatedAt'>,
    @Query('targetMonthlyPension') targetMonthlyPensionRaw?: string,
  ) {
    const targetMonthlyPension =
      typeof targetMonthlyPensionRaw === 'string' &&
      targetMonthlyPensionRaw.trim().length > 0
        ? Number(targetMonthlyPensionRaw)
        : null;

    const safeTarget =
      typeof targetMonthlyPension === 'number' &&
      Number.isFinite(targetMonthlyPension) &&
      targetMonthlyPension > 0
        ? targetMonthlyPension
        : null;

    return this.analysisService.getDocumentAnalysis(id, user.id, safeTarget);
  }

  @Get(':id/extraction')
  async getDocumentExtraction(
    @Param('id') id: string,
    @CurrentUser() user: Pick<User, 'id' | 'email' | 'name' | 'createdAt' | 'updatedAt'>,
  ): Promise<ExtractionResponse> {
    return this.analysisService.getDocumentExtraction(id, user.id);
  }

  @Post(':id/simulations')
  async runSimulationForDocument(
    @Param('id') id: string,
    @CurrentUser() user: Pick<User, 'id' | 'email' | 'name' | 'createdAt' | 'updatedAt'>,
    @Body() scenario: any,
  ) {
    return this.analysisService.runCustomSimulation(id, user.id, scenario);
  }

  @Get(':id/plan')
  async getDocumentPlan(
    @Param('id') id: string,
    @CurrentUser() user: Pick<User, 'id' | 'email' | 'name' | 'createdAt' | 'updatedAt'>,
    @Query('targetMonthlyPension') targetMonthlyPensionRaw?: string,
  ) {
    const targetMonthlyPension =
      typeof targetMonthlyPensionRaw === 'string' &&
      targetMonthlyPensionRaw.trim().length > 0
        ? Number(targetMonthlyPensionRaw)
        : null;

    const safeTarget =
      typeof targetMonthlyPension === 'number' &&
      Number.isFinite(targetMonthlyPension) &&
      targetMonthlyPension > 0
        ? targetMonthlyPension
        : null;

    const analysis = await this.analysisService.getDocumentAnalysis(
      id,
      user.id,
      safeTarget,
    );

    return {
      documentId: analysis.documentId,
      job: analysis.job,
      summary: analysis.summary,
      projection: analysis.projection,
      retirementGap: (analysis as any).retirementGap ?? null,
      redFlags: analysis.redFlags,
      projectionGaps: analysis.projectionGaps,
      tasks: analysis.tasks,
    };
  }
}

