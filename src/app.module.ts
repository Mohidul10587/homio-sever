import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { PatientsModule } from './patients/patients.module';
import { VisitsModule } from './visits/visits.module';
import { CaseModule } from './case/case.module';
import { AIModule } from './ai/ai.module';
import { AnalysisModule } from './analysis/analysis.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FollowUpModule } from './followup/followup.module';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AuditModule,
    PatientsModule,
    VisitsModule,
    CaseModule,
    AIModule,
    AnalysisModule,
    DashboardModule,
    FollowUpModule,
    AdminModule,
  ],
})
export class AppModule {}
