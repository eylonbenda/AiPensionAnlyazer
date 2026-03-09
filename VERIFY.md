# Verification: migration + run services + curl

Use these commands from the **repository root** (`c:\AiPensionAnlyazer`). For `curl` uploads on Windows, use **Git Bash** or **WSL** so `-F` works; otherwise use the PowerShell alternative shown.

---

## 1. Start infrastructure

```powershell
cd infra
docker compose up -d
cd ..
```

---

## 2. Environment

Create `.env` from the example (if you haven’t already) and set `DATABASE_URL` for your setup. With `infra/docker-compose.yml`, Postgres is on port **5433**:

```powershell
copy .env.example .env
```

Ensure `.env` contains:

```
DATABASE_URL=postgresql://app:app@localhost:5433/pension_ai?schema=public
REDIS_URL=redis://localhost:6379
```

For **real AI extraction** (OpenAI), set `AI_PROVIDER=openai` and `OPENAI_API_KEY` to your key. See `.env.example` for `AI_MODEL`, `AI_TEMPERATURE`, `AI_MAX_TOKENS`, `AI_TIMEOUT_MS`. Without a key, the worker uses the stub and runs without calling any AI API.

---

## 3. Install and build

```powershell
pnpm install
pnpm run build
```

---

## 4. Database: generate client + run migrations

From the repo root, `db:migrate` loads `DATABASE_URL` from the root `.env` file (see step 2). Run:

```powershell
pnpm run db:generate
pnpm run db:migrate
```

If `db:migrate` prompts for a migration name, you can accept the default or enter e.g. `add_extraction_structured`.

---

## 5. Run services (two terminals)

**Terminal 1 – API**

```powershell
pnpm --filter @pension-analyzer/api start:dev
```

**Terminal 2 – Worker**

```powershell
pnpm --filter @pension-analyzer/worker start:dev
```

Leave both running. Wait until you see the API listening (e.g. port 3000) and the worker log “worker started”.

---

## 6. Curl examples to verify

### Health check

```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok"}`

---

### Upload a PDF (use Git Bash or WSL on Windows)

Replace `C:/path/to/your.pdf` with a real PDF path.

```bash
curl -X POST http://localhost:3000/documents -F "file=@C:/path/to/your.pdf"
```

Example response:

```json
{"documentId":"<uuid>","jobId":"<uuid>"}
```

Save the `documentId` and `jobId` for the next steps.

**PowerShell alternative (upload):**

```powershell
$uri = "http://localhost:3000/documents"
$filePath = "C:\path\to\your.pdf"
$form = @{ file = Get-Item -Path $filePath }
Invoke-RestMethod -Uri $uri -Method Post -Form $form
```

---

### Job status

Replace `<jobId>` with the `jobId` from the upload response.

```bash
curl http://localhost:3000/jobs/<jobId>
```

Example (when done): `"status":"DONE"` (and `finishedAt`, `attempts`, etc.). Poll a few times if you see `PENDING` or `RUNNING`.

---

### Document analysis

Replace `<documentId>` with the `documentId` from the upload response.

```bash
curl http://localhost:3000/documents/<documentId>/analysis
```

Example response shape:

```json
{
  "documentId": "<uuid>",
  "job": {
    "id": "<jobId>",
    "status": "DONE",
    "attempts": 1,
    "error": null,
    "createdAt": "...",
    "updatedAt": "...",
    "startedAt": "...",
    "finishedAt": "..."
  },
  "hasText": true,
  "structured": {
    "pensionProviderName": "Example Pension Provider",
    "planType": "Defined Contribution",
    "country": "Unknown",
    "currency": "USD",
    ...
  },
  "analysisError": null,
  "summary": "Provider: Example Pension Provider | Plan type: Defined Contribution"
}
```

With the current stub AI, `structured` and `summary` will always look like the example above; `analysisError` is `null` when extraction succeeded.

---

### Extraction (full Extraction model)

Returns the latest extraction row for the document: raw `text`, `meta`, `structured` JSON, and `analysisError`. Use after the job is DONE.

Replace `<documentId>` with the `documentId` from the upload response.

```bash
curl http://localhost:3000/documents/<documentId>/extraction
```

Example response shape:

```json
{
  "id": "<extraction-uuid>",
  "documentId": "<document-uuid>",
  "text": "Raw PDF text content...",
  "textStorageKey": null,
  "meta": { "numPages": 3 },
  "structured": {
    "pensionProviderName": "Example Pension Provider",
    "planType": "Defined Contribution",
    "country": "Unknown",
    "currency": "USD",
    ...
  },
  "analysisError": null,
  "createdAt": "..."
}
```

Returns 404 if the document does not exist or no extraction has been created yet.

---

## One-liner verification (after upload)

After you have `DOCUMENT_ID` and `JOB_ID` from the upload:

```bash
# Job status
curl -s http://localhost:3000/jobs/JOB_ID

# Analysis (run after job is DONE)
curl -s http://localhost:3000/documents/DOCUMENT_ID/analysis

# Extraction (full Extraction model: text, meta, structured, analysisError)
curl -s http://localhost:3000/documents/DOCUMENT_ID/extraction
```

Replace `JOB_ID` and `DOCUMENT_ID` with the actual UUIDs.

---

## Troubleshooting

### MinIO: "The difference between the request time and the server's time is too large"

This happens when your PC clock and the MinIO (Docker) container clock differ by more than ~15 minutes. MinIO rejects the request for security.

**Check the clocks:**

```powershell
Get-Date
docker exec pension_ai_minio date
```

If they differ by more than a few minutes (e.g. PC 19:11 local vs MinIO 15:29 UTC):

1. **Sync Windows time:** Settings → Time & language → turn on "Set time automatically" → **Sync now**.
2. **Restart Docker so the container gets the correct time:**
   ```powershell
   cd infra
   docker compose down
   docker compose up -d
   ```
3. If it still fails, **restart Docker Desktop** so the Linux VM’s clock resyncs with Windows, then run `docker compose up -d` again in `infra`.
4. Re-run `docker exec pension_ai_minio date`; it should be close to your current UTC time. Then try the upload again.
