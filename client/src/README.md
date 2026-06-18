# client/src — architektura

React 18 + TypeScript + Vite. Przepływ danych:

```
pages/ (routing) → components/ (UI) → api/ (axios, jedyna warstwa HTTP) → backend
                 ↘ store/ (Zustand, globalny stan klienta — np. zalogowany user)
                 ↘ @tanstack/react-query (cache/sync danych z serwera per zapytanie)
```

## Podfoldery

- **`pages/`** — komponenty podłączone do routingu (`react-router-dom`, zob. `App.tsx`).
  Każdy folder pod `pages/` odpowiada jednej sekcji aplikacji (`Listings/`, `Settings/`, itd.).
  Złożone widoki (np. wizard dodawania ogłoszenia) mają własny podfolder z krokami.
- **`components/`** — komponenty reużywalne. `components/ui/` — prymitywy (shadcn/ui-style:
  `Button`, `Input`, `Label`) bez logiki domenowej. `components/shared/` — komponenty
  współdzielone między stronami z logiką (np. `ErrorBoundary`, `ProtectedRoute`,
  `AIParser`). `components/listings/`, `components/platforms/`, itd. — komponenty specyficzne
  dla danej domeny, używane przez więcej niż jedną stronę.
- **`api/`** — **jedyne** miejsce, gdzie kod woła backend (axios). Każdy plik odpowiada jednemu
  zasobowi (`listings.api.ts`, `auth.api.ts`, ...). `api/client.ts` konfiguruje base URL
  (`VITE_API_URL` w produkcji, relative `/api` lokalnie) i auto-refresh tokenu przy 401.
  Komponenty/strony nie wołają `axios` bezpośrednio.
- **`store/`** — Zustand, tylko dla stanu globalnego niezależnego od konkretnego zapytania do
  API (np. `auth.store.ts` — zalogowany użytkownik). Dane z backendu (listingi, kategorie,
  itd.) idą przez `@tanstack/react-query`, nie przez Zustand.
- **`hooks/`** — custom hooks reużywalne między komponentami (np. `useDebounce`,
  `useLocalWizardDraft` — lokalny draft formularza w localStorage).
- **`lib/`** — czyste funkcje pomocnicze bez zależności od React (`cn()` do scalania klas
  Tailwind, `category-scope.ts`).
- **`constants/`**, **`types/`** — jak w `server/src` — statyczne dane referencyjne i typy
  współdzielone.

## Gdzie dodać nowy widok

1. Strona w `pages/<Sekcja>/index.tsx` + routing w `App.tsx`.
2. Komunikacja z backendem przez nowy/istniejący plik w `api/`, owinięty w
   `useQuery`/`useMutation` (React Query) w stronie/komponencie — nie ręczne `useState`+`useEffect`
   do fetchowania.
3. Reużywalne kawałki UI do `components/` (ui-prymitywy vs współdzielone z logiką — zob. wyżej).
4. Testy: `client/src/**/__tests__/*.test.ts(x)` (Vitest) dla czystej logiki/utils. Pełne
   ścieżki użytkownika (rejestracja → listing → publikacja) — e2e w `e2e/` (Playwright, root
   repo, `npm run test:e2e`).
