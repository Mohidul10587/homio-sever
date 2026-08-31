import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guards';
import { Roles, CurrentUser } from '../auth/auth.decorators';
import type { AuthUser } from '../auth/auth.types';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('doctors')
  getDoctors(@Query() dto: PaginationDto) {
    return this.adminService.getDoctors(dto);
  }

  @Patch('doctors/:id/toggle-status')
  toggleDoctorStatus(@Param('id') id: string) {
    return this.adminService.toggleDoctorStatus(id);
  }

  @Get('doctors/:id')
  getDoctorDetails(@Param('id') id: string) {
    return this.adminService.getDoctorDetails(id);
  }

  @Get('analytics')
  getAnalytics() {
    return this.adminService.getAnalytics();
  }
}
