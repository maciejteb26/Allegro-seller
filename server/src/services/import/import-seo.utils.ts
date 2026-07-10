import { ALLEGRO_TITLE_LIMIT } from '../../constants/import-seo.constants';

export function fitTitleToLimit(title: string, limit = ALLEGRO_TITLE_LIMIT): string {
  const normalized = title.replace(/\s+/g, ' ').trim();
  if (normalized.length <= limit) return normalized;
  return normalized.slice(0, limit).trim();
}

// AI czasem (słusznie) nie chce zmyślać słów kluczowych tylko po to, by dobić do limitu, więc
// zwraca krótszy, ale w 100% prawdziwy tytuł. Zamiast liczyć wyłącznie na AI, dopełniamy go
// deterministycznie prawdziwymi słowami z już znanych danych produktu (kategoria, stan,
// opakowanie, dostawa, nazwy z katalogu/źródła) — nigdy nic nie wymyślamy, tylko dokładamy to,
// co i tak już wiemy o produkcie, a czego zabrakło w tytule.
export function padTitleToTarget(
  title: string,
  extraSources: Array<string | null | undefined>,
  limit = ALLEGRO_TITLE_LIMIT,
  minTarget = limit - 5,
): string {
  let result = title.trim();
  if (result.length >= minTarget) return result;

  const usedWords = new Set(result.toLowerCase().split(/\s+/).filter(Boolean));
  const candidateWords = extraSources
    .flatMap((source) => (source ?? '').split(/\s+/))
    .map((word) => word.trim())
    .filter(Boolean);

  for (const word of candidateWords) {
    if (result.length >= minTarget) break;
    const key = word.toLowerCase();
    if (usedWords.has(key)) continue;
    const candidate = `${result} ${word}`.trim();
    if (candidate.length > limit) continue;
    result = candidate;
    usedWords.add(key);
  }

  return result;
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
