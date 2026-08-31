import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guards';
import { Roles, CurrentUser } from '../auth/auth.decorators';
import type { AuthUser } from '../auth/auth.types';
import { UserRole } from '@prisma/client';
import { AnalysisOrchestratorService } from '../ai/analysis-orchestrator.service';
import { IsOptional, IsString } from 'class-validator';

class DecisionDto {
  @IsOptional()
  @IsString()
  selectedRemedy?: string;

  @IsOptional()
  @IsString()
  prescriptionNotes?: string;

  @IsOptional()
  @IsString()
  doctorNotes?: string;
}

@Controller('analysis')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DOCTOR)
export class AnalysisController {
  constructor(private readonly orchestrator: AnalysisOrchestratorService) {}

  @Post('run/:visitId')
  runAnalysis(@CurrentUser() user: AuthUser, @Param('visitId') visitId: string) {
    return this.orchestrator.runAnalysis(visitId, user.sub);
  }

  @Get('visit/:visitId')
  getAnalysisByVisit(@CurrentUser() user: AuthUser, @Param('visitId') visitId: string) {
    return this.orchestrator.getAnalysisByVisit(visitId, user.sub);
  }

  @Post(':id/decision')
  saveDecision(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: DecisionDto,
  ) {
    return this.orchestrator.saveDoctorDecision(id, user.sub, dto);
  }

  @Get(':id')
  getAnalysis(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.orchestrator.getAnalysisResult(id, user.sub);
  }
}
