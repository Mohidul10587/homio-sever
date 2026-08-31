import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guards';
import { Roles, CurrentUser } from '../auth/auth.decorators';
import type { AuthUser } from '../auth/auth.types';
import { UserRole } from '@prisma/client';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto';

@Controller('visits')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DOCTOR)
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post(':patientId')
  createVisit(
    @CurrentUser() user: AuthUser,
    @Param('patientId') patientId: string,
    @Body() dto: CreateVisitDto,
  ) {
    return this.visitsService.createVisit(user.sub, patientId, dto.notes);
  }

  @Get(':id')
  getVisit(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.visitsService.getVisit(user.sub, id);
  }

  @Get('patient/:patientId')
  getVisitsByPatient(
    @CurrentUser() user: AuthUser,
    @Param('patientId') patientId: string,
  ) {
    return this.visitsService.getVisitsByPatient(user.sub, patientId);
  }
}
