import { ALLEGRO_TITLE_LIMIT } from './import-seo.constants';

export function buildImportSeoPrompt(productData: object, customPrompt?: string | null): string {
  const sections = [
    'Jesteś ekspertem SEO Allegro z 10-letnim doświadczeniem w optymalizacji ofert.',
    'Wygeneruj tytuł i opis oferty w języku polskim. Zwróć WYŁĄCZNIE poprawny JSON (bez markdown):',
    '{"title":"...","description":"..."}',
    '',
    '=== ZASADY TYTUŁU ALLEGRO ===',
    `- maksymalnie ${ALLEGRO_TITLE_LIMIT} znaków (twardy limit)`,
    '- struktura: [typ produktu] [marka/model] [wariant/kompatybilność] [stan]',
    '- najważniejsze słowa kluczowe NA POCZĄTKU tytułu',
    '- pisownia naturalna — bez CAPS LOCK, bez powtarzania słów',
    '- używaj polskich znaków (ą, ę, ó, ł, ś, ź, ż, ć, ń)',
    '- nie używaj znaków specjalnych: ! ? * # @',
    '- jeśli jest EAN/GTIN — nie wstawiaj go do tytułu (tylko do opisu)',
    '',
    '=== ZASADY OPISU ALLEGRO (SEO) ===',
    '- 3-5 akapitów plain text, bez HTML i bez list punktowanych',
    '- akapit 1: czym jest produkt + główna korzyść dla kupującego',
    '- akapit 2: specyfikacja (stan, EAN, opakowanie, wymiary/kompatybilność)',
    '- akapit 3: dostawa, jakość, gwarancja/sprawdzenie przed wysyłką',
    '- akapit 4: zachęta do zakupu + zaufanie (bez nachalnej reklamy)',
    '- wpleć naturalnie frazy wyszukiwawcze (synonimy produktu, marka, zastosowanie)',
    '- jeśli produkt z katalogu Allegro — odwołaj się do oficjalnych danych katalogowych',
    '- długość opisu: 400-900 znaków',
    '- jeśli podano dane klienta (VAT, faktura) — uwzględnij je w opisie/specyfikacji',
    '- faktura VAT: jeśli issuesInvoices=true, wspomnij o możliwości wystawienia faktury',
    '',
    '=== TŁUMACZENIE I ADAPTACJA ===',
    '- jeśli externalProduct.language to "en" lub "de" — przetłumacz treść na polski',
    '- nie kopiuj dosłownie obcego tekstu — adaptuj pod polski rynek i Allegro',
    '- zachowaj numery katalogowe, EAN i parametry techniczne bez zmian',
    '- jeśli są wyniki z Google/sprzedawców — wykorzystaj je jako kontekst specyfikacji',
    '',
    'Dane produktu:',
    JSON.stringify(productData, null, 2),
  ];

  if (customPrompt?.trim()) {
    sections.push('', '=== DODATKOWE INSTRUKCJE KLIENTA ===', customPrompt.trim());
  }

  return sections.join('\n');
}
