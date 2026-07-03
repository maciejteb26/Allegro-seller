import { completeText, isAiEnabled } from '../ai.client';
import { AllegroCategoryParameter } from '../allegro-api.service';

export interface ResolvedParameter {
  id: string;
  values: string[];
}

interface ProductContext {
  title: string;
  description: string;
}

// Allegro wymaga kompletu atrybutów kategorii przy tworzeniu nowego produktu (brak dopasowania
// w katalogu). Prosimy AI o dopasowanie WOLNOTEKSTOWYCH atrybutów z tytułu/opisu.
//
// Parametry słownikowe (Stan, Marka, Smak, Producent...) są celowo pomijane — potwierdzone testem
// na 4 różnych parametrach w 2 różnych kategoriach: w tym środowisku Allegro Sandbox każda
// wartość słownikowa wraca jako "nieistniejąca" przy zapisie oferty, mimo że pochodzi z ich
// własnego API odczytu metadanych (/sale/categories/{id}/parameters). To niespójność danych po
// stronie Allegro dla tego konta/środowiska, nie coś możliwego do obejścia doborem wartości —
// dotyczy to zarówno reguł, jak i AI, więc nie ma sensu tego dalej próbować tutaj.
export async function resolveParametersWithAi(
  params: AllegroCategoryParameter[],
  context: ProductContext,
): Promise<ResolvedParameter[]> {
  const textParams = params.filter((p) => !p.dictionary?.length);
  if (!isAiEnabled() || textParams.length === 0) return [];

  const prompt = buildPrompt(context, textParams);

  try {
    const { text } = await completeText(prompt, { maxTokens: 400, temperature: 0 });
    const parsed = parseJsonObject(text);
    if (!parsed) return [];

    const resolved: ResolvedParameter[] = [];
    for (const param of textParams) {
      const value = parsed[param.id];
      if (value != null && value !== '') resolved.push({ id: param.id, values: [String(value)] });
    }
    return resolved;
  } catch {
    return [];
  }
}

function buildPrompt(context: ProductContext, params: AllegroCategoryParameter[]): string {
  const fields = params.map((p) => `- ${p.name} (id: ${p.id}) — krótka wartość tekstowa`).join('\n');

  return `Jesteś asystentem uzupełniającym atrybuty oferty na Allegro na podstawie tytułu i opisu produktu.

Tytuł: ${context.title}
Opis: ${context.description.slice(0, 600)}

Uzupełnij poniższe atrybuty tekstowe. Jeśli nie da się wiarygodnie ustalić wartości, pomiń dany atrybut (nie zgaduj na siłę).

${fields}

Odpowiedz WYŁĄCZNIE obiektem JSON w formacie {"<id parametru>": "<wartość>", ...}, bez żadnego dodatkowego tekstu.`;
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
