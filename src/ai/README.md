# AI মডিউল ডকুমেন্টেশন

## ওভারভিউ

AI মডিউল (`s/src/ai`) হোমিওপ্যাথিক ক্লিনিক্যাল অ্যানালিসিস সিস্টেমের মূল শক্তি হিসেবে কাজ করে। এটি Google Gemini API ব্যবহার করে একটি **৩-স্টেপ অ্যানালিসিস পাইপলাইন** চালায়, যা ডাক্তারদের রোগীর কেস ডেটার ভিত্তিতে হোমিওপ্যাথিক রেমেডি চিহ্নিত করতে সাহায্য করে।

---

## আর্কিটেকচার

```
s/src/ai/
├── ai-provider.interface.ts   # AI প্রোভাইদের জন্য অ্যাবস্ট্র্যাকশন
├── gemini.provider.ts         # Gemini API ইমপ্লিমেন্টেশন
├── ai.module.ts               # NestJS মডিউল সংযোগ
├── prompt-builder.service.ts  # প্রতিটি স্টেপের জন্য প্রম্পট তৈরি করে
├── output-validator.service.ts # AI JSON রেসপন্স ভ্যালিডেট করে
├── analysis-orchestrator.service.ts # ৩-স্টেপ পাইপলাইন পরিচালনা করে
└── prompts/
    ├── step1.prompt.ts        # লক্ষণ বিশ্লেষণ প্রম্পট
    ├── step2.prompt.ts        # রোগ-থেকে-রেমেডি ম্যাপিং প্রম্পট
    ├── step3.prompt.ts        # রেমেডি নির্বাচন প্রম্পট
    └── followup.prompt.ts     # ফলো-আপ তুলনা প্রম্পট
```

---

## মূল কম্পোনেন্টসমূহ

### ১. AIProvider ইন্টারফেস (`ai-provider.interface.ts`)

যেকোনো AI প্রোভাইডারের জন্য কন্ট্র্যাক্ট সংজ্ঞায়িত করে:

```typescript
export interface AIProvider {
  generateContent(prompt: string): Promise<AIProviderResponse>;
}

export interface AIProviderResponse {
  content: string;
  model?: string;
  tokenUsage?: number;
}
```

### ২. GeminiProvider (`gemini.provider.ts`)

Google Gemini API কল করার জন্য কনক্রিট ইমপ্লিমেন্টেশন।

**কনফিগারেশন:**
- `GEMINI_URL` - Gemini API এন্ডপয়েন্ট
- `GEMINI_API_KEY` - অথেন্টিকেশনের জন্য API কী

**রিকোয়েস্ট ফরম্যাট:**
```json
{
  "contents": [{ "parts": [{ "text": "<prompt>" }] }],
  "generationConfig": {
    "responseMimeType": "application/json",
    "temperature": 0.3,
    "maxOutputTokens": 8192
  }
}
```

**রেসপন্স পার্সিং:**
```typescript
const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
```

### ৩. PromptBuilderService (`prompt-builder.service.ts`)

প্রতিটি অ্যানালিসিস স্টেপের জন্য স্ট্রাকচার্ড প্রম্পট তৈরি করে। সব প্রম্পট বাংলা ভাষায় রেসপন্স দিতে বাধ্য করে।

### ৪. OutputValidatorService (`output-validator.service.ts`)

AI রেসপন্সগুলো ডাটাবেজে সেভ করার আগে Expected JSON স্কিমা ম্যাচ করছে ভ্যালিডেট করে।

- `validateStep1()` - লক্ষণের অ্যারে সঠিক কাঠামোতে আছে কিনা নিশ্চিত করে
- `validateStep2()` - mainDisease স্ট্রিং আছে কিনা এবং remedies অ্যারে আছে কিনা চেক করে
- `validateStep3()` - top3 এর ১-৩ Tem আছে কিনা এবং সব রেমেডি Step 2 এর লিস্ট থেকে আছে কিনা ক্রস-ভ্যালিডেট করে

### ৫. AnalysisOrchestratorService (`analysis-orchestrator.service.ts`)

সম্পূর্ণ অ্যানালিসিস পাইপলাইন পরিচালনা করার মূল সার্ভিস।

