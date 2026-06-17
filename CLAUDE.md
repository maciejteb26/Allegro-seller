# Allegro Seller — CLAUDE.md

## Opis projektu
Narzędzie SaaS do wystawiania ogłoszeń części samochodowych/motocyklowych na Allegro.

## Architektura
Modular monolith — monorepo z dwoma pakietami:
- `/client` — React 18 + TypeScript (Vite)
- `/server` — Node.js + Express + TypeScript

## Stack
**Frontend:** React 18, TypeScript, Vite, React Router v6, Zustand, TanStack Query, React Hook Form, Zod, Tailwind CSS, shadcn/ui, Lucide React
**Backend:** Node.js, Express, TypeScript, PostgreSQL, Prisma ORM, JWT, bcrypt, AWS S3 (MinIO lokalnie), Multer, Sharp, Anthropic SDK
**Infra:** Docker, docker-compose (postgres + minio)

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

## Zmienne środowiskowe
Patrz `.env.example`.
