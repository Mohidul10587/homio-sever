import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guards';
import { Roles, CurrentUser } from '../auth/auth.decorators';
import type { AuthUser } from '../auth/auth.types';
import { UserRole } from '@prisma/client';
import { FollowUpService } from './followup.service';
import { CreateFollowUpDto } from './dto';

@Controller('followups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DOCTOR)
export class FollowUpController {
  constructor(private readonly followUpService: FollowUpService) {}

  @Post('patient/:patientId')
  createFollowUp(
    @CurrentUser() user: AuthUser,
    @Param('patientId') patientId: string,
    @Body() dto: CreateFollowUpDto,
  ) {
    return this.followUpService.createFollowUp(user.sub, patientId, dto);
  }

  @Get(':id')
  getFollowUp(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.followUpService.getFollowUp(user.sub, id);
  }

  @Get('patient/:patientId')
  getFollowUpsByPatient(
    @CurrentUser() user: AuthUser,
    @Param('patientId') patientId: string,
  ) {
    return this.followUpService.getFollowUpsByPatient(user.sub, patientId);
  }

  @Put(':id')
  updateFollowUp(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateFollowUpDto,
  ) {
    return this.followUpService.updateFollowUp(user.sub, id, dto);
  }
}
