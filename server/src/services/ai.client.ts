import Anthropic from '@anthropic-ai/sdk';
import { env } from '../utils/env';
import {
  AI_MAX_TOKENS_PARSER,
  AI_MAX_TOKENS_SEO,
  AI_TEMPERATURE_PARSER,
  AI_TEMPERATURE_SEO,
} from '../constants/ai.constants';

export type AiMode = 'AI' | 'MOCK' | 'OFF';

const client = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;

export function getAiStatus() {
  const mode = resolveAiMode();
  return {
    configured: mode !== 'OFF',
    mode,
    model: env.ANTHROPIC_MODEL,
    features: ['import-seo', 'listing-parser'],
  };
}

export function resolveAiMode(): AiMode {
  if (client) return 'AI';
  if (env.AI_MOCK) return 'MOCK';
  return 'OFF';
}

export function isAiEnabled(): boolean {
  return resolveAiMode() !== 'OFF';
}

interface CompleteOptions {
  maxTokens?: number;
  temperature?: number;
}

export async function completeText(prompt: string, options: CompleteOptions = {}): Promise<{ text: string; mode: AiMode }> {
  const mode = resolveAiMode();
  if (mode === 'OFF') throw new Error('AI nie jest skonfigurowane');

  if (mode === 'MOCK') {
    // MOCK MODE — wymaga ANTHROPIC_API_KEY lub AI_MOCK=true
    return { text: '', mode: 'MOCK' };
  }

  const completion = await client!.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: options.maxTokens ?? AI_MAX_TOKENS_SEO,
    temperature: options.temperature ?? AI_TEMPERATURE_SEO,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = completion.content.find((part) => part.type === 'text')?.text ?? '';
  return { text, mode: 'AI' };
}

export async function completeSeoPrompt(prompt: string): Promise<{ text: string; mode: AiMode }> {
  return completeText(prompt, { maxTokens: AI_MAX_TOKENS_SEO, temperature: AI_TEMPERATURE_SEO });
}

export async function completeParserPrompt(prompt: string): Promise<{ text: string; mode: AiMode }> {
  return completeText(prompt, { maxTokens: AI_MAX_TOKENS_PARSER, temperature: AI_TEMPERATURE_PARSER });
}
