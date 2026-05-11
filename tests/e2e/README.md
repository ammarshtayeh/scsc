# Playwright E2E

## Setup

1. Copy env template:

```powershell
Copy-Item .env.playwright.example .env.playwright
```

2. Fill credentials in `.env.playwright`.
3. Install browser binaries:

```powershell
npx playwright install
```

## Run

```powershell
npm run test:e2e
```

Run only smoke:

```powershell
npx playwright test -g "@smoke"
```

or

```powershell
npm run test:e2e:smoke
```

Run redirect-focused checks:

```powershell
npm run test:e2e:redirect
```

## GitHub Actions

Workflow file: `.github/workflows/playwright-e2e.yml`

- Push/PR: runs smoke suite.
- Manual run (`workflow_dispatch`): runs smoke then full suite.

Required repository secrets:

- `BASE_URL` (example: `https://scsc-iota.vercel.app`)
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `USER_EMAIL`
- `USER_PASSWORD`
- `MOD_EMAIL`
- `MOD_PASSWORD`
