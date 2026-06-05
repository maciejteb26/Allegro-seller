/**
 * Wewnętrzne drzewo kategorii Selltry — jedyne źródło prawdy dla wszystkich platform.
 * Slug jest używany przez AI Parser i mapowania PlatformCategoryMapping.
 */
export interface InternalCategoryChildDef {
  name: string;
  slug: string;
}

export interface InternalCategoryDef {
  name: string;
  slug: string;
  children: InternalCategoryChildDef[];
}

export const INTERNAL_CATEGORY_TREE: InternalCategoryDef[] = [
  {
    name: 'Silnik',
    slug: 'engine',
    children: [
      { name: 'Blok silnika', slug: 'engine-block' },
      { name: 'Głowica', slug: 'cylinder-head' },
      { name: 'Rozrząd', slug: 'timing' },
      { name: 'Turbosprężarka', slug: 'turbocharger' },
      { name: 'Alternator', slug: 'alternator' },
      { name: 'Rozrusznik', slug: 'starter' },
      { name: 'Osprzęt silnika', slug: 'engine-accessories' },
    ],
  },
  {
    name: 'Skrzynia biegów',
    slug: 'gearbox',
    children: [
      { name: 'Automatyczna', slug: 'gearbox-automatic' },
      { name: 'Manualna', slug: 'gearbox-manual' },
      { name: 'Sprzęgło', slug: 'clutch' },
    ],
  },
  {
    name: 'Napęd',
    slug: 'drivetrain',
    children: [
      { name: 'Wał napędowy', slug: 'driveshaft' },
      { name: 'Przegub', slug: 'cv-joint' },
      { name: 'Most', slug: 'differential' },
    ],
  },
  {
    name: 'Zawieszenie',
    slug: 'suspension',
    children: [
      { name: 'Amortyzatory', slug: 'shock-absorbers' },
      { name: 'Sprężyny', slug: 'springs' },
      { name: 'Drążki i wahacze', slug: 'control-arms' },
      { name: 'Łożyska i piasty', slug: 'wheel-hubs' },
    ],
  },
  {
    name: 'Hamulce',
    slug: 'brakes',
    children: [
      { name: 'Tarcze', slug: 'brake-discs' },
      { name: 'Klocki', slug: 'brake-pads' },
      { name: 'Zaciski', slug: 'brake-calipers' },
      { name: 'Przewody', slug: 'brake-lines' },
    ],
  },
  {
    name: 'Oświetlenie',
    slug: 'lighting',
    children: [
      { name: 'Lampa przednia', slug: 'headlight' },
      { name: 'Lampa tylna', slug: 'taillight' },
      { name: 'Kierunkowskaz', slug: 'turn-signal' },
      { name: 'Lampa przeciwmgłowa', slug: 'fog-lamp' },
    ],
  },
  {
    name: 'Karoseria',
    slug: 'bodywork',
    children: [
      { name: 'Zderzak', slug: 'bumper' },
      { name: 'Błotnik', slug: 'fender' },
      { name: 'Maska', slug: 'hood' },
      { name: 'Drzwi', slug: 'door' },
      { name: 'Szyba', slug: 'glass' },
      { name: 'Progi i nadkola', slug: 'sills-trim' },
    ],
  },
  {
    name: 'Wnętrze',
    slug: 'interior',
    children: [
      { name: 'Fotele', slug: 'seats' },
      { name: 'Kierownica', slug: 'steering-wheel' },
      { name: 'Deska rozdzielcza', slug: 'dashboard' },
      { name: 'Bagażnik', slug: 'trunk-parts' },
    ],
  },
  {
    name: 'Elektryka',
    slug: 'electronics',
    children: [
      { name: 'Wiązka elektryczna', slug: 'wiring-harness' },
      { name: 'Sterownik ECU', slug: 'ecu' },
      { name: 'Czujniki', slug: 'sensors' },
    ],
  },
  {
    name: 'Chłodzenie',
    slug: 'cooling',
    children: [
      { name: 'Chłodnica', slug: 'radiator' },
      { name: 'Wentylator', slug: 'fan' },
      { name: 'Termostat', slug: 'thermostat' },
    ],
  },
  {
    name: 'Klimatyzacja',
    slug: 'air-conditioning',
    children: [
      { name: 'Sprężarka AC', slug: 'ac-compressor' },
      { name: 'Skraplacz', slug: 'ac-condenser' },
    ],
  },
  {
    name: 'Układ wydechowy',
    slug: 'exhaust',
    children: [
      { name: 'Katalizator', slug: 'catalytic-converter' },
      { name: 'Tłumik', slug: 'muffler' },
      { name: 'Rura wydechowa', slug: 'exhaust-pipe' },
    ],
  },
  {
    name: 'Układ paliwowy',
    slug: 'fuel-system',
    children: [
      { name: 'Pompa paliwa', slug: 'fuel-pump' },
      { name: 'Wtryskiwacze', slug: 'fuel-injectors' },
    ],
  },
  {
    name: 'Filtry i płyny',
    slug: 'filters-fluids',
    children: [
      { name: 'Filtr oleju', slug: 'oil-filter' },
      { name: 'Filtr powietrza', slug: 'air-filter' },
      { name: 'Filtr kabinowy', slug: 'cabin-filter' },
    ],
  },
  {
    name: 'Układ kierowniczy',
    slug: 'steering',
    children: [
      { name: 'Przekładnia', slug: 'steering-rack' },
      { name: 'Pompa wspomagania', slug: 'power-steering-pump' },
    ],
  },
  {
    name: 'Inne',
    slug: 'other',
    children: [{ name: 'Pozostałe', slug: 'other-misc' }],
  },
];

/** Wszystkie slugi liści (podkategorii) — dla AI Parser i walidacji */
export const INTERNAL_CATEGORY_LEAF_SLUGS = INTERNAL_CATEGORY_TREE.flatMap((parent) =>
  parent.children.map((child) => child.slug),
);

export const INTERNAL_CATEGORY_PARENT_SLUGS = INTERNAL_CATEGORY_TREE.map((p) => p.slug);
