import { EXTERNAL_SEARCH_SOURCE } from '../../constants/external-search.constants';
import { ExternalProductData, ExternalProductHit } from '../../types/external-product.types';
import { ParsedImportRow } from '../../types/import.types';

const MOCK_SELLERS = ['eBay DE', 'Amazon DE', 'Autodoc', 'RockAuto'] as const;

export function mockExternalProduct(row: ParsedImportRow): ExternalProductData {
  const phrase = row.searchPhrase || row.draftTitle || row.identifierRaw;
  const seller = MOCK_SELLERS[row.rowIndex % MOCK_SELLERS.length];
  const foreignTitle = `[MOCK] ${phrase} — OEM spare part`;
  const foreignDescription =
    `High quality automotive part. Reference: ${phrase}. ` +
    `Compatible with many vehicle models. Fast shipping from EU warehouse.`;

  const hits: ExternalProductHit[] = [
    {
      title: foreignTitle,
      url: `https://mock.${seller.toLowerCase().replace(/\s+/g, '')}.example/item/${row.rowIndex}`,
      snippet: foreignDescription.slice(0, 180),
      source: EXTERNAL_SEARCH_SOURCE.MOCK,
      sellerName: seller,
      language: 'en',
    },
    {
      title: `${phrase} Ersatzteil Original`,
      url: `https://mock.autodoc.example/${phrase}`,
      snippet: `Ersatzteil für Fahrzeuge. Artikelnummer ${row.signature || phrase}.`,
      source: EXTERNAL_SEARCH_SOURCE.MOCK,
      sellerName: 'Autodoc',
      language: 'de',
    },
  ];

  return {
    title: foreignTitle,
    description: foreignDescription,
    language: 'en',
    sourceUrl: hits[0].url,
    sourceName: seller,
    imageUrls: [],
    hits,
  };
}
