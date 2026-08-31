export interface AIProviderResponse {
  content: string;
  model?: string;
  tokenUsage?: number;
}

export interface AIProvider {
  generateContent(prompt: string): Promise<AIProviderResponse>;
}
