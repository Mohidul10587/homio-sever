import { Injectable, BadRequestException } from '@nestjs/common';

interface SymptomItem {
  symptom: string;
  category: string;
  priority: number;
  reason: string;
}

interface Step1Output {
  importantSymptoms: SymptomItem[];
  uniqueSymptoms: SymptomItem[];
  characteristicSymptoms: SymptomItem[];
  peculiarSymptoms: SymptomItem[];
  symptomPriority: SymptomItem[];
}

interface RemedyItem {
  rank: number;
  name: string;
  reason: string;
}

interface Step2Output {
  mainDisease: string;
  remedies: RemedyItem[];
}

interface Top3Item {
  rank: number;
  remedy: string;
  reason: string;
}

interface Step3Output {
  top3: Top3Item[];
}

@Injectable()
export class OutputValidatorService {
  validateStep1(data: unknown): Step1Output {
    const output = data as Step1Output;
    if (!output || typeof output !== 'object') {
      throw new BadRequestException('Invalid Step 1 output: not an object');
    }
    if (!Array.isArray(output.importantSymptoms)) {
      throw new BadRequestException('Invalid Step 1 output: importantSymptoms must be an array');
    }
    if (!Array.isArray(output.uniqueSymptoms)) {
      throw new BadRequestException('Invalid Step 1 output: uniqueSymptoms must be an array');
    }
    if (!Array.isArray(output.characteristicSymptoms)) {
      throw new BadRequestException('Invalid Step 1 output: characteristicSymptoms must be an array');
    }
    if (!Array.isArray(output.peculiarSymptoms)) {
      throw new BadRequestException('Invalid Step 1 output: peculiarSymptoms must be an array');
    }
    if (!Array.isArray(output.symptomPriority)) {
      throw new BadRequestException('Invalid Step 1 output: symptomPriority must be an array');
    }
    return output;
  }

  validateStep2(data: unknown): Step2Output {
    const output = data as Step2Output;
    if (!output || typeof output !== 'object') {
      throw new BadRequestException('Invalid Step 2 output: not an object');
    }
    if (!output.mainDisease || typeof output.mainDisease !== 'string') {
      throw new BadRequestException('Invalid Step 2 output: mainDisease required');
    }
    if (!Array.isArray(output.remedies)) {
      throw new BadRequestException('Invalid Step 2 output: remedies must be an array');
    }
    if (output.remedies.length === 0) {
      throw new BadRequestException('Invalid Step 2 output: at least 1 remedy required');
    }
    output.remedies.forEach((r: RemedyItem, i: number) => {
      if (!r.name || typeof r.name !== 'string') {
        throw new BadRequestException(`Invalid Step 2 output: remedy[${i}] name required`);
      }
    });
    return output;
  }

  validateStep3(data: unknown, step2Remedies: string[]): Step3Output {
    const output = data as Step3Output;
    if (!output || typeof output !== 'object') {
      throw new BadRequestException('Invalid Step 3 output: not an object');
    }
    if (!Array.isArray(output.top3)) {
      throw new BadRequestException('Invalid Step 3 output: top3 must be an array');
    }
    if (output.top3.length === 0 || output.top3.length > 3) {
      throw new BadRequestException('Invalid Step 3 output: top3 must have 1-3 items');
    }

    const step2Set = new Set(step2Remedies.map((r) => r.toLowerCase()));
    output.top3.forEach((item: Top3Item, i: number) => {
      if (!item.remedy || typeof item.remedy !== 'string') {
        throw new BadRequestException(`Invalid Step 3 output: top3[${i}] remedy required`);
      }
      if (!step2Set.has(item.remedy.toLowerCase())) {
        throw new BadRequestException(
          `REJECT AI OUTPUT: Step 3 remedy "${item.remedy}" is not in Step 2 Top 5. ` +
          `Allowed remedies: ${step2Remedies.join(', ')}`,
        );
      }
    });

    return output;
  }
}