---

## ৩-স্টেপ অ্যানালিসিস পাইপলাইন

### স্টেপ ১: লক্ষণ বিশ্লেষণ

**উদ্দেশ্য:** রোগীর কেস ডেটা বিশ্লেষণ করে স্ট্রাকচার্ড লক্ষণ হায়ারার্কি তৈরি করা।

**ইনপুট:** রোগীর কেস ডেটা (প্রধান রোগ, সময়কাল, শুরুর ধরন, বর্ধন, স্বল্পন, মানসিক অবস্থা, তাপীয় অবস্থা, ইত্যাদি)

**প্রম্পট:** `buildStep1Prompt(caseSummary, caseData)`

**AI আউটপুট কাঠামো:**
```json
{
  "importantSymptoms": [
    { "symptom": "...", "category": "important", "priority": 1, "reason": "..." }
  ],
  "uniqueSymptoms": [...],
  "characteristicSymptoms": [...],
  "peculiarSymptoms": [...],
  "symptomPriority": [...]
}
```

**ডাটাবেজ:** `analysisStep1` টেবিলে সেভ হয়।

**প্রম্পটের নিয়মসমূহ:**
- শুধুমাত্র explicitly provided লক্ষণগুলো ব্যবহার করা হবে
- নতুন লক্ষণ invent করা যাবে না
- সব টেক্সট বাংলায় হবে

---

### স্টেপ ২: রোগ-থেকে-রেমেডি ম্যাপিং

**উদ্দেশ্য:** প্রধান রোগের জন্য Top 5 সাধারণ হোমিওপ্যাথিক রেমেডি চিহ্নিত করা।

**ইনপুট:** শুধুমাত্র প্রধান রোগের নাম (Step 1 থেকে)

**প্রম্পট:** `buildStep2Prompt(mainDisease)`

**AI আউটপুট কাঠামো:**
```json
{
  "mainDisease": "...",
  "remedies": [
    { "rank": 1, "name": "...", "reason": "..." },
    { "rank": 2, "name": "...", "reason": "..." },
    { "rank": 3, "name": "...", "reason": "..." },
    { "rank": 4, "name": "...", "reason": "..." },
    { "rank": 5, "name": "...", "reason": "..." }
  ]
}
```

**ডাটাবেজ:** `analysisStep2` টেবিলে সেভ হয়।

**প্রম্পটের নিয়মসমূহ:**
- শুধুমাত্র প্রধান রোগ/চিফ কমপ্লেইন্ট ব্যবহার করা হবে
- রোগীর ব্যক্তিগত লক্ষণগুলো ignore করা হবে
- Pure disease-to-remedy mapping
- ঠিক ৫টি রেমেডি
- রেমেডির নাম standard homeopathic mnemonic (ইংলিশ/ল্যাটিন)
- কারণগুলো বাংলায়

---

### স্টেপ ৩: রেমেডি নির্বাচন

**উদ্দেশ্য:** রোগীর নির্দিষ্ট লক্ষণের ভিত্তিতে Step 2 এর লিস্ট থেকে Top 3 রেমেডি বেছে নেওয়া।

**ইনপুট:**
- Step 1 থেকে characteristikSymptoms
- Step 1 থেকে peculiarSymptoms
- Step 2 থেকে top 5 remedies

**প্রম্পট:** `buildStep3Prompt(characteristicSymptoms, peculiarSymptoms, top5Remedies)`

**AI আউটপুট কাঠামো:**
```json
{
  "top3": [
    { "rank": 1, "remedy": "...", "reason": "..." },
    { "rank": 2, "remedy": "...", "reason": "..." },
    { "rank": 3, "remedy": "...", "reason": "..." }
  ]
}
```

**ডাটাবেজ:** `analysisStep3` টেবিলে সেভ হয়।

**প্রম্পট এবং ভ্যালিডেটরের নিয়মসমূহ:**
- PROVIDED লিস্টের ৫টি রেমেডির মাঝে থেকে স elec only করবে
- নতুন রেমেডি introduce করতে পারবে না
- শুধুমাত্র Step 1 থেকে characteristic এবং peculiar symptoms ব্যবহার করবে
- ভ্যালিডেটর cross-check করে যে সব top3 remedies step2 remedies list এ আছে কিনা

