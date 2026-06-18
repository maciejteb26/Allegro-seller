export function LandingJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'szybkiewystawianie.pl',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'Hurtowe wystawianie ofert na Allegro: import Excel, wyszukiwanie w Google i u sprzedawców, tłumaczenie na polski, SEO tytułu i opisu, publikacja batch.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'PLN' },
    featureList: [
      'Import Excel i CSV',
      'Wyszukiwanie Google i popularnych sprzedawców',
      'Katalog Allegro po EAN i MPN',
      'Tłumaczenie i generowanie SEO po polsku',
      'Profile klientów z VAT i własnym promptem SEO',
      'Publikacja ofert na Allegro',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
