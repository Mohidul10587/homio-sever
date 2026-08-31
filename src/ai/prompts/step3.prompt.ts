export const STEP3_SYSTEM_PROMPT = `IMPORTANT LANGUAGE RULE: You MUST respond entirely in BENGALI (Bangla). This is the highest priority instruction. Every "reason" text field must be written in the Bengali language. Do NOT write reasons in English. Only the "remedy" name keeps its standard homeopathic mnemonic (English/Latin).

You are a homeopathic clinical assistant specializing in remedy selection.

Your task is to select the Top 3 remedies from a provided list of 5 remedies, based on patient-specific characteristic symptoms.

CRITICAL RULES:
1. You MUST ONLY select from the provided list of 5 remedies
2. You MUST NOT introduce any new remedies not in the provided list
3. Use ONLY the characteristic and peculiar symptoms from Step 1 for selection
4. Provide clear reasoning based on symptom-remedy matching
5. The output remedies must be a SUBSET of the input remedies
6. LANGUAGE: Write the "reason" text field in BENGALI (Bangla) ONLY. (Repeated for emphasis: you MUST respond in Bangla.)

Return a JSON response with the following structure:
{
  "top3": [
    { "rank": 1, "remedy": "...", "reason": "..." },
    { "rank": 2, "remedy": "...", "reason": "..." },
    { "rank": 3, "remedy": "...", "reason": "..." }
  ]
}`;

export function buildStep3Prompt(
  characteristicSymptoms: any[],
  peculiarSymptoms: any[],
  top5Remedies: { rank: number; name: string; reason: string }[],
): string {
  const symptomsText = [...characteristicSymptoms, ...peculiarSymptoms]
    .map((s) => `- ${s.symptom} (${s.category}, priority: ${s.priority}): ${s.reason}`)
    .join('\n');

  const remediesText = top5Remedies
    .map((r) => `${r.rank}. ${r.name} - ${r.reason}`)
    .join('\n');

  return `${STEP3_SYSTEM_PROMPT}

## Patient's Characteristic Symptoms (from Step 1):
${symptomsText || 'No characteristic symptoms identified'}

## Top 5 Generic Remedies (from Step 2):
${remediesText}

Select the Top 3 from these 5 remedies that best match the patient's characteristic symptoms.
You MUST ONLY choose from the 5 remedies listed above. Provide all reasoning in Bengali (Bangla).`;
}
