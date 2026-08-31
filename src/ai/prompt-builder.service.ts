import { Injectable } from '@nestjs/common';
import { buildStep1Prompt } from './prompts/step1.prompt';
import { buildStep2Prompt } from './prompts/step2.prompt';
import { buildStep3Prompt } from './prompts/step3.prompt';

@Injectable()
export class PromptBuilderService {
  buildStep1Prompt(caseSummary: string, caseData: Record<string, any>): string {
    return buildStep1Prompt(caseSummary, caseData);
  }

  buildStep2Prompt(mainDisease: string): string {
    return buildStep2Prompt(mainDisease);
  }

  buildStep3Prompt(
    characteristicSymptoms: any[],
    peculiarSymptoms: any[],
    top5Remedies: any[],
  ): string {
    return buildStep3Prompt(
      characteristicSymptoms,
      peculiarSymptoms,
      top5Remedies,
    );
  }
}
