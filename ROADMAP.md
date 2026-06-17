# Roadmap: zgodność z project-rules.md i gotowość produkcyjna

Ten dokument śledzi postęp prac wynikających z audytu projektu względem `project-rules.md`
(zasady startu projektu, bezpieczeństwo, CI, observability, deployment, proces).
Aktualizować po zamknięciu każdej fazy.

## Status ogólny

| Faza | Temat | Status |
|------|-------|--------|
| 1 | Bezpieczeństwo + CI | ✅ Zrobione (PR #1, zmergowane) |
| 2 | Observability (Sentry + logi) | ⬜ Do zrobienia |
| 3 | Testy integracyjne i e2e | ✅ Zrobione (PR #3) |
| 4 | Deployment i środowiska | ✅ Kod/configi zrobione (PR #4), decyzje organizacyjne zostają |
| 5 | Repo / organizacja / proces | ⬜ Do zrobienia |
| 6 | Migracja DB na Supabase (opcjonalna) | ⬜ Do decyzji |

---

## Faza 1: Bezpieczeństwo + CI — ✅ Zrobione

- [x] Sanityzacja HTML na `description` (XSS fix) — `sanitizeDescription()` w `listing.controller.ts`
- [x] Logowanie zdarzeń bezpieczeństwa — `server/src/utils/logger.ts` (auth_failed, login_failed/success, unhandled_error)
- [x] Naprawa 3/6 failujących testów jednostkowych (brak env vars przed importem) — `jest.config.js` `setupFiles`
- [x] `.github/workflows/ci.yml` — typecheck + test + build na każdym PR
- [x] Smoke test frontu (Vitest miał 0 testów)
- [x] `CLAUDE.md` zgodny z faktyczną implementacją

**Pozostało do weryfikacji na produkcji:**
- [ ] Ręczny test API na żywym środowisku: POST z `<script>` w `description` → potwierdzić usunięcie tagu

---

## Faza 2: Observability (Sentry + logi)

- [ ] Założyć projekt Sentry (frontend + backend)
- [ ] Zintegrować Sentry SDK z Express (`server/src/index.ts`)
- [ ] Zintegrować Sentry SDK z React (podłączyć do istniejącego error boundary)
- [ ] Source maps dla produkcji (upload przy buildzie)
- [ ] Release tracking (tag wersji przy deployu)
- [ ] Alerty dla zespołu przy krytycznych błędach
- [ ] Rozszerzyć `logger.ts`, żeby `security`/`error` eventy szły też do Sentry, nie tylko do konsoli

---

## Faza 3: Testy integracyjne i e2e — ✅ Zrobione

- [x] `tests/integration` z testową bazą Postgres (`allegro_seller_test`, osobna od dev)
- [x] Integracyjne: pełny flow auth (register → login → refresh → logout) + przypadki błędne
- [x] Integracyjne: listing CRUD + autoryzacja (dostęp do listingu innego `userId` → 404)
- [x] Integracyjne: publish flow (mock Allegro service) + przypadek disconnected platform
- [x] Wybór i setup frameworku e2e (Playwright)
- [x] e2e: rejestracja → dodanie listingu → publikacja → status widoczny w UI (happy path)
- [x] e2e smoke: strona logowania renderuje się bez błędów konsoli
- [x] Dodanie testów integracyjnych do `ci.yml` (osobny serwis Postgres w GitHub Actions)
- [x] Refaktor `index.ts` → `app.ts`/`index.ts`, żeby `app` był testowalny przez supertest bez bindowania portu

**Świadomie poza zakresem tej fazy:**
- [ ] e2e w automatycznym CI — wymaga orkiestracji docker-compose (Postgres+MinIO) w GitHub Actions; zostaje jako lokalny skrypt `npm run test:e2e` na razie (decyzja z rozmowy — ryzyko flaky CI)
- [ ] Weryfikacja realnego coverage względem progu 70% w `jest.config.js` (próg dotyczy tylko testów jednostkowych)

**Znalezione przy pisaniu testów (naprawione w tym PR):**
- Bug: dwa logowania tego samego użytkownika w tej samej sekundzie kończyły się 500 (kolizja unikalnego refresh tokenu — JWT bez `jti` był identyczny). Naprawione przez dodanie `jwtid` w `auth.service.ts`.
- Gap procesowy: `prisma/migrations/` zawiera tylko `.gitkeep` — projekt nie ma historii migracji, schemat był zarządzany przez `prisma db push` lokalnie. CI testów integracyjnych też używa `db push`. **Do rozważenia w Fazie 4/5:** wygenerowanie pierwszej realnej migracji (`prisma migrate dev --name init`), żeby mieć odtwarzalną historię schematu przed produkcją.

---

## Faza 4: Deployment i środowiska — ✅ Kod/configi zrobione, decyzje organizacyjne zostają

- [x] `Dockerfile` produkcyjny dla `server` (root, multi-stage, generyczny — działa z dowolnym hostingiem Docker)
- [x] `client/vercel.json` (SPA rewrite dla React Router)
- [x] `docs/DEPLOYMENT.md` — pełna lista env vars per środowisko, architektura wdrożenia, decyzje
- [x] CI: krok `docker build` na każdym PR, żeby Dockerfile nie psuł się bez wykrycia
- [x] Docelowy storage obrazów w produkcji: **realny S3/R2** (decyzja, zero zmian w kodzie — już wspierane przez `@aws-sdk/client-s3`)
- [x] Baza danych w produkcji: **generyczny managed Postgres**, niezależny od Supabase (Faza 6 zostaje opcjonalna)

**Wymaga decyzji/dostępu, którego nie mam — do zrobienia przez Was/dev'a:**
- [ ] Wybór konkretnego hostingu backendu (Railway/Render/Fly.io/VPS) i jego podłączenie do repo
- [ ] Założenie produkcyjnego bucketu S3/R2 + klucze
- [ ] Założenie projektu Vercel + ustawienie Root Directory = `client` + zmienne `VITE_API_URL` per środowisko
- [ ] Wybór hostingu Postgresa + **weryfikacja, że ma automatyczne backupy i jaki jest retention**
- [ ] Wygenerowanie pierwszej migracji Prisma (`migrate dev --name init`) przed pierwszym realnym deployem — patrz `docs/DEPLOYMENT.md`, blocker zostawiony z Fazy 3
- [ ] Nowe, unikalne `JWT_SECRET`/`JWT_REFRESH_SECRET`/`ENCRYPTION_KEY` dla produkcji (nie reużywać wartości dev/testowych)

---

## Faza 5: Repo / organizacja / proces

- [ ] Decyzja: przenieść repo do organizacji Red Sky czy zostaje u dev'a
- [ ] Role i uprawnienia (Admin / Maintainer / Developer / Read-only)
- [ ] Branch protection na `main` — wymagany PR + zielone CI przed merge
- [ ] Konwencja commitów (obecnie bez standardu)
- [ ] Dodanie ESLint (obecnie tylko `tsc --noEmit` jako zamiennik lintu w CI)
- [ ] README per moduł (granice odpowiedzialności, public API)

---

## Faza 6 (opcjonalna): Migracja bazy na Supabase

- [ ] Decyzja: tylko hosting Postgresa na Supabase, czy pełne przejście (Auth + Storage + RLS)
- [ ] Wariant lekki: zmiana `DATABASE_URL` na Supabase + test migracji Prisma
- [ ] Wariant pełny: migracja `auth.service.ts` / `auth.middleware.ts` na Supabase Auth
- [ ] Wariant pełny: migracja image upload na Supabase Storage
- [ ] Wariant pełny: RLS policies jako dodatkowa warstwa do istniejącego filtra `userId`
- [ ] Monitoring Supabase: logi database/auth/edge functions/API + alerty (wymóg `project-rules.md` pkt 11)

---

## Co NIE jest objęte tą roadmapą

Fazy 1–6 zamykają zgodność z `project-rules.md` (proces, bezpieczeństwo, CI, observability,
deployment). To **nie jest** to samo co "produkt gotowy do sprzedaży". Poza zakresem tego
dokumentu, do oddzielnej oceny:
- kompletność funkcjonalna (czy wszystkie potrzebne funkcje biznesowe istnieją)
- realna integracja z Allegro API (obecnie `ALLEGRO_MOCK=true` domyślnie — wymaga testów z prawdziwym kontem/tokenem)
- RODO / ochrona danych osobowych (jeśli przetwarzane są dane klientów)
- wydajność i skalowanie pod realnym obciążeniem
- UX/dostępność (accessibility)
