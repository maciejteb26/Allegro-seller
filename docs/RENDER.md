# Wdrożenie na Render.com

Ten dokument opisuje wdrożenie całego stacku (frontend + backend + baza) na [Render.com](https://render.com) przy użyciu pliku `render.yaml` (Blueprint).

## Architektura na Render

| Usługa | Typ | Opis |
|--------|-----|------|
| `szybkiewystawianie-api` | Web Service (Docker) | Express + Prisma, port z `PORT` |
| `szybkiewystawianie-web` | Static Site | React build z `client/dist` |
| `szybkiewystawianie-db` | PostgreSQL | Managed Postgres (plan free) |

## Szybki start

1. **Push** repozytorium na GitHub/GitLab.
2. W [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** → wybierz repo.
3. Render utworzy 3 zasoby z `render.yaml`.
4. **Uzupełnij ręcznie** w ustawieniach `szybkiewystawianie-api` (zmienne oznaczone `sync: false`):
   - `ENCRYPTION_KEY` — dokładnie **32 znaki** (np. `openssl rand -hex 16`)
   - `S3_*` — Cloudflare R2 lub AWS S3
   - `ALLEGRO_REDIRECT_URI` — np. `https://szybkiewystawianie-api.onrender.com/api/platforms/allegro/oauth/callback`
5. **Poczekaj** na pierwszy deploy obu usług web (API + static). Render automatycznie ustawi `CLIENT_URL` i `VITE_API_URL` przez `RENDER_EXTERNAL_URL`.
6. **Seed bazy** (jednorazowo, lokalnie z produkcyjnym `DATABASE_URL` z dashboardu Postgres):

   ```bash
   cd server
   DATABASE_URL="postgresql://..." DIRECT_URL="postgresql://..." npm run prisma:seed
   ```

7. Otwórz URL static site (`szybkiewystawianie-web`) lub podłącz domenę `szybkiewystawianie.pl`.

## Migracje bazy

Przy każdym starcie kontenera API uruchamiany jest `prisma migrate deploy` (skrypt `server/docker-entrypoint.sh`). Nowe migracje commituj do `server/prisma/migrations/` i push — Render przebuduje obraz automatycznie.

## Storage obrazów (S3 / R2)

MinIO z `docker-compose.yml` **nie działa** na Render. Potrzebujesz zewnętrznego bucketu:

### Cloudflare R2 (zalecane, darmowy tier)

| Zmienna | Przykład |
|---------|----------|
| `S3_ENDPOINT` | `https://<account-id>.r2.cloudflarestorage.com` |
| `S3_BUCKET` | `szybkiewystawianie-prod` |
| `S3_REGION` | `auto` |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | klucze z R2 API Tokens |

### AWS S3

| Zmienna | Przykład |
|---------|----------|
| `S3_ENDPOINT` | *(puste — używa domyślnego endpointu AWS)* |
| `S3_BUCKET` | `szybkiewystawianie-prod` |
| `S3_REGION` | `eu-central-1` |

## Cookies i CORS

W produkcji backend ustawia cookies z `secure: true` i `sameSite: 'none'`. Wymaga to HTTPS na obu domenach — Render zapewnia to domyślnie. `CLIENT_URL` musi dokładnie odpowiadać URL frontendu (np. `https://szybkiewystawianie.pl`).

## Domena własna

W Render Dashboard → `szybkiewystawianie-web` → **Settings** → **Custom Domains** → dodaj `szybkiewystawianie.pl` i skonfiguruj DNS u rejestratora.

## Free tier — ograniczenia

- **Web Service** usypia się po ~15 min nieaktywności (cold start ~30 s).
- **PostgreSQL free** wygasa po 90 dniach — rozważ upgrade przed produkcją.
- **Static Site** — bez limitu usypiania.

## Alternatywa: tylko backend na Render

Jeśli frontend zostaje na Vercel, usuń sekcję `szybkiewystawianie-web` z `render.yaml` i ustaw ręcznie:

- `CLIENT_URL` = `https://szybkiewystawianie.pl`
- Na Vercel: `VITE_API_URL` = URL Render API

Patrz też: [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md).
