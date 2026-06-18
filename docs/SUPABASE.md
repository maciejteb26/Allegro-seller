# Supabase — konfiguracja szybkiewystawianie.pl

Projekt używa **Supabase jako backendu danych** (Postgres + Storage). Autentykacja pozostaje we własnym JWT (`auth.service.ts`) — nie wymaga Supabase Auth.

## Co jest na Supabase

| Usługa | Użycie w projekcie | Technologia |
|--------|-------------------|-------------|
| **Postgres** | Użytkownicy, oferty, kategorie | Prisma ORM |
| **Storage** | Zdjęcia ofert (`listings/…`) | AWS S3 SDK → Supabase S3 API |
| **Auth** | — | Własny JWT (bez zmian) |

## 1. Utwórz projekt

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Region: **eu-central-1** (Frankfurt) — zapisz, potrzebny do `S3_REGION`
3. Skopiuj **Project URL** i **Project ref** (np. `abcdefghijklmnop`)

## 2. Baza danych (Prisma)

W Dashboard → **Connect** skopiuj dwa connection stringi:

| Zmienna | Connection string | Port | Kiedy |
|---------|-------------------|------|-------|
| `DATABASE_URL` | **Transaction pooler** | `6543` + `?pgbouncer=true` | Runtime API (Render/Docker) |
| `DIRECT_URL` | **Session pooler** lub **Direct** | `5432` | Migracje Prisma, seed, Studio |

Przykład (zamień `[...]`):

```env
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

### Pierwsze wdrożenie schematu

Lokalnie (z produkcyjnym `DIRECT_URL` w env):

```bash
cd server
npm run prisma:migrate:deploy
npm run prisma:seed
```

Na Render migracje uruchamiają się automatycznie (`server/docker-entrypoint.sh`) — **wymaga ustawionego `DIRECT_URL`**.

> Schemat jest zarządzany przez **Prisma** (`server/prisma/migrations/`). Nie używamy `supabase/migrations/` — folder `supabase/` służy tylko do CLI lokalnego i SQL pomocniczego.

## 3. Storage (zdjęcia)

### Krok A — bucket

W **SQL Editor** uruchom:

[`supabase/storage-bucket.sql`](../supabase/storage-bucket.sql)

### Krok B — klucze S3

Dashboard → **Storage** → **S3 Access Keys** → **Generate new keys**

Ustaw w env:

```env
SUPABASE_URL=https://[PROJECT_REF].supabase.co
S3_BUCKET=szybkiewystawianie
S3_REGION=eu-central-1
S3_ACCESS_KEY=<access key id>
S3_SECRET_KEY=<secret access key>
```

`S3_ENDPOINT` **można pominąć** — backend wyliczy go z `SUPABASE_URL`:

`https://[PROJECT_REF].storage.supabase.co/storage/v1/s3`

## 4. Zmienne na Render

W `render.yaml` baza **nie jest** tworzona przez Render — podajesz Supabase ręcznie:

| Zmienna | Źródło |
|---------|--------|
| `DATABASE_URL` | Supabase → Transaction pooler |
| `DIRECT_URL` | Supabase → Session/Direct |
| `SUPABASE_URL` | Project Settings → API URL |
| `S3_*` | Storage → S3 Access Keys |
| `ENCRYPTION_KEY`, `JWT_*` | Wygeneruj nowe (nie z dev!) |

Szablon: [`.env.supabase.example`](../.env.supabase.example)

## 5. Lokalny dev

### Opcja A — docker-compose (domyślna)

Bez zmian: Postgres + MinIO z `docker-compose.yml` i `server/.env`.

### Opcja B — Supabase CLI

```bash
# Instalacja CLI: https://supabase.com/docs/guides/cli
supabase start
supabase status -o env   # connection strings + anon key
```

Ustaw w `server/.env` (wartości z `supabase status`):

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
DIRECT_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
S3_ENDPOINT=http://127.0.0.1:54321/storage/v1/s3
S3_BUCKET=szybkiewystawianie
S3_REGION=local
S3_ACCESS_KEY=<service_role lub S3 key z status>
S3_SECRET_KEY=<secret>
```

Uruchom `supabase/storage-bucket.sql` w lokalnym Studio (`http://127.0.0.1:54323`).

## 6. Weryfikacja

```bash
npm run supabase:check --workspace=server
```

Sprawdza obecność env i połączenie z bazą (wymaga `DATABASE_URL` / `DIRECT_URL`).

## 7. Backup i monitoring

- **Backupy**: Supabase Pro ma automatyczne backupy; na Free — eksport ręczny (Dashboard → Database → Backups)
- **Logi**: Dashboard → **Logs** (Postgres, Storage, API)
- **Alerty**: Integracja z zewnętrznym monitoringiem (Sentry — patrz `ROADMAP.md` Faza 2)

## Co świadomie NIE jest na Supabase

| Funkcja | Status |
|---------|--------|
| Supabase Auth | Nie — własny JWT + cookies |
| RLS na tabelach app | Nie — izolacja przez `userId` w Prisma |
| Edge Functions | Nie — Express na Render |
| Realtime | Nie używane |

Pełna migracja na Supabase Auth + RLS to osobna faza (patrz `ROADMAP.md`).
