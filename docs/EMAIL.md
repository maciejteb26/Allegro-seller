# Email — konfiguracja szybkiewystawianie.pl

Projekt wysyła maile transakcyjne przez własny backend (`server/src/services/email.service.ts`). Na razie jedyny przypadek użycia to **reset hasła** (`POST /api/auth/forgot-password`).

Autentykacja pozostaje we własnym JWT — **nie** używamy Supabase Auth ani Resend jako providera logowania.

## Co wysyłamy

| Zdarzenie | Endpoint | Odbiorca |
|-----------|----------|----------|
| Reset hasła | `POST /api/auth/forgot-password` | Email użytkownika z linkiem `/reset-password?token=…` |

Link jest ważny **1 godzinę**. Po resecie unieważniane są wszystkie sesje (refresh tokeny).

## Wybór providera (priorytet)

Backend wybiera provider w tej kolejności:

1. **Resend** — gdy ustawiony `RESEND_API_KEY` (zalecane)
2. **SMTP** — gdy ustawiony `SMTP_HOST` (nodemailer)
3. **EMAIL_MOCK** — gdy brak obu; link resetu trafia do **logów serwera** (dev)

```env
EMAIL_MOCK=true   # wymusza mock nawet z kluczem Resend
EMAIL_MOCK=false  # wysyłka przez Resend lub SMTP
```

## Zmienne środowiskowe

Szablon w `server/.env.example`:

```env
# Dev (bez weryfikacji domeny Resend):
EMAIL_FROM=onboarding@resend.dev
RESEND_API_KEY=re_xxxxxxxx
EMAIL_MOCK=false

# Prod (po Verified domeny):
# EMAIL_FROM=noreply@szybkiewystawianie.pl
# RESEND_API_KEY=re_xxxxxxxx
# EMAIL_MOCK=false
```

