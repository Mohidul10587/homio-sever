import {
  Injectable,
  Logger,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import type { AIProvider } from './ai-provider.interface';
import { Prisma } from '@prisma/client';
import { PromptBuilderService } from './prompt-builder.service';
import { OutputValidatorService } from './output-validator.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalysisOrchestratorService {
  private readonly logger = new Logger(AnalysisOrchestratorService.name);

  constructor(
    @Inject('AIProvider')
    private readonly aiProvider: AIProvider,
    private readonly promptBuilder: PromptBuilderService,
    private readonly validator: OutputValidatorService,
    private readonly prisma: PrismaService,
  ) {}

  async runAnalysis(visitId: string, doctorId: string) {
    const visit = await this.prisma.patientVisit.findUnique({
      where: { id: visitId },
      include: { patient: true, caseResponse: true },
    });
    if (!visit) {
      throw new NotFoundException('Visit not found');
    }
    if (visit.patient.doctorId !== doctorId) {
      throw new ForbiddenException('Visit not found or access denied');
    }
    if (!visit.caseResponse) {
      throw new BadRequestException('No case data for this visit');
    }

    const analysis = await this.prisma.analysis.create({
      data: {
        visitId,
        status: 'PROCESSING',
        aiProvider: 'gemini',
        modelUsed: 'gemini-2.5-flash',
        caseSummary: this.buildCaseSummary(visit.caseResponse),
      },
    });

    const startTime = Date.now();

    try {
      const caseData = visit.caseResponse as any;
      const caseSummary = analysis.caseSummary || '';

      this.logger.log(`Starting Step 1 for visit ${visitId}`);
      const step1Result = await this.runStep1(analysis.id, caseSummary, caseData);
      this.logger.log(`Step 1 completed for visit ${visitId}`);

      this.logger.log(`Starting Step 2 for visit ${visitId}`);
      const step2Result = await this.runStep2(analysis.id, caseData.mainDisease);
      this.logger.log(`Step 2 completed for visit ${visitId}`);

      this.logger.log(`Starting Step 3 for visit ${visitId}`);
      const step3Result = await this.runStep3(
        analysis.id,
        step1Result,
        step2Result,
      );
      this.logger.log(`Step 3 completed for visit ${visitId}`);

      const processingTime = Date.now() - startTime;

      await this.prisma.analysis.update({
        where: { id: analysis.id },
        data: {
          status: 'COMPLETED',
          processingTime,
        },
      });

      await this.prisma.usageRecord.create({
        data: {
          doctorId,
          patientId: visit.patientId,
          visitId,
          analysisId: analysis.id,
          aiProvider: 'gemini',
          modelUsed: 'gemini-2.5-flash',
          processingTime,
          status: 'COMPLETED',
        },
      });

      return this.getAnalysisResult(analysis.id);
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.prisma.analysis.update({
        where: { id: analysis.id },
        data: {
          status: 'FAILED',
          processingTime,
        },
      });

      await this.prisma.usageRecord.create({
        data: {
          doctorId,
          patientId: visit.patientId,
          visitId,
          analysisId: analysis.id,
          aiProvider: 'gemini',
          modelUsed: 'gemini-2.5-flash',
          processingTime,
          status: 'FAILED',
          error: errorMessage,
        },
      });

      throw error;
    }
  }

  private async runStep1(analysisId: string, caseSummary: string, caseData: Record<string, any>) {
    const prompt = this.promptBuilder.buildStep1Prompt(caseSummary, caseData);
    const response = await this.aiProvider.generateContent(prompt);

    let parsed: unknown;
    try {
      parsed = JSON.parse(response.content);
    } catch {
      throw new Error('Failed to parse Step 1 AI response as JSON');
    }

    const validated = this.validator.validateStep1(parsed);

    await this.prisma.analysisStep1.create({
      data: {
        analysisId,
        importantSymptoms: validated.importantSymptoms as unknown as Prisma.InputJsonValue,
        uniqueSymptoms: validated.uniqueSymptoms as unknown as Prisma.InputJsonValue,
        characteristicSymptoms: validated.characteristicSymptoms as unknown as Prisma.InputJsonValue,
        peculiarSymptoms: validated.peculiarSymptoms as unknown as Prisma.InputJsonValue,
        symptomPriority: validated.symptomPriority as unknown as Prisma.InputJsonValue,
        rawAiResponse: response.content,
      },
    });

    return validated;
  }

  private async runStep2(analysisId: string, mainDisease: string) {
    const prompt = this.promptBuilder.buildStep2Prompt(mainDisease);
    const response = await this.aiProvider.generateContent(prompt);

    let parsed: unknown;
    try {
      parsed = JSON.parse(response.content);
    } catch {
      throw new Error('Failed to parse Step 2 AI response as JSON');
    }

    const validated = this.validator.validateStep2(parsed);

    await this.prisma.analysisStep2.create({
      data: {
        analysisId,
        mainDisease: validated.mainDisease,
        remedies: validated.remedies as unknown as Prisma.InputJsonValue,
        rawAiResponse: response.content,
      },
    });

    return validated;
  }

  private async runStep3(analysisId: string, step1: any, step2: any) {
    const step2RemedyNames = step2.remedies.map((r: any) => r.name);

    const prompt = this.promptBuilder.buildStep3Prompt(
      step1.characteristicSymptoms,
      step1.peculiarSymptoms,
      step2.remedies,
    );
    const response = await this.aiProvider.generateContent(prompt);

    let parsed: unknown;
    try {
      parsed = JSON.parse(response.content);
    } catch {
      throw new Error('Failed to parse Step 3 AI response as JSON');
    }

    const validated = this.validator.validateStep3(parsed, step2RemedyNames);

    await this.prisma.analysisStep3.create({
      data: {
        analysisId,
        top3: validated.top3 as unknown as Prisma.InputJsonValue,
        rawAiResponse: response.content,
      },
    });

    return validated;
  }

  private buildCaseSummary(caseData: any): string {
    const parts: string[] = [];
    if (caseData.mainDisease) {
      parts.push(`রোগীর প্রধান সমস্যা: ${caseData.mainDisease}`);
    }
    if (caseData.duration) {
      parts.push(`সময়কাল: ${caseData.duration}`);
    }
    if (caseData.onset) {
      parts.push(`শুরুর ধরন: ${caseData.onset}`);
    }
    if (caseData.aggravation?.length > 0) {
      parts.push(`যেসব বিষয়ে লক্ষণ বেড়ে যায়: ${caseData.aggravation.join(', ')}`);
    }
    if (caseData.amelioration?.length > 0) {
      parts.push(`যেসব বিষয়ে লক্ষণ কমে যায়: ${caseData.amelioration.join(', ')}`);
    }
    if (caseData.mentalState?.length > 0) {
      parts.push(`মানসিক অবস্থা: ${caseData.mentalState.join(', ')}`);
    }
    if (caseData.thermalState) {
      parts.push(`তাপীয় অবস্থা: ${caseData.thermalState}`);
    }
    if (caseData.additionalSymptoms) {
      parts.push(`অন্যান্য লক্ষণ: ${caseData.additionalSymptoms}`);
    }
    return parts.join('। ') + '।';
  }

  async getAnalysisResult(analysisId: string, doctorId?: string) {
    const result = await this.prisma.analysis.findUnique({
      where: { id: analysisId },
      include: { step1: true, step2: true, step3: true, visit: { include: { patient: true } } },
    });
    if (!result) throw new NotFoundException('Analysis not found');
    if (doctorId && result.visit?.patient.doctorId !== doctorId) {
      throw new ForbiddenException('Access denied');
    }
    return result;
  }

  async getAnalysisByVisit(visitId: string, doctorId?: string) {
    const result = await this.prisma.analysis.findUnique({
      where: { visitId },
      include: { step1: true, step2: true, step3: true, visit: { include: { patient: true } } },
    });
    if (!result) throw new NotFoundException('Analysis not found');
    if (doctorId && result.visit?.patient.doctorId !== doctorId) {
      throw new ForbiddenException('Access denied');
    }
    return result;
  }

  async saveDoctorDecision(
    analysisId: string,
    doctorId: string,
    decision: { selectedRemedy?: string; prescriptionNotes?: string; doctorNotes?: string },
  ) {
    const analysis = await this.getAnalysisResult(analysisId, doctorId);

    return this.prisma.analysis.update({
      where: { id: analysisId },
      data: {
        doctorDecision: decision.selectedRemedy,
        prescriptionNotes: decision.prescriptionNotes,
        doctorNotes: decision.doctorNotes,
      },
    });
  }
}
