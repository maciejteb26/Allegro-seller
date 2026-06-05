import Anthropic from '@anthropic-ai/sdk';
import { Condition } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { env } from '../utils/env';
import { extractVehicleFromText } from './ai-parser-vehicle';

export interface ParsedListingData {
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  partCategory: string | null;
  partSubcategory: string | null;
  partSide: 'Lewa' | 'Prawa' | null;
  condition: 'NEW' | 'USED' | 'DAMAGED' | null;
  catalogNumber: string | null;
  confidence: number;
  needsReview: boolean;
  parserMode: 'AI' | 'REGEX';
}

const anthropic = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;

export async function parseInput(rawInput: string): Promise<ParsedListingData> {
  if (!anthropic) {
    return parseWithRegex(rawInput);
  }

  const categories = await prisma.internalCategory.findMany({
    select: { slug: true, parentId: true },
    orderBy: { slug: 'asc' },
  });
  const top = categories.filter((c) => !c.parentId).map((c) => c.slug);
  const sub = categories.filter((c) => !!c.parentId).map((c) => c.slug);

  const prompt = [
    'Z parsowanego tekstu zwroc JSON (tylko JSON, bez komentarzy).',
    'Pola: vehicleMake, vehicleModel, vehicleYear (number), partCategory (slug), partSubcategory (slug),',
    'partSide ("Lewa"|"Prawa"|null), condition ("NEW"|"USED"|"DAMAGED"|null), catalogNumber, confidence (0-1).',
    'Uzyj tylko podanych slugow kategorii.',
    `Kategorie glowne: ${top.join(', ')}`,
    `Podkategorie: ${sub.join(', ')}`,
    `Tekst: "${rawInput}"`,
  ].join('\n');

  const completion = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = completion.content.find((part) => part.type === 'text');
  const parsed = safeParseJson(text?.text ?? '');
  if (!parsed) return parseWithRegex(rawInput);
  const normalized = normalizeResult(parsed);
  if (!normalized.vehicleMake) {
    const vehicle = extractVehicleFromText(rawInput);
    normalized.vehicleMake = vehicle.vehicleMake;
    normalized.vehicleModel = vehicle.vehicleModel ?? normalized.vehicleModel;
  }
  return normalized;
}

export function parseWithRegex(rawInput: string): ParsedListingData {
  const lower = rawInput.toLowerCase();
  const yearMatch = lower.match(/\b(19|20)\d{2}\b/);
  const catalogMatch = rawInput.match(/\b[A-Z0-9-]{5,}\b/);
  const vehicle = extractVehicleFromText(rawInput);

  const side: 'Lewa' | 'Prawa' | null = lower.includes('lewa') || lower.includes('lewy')
    ? 'Lewa'
    : lower.includes('prawa') || lower.includes('prawy')
      ? 'Prawa'
      : null;

  const condition: Condition | null = lower.includes('nowa') || lower.includes('nowy')
    ? 'NEW'
    : lower.includes('uszk')
      ? 'DAMAGED'
      : lower.includes('używ') || lower.includes('uzyw')
        ? 'USED'
        : null;

  const hasVehicle = !!(vehicle.vehicleMake || vehicle.vehicleModel);
  const confidence = hasVehicle ? 0.55 : 0.4;

  return {
    vehicleMake: vehicle.vehicleMake,
    vehicleModel: vehicle.vehicleModel,
    vehicleYear: yearMatch ? Number(yearMatch[0]) : null,
    partCategory: null,
    partSubcategory: null,
    partSide: side,
    condition,
    catalogNumber: catalogMatch ? catalogMatch[0] : null,
    confidence,
    needsReview: confidence < 0.6,
    parserMode: 'REGEX',
  };
}

function normalizeResult(data: unknown): ParsedListingData {
  const fallback = parseWithRegex('');
  const obj = typeof data === 'object' && data ? (data as Record<string, unknown>) : {};
  const confidence = Number(obj.confidence ?? 0.5);

  return {
    vehicleMake: asStr(obj.vehicleMake),
    vehicleModel: asStr(obj.vehicleModel),
    vehicleYear: asNum(obj.vehicleYear),
    partCategory: asStr(obj.partCategory),
    partSubcategory: asStr(obj.partSubcategory),
    partSide: obj.partSide === 'Lewa' || obj.partSide === 'Prawa' ? obj.partSide : null,
    condition: obj.condition === 'NEW' || obj.condition === 'USED' || obj.condition === 'DAMAGED' ? obj.condition : null,
    catalogNumber: asStr(obj.catalogNumber),
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : fallback.confidence,
    needsReview: confidence < 0.6,
    parserMode: 'AI',
  };
}

function safeParseJson(value: string): unknown | null {
  const jsonCandidate = value.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonCandidate) return null;
  try {
    return JSON.parse(jsonCandidate);
  } catch {
    return null;
  }
}

function asStr(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function asNum(value: unknown): number | null {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}
