Pension AI Analyzer — Project Context
Product Vision

This project is building a system called Pension AI Analyzer.

The goal of the product is to help users understand their pension situation by analyzing pension reports (PDF documents) and transforming complex financial information into clear insights, issues to check, and actionable tasks.

Most people cannot understand pension reports.
This system converts those reports into:

structured financial data

detected issues (red flags)

retirement projections

gap analysis

actionable tasks

future simulations

The long-term vision is to evolve this system into a “Waze for Pension” — a system that guides users step-by-step to improve their retirement readiness.

Core Product Flow

The system processes pension reports through a pipeline:

User uploads pension PDF
↓
Document text extraction
↓
AI converts text → structured pension JSON
↓
Rules engine analyzes structured data
↓
Red flags are generated
↓
Projection engine calculates retirement outlook
↓
Gap engine compares projected pension vs target
↓
Simulation engine runs "what-if" scenarios
↓
Task engine converts insights into actionable tasks

Each step builds on the previous one.

Architecture

The system follows a modular monolith architecture with async processing.

Main components:

apps/
  api/        → NestJS REST API
  worker/     → background processing workers

packages/
  ai/         → OpenAI structured extraction
  rules/      → deterministic analysis rules
  projection/ → retirement projection calculations
  simulation/ → what-if simulations
  tasks/      → task generation engine
  domain/     → shared types and models
  common/     → shared utilities

infra/
  docker-compose.yml

Infrastructure services:

PostgreSQL → main database

Redis → BullMQ job queue

MinIO → S3-compatible file storage

OpenAI API → structured extraction only

Data Processing Pipeline

1. Document Upload

User uploads a pension PDF.

POST /documents

API stores file in MinIO and creates:

document record

processing job

Job is queued via BullMQ.

1. Worker Processing

Worker pipeline:

download PDF
↓
extract text
↓
AI structured extraction
↓
rules engine
↓
projection engine
↓
gap engine
↓
task generator

The result is stored in:

extractions.meta
Structured Extraction (AI)

AI is used only for structured data extraction.

Input:

raw pension report text

Output:

structured JSON matching Zod schema

The schema represents pension data such as:

plans

balances

fees

deposits

pension projections

AI is not used for advice or decision making.

Rules Engine

A deterministic rules engine analyzes structured data.

Examples:

multiple pension plans detected

high management fees

missing fee information

missing deposit information

inactive or closed plans

Rules produce flags:

meta.flags

Flags describe issues users may want to check.

Projection Engine

The projection engine calculates:

totalCurrentBalance
totalProjectedBalance
totalMonthlyPensionProjected
dataCompletenessScore

If monthly pension data is missing, it estimates:

estimatedMonthlyPension = projectedBalance / 200

This is a conservative approximation.

Gap Engine

Users can optionally provide a target retirement pension.

Example:

targetMonthlyPension = 15000

The system calculates:

projectedMonthlyPension
gapAmount
gapPercent
status = SHORTFALL | ON_TRACK | SURPLUS

This helps users understand whether they are on track for retirement.

Simulation Engine

Users can run what-if scenarios.

Example:

extraMonthlyDeposit = 500
years = 25
annualReturn = 4%

The system estimates:

futureValueOfExtraDeposits
newProjectedBalance
newProjectedPension
delta vs baseline

This allows users to explore how changes affect retirement outcomes.

Task Engine (Waze-like behavior)

Analysis results are converted into tasks.

Examples:

verify multiple plans

request updated management fee quote

confirm deposit status

review retirement target

Tasks have statuses:

TODO
IN_PROGRESS
DONE
DISMISSED

Tasks help guide users step-by-step.

AI Usage Principles

AI is used only where necessary:

Used for:

extracting structured data from messy text

Not used for:

rules

financial advice

projections

simulations

These are deterministic calculations implemented in code.

This makes the system:

auditable

stable

predictable

cheaper to operate

Safety and Compliance Principles

The system must:

avoid financial advice language

use wording like:

"you may want to check"

"consider verifying"

avoid storing sensitive PII unnecessarily

never log raw document text

Future Roadmap

**Implementation plans (detailed specs for later work):**

- **Phase 5 extended auth** – Google OAuth, refresh tokens, password reset, email verification, roles/admin. See `docs/PLAN_PHASE5_EXTENDED_AUTH.md` for the full plan and implementation order.

Planned features include:

user accounts and secure document access

OCR support for scanned PDFs

document comparison (report vs report)

change tracking in balances and fees

RAG-based pension glossary Q&A

conversational interface over structured data

provider-specific report parsing

pension optimization simulations

Long-term vision:

Pension AI Analyzer → Personal Retirement Navigation System
Development Guidelines

When extending this system:

Prefer deterministic code over AI.

Keep AI limited to data extraction.

Ensure pipelines are idempotent.

Avoid breaking schema versions.

Never log sensitive financial data.

Project Goal

Build a system that turns complex pension reports into:

understandable insights

retirement projections

actionable next steps

Ultimately helping users navigate their financial future.