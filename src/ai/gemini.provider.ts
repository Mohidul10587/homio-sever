import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider, AIProviderResponse } from './ai-provider.interface';

@Injectable()
export class GeminiProvider implements AIProvider {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiUrl = this.config.getOrThrow<string>('GEMINI_URL');
    this.apiKey = this.config.getOrThrow<string>('GEMINI_API_KEY');
  }

  async generateContent(prompt: string): Promise<AIProviderResponse> {
    const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error('No content in Gemini response');

    return {
      content,
      model: data.modelVersion || 'gemini-2.5-flash',
      tokenUsage: data.usageMetadata?.totalTokenCount,
    };
  }
}
