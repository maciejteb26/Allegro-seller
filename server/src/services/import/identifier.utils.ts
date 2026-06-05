import { IdentifierType } from '../../types/import.types';

const GTIN_PATTERN = /^\d{8,14}$/;
const MPN_PATTERN = /^[A-Z0-9][A-Z0-9\-_. ]{2,}$/i;

export function resolveIdentifier(raw: string, draftTitle: string): {
  identifierType: IdentifierType;
  searchPhrase: string;
} {
  const trimmed = raw.trim();
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (digitsOnly.length >= 8 && digitsOnly.length <= 14 && GTIN_PATTERN.test(digitsOnly)) {
    return { identifierType: 'GTIN', searchPhrase: digitsOnly };
  }

  if (trimmed && MPN_PATTERN.test(trimmed) && !trimmed.startsWith('http')) {
    return { identifierType: 'MPN', searchPhrase: trimmed };
  }

  const phrase = draftTitle.trim() || trimmed;
  return { identifierType: 'PHRASE', searchPhrase: phrase };
}

export function isEmptyImportRow(values: {
  identifierRaw: string;
  signature: string;
  draftTitle: string;
  price: number | null;
}): boolean {
  return !values.identifierRaw && !values.signature && !values.draftTitle && values.price === null;
}
