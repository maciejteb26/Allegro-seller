export const WIZARD_STEPS = [
  { label: 'Część', desc: 'Kategoria, stan i opis ogłoszenia' },
  { label: 'Pojazd i zdjęcia', desc: 'Dopasowanie pojazdu (opcjonalnie) i zdjęcia' },
  { label: 'Publikacja', desc: 'Cena i wybór platform' },
] as const;

export const MIN_DESCRIPTION_LENGTH = 10;
export const MIN_IMAGES = 1;

export const WIZARD_DRAFT_KEY = 'selltry_listing_wizard_draft';
export const WIZARD_DRAFT_VERSION = 1;
export const WIZARD_DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const WIZARD_DRAFT_DEBOUNCE_MS = 800;

export const AI_PARSER_EXAMPLES = [
  'Lampa tylna Suzuki Samurai 1990 prawa, używana, oryginał',
  'Amortyzator przedni lewy BMW E46 2002, stan dobry',
  'Blok silnika 1.9 TDI VW Golf IV, uszkodzony, nr 038103101A',
] as const;

export const CONDITION_LABELS: Record<string, string> = {
  NEW: 'Nowy',
  USED: 'Używany',
  DAMAGED: 'Uszkodzony',
};

/** Etykiety stanu w podsumowaniu (forma żeńska — część samochodowa) */
export const CONDITION_PART_LABELS: Record<string, string> = {
  NEW: 'nowa',
  USED: 'używana',
  DAMAGED: 'uszkodzona',
};