---

## ফলো-আপ অ্যানালিসিস

একটি আলাদা প্রম্পট (`followup.prompt.ts`) ফলো-আপ ভিজিটের জন্য ব্যবহৃত হয়:

**উদ্দেশ্য:** পূর্বের কেস ডেটা বর্তমান ফলো-আপ ডেটার সাথে তুলনা করা।

**ইনপুট:** পূর্বের কেস ডেটা + বর্তমান ফলো-আপ ডেটা

**AI আউটপুট কাঠামো:**
```json
{
  "previousVsCurrent": {
    "improvedSymptoms": [...],
    "worsenedSymptoms": [...],
    "unchangedSymptoms": [...],
    "newSymptoms": [...]
  },
  "overallAssessment": "...",
  "reassessmentSuggested": true/false,
  "reasoning": "..."
}
```

---

## অরকেস্ট্রেশন ফ্লো

```
runAnalysis(visitId, doctorId)
    │
    ├── ১. visit + patient + caseResponse fetch করা
    │
    ├── ২. analysis রেকর্ড তৈরি করা (status: PROCESSING)
    │
    ├── ৩. স্টেপ ১: লক্ষণ বিশ্লেষণ
    │   ├── কেস ডেটা থেকে প্রম্পট তৈরি
    │   ├── Gemini API কল
    │   ├── JSON রেসপন্স পার্স
    │   ├── আউটপুট ভ্যালিডেট
    │   └── analysisStep1 এ সেভ
    │
    ├── ৪. স্টেপ ২: রোগ-থেকে-রেমেডি ম্যাপিং
    │   ├── mainDisease থেকে প্রম্পট তৈরি
    │   ├── Gemini API কল
    │   ├── JSON রেসপন্স পার্স
    │   ├── আউটপুট ভ্যালিডেট
    │   └── analysisStep2 এ সেভ
    │
    ├── ৫. স্টেপ ৩: রেমেডি নির্বাচন
    │   ├── Step1 + Step2 ডেটা থেকে প্রম্পট তৈরি
    │   ├── Gemini API কল
    │   ├── JSON রেসপন্স পার্স
    │   ├── আউটপুট ভ্যালিডেট (Step2 এর সাথে ক্রস-চেক)
    │   └── analysisStep3 এ সেভ
    │
    ├── ৬. analysis আপডেট (status: COMPLETED)
    │
    └── ৭. usage রেকর্ড তৈরি
```

---

## এরর হ্যান্ডলিং

যদি কোনো স্টেপ ফেলে যায়:
1. Analysis স্ট্যাটাস `FAILED` সেট করা হয়
2. প্রসেসিং টাইম রেকর্ড করা হয়
3. এরর ম্যাসেজ `usageRecord` এ সেভ করা হয়
4. এরর caller কে re-throw করা হয়

---

## ভাষার নিয়ম

সব প্রম্পট বাংলা ভাষায় রেসপন্স দিতে বাধ্য করে:
- স্টেপ ১: লক্ষণ এবং কারণগুলো বাংলায়
- স্টেপ ২: কারণগুলো বাংলায় (রেমেডির নাম ইংলিশ/ল্যাটিন এ থাকবে)
- স্টেপ ৩: কারণগুলো বাংলায় (রেমেডির নাম ইংলিশ/ল্যাটিন এ থাকবে)
- ফলো-আপ: সব টেক্সট বাংলায়

---

## মডিউল রেজিস্ট্রেশন

`AIModule` `app.module.ts` এ রেজিস্টার করা আছে:

```typescript
@Module({
  providers: [
    { provide: 'AIProvider', useClass: GeminiProvider },
    PromptBuilderService,
    OutputValidatorService,
    AnalysisOrchestratorService,
    GeminiProvider,
  ],
  exports: ['AIProvider', AnalysisOrchestratorService],
})
export class AIModule {}
```

`AIProvider` NestJS এর `@Inject('AIProvider')` ডেকোরেটর দিয়ে ইনজেক্ট করা হয়, যা প্রয়োজনে প্রোভাইডার swap করার সুবিধা দেয়।
