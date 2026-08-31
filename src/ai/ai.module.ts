import { Module } from '@nestjs/common';
import { GeminiProvider } from './gemini.provider';
import { PromptBuilderService } from './prompt-builder.service';
import { OutputValidatorService } from './output-validator.service';
import { AnalysisOrchestratorService } from './analysis-orchestrator.service';

const AIProviderFactory = {
  provide: 'AIProvider',
  useClass: GeminiProvider,
};

@Module({
  providers: [
    AIProviderFactory,
    PromptBuilderService,
    OutputValidatorService,
    AnalysisOrchestratorService,
    GeminiProvider,
  ],
  exports: ['AIProvider', AnalysisOrchestratorService],
})
export class AIModule {}
