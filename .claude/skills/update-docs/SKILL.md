---
name: update-docs
description: Keep the project docs and architecture notes in sync after code changes. Use this whenever a change under apps/, packages/, or infra/ affects behavior, data flow, API endpoints, the worker pipeline, the Prisma/DB schema, an engine/package, or an architectural pattern — i.e. anything users of the docs would need to know. Invoke as part of the same change, before finishing.
---

# Update Docs

When code changes affect observable behavior, you MUST review and update the relevant documentation in the **same change** (not as a separate follow-up). Skip this only for pure refactors, comments, tests, or formatting that change nothing a doc describes.

## Which doc to update for which change

| Change | Update |
|---|---|
| New / changed API endpoint | `docs/ARCHITECTURE.md` — endpoint list **and** the sequence diagram |
| New / changed worker pipeline step | `docs/ARCHITECTURE.md` — processing-flow section |
| New / changed Prisma model, enum, or field | `docs/DATABASE-SCHEMA.md` **and** `docs/ARCHITECTURE.md` |
| New engine or package (projection, simulation, tasks, red-flags) | `docs/PROJECT_CONTEXT.md` **and** `docs/ARCHITECTURE.md` |
| New architectural pattern or responsibility shift | `docs/PROJECT_CONTEXT.md` and the architecture notes in `CLAUDE.md` |
| New extraction field | `docs/DATABASE-SCHEMA.md` (if persisted) and the `PensionExtractionSchema` notes |

## How to update

1. Read the target doc first and match its existing style and structure.
2. Keep entries concise and factual. **Add or revise only what changed** — never delete information about unchanged parts.
3. Update Mermaid diagrams (sequence, ER, flowchart) when the flow they depict changes — don't leave a diagram describing the old behavior.
4. If a change spans several docs (e.g. a new endpoint that reads a new DB field), update all of them.
5. Cross-check against the actual code you changed — the doc must describe what the code now does, not what was planned.

## Boundaries

- This skill is about documentation only. It does not add tests or commit — do those per the normal workflow.
- Respect the project's safety rule: docs must use neutral phrasing, never financial-advice language, and never embed raw document text.
