# server/src — architektura

Express + TypeScript + Prisma. Przepływ żądania:

```
routes/ → middleware/ (auth, rate-limit) → controllers/ → services/ → prisma (Postgres)
```

`app.ts` składa Express app (helmet, cors, json, cookies, rate limit, routes, error
middleware) bez `app.listen()` — dzięki temu testy integracyjne (`server/tests/integration/`)
importują `app` przez supertest bez bindowania portu. `index.ts` tylko startuje `app` i worker'y.

## Podfoldery

- **`routes/`** — definicje endpointów (Express `Router`), tylko mapowanie ścieżka→kontroler +
  middleware. Bez logiki biznesowej.
- **`controllers/`** — parsowanie/walidacja requestu (Zod), wywołanie serwisu, zmapowanie
  wyniku na odpowiedź HTTP. Każdy endpoint operujący na zasobie użytkownika filtruje przez
  `req.userId` (patrz `listing.service.ts` — `getListing(userId, listingId)` zwraca 404, nie
  403, gdy zasób nie należy do usera — nie zdradzamy istnienia cudzych zasobów).
- **`services/`** — logika biznesowa i zapytania Prisma. Tu, nie w kontrolerach, mieszka cała
  logika domenowa (np. `listing.service.ts`, `auth.service.ts`, `platforms/` — integracje z
  platformami sprzedażowymi z trybem mock/real, patrz `CLAUDE.md`).
- **`middleware/`** — `auth.middleware.ts` (JWT z httpOnly cookie), `rate-limit.middleware.ts`,
  `error.middleware.ts` (`AppError` + globalny handler, zamienia błędy na JSON + loguje przez
  `utils/logger.ts`).
- **`jobs/`** — tło/workery startowane przy starcie serwera (`startWorkers()` w `index.ts`).
- **`utils/`** — przekrojowe narzędzia bez logiki domenowej: `env.ts` (walidacja zmiennych
  środowiskowych przy starcie), `prisma.ts` (singleton klienta), `logger.ts` (structured
  logging + zdarzenia bezpieczeństwa), `crypto.ts`, `s3.ts`.
- **`validators/`** — schematy Zod używane poza kontrolerami (np. w imporcie z Excela).
- **`constants/`** — statyczne dane referencyjne (kategorie, marki, prompty AI) — nigdy magic
  strings rozsiane po kodzie, patrz `CLAUDE.md`.
- **`types/`** — typy współdzielone między modułami, gdy nie pasują do żadnego konkretnego
  serwisu.

## Gdzie dodać nowy endpoint

1. Routing w `routes/` (+ middleware jeśli potrzebne: auth, dedykowany rate limit).
2. Kontroler w `controllers/` — schema Zod na wejściu, wywołanie serwisu, status HTTP.
3. Logika w `services/` — operacje na Prisma, zawsze filtrowane przez `userId` dla zasobów
   należących do użytkownika.
4. Testy: jednostkowe w `server/tests/unit/` dla czystej logiki, integracyjne w
   `server/tests/integration/` (supertest + realna baza testowa) dla pełnego flow przez HTTP.

## Bezpieczeństwo — checklist przy nowym kodzie

- Pola tekstowe trafiające do HTML/eksportu sanityzować (`sanitizeDescription()` w
  `listing.controller.ts` jako wzorzec).
- Nieudane logowania / nieautoryzowany dostęp logować przez `logger.security()`.
- Sekrety tylko przez `env.ts` (`requireEnv`/`requireEnv32Chars`), nigdy hardcoded.
