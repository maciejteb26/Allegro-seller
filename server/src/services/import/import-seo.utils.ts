import { ALLEGRO_TITLE_LIMIT } from '../../constants/import-seo.constants';

export function fitTitleToLimit(title: string, limit = ALLEGRO_TITLE_LIMIT): string {
  const normalized = title.replace(/\s+/g, ' ').trim();
  if (normalized.length <= limit) return normalized;
  return normalized.slice(0, limit).trim();
}

export function buildKeywordTitle(parts: Array<string | null | undefined>, limit = ALLEGRO_TITLE_LIMIT): string {
  const tokens = parts
    .flatMap((part) => (part ?? '').split(/\s+/))
    .map((token) => token.trim())
    .filter(Boolean);

  const unique: string[] = [];
  for (const token of tokens) {
    const key = token.toLowerCase();
    if (!unique.some((existing) => existing.toLowerCase() === key)) unique.push(token);
  }

  let result = '';
  for (const token of unique) {
    const candidate = result ? `${result} ${token}` : token;
    if (candidate.length > limit) break;
    result = candidate;
  }

  return result || fitTitleToLimit(tokens.join(' '), limit);
}

export function safeParseSeoJson(value: string): { title?: string; description?: string } | null {
  const jsonCandidate = value.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonCandidate) return null;
  try {
    const parsed = JSON.parse(jsonCandidate) as { title?: unknown; description?: unknown };
    return {
      title: typeof parsed.title === 'string' ? parsed.title.trim() : undefined,
      description: typeof parsed.description === 'string' ? parsed.description.trim() : undefined,
    };
  } catch {
    return null;
  }
}
