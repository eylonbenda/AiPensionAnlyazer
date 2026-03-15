# Testing – Pension AI Analyzer

## Overview

- **`apps/api`** – Jest. Unit tests (e.g. `*.spec.ts`) and e2e tests (e.g. `*.e2e-spec.ts`). Auth tests mock `@pension-analyzer/database` and `bcryptjs` so no running database is required.
- **`packages/ai`** – Vitest. Unit tests for projection, simulation, and red-flags engines.

## Running tests

From the repository root:

```bash
# API (auth and other Nest modules)
pnpm --filter @pension-analyzer/api test

# API in watch mode
pnpm --filter @pension-analyzer/api test:watch

# AI package (projection, simulation, red-flags)
pnpm --filter @pension-analyzer/ai test
```

## Phase 5 auth test coverage

- **AuthService (unit):** `register` (success + duplicate email), `validateUser` (match, user not found, wrong password), `login`, `getUserById` (found, not found).
- **Auth (e2e):** `POST /auth/register` (201 + body, 409 on duplicate), `POST /auth/login` (201 valid, 401 wrong password, 401 user not found), `GET /auth/me` (401 without token, 200 with valid Bearer token).

## Rule: add tests for every new feature

When you implement a new feature:

1. **API:** Add or extend unit tests for new or changed services (mock external deps). Add e2e tests for new or changed HTTP endpoints (status codes, response shape, auth/ownership).
2. **Packages (e.g. `packages/ai`):** Add or extend tests for new or changed logic (engines, schemas, utils).
3. Update this file (or the relevant test file) if you introduce a new test suite or change how tests are run.

This keeps regression risk low and documents intended behavior.
