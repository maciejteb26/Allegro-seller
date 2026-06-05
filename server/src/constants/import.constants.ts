export const IMPORT_PROFILE = {
  ZESTAWIENIE: 'zestawienie',
  LISTA_PRODUKTOW: 'lista_produktow',
} as const;

export type ImportProfileId = (typeof IMPORT_PROFILE)[keyof typeof IMPORT_PROFILE];

export const ZESTAWIENIE_COLUMNS = {
  LP: 'Lp.',
  SOURCE_LINK: 'Link do produktu i zdjeć',
  EAN: 'EAN',
  SIGNATURE: 'Sygnatura',
  CONDITION: 'Stan',
  QUANTITY: 'Ilość',
  PACKAGING: 'Opakowanie ',
  PRICE: 'Cena',
  DELIVERY: 'Dostawa',
  TITLE: 'Tytuł',
  NOTES: 'Uwagi',
} as const;

export const LISTA_PRODUKTOW_COLUMNS = {
  NAME: 'produkt_nazwa',
  QUANTITY: 'ilosc',
  EAN: 'produkt_ean',
  SKU: 'produkt_sku',
  CATEGORY: 'kategoria_nazwa',
  PRICE: 'cena',
  VAT: 'stawka_vat',
  PRODUCER: 'producent_nazwa',
} as const;

export const IMPORT_ALLOWED_MIMES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/csv',
] as const;

export const IMPORT_MAX_FILE_SIZE = 10 * 1024 * 1024;

export const ENRICH_BATCH_SIZE = 5;
export const ENRICH_BATCH_DELAY_MS = 300;
