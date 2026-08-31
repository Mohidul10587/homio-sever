import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDoctors(dto: PaginationDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const where: any = {};
    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { phone: { contains: dto.search, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: 'DOCTOR', ...where },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          subscription: { include: { plan: true } },
          _count: { select: { patients: true } },
        },
      }),
      this.prisma.user.count({ where: { role: 'DOCTOR', ...where } }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async toggleDoctorStatus(doctorId: string) {
    const doctor = await this.prisma.user.findUnique({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return this.prisma.user.update({
      where: { id: doctorId },
      data: { isActive: !doctor.isActive },
    });
  }

  async getDoctorDetails(doctorId: string) {
    const doctor = await this.prisma.user.findUnique({
      where: { id: doctorId },
      include: {
        doctorProfile: true,
        subscription: { include: { plan: true } },
        _count: { select: { patients: true, usageRecords: true, auditLogs: true } },
      },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    const { passwordHash, ...safeDoctor } = doctor;
    return safeDoctor;
  }

  async getAnalytics() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalAnalyses, successfulAnalyses, failedAnalyses, avgProcessingTime, recentErrors] =
      await Promise.all([
        this.prisma.analysis.count({ where: { createdAt: { gte: monthStart } } }),
        this.prisma.analysis.count({ where: { status: 'COMPLETED', createdAt: { gte: monthStart } } }),
        this.prisma.analysis.count({ where: { status: 'FAILED', createdAt: { gte: monthStart } } }),
        this.prisma.analysis.aggregate({
          where: { status: 'COMPLETED', createdAt: { gte: monthStart } },
          _avg: { processingTime: true },
        }),
        this.prisma.usageRecord.findMany({
          where: { status: 'FAILED' },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

    return {
      totalAnalyses,
      successfulAnalyses,
      failedAnalyses,
      averageProcessingTime: avgProcessingTime._avg.processingTime || 0,
      recentErrors,
    };
  }
}
