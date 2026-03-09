# Feature Log – Pension AI Analyzer

This file tracks high-level features implemented in the project. Update it whenever a new feature is added.

## 2026-03-03

- **Phase 3: Projection + Gap Engine**
  - Added deterministic projection engine in `packages/ai` (`projection` module) that aggregates balances and pension projections from structured extraction.
  - Added projection gap analysis (data completeness and projection-gap flags) computed without AI and exposed via the analysis API response.

- **Phase 3.5: Simulation Engine (What-if deposits)**
  - Added deterministic simulation engine in `packages/ai` (`simulation` module) to estimate changes in projected balance and monthly pension under configurable deposit increase scenarios.
  - Wired simulation output into the analysis API response and (optionally) appended simulation runs into `Extraction.meta.simulations` without DB schema changes.

- **Phase 4: Action Tasks (Waze Step 1)**
  - Introduced a persistent `Task` model (with status, priority, and source metadata) linked to each `Document`, ensuring stable, idempotent tasks identified by `(documentId, taskKey)`.
  - Implemented a worker-side task generator that converts red flags and projection/gap signals into neutral “things to check” tasks, upserting them per document.
  - Added API support to fetch and update tasks (`GET /documents/:documentId/tasks`, `PATCH /tasks/:taskId`) and included the current task list in the analysis response.


