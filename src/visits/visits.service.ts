import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VisitsService {
  constructor(private readonly prisma: PrismaService) {}

  async createVisit(doctorId: string, patientId: string, notes?: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Patient not found');
    if (patient.doctorId !== doctorId) throw new ForbiddenException('Access denied');

    const lastVisit = await this.prisma.patientVisit.findFirst({
      where: { patientId },
      orderBy: { visitNumber: 'desc' },
    });

    return this.prisma.patientVisit.create({
      data: {
        patientId,
        visitNumber: (lastVisit?.visitNumber ?? 0) + 1,
        notes,
      },
    });
  }

  async getVisit(doctorId: string, visitId: string) {
    const visit = await this.prisma.patientVisit.findUnique({
      where: { id: visitId },
      include: {
        patient: true,
        caseResponse: true,
        analysis: {
          include: { step1: true, step2: true, step3: true },
        },
        followUp: true,
      },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    if (visit.patient.doctorId !== doctorId) throw new ForbiddenException('Access denied');
    return visit;
  }

  async getVisitsByPatient(doctorId: string, patientId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Patient not found');
    if (patient.doctorId !== doctorId) throw new ForbiddenException('Access denied');

    return this.prisma.patientVisit.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        caseResponse: true,
        analysis: {
          select: { id: true, status: true, createdAt: true },
        },
      },
    });
  }
}
