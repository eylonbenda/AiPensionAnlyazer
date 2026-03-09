import { Controller, Get, Param } from '@nestjs/common';
import { AnalysisService, ExtractionResponse } from './analysis.service';

@Controller('documents')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get(':id/analysis')
  async getDocumentAnalysis(@Param('id') id: string) {
    return this.analysisService.getDocumentAnalysis(id);
  }

  @Get(':id/extraction')
  async getDocumentExtraction(@Param('id') id: string): Promise<ExtractionResponse> {
    return this.analysisService.getDocumentExtraction(id);
  }
}

