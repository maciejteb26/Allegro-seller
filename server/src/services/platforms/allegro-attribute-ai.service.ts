import { completeText, isAiEnabled } from '../ai.client';
import { AllegroCategoryParameter, formatNumericParamValue } from '../allegro-api.service';

export interface ResolvedParameter {
  id: string;
  values?: string[];
  valuesIds?: string[];
}

interface ProductContext {
  title: string;
  description: string;
}

const DICTIONARY_OPTION_LIMIT = 150;

// Gdy AI nie potrafi wiarygodnie ustalić wartości (np. tytuł/opis nie wspominają marki), wolimy
// nie zgadywać — ale atrybut słownikowy pozostaje wtedy pusty, a Allegro odrzuca całą ofertę jako
// niekompletną. Większość kategorii ma w słowniku pozycję ogólną ("Inna", "Pozostałe",
// "Nieznana"...) — to bezpieczniejszy fallback niż utrata publikacji.
const GENERIC_DICTIONARY_PATTERNS = [
  /^inn[ayeą]\b/i,
  /^pozosta/i,
  /^nieznan/i,
  /^brak\b/i,
  /^nie dotyczy/i,
  /^n\/a$/i,
  /^bez\s/i, // np. "bez marki", "bez producenta" — częsty generyczny wpis w słowniku Marka
];

// Allegro wymaga kompletu atrybutów kategorii przy tworzeniu nowego produktu (brak dopasowania
// w katalogu). Parametry wolnotekstowe wypełniamy jako `values` (tekst), a słownikowe (Marka,
// Model, Kolor...) jako `valuesIds` — Allegro odrzuca próbę wysłania etykiety słownika przez pole
// `values` komunikatem "wartość słownikowa nie istnieje", nawet jeśli etykieta jest poprawna;
// wymaga właśnie identyfikatora z `dictionary[].id`.
export async function resolveParametersWithAi(
  params: AllegroCategoryParameter[],
  context: ProductContext,
): Promise<ResolvedParameter[]> {
  const resolved = await resolveWithAi(params, context);
  return applyGenericDictionaryFallback(params, resolved);
}

async function resolveWithAi(
  params: AllegroCategoryParameter[],
  context: ProductContext,
): Promise<ResolvedParameter[]> {
  if (!isAiEnabled() || params.length === 0) return [];

  const prompt = buildPrompt(context, params);

  try {
    const { text } = await completeText(prompt, { maxTokens: 500, temperature: 0 });
    const parsed = parseJsonObject(text);
    if (!parsed) return [];

    const resolved: ResolvedParameter[] = [];
    for (const param of params) {
      const value = parsed[param.id];
      if (value == null || value === '') continue;

      if (param.dictionary?.length) {
        const match = param.dictionary.find((d) => d.id === String(value));
        if (match) resolved.push({ id: param.id, valuesIds: [match.id] });
      } else {
        resolved.push({ id: param.id, values: [normalizeNumericIfNeeded(param, String(value))] });
      }
    }
    return resolved;
  } catch {
    return [];
  }
}

function applyGenericDictionaryFallback(
  params: AllegroCategoryParameter[],
  resolved: ResolvedParameter[],
): ResolvedParameter[] {
  const resolvedIds = new Set(resolved.map((r) => r.id));
  const withFallback = [...resolved];

  for (const param of params) {
    if (resolvedIds.has(param.id) || !param.dictionary?.length) continue;
    const fallback = param.dictionary.find((d) =>
      GENERIC_DICTIONARY_PATTERNS.some((pattern) => pattern.test(d.value.trim())),
    );
    if (fallback) withFallback.push({ id: param.id, valuesIds: [fallback.id] });
  }

  return withFallback;
}

// Atrybuty liczbowe (type: integer/float — dowolna nazwa: Pojemność, Moc, Rozmiar...) wymagają
// czystej liczby. Allegro odrzuca wartość z jednostką ("300 ml") jako "nie jest liczbą". AI
// czasem mimo instrukcji w prompcie dokleja jednostkę, więc dodatkowo sanityzujemy wynik.
function normalizeNumericIfNeeded(param: AllegroCategoryParameter, value: string): string {
  if (param.type !== 'integer' && param.type !== 'float') return value;
  return formatNumericParamValue(param, value) ?? value;
}

function buildPrompt(context: ProductContext, params: AllegroCategoryParameter[]): string {
  const fields = params
    .map((p) => {
      if (p.dictionary?.length) {
        const options = rankDictionaryOptions(p.dictionary, context)
          .slice(0, DICTIONARY_OPTION_LIMIT)
          .map((d) => `"${d.id}"=${d.value}`)
          .join(', ');
        return `- ${p.name} (id: ${p.id}) — atrybut słownikowy, odpowiedz DOKŁADNIE jednym identyfikatorem (id, nie nazwą) z listy: ${options}`;
      }
      if (p.type === 'integer' || p.type === 'float') {
        const unitHint = p.unit ? ` w jednostce ${p.unit}` : '';
        return `- ${p.name} (id: ${p.id}) — WYŁĄCZNIE liczba${unitHint} (np. "300"), bez jednostki i bez tekstu w odpowiedzi`;
      }
      return `- ${p.name} (id: ${p.id}) — krótka wartość tekstowa`;
    })
    .join('\n');

  return `Jesteś asystentem uzupełniającym atrybuty oferty na Allegro na podstawie tytułu i opisu produktu.

Tytuł: ${context.title}
Opis: ${context.description.slice(0, 600)}

Uzupełnij poniższe atrybuty. Dla atrybutów słownikowych podaj wyłącznie id wybranej opcji (np. "123"),
nigdy jej nazwę. Jeśli nie da się wiarygodnie ustalić wartości, pomiń dany atrybut (nie zgaduj na siłę).

${fields}

Odpowiedz WYŁĄCZNIE obiektem JSON w formacie {"<id parametru>": "<wartość lub id opcji>", ...}, bez żadnego dodatkowego tekstu.`;
}

// Duże słowniki (setki opcji) nie mieszczą się sensownie w promptcie — przy ograniczeniu do
// DICTIONARY_OPTION_LIMIT dajemy pierwszeństwo opcjom, których nazwa pojawia się w tytule/opisie.
function rankDictionaryOptions(
  dictionary: Array<{ id: string; value: string }>,
  context: ProductContext,
): Array<{ id: string; value: string }> {
  if (dictionary.length <= DICTIONARY_OPTION_LIMIT) return dictionary;

  const haystack = `${context.title} ${context.description}`.toLowerCase();
  const matched = dictionary.filter((d) => haystack.includes(d.value.toLowerCase()));
  const rest = dictionary.filter((d) => !matched.includes(d));
  return [...matched, ...rest];
}

function parseJsonObject(text: string): Record<string, string> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}
