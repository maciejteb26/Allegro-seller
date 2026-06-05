import { InternalCategoryDef } from './internal-categories';

export const GENERAL_CATEGORY_TREE: InternalCategoryDef[] = [
  {
    name: 'Elektronika',
    slug: 'electronics-general',
    children: [
      { name: 'Telefony i smartfony', slug: 'phones' },
      { name: 'Komputery i laptopy', slug: 'computers' },
      { name: 'TV i audio', slug: 'tv-audio' },
      { name: 'AGD małe', slug: 'small-appliances' },
      { name: 'AGD duże', slug: 'large-appliances' },
      { name: 'Foto i kamery', slug: 'photo-cameras' },
    ],
  },
  {
    name: 'Dom i ogród',
    slug: 'home-garden',
    children: [
      { name: 'Meble', slug: 'furniture' },
      { name: 'Dekoracje', slug: 'decor' },
      { name: 'Oświetlenie domowe', slug: 'home-lighting' },
      { name: 'Narzędzia', slug: 'tools' },
      { name: 'Ogród', slug: 'garden' },
    ],
  },
  {
    name: 'Moda i odzież',
    slug: 'fashion',
    children: [
      { name: 'Odzież damska', slug: 'womens-clothing' },
      { name: 'Odzież męska', slug: 'mens-clothing' },
      { name: 'Obuwie', slug: 'footwear' },
      { name: 'Akcesoria modowe', slug: 'fashion-accessories' },
    ],
  },
  {
    name: 'Sport i turystyka',
    slug: 'sport-travel',
    children: [
      { name: 'Sprzęt sportowy', slug: 'sports-equipment' },
      { name: 'Turystyka i outdoor', slug: 'outdoor-travel' },
      { name: 'Rowery', slug: 'bicycles' },
    ],
  },
  {
    name: 'Dziecko',
    slug: 'kids',
    children: [
      { name: 'Zabawki', slug: 'toys' },
      { name: 'Ubranka dziecięce', slug: 'kids-clothing' },
      { name: 'Wózki i foteliki', slug: 'strollers-seats' },
    ],
  },
  {
    name: 'Zdrowie i uroda',
    slug: 'health-beauty',
    children: [
      { name: 'Kosmetyki', slug: 'cosmetics' },
      { name: 'Pielęgnacja', slug: 'personal-care' },
      { name: 'Zdrowie', slug: 'health-products' },
    ],
  },
  {
    name: 'Kultura i rozrywka',
    slug: 'culture-entertainment',
    children: [
      { name: 'Książki', slug: 'books' },
      { name: 'Gry i konsole', slug: 'games-consoles' },
      { name: 'Muzyka i filmy', slug: 'music-movies' },
    ],
  },
  {
    name: 'Pozostałe',
    slug: 'general-other',
    children: [{ name: 'Inne produkty', slug: 'general-misc' }],
  },
];
