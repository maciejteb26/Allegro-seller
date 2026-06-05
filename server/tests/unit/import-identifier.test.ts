import { resolveIdentifier, isEmptyImportRow } from '../../src/services/import/identifier.utils';

describe('resolveIdentifier', () => {
  it('detects GTIN from EAN column', () => {
    expect(resolveIdentifier('5906476065534', '')).toEqual({
      identifierType: 'GTIN',
      searchPhrase: '5906476065534',
    });
  });

  it('detects MPN for manufacturer codes', () => {
    expect(resolveIdentifier('Maxpeedingrods 0001380', 'ZAWIESZENIE FIAT')).toEqual({
      identifierType: 'MPN',
      searchPhrase: 'Maxpeedingrods 0001380',
    });
  });

  it('falls back to draft title as phrase', () => {
    expect(resolveIdentifier('B0CW5ZNMW5', 'PRZEGRODA POKOJOWA')).toEqual({
      identifierType: 'MPN',
      searchPhrase: 'B0CW5ZNMW5',
    });
  });
});

describe('isEmptyImportRow', () => {
  it('skips blank rows', () => {
    expect(isEmptyImportRow({ identifierRaw: '', signature: '', draftTitle: '', price: null })).toBe(true);
  });
});
