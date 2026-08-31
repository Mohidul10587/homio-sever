import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guards';
import { Roles, CurrentUser } from '../auth/auth.decorators';
import type { AuthUser } from '../auth/auth.types';
import { UserRole } from '@prisma/client';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('doctor')
  @Roles(UserRole.DOCTOR)
  getDoctorDashboard(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getDoctorDashboard(user.sub);
  }

  @Get('admin')
  @Roles(UserRole.ADMIN)
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }
}
