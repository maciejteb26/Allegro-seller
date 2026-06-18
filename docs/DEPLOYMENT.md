# Deployment

Ten dokument opisuje, jak wdrożyć szybkiewystawianie.pl na produkcję, jakie zmienne środowiskowe
są potrzebne per środowisko, oraz decyzje przyjęte na razie (do ewentualnej zmiany).

## Architektura wdrożenia

- **`client`** (React + Vite, statyczny build) → Vercel **lub** Render Static Site (patrz [`docs/RENDER.md`](./RENDER.md)).
- **`server`** (Express + Prisma) → hosting z Dockerfile (Render, Railway, Fly.io, VPS). Root `Dockerfile` buduje obraz z całego monorepo (npm workspaces hoistują `node_modules`, więc nie da się zbudować `server/` w izolacji od reszty repo).
- **Baza danych**: managed Postgres (Render Postgres, Supabase, itp.).
- **Storage obrazów**: w produkcji prawdziwy S3 (AWS lub R2). MinIO z `docker-compose.yml` zostaje tylko do lokalnego dev.

### Render.com (zalecane — full stack)

Plik `render.yaml` w root projektu definiuje Blueprint: API (Docker), static site (frontend) i Postgres. Szczegóły: [`docs/RENDER.md`](./RENDER.md).

## ⚠️ Migracje Prisma

Pierwsza migracja (`server/prisma/migrations/20250618194500_init/`) jest w repozytorium.
Na produkcji stosuj **`prisma migrate deploy`** (w Dockerze uruchamiane automatycznie przez
`server/docker-entrypoint.sh`). Lokalnie: `npm run prisma:migrate --workspace=server`.

## Zmienne środowiskowe per środowisko

### Backend (gdziekolwiek hostowany)

Pełna lista w `.env.example`. Najważniejsze różnice między środowiskami:

| Zmienna | Dev | Produkcja |
|---|---|---|
| `NODE_ENV` | `development` | `production` |
| `CLIENT_URL` | `http://localhost:5173` | `https://szybkiewystawianie.pl` (lub URL Render/Vercel) |
| `DATABASE_URL` / `DIRECT_URL` | lokalny docker-compose Postgres | connection string managed Postgres |
| `S3_*` | MinIO (`localhost:9000`, `minioadmin`) | prawdziwy bucket S3/R2 + realne klucze |
| `ALLEGRO_MOCK` | `true` | `true` do momentu realnej integracji z Allegro (patrz `ROADMAP.md`) |
| `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY` | wartości testowe | **nowe, losowe** wartości — nigdy nie reużywać dev/dev-testowych sekretów na produkcji |

**Krytyczne dla auth/cookies:** `CLIENT_URL` musi być poprawnym originem produkcyjnego
frontendu. `auth.controller.ts` ustawia cookies z `sameSite: 'none'` i `secure: true` gdy
`NODE_ENV=production` — to wymaga HTTPS na obu domenach (Vercel ma to domyślnie; backend-hosting
też powinien terminować TLS).

### Frontend (Vercel)

| Zmienna | Production | Preview |
|---|---|---|
| `VITE_API_URL` | URL produkcyjnego backendu | URL backendu, do którego mają trafiać preview deploye (na start: można wskazać ten sam backend produkcyjny — osobny backend per-preview to możliwa przyszła optymalizacja, nie blocker) |

Jeśli `VITE_API_URL` jest puste, frontend woła `/api` relatywnie — działa tylko gdy backend
jest na tej samej domenie (reverse proxy), co nie jest domyślną konfiguracją tu opisaną.

## Automatyczne deploye

- **Vercel**: domyślne zachowanie po podłączeniu repo — `main` → produkcja, każdy PR → osobny
  preview deploy z unikalnym URL. Nic dodatkowego do skonfigurowania poza Root Directory.
- **Backend hosting**: większość dostawców Docker (Railway, Render, Fly.io) ma analogiczne
  zachowanie po podłączeniu repo (auto-deploy z wybranego brancha). Dokładne kroki zależą od
  wybranego dostawcy — do uzupełnienia tutaj po wyborze.

## Backup bazy danych

Nie ma jeszcze wybranego dostawcy Postgresa, więc nie ma wdrożonej strategii backupów.
Rekomendacja: przy wyborze hostingu bazy sprawdzić, czy ma wbudowane automatyczne backupy
(większość managed Postgres je ma) i jaki jest retention — zweryfikować to **przed**
pierwszym realnym wdrożeniem, nie po incydencie.

## CI

`.github/workflows/ci.yml` buduje obraz Docker (`docker build -f Dockerfile .`) na każdym PR,
żeby wyłapać błędy w Dockerfile zanim trafią na branch wdrożeniowy. To nie publikuje obrazu
do żadnego registry — tylko weryfikuje, że się buduje.