| Zmienna | Opis |
|---------|------|
| `EMAIL_FROM` | Nadawca (musi być zweryfikowany w Resend lub dozwolony na koncie testowym) |
| `RESEND_API_KEY` | Klucz API z [resend.com/api-keys](https://resend.com/api-keys) |
| `SMTP_HOST` | Alternatywa: host SMTP (np. SendGrid, home.pl) |
| `SMTP_PORT` | Domyślnie `587` |
| `SMTP_USER` / `SMTP_PASS` | Dane logowania SMTP (opcjonalne) |
| `SMTP_SECURE` | `true` dla portu 465 |
| `EMAIL_MOCK` | `true` = brak wysyłki, link w logach |

> **Sekrety:** `RESEND_API_KEY` tylko w `.env` / Render Dashboard — nigdy w repozytorium.

Na Render dodaj te zmienne do usługi `szybkiewystawianie-api` (patrz [`docs/RENDER.md`](./RENDER.md)).

---

## Resend — szybki start (test)

1. Załóż konto na [resend.com](https://resend.com)
2. **API Keys** → wygeneruj klucz → wklej do `RESEND_API_KEY`
3. Bez weryfikacji własnej domeny możesz wysyłać:
   - **Od:** `onboarding@resend.dev`
   - **Do:** adres email powiązany z kontem Resend

```env
EMAIL_FROM=onboarding@resend.dev
RESEND_API_KEY=re_...
EMAIL_MOCK=false
CLIENT_URL=http://localhost:5173
```

4. Uruchom API, wejdź na `/forgot-password`, podaj swój email
5. Sprawdź skrzynkę — link prowadzi na `CLIENT_URL/reset-password?token=…`

W trybie mock (bez klucza) szukaj w logach serwera zdarzenia `password_reset_email_mock` z polem `resetUrl`.

---

## Resend — własna domena i DNS

Aby wysyłać z `@szybkiewystawianie.pl` na dowolne adresy:

### 1. Dodaj domenę

1. [resend.com/domains](https://resend.com/domains) → **Add Domain**
2. Wpisz `szybkiewystawianie.pl` (root domain)
3. Otwórz zakładkę **Records** — Resend wygeneruje **unikalne** rekordy dla Twojej domeny

### 2. Rekordy DNS (u rejestratora)

Dokładne wartości bierz z panelu Resend. Typowy zestaw:

| Typ | Host / nazwa | Wartość (przykład) | Uwagi |
|-----|--------------|-------------------|--------|
| **MX** | `send` | `feedback-smtp.eu-west-1.amazonses.com` | Priorytet `10` |
| **TXT** | `send` | `v=spf1 include:amazonses.com ~all` | SPF — return-path |
| **CNAME** | `abc._domainkey` | `abc.dkim.amazonses.com` | DKIM (zwykle 3 rekordy) |

**Ważne:**

- Rekordy DKIM to **CNAME** na subdomenach `*._domainkey`
- MX i SPF TXT idą na subdomenę `send` (return-path bounces)
- Jeśli na `@` masz już rekord SPF, **scal** go w jeden TXT — nie publikuj dwóch SPF na tej samej nazwie
- W Cloudflare ustaw **DNS only** (szara chmura) dla rekordów mailowych
- Propagacja DNS: od kilkunastu minut do 48 h

### 3. Weryfikacja

Status w Resend zmieni się na **Verified**. Wtedy ustaw:

```env
EMAIL_FROM=noreply@szybkiewystawianie.pl
```

(lub `auth@`, `hello@` — dowolny adres z zweryfikowanej domeny)

### 4. DMARC (zalecane po SPF + DKIM)

Dodaj u rejestratora:

| Typ | Host | Wartość |
|-----|------|---------|
| **TXT** | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@szybkiewystawianie.pl;` |

Na start `p=none` (monitoring). Po testach rozważ `p=quarantine` lub `p=reject`.

Dokumentacja Resend: [Managing Domains](https://resend.com/docs/dashboard/domains) · [DMARC](https://resend.com/docs/dashboard/domains/dmarc)

---

## Alternatywa: SMTP

Jeśli nie używasz Resend, skonfiguruj klasyczny SMTP:

```env
RESEND_API_KEY=
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM=noreply@szybkiewystawianie.pl
EMAIL_MOCK=false
```

Gdy ustawiony jest `RESEND_API_KEY`, SMTP jest pomijany.

---

## Produkcja (Render)

W **Environment** usługi API:

| Zmienna | Wartość |
|---------|---------|
| `EMAIL_FROM` | `noreply@szybkiewystawianie.pl` |
| `RESEND_API_KEY` | klucz produkcyjny (osobny od dev) |
| `EMAIL_MOCK` | `false` |
| `CLIENT_URL` | `https://szybkiewystawianie.pl` |

`CLIENT_URL` musi być zgodny z domeną frontendu — od niego budowany jest link w mailu resetu.

---

## Bezpieczeństwo

- Endpoint `forgot-password` ma rate limit: **5 żądań / godzinę / IP** (produkcja)
- Odpowiedź API jest taka sama dla istniejącego i nieistniejącego emaila (brak enumeracji kont)
- Token resetu przechowywany jako hash SHA-256 w tabeli `PasswordResetToken`
- Przy wycieku klucza API: natychmiast usuń go w Resend i wygeneruj nowy
- Nie commituj kluczy — używaj `.env` lokalnie i secretów na Render

---

## Rozwiązywanie problemów

| Problem | Rozwiązanie |
|---------|-------------|
| Mail nie dochodzi (dev) | Sprawdź `EMAIL_MOCK=false`, poprawny `RESEND_API_KEY`, logi serwera |
| Resend: tylko na swój email | Normalne bez Verified domeny — użyj `onboarding@resend.dev` |
| Resend: invalid from | `EMAIL_FROM` musi być z zweryfikowanej domeny lub `onboarding@resend.dev` |
| Link w mailu nie działa | Sprawdź `CLIENT_URL` (dev: `http://localhost:5173`) |
| Brak tabeli w bazie | `cd server && npm run prisma:migrate:deploy` |

---

## Pliki w repozytorium

| Plik | Rola |
|------|------|
| `server/src/services/email.service.ts` | Resend / SMTP / mock |
| `server/src/services/auth.service.ts` | `requestPasswordReset`, `resetPassword` |
| `server/src/controllers/auth.controller.ts` | Endpointy `/auth/forgot-password`, `/auth/reset-password` |
| `client/src/pages/Auth/ForgotPassword.tsx` | Formularz „zapomniałem hasła” |
| `client/src/pages/Auth/ResetPassword.tsx` | Ustawienie nowego hasła |
