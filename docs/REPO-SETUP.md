# Repo setup — do zrobienia przez właściciela repo

Te punkty wymagają uprawnień admina w ustawieniach GitHub. Sprawdzone: konto użyte do pracy
nad tym repo ma `push`/`triage`, nie `admin` (`gh api repos/maciejteb26/Allegro-seller --jq
.permissions`) — żadnego z poniższych nie da się skonfigurować z tego miejsca.

## 1. Branch protection na `main`

GitHub → Settings → Branches → Add branch protection rule → pattern `main`:

- ✅ **Require a pull request before merging** — żadnych commitów wprost na `main`.
  - Opcjonalnie: Require approvals (min. 1), jeśli w zespole jest więcej niż 1 osoba.
- ✅ **Require status checks to pass before merging**
  - Status check do wybrania: `build-and-test` (job z `.github/workflows/ci.yml` — obejmuje
    typecheck, lint, testy jednostkowe i integracyjne, build, oraz `docker build`).
  - ✅ Require branches to be up to date before merging.
- ✅ **Do not allow bypassing the above settings** (żeby nawet admin nie mergował bez PR —
  opcjonalne, ale zgodne z duchem `project-rules.md` pkt 9: "wszystko przez PR").

## 2. Role i uprawnienia

Generyczna struktura z `project-rules.md` (pkt 2) — przypisanie konkretnych osób zależy od
zespołu, którego nie znam:

| Rola | Uprawnienia | Kto |
|---|---|---|
| Admin | pełna kontrola, ustawienia repo | właściciel/założyciel projektu |
| Maintainer | merge PR, zarządzanie branchami | osoby odpowiedzialne za review i release |
| Developer | push do branchy, otwieranie PR | wszyscy piszący kod (w tym AI-assisted sesje) |
| Read-only | tylko odczyt | interesariusze, którzy nie commitują |

## 3. Transfer do organizacji Red Sky

`project-rules.md` (pkt 2) zaleca repo w organizacji, nie na prywatnym koncie — **decyzja
odłożona**, nie wykonana w ramach tej fazy. Jeśli i kiedy zapadnie:
GitHub → Settings → General → Transfer ownership → nazwa organizacji Red Sky. Po transferze
warto ponownie sprawdzić branch protection (czasem ustawienia repo-level przechodzą, ale role
zespołu trzeba przypisać na nowo w kontekście organizacji).

## 4. Po wykonaniu powyższego

Zaktualizuj checkboxy w `ROADMAP.md` (Faza 5) — żeby było widać w jednym miejscu, co z
checklisty `project-rules.md` jest już spełnione.
