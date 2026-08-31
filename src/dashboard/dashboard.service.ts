import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDoctorDashboard(doctorId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalPatients,
      todayPatients,
      totalCases,
      recentPatients,
      recentAnalyses,
      followUpsDue,
    ] = await Promise.all([
      this.prisma.patient.count({ where: { doctorId } }),
      this.prisma.patient.count({
        where: { doctorId, createdAt: { gte: todayStart } },
      }),
      this.prisma.patientVisit.count({
        where: { patient: { doctorId }, caseResponse: { isNot: null } },
      }),
      this.prisma.patient.findMany({
        where: { doctorId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.analysis.findMany({
        where: { visit: { patient: { doctorId } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { step1: true, step2: true, step3: true },
      }),
      this.prisma.followUp.findMany({
        where: {
          patient: { doctorId },
          status: 'SCHEDULED',
          scheduledDate: { lte: now },
        },
        take: 5,
        include: { patient: true },
      }),
    ]);

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId: doctorId },
      include: { plan: true },
    });

    return {
      totalPatients,
      todayPatients,
      totalCases,
      followUpsDue: followUpsDue.length,
      recentPatients,
      recentAnalyses,
      followUps: followUpsDue,
      subscription,
    };
  }

  async getAdminDashboard() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalDoctors,
      activeDoctors,
      totalPatients,
      totalCases,
      totalAnalyses,
      successfulAnalyses,
      failedAnalyses,
      dailyUsage,
      monthlyUsage,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'DOCTOR' } }),
      this.prisma.user.count({ where: { role: 'DOCTOR', isActive: true } }),
      this.prisma.patient.count(),
      this.prisma.patientVisit.count({ where: { caseResponse: { isNot: null } } }),
      this.prisma.analysis.count(),
      this.prisma.analysis.count({ where: { status: 'COMPLETED' } }),
      this.prisma.analysis.count({ where: { status: 'FAILED' } }),
      this.prisma.usageRecord.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.usageRecord.count({ where: { createdAt: { gte: monthStart } } }),
    ]);

    return {
      totalDoctors,
      activeDoctors,
      totalPatients,
      totalCases,
      totalAnalyses,
      successfulAnalyses,
      failedAnalyses,
      dailyUsage,
      monthlyUsage,
    };
  }
}
