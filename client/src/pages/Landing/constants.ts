export const PLATFORMS = ['Allegro'] as const;

export const FEATURES = [
  {
    title: 'Kreator ogłoszeń Allegro',
    description:
      'Wypełniasz dane raz — tytuł, kategoria i cena są dostosowane do wymagań Allegro.',
    icon: 'layers' as const,
  },
  {
    title: 'AI Parser opisu',
    description:
      'Wklej tekst z WhatsAppa lub notatki — system rozpozna część, pojazd i stan, a formularz się uzupełni.',
    icon: 'sparkles' as const,
  },
  {
    title: 'Szkice i bezpieczny zapis',
    description:
      'Postęp kreatora zapisuje się automatycznie. Wróć do ogłoszenia w dowolnym momencie bez utraty danych.',
    icon: 'shield' as const,
  },
  {
    title: 'Marże i ceny końcowe',
    description:
      'Ustaw regułę marży i od razu widzisz cenę wystawienia na Allegro przed publikacją.',
    icon: 'trending' as const,
  },
] as const;

export const STEPS = [
  { step: '01', title: 'Opisz część', desc: 'Formularz lub AI Parser — kategoria i tytuł gotowe w minutę.' },
  { step: '02', title: 'Dodaj zdjęcia', desc: 'Min. jedno zdjęcie, opcjonalnie dopasowanie do pojazdu.' },
  { step: '03', title: 'Wystaw na Allegro', desc: 'Jedno kliknięcie — resztą zajmie się Allegro Seller.' },
] as const;

export const STATS = [
  { value: '1', label: 'platforma — Allegro' },
  { value: '3', label: 'kroki do publikacji' },
  { value: '1×', label: 'wprowadzanie danych' },
] as const;
