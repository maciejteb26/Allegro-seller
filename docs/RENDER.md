# Wdrożenie na Render.com

Backend i frontend na Render; **baza i storage na Supabase**. Szczegóły Supabase: [`docs/SUPABASE.md`](./SUPABASE.md).

## Architektura

| Usługa | Gdzie | Opis |
|--------|-------|------|
| `szybkiewystawianie-api` | Render (Docker) | Express + Prisma |
| `szybkiewystawianie-web` | Render (Static) | React → `client/dist` |
| Postgres | **Supabase** | `DATABASE_URL` + `DIRECT_URL` |
| Zdjęcia | **Supabase Storage** | S3 API (`S3_*` + opcjonalnie `SUPABASE_URL`) |

## Szybki start

1. **Supabase** — utwórz projekt, uruchom migracje i bucket ([`docs/SUPABASE.md`](./SUPABASE.md))
2. **Render** → New → Blueprint → wybierz repo (`render.yaml`)
3. Uzupełnij w `szybkiewystawianie-api` (sync: false):
   - `DATABASE_URL`, `DIRECT_URL` — z Supabase Connect
   - `SUPABASE_URL`, `SUPABASE_PROJECT_REF`
   - `S3_ACCESS_KEY`, `S3_SECRET_KEY` — Storage → S3 Access Keys
   - `ENCRYPTION_KEY` — dokładnie 32 znaki
   - `ALLEGRO_REDIRECT_URI` — URL callback API
4. Po deployu: seed (`npm run prisma:seed` z produkcyjnym `DIRECT_URL`)
5. Domena: Render → Custom Domains → `szybkiewystawianie.pl`

## Weryfikacja env

```bash
npm run supabase:check --workspace=server
```

## Domena własna

- **Frontend** (`szybkiewystawianie-web`): `szybkiewystawianie.pl`
- **API**: subdomena np. `api.szybkiewystawianie.pl` lub `*.onrender.com`
- Ustaw `CLIENT_URL` = URL frontendu, `VITE_API_URL` = URL API

## Free tier

- Render Web Service usypia się po nieaktywności (~30 s cold start)
- Supabase Free: 500 MB DB, 1 GB Storage — wystarczy na start

Patrz też: [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md).
