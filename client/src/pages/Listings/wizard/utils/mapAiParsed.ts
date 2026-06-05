import { ParsedListingData } from '@/api/ai-parser.api';
import { InternalCategory } from '@/types';
import { MIN_DESCRIPTION_LENGTH } from '../constants';
import { WizardData } from '../types';

function findCategoryId(
  tree: InternalCategory[],
  categorySlug: string | null,
  subcategorySlug: string | null,
): string | undefined {
  if (!categorySlug && !subcategorySlug) return undefined;

  if (categorySlug && subcategorySlug) {
    const parent = tree.find((item) => item.slug === categorySlug);
    const child = parent?.children?.find((item) => item.slug === subcategorySlug);
    if (child) return child.id;
  }

  const slug = subcategorySlug ?? categorySlug;
  if (!slug) return undefined;

  for (const parent of tree) {
    if (parent.slug === slug && !parent.children?.length) return parent.id;
    const child = parent.children?.find((item) => item.slug === slug);
    if (child) return child.id;
  }

  return undefined;
}

const CATEGORY_HINTS: { pattern: RegExp; parent: string; child: string }[] = [
  { pattern: /lamp[aęy].*ty[lł]|ty[lł].*lamp/i, parent: 'lighting', child: 'taillight' },
  { pattern: /lamp[aęy].*przed|przedni.*lamp/i, parent: 'lighting', child: 'headlight' },
  { pattern: /kierunkowskaz/i, parent: 'lighting', child: 'turn-signal' },
  { pattern: /amortyzator/i, parent: 'suspension', child: 'shock-absorbers' },
  { pattern: /tarcz[aęy].*hamul|hamul.*tarcz/i, parent: 'brakes', child: 'brake-discs' },
  { pattern: /klock/i, parent: 'brakes', child: 'brake-pads' },
  { pattern: /zacisk/i, parent: 'brakes', child: 'brake-calipers' },
  { pattern: /zderzak/i, parent: 'bodywork', child: 'bumper' },
  { pattern: /błotnik/i, parent: 'bodywork', child: 'fender' },
  { pattern: /maska/i, parent: 'bodywork', child: 'hood' },
  { pattern: /chłodnic/i, parent: 'cooling', child: 'radiator' },
  { pattern: /turbo/i, parent: 'engine', child: 'turbocharger' },
  { pattern: /alternator/i, parent: 'engine', child: 'alternator' },
];

function findCategoryIdFromText(tree: InternalCategory[], text: string): string | undefined {
  const lower = text.toLowerCase();

  for (const hint of CATEGORY_HINTS) {
    if (!hint.pattern.test(lower)) continue;
    const id = findCategoryId(tree, hint.parent, hint.child);
    if (id) return id;
  }

  for (const parent of tree) {
    for (const child of parent.children ?? []) {
      const childName = child.name.toLowerCase();
      if (lower.includes(childName)) return child.id;
    }
    if (lower.includes(parent.name.toLowerCase()) && !parent.children?.length) {
      return parent.id;
    }
  }

  return undefined;
}

export function getCategoryLabel(
  tree: InternalCategory[],
  categorySlug: string | null,
  subcategorySlug: string | null,
): string | null {
  if (categorySlug && subcategorySlug) {
    const parent = tree.find((item) => item.slug === categorySlug);
    const child = parent?.children?.find((item) => item.slug === subcategorySlug);
    if (child) return `${parent?.name ?? categorySlug} → ${child.name}`;
  }

  const slug = subcategorySlug ?? categorySlug;
  if (!slug) return null;

  for (const parent of tree) {
    if (parent.slug === slug) return parent.name;
    const child = parent.children?.find((item) => item.slug === slug);
    if (child) return child.name;
  }

  return slug;
}

function buildTitle(
  tree: InternalCategory[],
  patch: Partial<WizardData>,
  parsed: ParsedListingData,
): string {
  const parts: string[] = [];

  if (patch.categoryId) {
    const cat = tree.flatMap((c) => [c, ...(c.children ?? [])]).find((c) => c.id === patch.categoryId);
    if (cat) parts.push(cat.name);
  }

  if (parsed.vehicleMake) parts.push(parsed.vehicleMake);
  if (parsed.vehicleModel) parts.push(parsed.vehicleModel);
  if (parsed.vehicleYear) parts.push(String(parsed.vehicleYear));
  if (patch.partSide && patch.partSide !== 'Nie dotyczy') parts.push(patch.partSide.toLowerCase());

  if (parsed.condition === 'USED') parts.push('używana');
  if (parsed.condition === 'DAMAGED') parts.push('uszkodzona');
  if (parsed.condition === 'NEW') parts.push('nowa');

  return parts.join(' ').trim();
}

function buildDescription(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (trimmed.length >= MIN_DESCRIPTION_LENGTH) return trimmed;
  return `${trimmed}. Sprzedaję część z demontażu — szczegóły w opisie.`;
}

export function mapAiParsedToWizard(
  parsed: ParsedListingData,
  categories: InternalCategory[],
  rawInput: string,
): Partial<WizardData> {
  const categoryId =
    findCategoryId(categories, parsed.partCategory, parsed.partSubcategory) ??
    findCategoryIdFromText(categories, rawInput);

  const patch: Partial<WizardData> = {
    identMethod: 'AI_PARSED',
    vehicleYearRaw: parsed.vehicleYear ?? undefined,
    partSide: parsed.partSide ?? undefined,
    condition: parsed.condition ?? undefined,
    catalogNumber: parsed.catalogNumber ?? undefined,
    categoryId,
    description: buildDescription(rawInput),
  };

  const title = buildTitle(categories, patch, parsed);
  if (title) patch.title = title;

  return patch;
}
