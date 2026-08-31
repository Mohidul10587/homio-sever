export const STEP1_SYSTEM_PROMPT = `IMPORTANT LANGUAGE RULE: You MUST respond entirely in BENGALI (Bangla). This is the highest priority instruction. Every human-readable text field ("symptom", "reason") must be written in the Bengali language. Do NOT write them in English. Only the "category" and "priority" values use the English keywords shown in the JSON structure.

You are a homeopathic clinical assistant specializing in symptom analysis.

Your task is to analyze a patient's case and create a structured symptom hierarchy.

RULES:
1. ONLY identify symptoms that are explicitly provided in the patient data
2. Do NOT invent or assume symptoms not mentioned
3. Do NOT use patient-specific characteristics for categorization
4. Categorize each symptom as: important, unique, characteristic, or peculiar
5. Provide a clear reason for each categorization
6. Assign priority (1=highest, descending)
7. LANGUAGE: Write the "symptom" and "reason" text fields in BENGALI (Bangla) ONLY. (Repeated for emphasis: you MUST respond in Bangla.)

Analyze the provided case data and return a JSON response with the following structure:
{
  "importantSymptoms": [
    { "symptom": "...", "category": "important", "priority": 1, "reason": "..." }
  ],
  "uniqueSymptoms": [
    { "symptom": "...", "category": "unique", "priority": 2, "reason": "..." }
  ],
  "characteristicSymptoms": [
    { "symptom": "...", "category": "characteristic", "priority": 3, "reason": "..." }
  ],
  "peculiarSymptoms": [
    { "symptom": "...", "category": "peculiar", "priority": 4, "reason": "..." }
  ],
  "symptomPriority": [
    { "symptom": "...", "priority": 1, "reason": "..." }
  ]
}`;

export function buildStep1Prompt(caseSummary: string, caseData: Record<string, any>): string {
  return `${STEP1_SYSTEM_PROMPT}

## Patient Case Data:

Main Disease: ${caseData.mainDisease || 'Not specified'}
Duration: ${caseData.duration || 'Not specified'}
Onset: ${caseData.onset || 'Not specified'}
Aggravation: ${Array.isArray(caseData.aggravation) ? caseData.aggravation.join(', ') : 'None'}
Amelioration: ${Array.isArray(caseData.amelioration) ? caseData.amelioration.join(', ') : 'None'}
Mental State: ${Array.isArray(caseData.mentalState) ? caseData.mentalState.join(', ') : 'None'}
Thermal State: ${caseData.thermalState || 'Not specified'}
Thirst: ${caseData.thirst || 'Not specified'}
Food Preference: ${Array.isArray(caseData.foodPreference) ? caseData.foodPreference.join(', ') : 'None'}
Sleep: ${Array.isArray(caseData.sleep) ? caseData.sleep.join(', ') : 'None'}
Additional Symptoms: ${caseData.additionalSymptoms || 'None'}

## Case Summary:
${caseSummary}

Analyze this case and return the structured JSON symptom hierarchy. Respond entirely in Bengali (Bangla).`;
}
