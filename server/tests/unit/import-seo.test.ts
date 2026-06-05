import { buildKeywordTitle, fitTitleToLimit } from '../../src/services/import/import-seo.utils';
import { generateSeoForImportRows, buildRulesTitleFromProduct } from '../../src/services/import/import-seo.service';

describe('import SEO utils', () => {
  it('fits title to Allegro limit', () => {
    const long = 'A'.repeat(100);
    expect(fitTitleToLimit(long)).toHaveLength(75);
  });

  it('builds keyword title without duplicates', () => {
    const title = buildKeywordTitle([
      'ZAWIESZENIE PNEUMATYCZNE FIAT DUCATO',
      'ZAWIESZENIE FIAT DUCATO 1994',
      'nowy',
    ]);
    expect(title.length).toBeLessThanOrEqual(75);
    expect(title.toLowerCase()).toContain('zawieszenie');
  });

  it('generates SEO via AI mock when enabled', async () => {
    const rows = await generateSeoForImportRows([
      {
        rowIndex: 2,
        sourceLink: '',
        identifierRaw: '5906476065534',
        identifierType: 'GTIN',
        searchPhrase: '5906476065534',
        signature: 'D541',
        condition: 'NEW',
        quantity: 1,
        packaging: 'ORYGINALNE',
        price: 895,
        delivery: 'KURIER',
        draftTitle: 'PRZEGRODA POKOJOWA STELAŻ MOBILNY',
        notes: '',
        enrichStatus: 'matched',
        externalProduct: null,
        allegroProduct: {
          id: 'p1',
          name: 'Przegroda pokojowa stelaż mobilny',
          categoryId: 'c1',
          categoryName: 'Dom i Ogród',
        },
      },
    ]);

    expect(rows[0].seoStatus).toBe('generated');
    expect(rows[0].seo?.title.length).toBeLessThanOrEqual(75);
    expect(rows[0].seo?.description.length).toBeGreaterThan(50);
  });

  it('prefers catalog product name in rules title', () => {
    const title = buildRulesTitleFromProduct(
      { id: '1', name: 'Poduszka powietrzna tylna Fiat Ducato', categoryId: 'c1', categoryName: 'Motoryzacja' },
      'ZAWIESZENIE PNEUMATYCZNE FIAT DUCATO',
    );
    expect(title.length).toBeLessThanOrEqual(75);
    expect(title).toContain('Fiat Ducato');
  });
});
