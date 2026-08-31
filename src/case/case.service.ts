import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCaseDto } from './dto';

@Injectable()
export class CaseService {
  constructor(private readonly prisma: PrismaService) {}

  async createCase(doctorId: string, visitId: string, dto: CreateCaseDto) {
    const visit = await this.prisma.patientVisit.findUnique({
      where: { id: visitId },
      include: { patient: true, caseResponse: true },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    if (visit.patient.doctorId !== doctorId) throw new ForbiddenException('Access denied');
    if (visit.caseResponse) throw new BadRequestException('Case already exists for this visit');
    return this.prisma.caseResponse.create({
      data: {
        visitId,
        mainDisease: dto.mainDisease,
        duration: dto.duration,
        onset: dto.onset,
        aggravation: dto.aggravation,
        amelioration: dto.amelioration,
        mentalState: dto.mentalState,
        thermalState: dto.thermalState,
        thirst: dto.thirst,
        foodPreference: dto.foodPreference,
        sleep: dto.sleep,
        additionalSymptoms: dto.additionalSymptoms,
        rawFormData: dto.rawFormData,
      },
    });
  }

  async getCase(doctorId: string, visitId: string) {
    const visit = await this.prisma.patientVisit.findUnique({
      where: { id: visitId },
      include: { patient: true },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    if (visit.patient.doctorId !== doctorId) throw new ForbiddenException('Access denied');

    const caseResponse = await this.prisma.caseResponse.findUnique({
      where: { visitId },
    });
    if (!caseResponse) throw new NotFoundException('Case not found');
    return caseResponse;
  }

  generateCaseSummary(caseData: CreateCaseDto): string {
    const parts: string[] = [];
    if (caseData.mainDisease) {
      parts.push(`Patient presents with ${caseData.mainDisease.toLowerCase()}`);
    }
    if (caseData.duration) {
      parts.push(`for ${caseData.duration.toLowerCase()}`);
    }
    if (caseData.onset) {
      parts.push(`with ${caseData.onset.toLowerCase()} onset`);
    }
    if (caseData.aggravation.length > 0) {
      parts.push(`symptoms worsen from ${caseData.aggravation.join(', ').toLowerCase()}`);
    }
    if (caseData.amelioration.length > 0) {
      parts.push(`symptoms improve with ${caseData.amelioration.join(', ').toLowerCase()}`);
    }
    return parts.join('. ') + '.';
  }
}
