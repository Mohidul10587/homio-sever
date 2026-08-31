import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [AIModule],
  controllers: [AnalysisController],
})
export class AnalysisModule {}
