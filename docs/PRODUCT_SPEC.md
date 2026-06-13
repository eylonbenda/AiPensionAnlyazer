# Pension AI Analyzer — Product Specification

## Product Overview

Pension AI Analyzer is a system that analyzes pension reports and transforms them into clear, structured insights.

The product helps users understand:

- their pension savings
- projected retirement income
- potential issues in their plans
- what actions they may want to take

Most pension reports are complex and difficult to understand.  
This system simplifies them into actionable, explainable outputs.

The long-term vision is to build a **“Waze for Pension”** — a system that guides users step-by-step toward better retirement readiness.

---

# Primary User Flow

## Step 1 — Upload Pension Report

User uploads a pension report (PDF).

**System behavior:**
- Store document
- Create processing job
- Run analysis asynchronously

**Acceptance criteria:**
- Upload succeeds for valid PDF
- Large documents are supported
- API does not block (async processing)

---

## Step 2 — Document Analysis

The system extracts structured data from the pension report.

**Extracted data may include:**
- pension provider
- plan type
- plan name
- balances
- projected savings
- projected monthly pension
- management fees
- deposits
- plan status

**Acceptance criteria:**
- Missing fields must not break analysis
- Output must match defined schema
- Invalid extraction must be handled safely

---

## Step 3 — Issue Detection (Flags)

The system detects potential issues in the pension data.

**Examples:**
- multiple pension plans
- high management fees
- missing fee information
- missing deposit information
- inactive or closed plans

Flags represent **things the user may want to check**.

**Allowed wording:**
- "You may want to verify..."
- "Consider checking..."

**Not allowed:**
- "You should move your money"
- "Choose a different fund"

**Acceptance criteria:**
- Flags must be deterministic
- Flags must be derived from structured data
- No financial advice

---

## Step 4 — Retirement Projection

The system calculates expected retirement outcomes.

**Outputs:**
- total current balance
- projected retirement balance
- projected monthly pension

If pension data is missing, estimate using:

```
estimatedMonthlyPension = projectedBalance / 200
```

**Acceptance criteria:**
- Calculations must be deterministic
- Missing data must be handled safely
- Approximations must be documented

---

## Step 5 — Retirement Gap Analysis

Users may provide a target retirement pension.

Example:

```
Target monthly pension: 15000
```

**System calculates:**
- projected monthly pension
- difference vs target
- retirement status

**Statuses:**
- SHORTFALL
- ON_TRACK
- SURPLUS

**Acceptance criteria:**
- Target is optional
- Gap must be calculated consistently
- No financial recommendations

---

## Step 6 — Simulation (What-If Analysis)

Users can simulate changes.

Example:

```
Increase monthly deposit by ₪500
```

**System estimates:**
- future projected balance
- future projected pension
- improvement vs baseline

**Acceptance criteria:**
- Simulation must be deterministic
- Assumptions must be transparent
- Output must be labeled as estimate

---

## Step 7 — Action Tasks

The system converts analysis into tasks.

**Examples:**
- Verify multiple plans
- Check management fees
- Confirm deposit status
- Review retirement target

**Task fields:**
- title
- description
- priority
- status

**Statuses:**
- TODO
- IN_PROGRESS
- DONE
- DISMISSED

**Acceptance criteria:**
- Tasks must be stable (no duplicates)
- Tasks must be linked to document
- User must be able to update status

---

# Analysis Output Structure

The analysis response must include:

```
structuredData
flags
projection
gapInsight
simulation
tasks
```

This represents the full analysis of a pension report.

---

# Edge Cases

## Missing Data

If fields are missing:
- continue analysis
- use fallback calculations

## Multiple Plans

System must:
- aggregate balances
- aggregate projections

## Incomplete Reports

System must:
- use available data
- avoid failing analysis

## Scanned Documents

If text extraction is insufficient:
- flag document for OCR processing

---

# Safety Requirements

The system must not provide financial advice.

**Allowed:**
- "You may want to check..."
- "Consider verifying..."

**Not allowed:**
- "You should invest..."
- "Move your pension..."
- "Choose fund X..."

The system provides insights, not recommendations.

---

# Future Product Direction

Planned capabilities:

- OCR support for scanned PDFs
- document comparison over time
- change tracking (balances, fees)
- conversational interface
- pension glossary (RAG)
- provider-specific parsing

Long-term direction:

```
Pension Analyzer
→ Retirement Insight Platform
→ Retirement Simulation System
→ Personal Retirement Navigation System
```

---

# Development Philosophy

The system must prioritize:

- deterministic logic
- explainable outputs
- safe language
- transparent assumptions

AI should be used only for:

- extracting structured data from documents

---

# Product Goal

Transform complex pension reports into:

- understandable insights
- retirement projections
- actionable next steps

Helping users better understand and navigate their financial future.