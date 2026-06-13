# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Pension AI Analyzer** — a backend pipeline that ingests Israeli pension PDFs, extracts structured data via AI, and exposes analysis (red flags, projections, retirement gap, simulations, tasks) through a REST API. No frontend exists yet.

The long-term vision is a "Waze for Pension" — guiding users step-by-step to improve their retirement readiness.

## Commands

All commands run from the repo root with `pnpm`.

### Infrastructure (required before dev)
```bash
cd infra && docker compose up -d    # start Postgres, Redis, MinIO
docker compose down                 # stop services
```

### Install & build
```bash
pnpm install
pnpm -r build                       # build all packages
```

### Database
```bash
pnpm run db:migrate                 # apply Prisma migrations (needs .env and Postgres running)
pnpm run db:generate                # regenerate Prisma client after schema changes
```

### Run services
```bash
pnpm --filter @pension-analyzer/api start:dev      # API on port 3000 (default)
pnpm --filter @pension-analyzer/worker start:dev   # worker (connects to Redis)
```

### Tests
```bash
pnpm test                                           # run all tests (api + ai)
pnpm --filter @pension-analyzer/api test            # API tests (Jest; e2e mocks Prisma/bcrypt)
pnpm --filter @pension-analyzer/ai test             # AI package tests (Vitest; projection, simulation, red-flags)
```
Run a single test file: `pnpm --filter @pension-analyzer/api test -- --testPathPattern=auth.service`

### Environment
Copy `.env.example` to `.env`. Key variables:
- `DATABASE_URL` — Postgres (use port `5433` with docker-compose)
- `REDIS_URL` — default `redis://localhost:6379`
- `MINIO_*` — endpoint/port/access-key/secret-key/bucket
- `JWT_SECRET` — required; must be ≥32 chars
- `AI_PROVIDER=openai` + `OPENAI_API_KEY` — set for real extraction; omit to use stub

## Architecture

### Workspace layout
```
apps/
  api/      NestJS REST API (HTTP, validation, DB, queueing)
  worker/   BullMQ worker (PDF parse, AI extraction, DB writes)
packages/
  ai/       Zod extraction schema + OpenAI/stub provider + projection/simulation/red-flags engines
  database/ Prisma schema and client (single source of truth for DB)
  domain/   TypeScript interfaces mirroring Prisma models (used at DTO layer)
  common/   Shared constants (MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES, DOCUMENT_PROCESSING_QUEUE)
infra/
  docker-compose.yml  Postgres 16 (5433→5432), Redis 7, MinIO
```

### End-to-end flow
1. Client registers/logs in → receives JWT (`POST /auth/register`, `POST /auth/login`)
2. Client uploads PDF with Bearer token → `POST /documents`
   - API validates size/MIME, stores PDF in MinIO, creates `Document` + `Job (PENDING)` in Postgres, enqueues `jobId` on Redis/BullMQ
3. Worker picks up job:
   - Locks job with `UPDATE ... WHERE status IN (PENDING, FAILED) RETURNING` to prevent double-processing
   - Downloads PDF from MinIO, extracts text via `pdf-parse`
   - Calls `extractStructured()` from `@pension-analyzer/ai` → structured JSON validated by `PensionExtractionSchema` (Zod)
   - Runs `computeRedFlags()` and `buildTasksFromAnalysis()` deterministically
   - Wraps `Extraction` creation + `Task` upserts + `Job → DONE` in a Prisma transaction
4. Client polls `GET /jobs/:jobId` for status, then fetches `GET /documents/:documentId/analysis`
   - API runs projection (`computeProjection`), optional retirement gap, default simulation (`runSimulation`), and returns everything in one payload

### AI usage boundary
AI is **only** used for structured text extraction (`packages/ai/src/extractor.ts`). Rules, projections, simulations, and task generation are all deterministic code. This is intentional — keep it this way.

### Authentication & authorization
All document/job/task endpoints require `JwtAuthGuard`. Always scope DB queries by `userId` from the JWT (e.g., `where: { id: documentId, userId }`). Return 404 when a resource doesn't belong to the requesting user — never 403.

### Key design patterns
- **New API feature:** Add a NestJS module/controller under `apps/api/src/`. Use `JwtAuthGuard` + `@CurrentUser()` decorator; pass `userId` into services.
- **New extraction field:** Update `PensionExtractionSchema` in `packages/ai/src/schema.ts` → update the prompt in `packages/ai/src/prompts/v1.ts` → run Prisma migration if persisting to DB.
- **New background step:** Extend `apps/worker/src/main.ts` following the existing `processJobById` locking pattern; never throw unhandled errors — capture them in `job.error` or `extraction.analysisError`.
- **Zod transforms:** Use `.nullable().optional().transform(v => v ?? default)` in schemas rather than scattered null-checks downstream.

### Docs sync rule (from `.cursor/rules/docs-sync.mdc`)
After any code change that affects endpoints, data flow, or DB schema, update:
- `docs/ARCHITECTURE.md` (sequence diagram, component list, endpoint list)
- `docs/DATABASE-SCHEMA.md` (models, enums, relations)
- `docs/PROJECT_CONTEXT.md` (engine descriptions, product flow)
- `.cursor/rules/pension-architecture.mdc` (architecture principles)

Do doc updates in the same commit as the code change.

### Safety rule
Never use financial advice language. All AI output and analysis must use neutral phrasing: "you may want to check", "consider verifying". Never log raw document text.

## Pending work
- **Phase 5 extended auth** (Google OAuth, refresh tokens, password reset, email verification, roles): full spec at `docs/PLAN_PHASE5_EXTENDED_AUTH.md`.
