# szybkiewystawianie.pl — CLAUDE.md

## Opis projektu
Narzędzie SaaS do wystawiania ogłoszeń części samochodowych/motocyklowych na Allegro.

## Architektura
Modular monolith — monorepo z dwoma pakietami:
- `/client` — React 18 + TypeScript (Vite)
- `/server` — Node.js + Express + TypeScript

## Stack
**Frontend:** React 18, TypeScript, Vite, React Router v6, Zustand, TanStack Query, React Hook Form, Zod, Tailwind CSS, shadcn/ui, Lucide React
**Backend:** Node.js, Express, TypeScript, PostgreSQL, Prisma ORM, JWT, bcrypt, S3-compatible storage (MinIO lokalnie / Supabase Storage prod), Multer, Sharp, Anthropic SDK
**Infra dev:** Docker, docker-compose (postgres + minio)
**Infra prod:** Render (API + static) + Supabase (Postgres + Storage) — patrz `docs/SUPABASE.md`

## Zasady implementacji

### Ogólne
- TypeScript strict mode wszędzie
- Max 250 linii per plik — bezwzględnie wydzielaj moduły
- Brak magic strings — używaj stałych z `constants.ts`
- Walidacja Zod na każdym backendowym endpoincie
- Każdy sekret w `.env`, nigdy w kodzie

### MOCK MODE — krytyczne
Integracja Allegro działa domyślnie w MOCK mode:
```
ALLEGRO_MOCK=true
```
`allegro.service` implementuje `_mockPublish()` i `_realPublish()`.
Oznaczaj moki komentarzem: `// MOCK MODE — wymaga ALLEGRO_MOCK=false i prawdziwego tokenu`

### Backend
- Każdy endpoint sprawdza `req.userId === resource.userId`
- Tokeny OAuth szyfrowane AES-256 przed zapisem
- JWT w httpOnly cookie (nie localStorage)
- Rate limiting: 100 req/15min per IP
- Sanityzacja HTML na polu `description` (`sanitizeDescription()` w `listing.controller.ts`, oparte na `sanitize-html`)
- Zdarzenia bezpieczeństwa (nieudane logowania, nieautoryzowany dostęp, błędy nieobsłużone) logowane przez `utils/logger.ts`

### Frontend
- Skeleton screens zamiast spinnerów
- Empty states dla wszystkich pustych list
- Error boundary na poziomie stron
- Protected routes — redirect gdy brak tokenu

### Storage
- Zdjęcia TYLKO przez S3/MinIO — nigdy lokalny filesystem
- Zapisuj `s3Key` w bazie, URL generuj dynamicznie (presigned)

## Moduły Allegro

- `server/src/services/allegro-oauth.service.ts` — OAuth
- `server/src/services/allegro-api.service.ts` — REST API Allegro
- `server/src/services/platforms/allegro.service.ts` — publikacja

## Konwencja commitów

Conventional Commits: `<typ>: <opis>`. Typy używane w tym repo:
- `feat:` — nowa funkcjonalność (np. `feat: add Excel import pipeline`)
- `fix:` — poprawka błędu (np. `fix: refresh token collision on same-second login`)
- `chore:` — utrzymanie, zależności, konfiguracja (np. `chore: add ESLint flat config`)
- `docs:` — wyłącznie dokumentacja (np. `docs: add deployment guide`)
- `test:` — wyłącznie testy (np. `test: add integration tests for listing publish flow`)
- `refactor:` — zmiana struktury kodu bez zmiany zachowania (np. `refactor: split index.ts into app.ts + index.ts`)

Commit message: krótki tytuł (do ok. 70 znaków) + opcjonalnie dłuższy opis "czemu", nie "co"
(diff już mówi "co"). Historia tego repo sprzed tej konwencji (np. "fix", "Reorder cards") nie
wymaga retroaktywnej poprawy — konwencja obowiązuje od teraz.

## Lint

`npm run lint` (ESLint, flat config w `eslint.config.js`, poziom "lekki": `eslint:recommended`
+ `typescript-eslint recommended` + `react-hooks`/`react-refresh` dla `client/`). Odpalane w CI
na każdym PR. Błędy blokują, ostrzeżenia (np. nieużywane zmienne) nie.

## Zmienne środowiskowe
Patrz `.env.example`.
