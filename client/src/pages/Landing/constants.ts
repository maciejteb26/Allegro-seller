export const WORKFLOW_STEPS = [
  {
    step: '1',
    title: 'Wgraj Excel',
    desc: 'Lista produktów z EAN, ceną i tytułem roboczym — format „Zestawienie” lub własny profil klienta.',
    icon: 'upload' as const,
  },
  {
    step: '2',
    title: 'Znajdź produkt',
    desc: 'Google, popularni sprzedawcy (eBay, Amazon, Autodoc…) i katalog Allegro po EAN lub MPN.',
    icon: 'search' as const,
  },
  {
    step: '3',
    title: 'Tłumacz i generuj SEO',
    desc: 'AI tłumaczy obce opisy na polski i tworzy tytuł (max 75 znaków) oraz opis pod wyszukiwarkę Allegro.',
    icon: 'sparkles' as const,
  },
  {
    step: '4',
    title: 'Opublikuj',
    desc: 'Podgląd arkusza, edycja wierszy i publikacja batch na Allegro Business.',
    icon: 'rocket' as const,
  },
] as const;

export const FEATURES = [
  {
    title: 'Import hurtowy z Excela',
    description:
      'Wczytaj setki pozycji naraz. Obsługa profili per klient — różne układy kolumn, ten sam silnik.',
    icon: 'spreadsheet' as const,
  },
  {
    title: 'Google i sprzedawcy',
    description:
      'Wyszukiwanie produktu w Google i u popularnych marketplace’ów. Per klient: wybór sprzedawców i własny prompt SEO.',
    icon: 'catalog' as const,
  },
  {
    title: 'Tytuły i opisy SEO',
    description:
      'Generator pod reguły Allegro: limit znaków, słowa kluczowe na początku, naturalny opis bez spamu.',
    icon: 'seo' as const,
  },
  {
    title: 'Kreator pojedynczych ogłoszeń',
    description:
      'Elektronika, moda, dom i motoryzacja — marka produktu, kategoria i opcjonalne dopasowanie pojazdu.',
    icon: 'wizard' as const,
  },
] as const;

export const SEO_BENEFITS = [
  'Tytuł max 75 znaków — marka i słowa kluczowe na początku',
  'Tłumaczenie EN/DE → polski z adaptacją pod Allegro',
  'Opis z EAN, VAT, fakturą i parametrami produktu',
  'Własny prompt SEO per klient — ton i słownictwo pod branżę',
] as const;

export const STATS = [
  { value: '153+', label: 'pozycji z jednego Excela' },
  { value: '75', label: 'znaków tytułu SEO Allegro' },
  { value: '4', label: 'kroki do publikacji' },
] as const;

export const FAQ = [
  {
    q: 'Czy Allegro Seller wystawia oferty na Allegro?',
    a: 'Tak — integracja z Allegro API (OAuth). Domyślnie tryb deweloperski MOCK; na produkcji prawdziwa publikacja.',
  },
  {
    q: 'Jak działa SEO dla ofert?',
    a: 'AI generuje polski tytuł (max 75 znaków) i opis zgodnie z zasadami Allegro. Uwzględnia dane z Google, sprzedawców, katalogu Allegro oraz własny prompt klienta (VAT, faktury, styl).',
  },
  {
    q: 'Jakie formaty Excel są obsługiwane?',
    a: 'XLSX, XLS i CSV. Pierwszy profil: „Zestawienie” z kolumnami EAN, cena, tytuł, stan i sygnatura.',
  },
] as const;
