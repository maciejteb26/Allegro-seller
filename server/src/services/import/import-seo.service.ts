import { buildImportSeoPrompt } from '../../constants/ai-prompts';
import {
  ALLEGRO_DESCRIPTION_MIN,
  IMPORT_CONDITION_LABELS,
} from '../../constants/import-seo.constants';
import { completeSeoPrompt, isAiEnabled, resolveAiMode } from '../ai.client';
import { ClientSettingsContext } from '../../types/client.types';
import { CLIENT_VAT_LABELS } from '../../constants/client.constants';
import { AllegroCatalogProduct, EnrichedImportRow, ImportSeoContent } from '../../types/import.types';
import { buildKeywordTitle, fitTitleToLimit, padTitleToTarget, safeParseSeoJson } from './import-seo.utils';
import { generateMockSeo } from './import-seo-mock';

type SeoInputRow = EnrichedImportRow;

export async function generateSeoForImportRows(
  rows: SeoInputRow[],
  client?: ClientSettingsContext | null,
  onProgress?: (done: number, total: number) => void,
) {
  const results = [];
  for (let index = 0; index < rows.length; index += 1) {
    results.push(await generateSeoForRow(rows[index], client));
    onProgress?.(index + 1, rows.length);
  }
  return results;
}

async function generateSeoForRow(row: SeoInputRow, client?: ClientSettingsContext | null) {
  const baseName = row.allegroProduct?.name || row.externalProduct?.title || row.draftTitle;
  if (!baseName.trim()) {
    return {
      ...row,
      seo: null,
      seoStatus: 'skipped' as const,
      seoMessage: 'Brak nazwy produktu do wygenerowania SEO',
    };
  }

  try {
    const seo = isAiEnabled() ? await generateWithAi(row, client) : generateWithRules(row, client);
    return { ...row, seo, seoStatus: 'generated' as const, seoMessage: undefined };
  } catch (error) {
    const fallback = generateWithRules(row, client);
    const message = error instanceof Error ? error.message : 'Błąd generowania SEO';
    return { ...row, seo: fallback, seoStatus: 'error' as const, seoMessage: `${message} — użyto reguł` };
  }
}

function generateWithRules(row: SeoInputRow, client?: ClientSettingsContext | null): ImportSeoContent {
  const productName = row.allegroProduct?.name || row.externalProduct?.title || row.draftTitle;
  const conditionLabel = row.condition ? IMPORT_CONDITION_LABELS[row.condition] : null;

  const title = buildKeywordTitle([
    productName,
    row.draftTitle !== productName ? row.draftTitle : null,
    conditionLabel,
    row.allegroProduct?.categoryName,
  ]);

  const finalTitle = fitTitleToLimit(title);

  return {
    title: finalTitle,
    description: buildDescription(row, productName, conditionLabel, client),
    titleLength: finalTitle.length,
    mode: 'RULES',
  };
}

async function generateWithAi(row: SeoInputRow, client?: ClientSettingsContext | null): Promise<ImportSeoContent> {
  if (resolveAiMode() === 'MOCK') {
    // MOCK MODE — wymaga ANTHROPIC_API_KEY dla prawdziwego AI
    return generateMockSeo(row, client);
  }

  const prompt = buildImportSeoPrompt(buildAiContext(row, client), client?.seoPrompt);
  const { text } = await completeSeoPrompt(prompt);
  const parsed = safeParseSeoJson(text);
  if (!parsed?.title || !parsed.description) return generateWithRules(row, client);

  const aiTitle = fitTitleToLimit(parsed.title);
  const paddedTitle = padTitleToTarget(aiTitle, [
    row.allegroProduct?.categoryName,
    row.condition ? IMPORT_CONDITION_LABELS[row.condition] : null,
    row.packaging,
    row.delivery,
    row.allegroProduct?.name,
    row.externalProduct?.title,
    row.draftTitle,
  ]);
  const title = paddedTitle;
  const description = parsed.description.length >= ALLEGRO_DESCRIPTION_MIN
    ? parsed.description
    : buildDescription(row, row.allegroProduct?.name || row.draftTitle, row.condition ? IMPORT_CONDITION_LABELS[row.condition] : null, client);

  return { title, description, titleLength: title.length, mode: 'AI' };
}

function buildAiContext(row: SeoInputRow, client?: ClientSettingsContext | null) {
  return {
    client: client
      ? {
          name: client.clientName,
          vatRate: client.vatRate,
          vatLabel: CLIENT_VAT_LABELS[client.vatRate as keyof typeof CLIENT_VAT_LABELS] ?? client.vatRate,
          issuesInvoices: client.issuesInvoices,
        }
      : null,
    catalogProduct: row.allegroProduct,
    externalProduct: row.externalProduct
      ? {
          title: row.externalProduct.title,
          description: row.externalProduct.description,
          language: row.externalProduct.language,
          sourceName: row.externalProduct.sourceName,
          sourceUrl: row.externalProduct.sourceUrl,
          sellerHits: row.externalProduct.hits.slice(0, 3).map((hit) => ({
            title: hit.title,
            seller: hit.sellerName,
            snippet: hit.snippet,
          })),
        }
      : null,
    draftTitle: row.draftTitle,
    identifier: row.identifierRaw || row.searchPhrase,
    identifierType: row.identifierType,
    condition: row.condition,
    price: row.price,
    quantity: row.quantity,
    packaging: row.packaging,
    delivery: row.delivery,
    notes: row.notes,
    signature: row.signature,
  };
}

function buildDescription(
  row: SeoInputRow,
  productName: string,
  conditionLabel: string | null,
  client?: ClientSettingsContext | null,
): string {
  const lines: string[] = [productName, ''];
  const specs: string[] = [];

  if (conditionLabel) specs.push(`Stan: ${conditionLabel}`);
  if (row.allegroProduct?.gtin || (row.identifierType === 'GTIN' && row.searchPhrase)) {
    specs.push(`EAN: ${row.allegroProduct?.gtin || row.searchPhrase}`);
  }
  if (row.packaging) specs.push(`Opakowanie: ${row.packaging}`);
  if (row.delivery) specs.push(`Dostawa: ${row.delivery}`);
  if (row.price != null) specs.push(`Cena: ${row.price.toFixed(2)} PLN`);
  if (row.allegroProduct?.categoryName) specs.push(`Kategoria: ${row.allegroProduct.categoryName}`);
  if (client) {
    specs.push(`VAT: ${CLIENT_VAT_LABELS[client.vatRate as keyof typeof CLIENT_VAT_LABELS] ?? client.vatRate}`);
    specs.push(`Faktura VAT: ${client.issuesInvoices ? 'tak' : 'nie'}`);
  }

  if (specs.length) lines.push(...specs, '');
  if (row.notes) lines.push(`Uwagi: ${row.notes}`, '');
  if (row.draftTitle && row.draftTitle !== productName) lines.push(`Produkt: ${row.draftTitle}`, '');

  lines.push(
    'Zapraszamy do zakupu. Szybka realizacja zamówienia i bezpieczne pakowanie.',
    row.allegroProduct ? 'Oferta powiązana z produktem z katalogu Allegro.' : '',
  );

  return lines.filter(Boolean).join('\n');
}

export function buildRulesTitleFromProduct(product: AllegroCatalogProduct, draftTitle: string): string {
  return buildKeywordTitle([product.name, draftTitle !== product.name ? draftTitle : null]);
}
