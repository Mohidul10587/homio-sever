import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto, UpdatePatientDto } from './dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(doctorId: string, dto: CreatePatientDto) {
    return this.prisma.patient.create({
      data: { ...dto, doctorId },
    });
  }

  async findAll(doctorId: string, page = 1, limit = 20, search?: string) {
    const where: any = { doctorId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { visits: { select: { id: true }, orderBy: { createdAt: 'desc' } } },
      }),
      this.prisma.patient.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(doctorId: string, id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        visits: {
          orderBy: { createdAt: 'desc' },
          include: {
            caseResponse: true,
            analysis: {
              include: { step1: true, step2: true, step3: true },
            },
            followUp: true,
          },
        },
      },
    });
    if (!patient) throw new NotFoundException('Patient not found');
    if (patient.doctorId !== doctorId) throw new ForbiddenException('Access denied');
    return patient;
  }

  async update(doctorId: string, id: string, dto: UpdatePatientDto) {
    const existing = await this.prisma.patient.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Patient not found');
    if (existing.doctorId !== doctorId) throw new ForbiddenException('Access denied');
    return this.prisma.patient.update({ where: { id }, data: dto });
  }

  async delete(doctorId: string, id: string) {
    const existing = await this.prisma.patient.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Patient not found');
    if (existing.doctorId !== doctorId) throw new ForbiddenException('Access denied');
    return this.prisma.patient.delete({ where: { id } });
  }
}
