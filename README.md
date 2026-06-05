# Allegro Seller

Narzędzie SaaS do publikacji ogłoszeń części samochodowych na Allegro.

## Szybki start

```bash
docker-compose up -d && npm install && npm run dev
```

## Wymagania

- Node.js 20+
- Docker Desktop

## Uruchomienie (dev)

1. Skopiuj `.env.example` do `server/.env` (lub `.env` w root — zależnie od konfiguracji).
2. Uruchom infrastrukturę: `docker-compose up -d`.
3. Wykonaj migracje i seed:
   ```bash
   cd server
   npm run prisma:migrate
   npm run prisma:seed
   ```
4. W root projektu uruchom: `npm run dev`.

## Architektura

- `client/` — React + TypeScript + Vite
- `server/` — Express + TypeScript + Prisma
- Integracja Allegro działa domyślnie w MOCK mode (`ALLEGRO_MOCK=true`)
