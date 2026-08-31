import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guards';
import { Roles, CurrentUser } from '../auth/auth.decorators';
import type { AuthUser } from '../auth/auth.types';
import { UserRole } from '@prisma/client';
import { CaseService } from './case.service';
import { CreateCaseDto } from './dto';

@Controller('cases')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DOCTOR)
export class CaseController {
  constructor(private readonly caseService: CaseService) {}

  @Post(':visitId')
  createCase(
    @CurrentUser() user: AuthUser,
    @Param('visitId') visitId: string,
    @Body() dto: CreateCaseDto,
  ) {
    return this.caseService.createCase(user.sub, visitId, dto);
  }

  @Get(':visitId')
  getCase(@CurrentUser() user: AuthUser, @Param('visitId') visitId: string) {
    return this.caseService.getCase(user.sub, visitId);
  }
}
