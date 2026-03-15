# Pension AI Analyzer

## Local infrastructure

This project includes a local development stack using Docker Compose for PostgreSQL, Redis, and MinIO.

### Prerequisites

- Docker and Docker Compose (v2 recommended, `docker compose` CLI)
- Node.js and pnpm

### Start infrastructure

From the repository root:

```bash
cd infra
docker compose up -d
```

To stop the services:

```bash
docker compose down
```

### Verify services

From another terminal:

- **List running containers:**

  ```bash
  docker ps
  ```

  You should see containers for PostgreSQL, Redis, and MinIO.

- **PostgreSQL:**

  - Host: `localhost`
  - Port: `5432`
  - Database: `pension_ai`
  - User: `app`
  - Password: `app`

- **Redis:**

  - Host: `localhost`
  - Port: `6379`

- **MinIO:**

  - API endpoint: `http://localhost:9000`
  - Console (web UI): `http://localhost:9001`
  - Access key: `app`
  - Secret key: `appappapp`

Open the MinIO console URL in your browser and log in with the access/secret key above to confirm MinIO is running.

## Install & build

From the repository root:

```bash
pnpm install
pnpm -r build
```

## Database (Prisma)

With Postgres running (see infra section) and `.env` configured (copy `.env.example` to `.env` and adjust if needed):

```bash
pnpm run db:migrate
```

This will apply Prisma migrations using the shared `@pension-analyzer/database` package.

## Run API and worker

In one terminal (API):

```bash
pnpm --filter @pension-analyzer/api start:dev
```

The API will start on the port defined by `API_PORT` (default `3000`).

Health check:

```bash
curl http://localhost:3000/health
```

In another terminal (worker):

```bash
pnpm --filter @pension-analyzer/worker start:dev
```

The worker connects to Redis and waits for jobs on the document processing queue.

## Tests

- **API (Phase 5 auth and beyond):** From repo root, run `pnpm --filter @pension-analyzer/api test`. Uses Jest; unit tests mock the database; e2e tests mock Prisma and bcrypt so no running DB is required.
- **AI package:** `pnpm --filter @pension-analyzer/ai test` (Vitest; projection, simulation, red-flags engines).

When adding a new feature, add or extend tests so the new behavior is covered (see `docs/TESTING.md`).

## Structured AI extraction and analysis

After the worker extracts raw text from uploaded PDF documents, it runs an AI-backed structured extraction step via the shared `@pension-analyzer/ai` package. By default the worker uses a **stub** implementation (no API key required). For real extraction, set:

- **`AI_PROVIDER=openai`** – use OpenAI for structured extraction.
- **`OPENAI_API_KEY`** – your OpenAI API key (required when `AI_PROVIDER=openai`).

Optional env (see `.env.example`): `AI_MODEL` (default `gpt-4o-mini`), `AI_TEMPERATURE`, `AI_MAX_TOKENS`, `AI_TIMEOUT_MS`. Without `OPENAI_API_KEY` or with `AI_PROVIDER=stub`, the app uses the stub and can run without any AI key.

- The worker stores:
  - Raw text in the `Extraction.text` column.
  - Structured JSON in `Extraction.structured` (JSONB).
  - Any AI-specific error message in `Extraction.analysisError`.
- Job status remains `DONE` as long as PDF text extraction succeeded; AI failures are reflected only in `analysisError`.

To inspect the analysis for a document, use the API endpoint:

```bash
curl http://localhost:3000/documents/<documentId>/analysis
```

The response includes basic job metadata, a `hasText` flag, the structured JSON payload (if available), any `analysisError`, and a short descriptive summary. The AI prompts are designed strictly for data extraction and avoid financial advice; any risk-related information is surfaced only as neutral “things to check” fields in the structured JSON.

## End-to-end flow (upload → queue → extraction → status)

1. **Ensure infra is running** (Postgres, Redis, MinIO) and migrations are applied.
2. **Start API and worker** as described above.
3. **Upload a PDF document:**

```bash
curl -X POST http://localhost:3000/documents \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/your.pdf"
```

Successful response:

```json
{
  "documentId": "<uuid>",
  "jobId": "<uuid>"
}
```

4. **Check job status:**

```bash
curl http://localhost:3000/jobs/<jobId>
```

You should see a JSON payload with `status` (`PENDING`, `RUNNING`, `DONE`, or `FAILED`), timestamps, attempts, and error if any.

