# Database schema

PostgreSQL schema for the Pension AI Analyzer. Defined in `packages/database/prisma/schema.prisma` and applied via Prisma migrations.

---

## Datasource

| Property | Value |
|----------|--------|
| **Provider** | PostgreSQL |
| **URL** | From env: `DATABASE_URL` |

Example (local with Docker):  
`postgresql://app:app@localhost:5433/pension_ai?schema=public`

---

## Enums

### `JobStatus`

Lifecycle of a document-processing job.

| Value   | Description |
|--------|-------------|
| `PENDING` | Job created, not yet picked by a worker |
| `RUNNING` | Worker is processing the document |
| `DONE`    | Processing finished successfully |
| `FAILED`  | Processing failed (see `Job.error`) |

---

## Models

### `Document`

Represents an uploaded PDF file. Stored in object storage (MinIO); this row holds metadata and the storage key.

| Column             | Type     | Nullable | Description |
|--------------------|----------|----------|-------------|
| `id`               | UUID     | No       | Primary key (default: `uuid()`) |
| `originalFileName` | String   | No       | Original name of the uploaded file |
| `mimeType`         | String   | No       | MIME type (e.g. `application/pdf`) |
| `storageKey`       | String   | No       | Key used to fetch the file from MinIO |
| `createdAt`        | DateTime | No       | When the document was created |

**Relations**

- `jobs` → one-to-many → `Job`
- `extractions` → one-to-many → `Extraction`

---

### `Job`

A single processing run for a document (PDF text extraction + optional AI structured extraction). Created when a document is uploaded; consumed by the worker.

| Column       | Type      | Nullable | Description |
|--------------|-----------|----------|-------------|
| `id`         | UUID      | No       | Primary key (default: `uuid()`) |
| `documentId` | UUID      | No       | FK → `Document.id` |
| `status`    | JobStatus | No       | `PENDING` \| `RUNNING` \| `DONE` \| `FAILED` |
| `attempts`   | Int       | No       | Number of processing attempts (default: 0) |
| `error`     | String    | Yes      | Error message when `status = FAILED` |
| `createdAt`  | DateTime  | No       | When the job was created |
| `updatedAt`  | DateTime  | No       | Last update (auto) |
| `startedAt`  | DateTime  | Yes      | When the worker started processing |
| `finishedAt`| DateTime  | Yes      | When processing finished or failed |
| `lockedAt`  | DateTime  | Yes      | Used for job locking |

**Relations**

- `document` → many-to-one → `Document`

---

### `Extraction`

Result of processing one document: raw text from the PDF and optional AI-derived structured data. One row per processing run (tied to the document; “latest” is determined by `createdAt`).

| Column          | Type   | Nullable | Description |
|-----------------|--------|----------|-------------|
| `id`            | UUID   | No       | Primary key (default: `uuid()`) |
| `documentId`    | UUID   | No       | FK → `Document.id` |
| `text`          | String | No       | Full text extracted from the PDF |
| `textStorageKey`| String | Yes      | Optional key if text is stored externally |
| `meta`          | Json   | Yes      | Arbitrary metadata (e.g. `{ "numPages": 3 }`) |
| `structured`    | Json   | Yes      | AI-extracted JSON matching `PensionExtraction` schema (provider, plan type, balances, funds, etc.) |
| `analysisError` | String | Yes      | Error message if AI structured extraction failed (job can still be `DONE`) |
| `createdAt`     | DateTime | No     | When the extraction was created |

**Relations**

- `document` → many-to-one → `Document`

---

## Entity relationship (high level)

```
Document 1 ──────┬──────── N Job
                 │
                 └──────── N Extraction
```

- Each **Document** has many **Job**s (one per processing run; latest by `createdAt`).
- Each **Document** has many **Extraction**s (one per successful text extraction; latest by `createdAt`).
- **Job** and **Extraction** are not directly linked; correlation is by `documentId` and ordering by time.

---

## Migrations

Migrations live under `packages/database/prisma/migrations/`. To apply from repo root (with `.env` containing `DATABASE_URL`):

```bash
pnpm run db:migrate
```

To regenerate the Prisma client only:

```bash
pnpm run db:generate
```
