import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFollowUpDto } from './dto';

@Injectable()
export class FollowUpService {
  constructor(private readonly prisma: PrismaService) {}

  async createFollowUp(doctorId: string, patientId: string, dto: CreateFollowUpDto) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Patient not found');
    if (patient.doctorId !== doctorId) throw new ForbiddenException('Access denied');

    return this.prisma.followUp.create({
      data: {
        patientId,
        ...dto,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
      },
    });
  }

  async getFollowUp(doctorId: string, id: string) {
    const followUp = await this.prisma.followUp.findUnique({
      where: { id },
      include: { patient: true, visit: true },
    });
    if (!followUp) throw new NotFoundException('Follow-up not found');
    if (followUp.patient.doctorId !== doctorId) throw new ForbiddenException('Access denied');
    return followUp;
  }

  async getFollowUpsByPatient(doctorId: string, patientId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Patient not found');
    if (patient.doctorId !== doctorId) throw new ForbiddenException('Access denied');

    return this.prisma.followUp.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateFollowUp(doctorId: string, id: string, dto: Partial<CreateFollowUpDto>) {
    const existing = await this.prisma.followUp.findUnique({
      where: { id },
      include: { patient: true },
    });
    if (!existing) throw new NotFoundException('Follow-up not found');
    if (existing.patient.doctorId !== doctorId) throw new ForbiddenException('Access denied');

    return this.prisma.followUp.update({
      where: { id },
      data: {
        ...dto,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
      },
    });
  }
}
