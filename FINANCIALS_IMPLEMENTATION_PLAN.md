# Financials Implementation Plan

## Plain-English Overview

The first real Financials feature should come from the active CIM, not from an uploaded Excel file.

System flow:

1. A user uploads a CIM PDF to a deal.
2. The PDF is stored in the private `deal-documents` Supabase bucket.
3. The app extracts text from the active CIM into `document_pages`.
4. A dedicated financial extraction route reads that extracted CIM text.
5. Claude returns structured financial data: periods, line items, values, add-backs, warnings, and source pages.
6. The app saves the extraction run to `financial_outputs`.
7. The app saves each financial value to `financial_line_items`.
8. The Financials tab reads the latest active financial output and displays real CIM-derived financials.
9. The Valuation tab later pulls latest adjusted EBITDA from these saved line items.

This makes Financials a real first-pass diligence view: "What numbers were in the CIM, where did they come from, and are they usable?"

## What This Feature Is

Financials should answer:

- What revenue, EBITDA, margin, and add-back data did the CIM disclose?
- Which periods are actuals, TTM/LTM, or projections?
- What source page did each important number come from?
- What financial data is missing or low-confidence?
- What numbers should seed valuation?

## What This Feature Is Not Yet

Do not build these first:

- Excel upload/import.
- Full spreadsheet replacement.
- Manual financial model builder.
- QoE reconciliation.
- OCR/table-perfect extraction.
- Full audit trail for analyst edits.

Those are later phases.

## Recommended Database Foundation

Use two tables.

### 1. `financial_outputs`

One row per financial extraction run.

Purpose:

- Tracks the extraction run.
- Knows which deal, org, and CIM document created the output.
- Lets the app keep one active financial extraction per deal.
- Stores warnings and extraction metadata.

Suggested fields:

- `id`
- `organization_id`
- `deal_id`
- `document_id`
- `status`
- `is_active`
- `model`
- `prompt_version`
- `schema_version`
- `currency`
- `scale`
- `warnings jsonb`
- `created_by`
- `created_at`

### 2. `financial_line_items`

One row per financial value.

Examples:

- Revenue, FY2023, 35000000
- Revenue, FY2024, 42000000
- Adjusted EBITDA, FY2025, 12600000
- Add-back: legal fees, FY2025, 600000

Purpose:

- Makes valuation easy.
- Makes growth/margin calculations reliable.
- Allows source-page traceability.
- Avoids doing math inside a fragile JSON blob.

Suggested fields:

- `id`
- `financial_output_id`
- `organization_id`
- `deal_id`
- `category`
- `label`
- `period_label`
- `period_type`
- `period_end_date`
- `value`
- `unit`
- `source_page`
- `confidence`
- `created_at`

## Why Not Store Everything In JSONB?

JSONB is fine for warnings, metadata, and flexible lists.

But financial line items need math:

- revenue growth
- EBITDA margin
- latest EBITDA
- valuation seeding
- period comparisons

Those are better as database rows with numeric values.

## Phase 1: Database Foundation

Goal: Add the tables before building UI.

Tasks:

- Create `financial_outputs`.
- Create `financial_line_items`.
- Add RLS policies scoped by `organization_id`.
- Add indexes by `deal_id`, `organization_id`, and `financial_output_id`.
- Enforce one active financial output per deal with a partial unique index.

Completion criteria:

- SQL runs successfully.
- A logged-in org member can read their own org financial outputs.
- Other orgs cannot read the data.

## Phase 2: Financial Extraction Route

Goal: Convert active CIM text into structured financial records.

Route idea:

- `POST /api/deals/[id]/financials/extract`

System behavior:

1. Verify user is logged in and belongs to the deal's organization.
2. Find the active CIM.
3. Read extracted text from `document_pages`.
4. Send the text to Claude with a financial-only schema.
5. Validate the response.
6. Mark old financial outputs for that deal inactive.
7. Insert a new `financial_outputs` row.
8. Insert related `financial_line_items`.
9. Return the saved output summary.

Important:

- This route should not invent numbers.
- If a number is not in the CIM, return missing/low-confidence warnings.
- Source page should be included when possible.

## Phase 3: Financials Tab Real Data

Goal: Replace mock workbook defaults with saved CIM-derived financial data.

Financials tab should show:

- Latest financial extraction status.
- Revenue by period.
- Adjusted EBITDA by period.
- EBITDA margin by period.
- Add-backs.
- Source page references.
- Confidence indicators.
- Missing-data warnings.

Useful first UI:

- "Run financial extraction" button if no financial output exists.
- "Refresh from active CIM" button if the CIM changed.
- A clean table grouped by Revenue, EBITDA, Add-backs, and Other metrics.
- Badge: `AI extracted from CIM`.

Avoid for now:

- Huge spreadsheet UI.
- Editing cells.
- Complicated forecasts.

## Phase 4: Valuation Handoff

Goal: Seed valuation from real financials.

Valuation should pull:

- Latest adjusted EBITDA.
- Maybe latest revenue.
- Maybe EBITDA margin.

Then user controls:

- Entry multiple.
- Debt percentage.
- Interest rate.
- Hold period.
- EBITDA CAGR.
- Exit multiple.
- FCF conversion.

This keeps valuation useful without pretending it is a full banking model.

## Phase 5: Review And Overrides

Later, add human review.

Possible additions:

- Mark line item as verified.
- Edit extracted values.
- Save user override separately from AI value.
- Show who verified it and when.

This matters before serious enterprise usage, but does not need to be first.

## Phase 6: Excel / Additional Source Files

Later, support uploaded financial files.

Examples:

- Excel model.
- QoE report.
- Monthly financials.
- Management forecast.

Future flow:

- CIM financials are first-pass.
- Uploaded Excel/QoE can override or reconcile against CIM numbers.

## Immediate Next Build Step

Start with Phase 1.

Create SQL for:

- `financial_outputs`
- `financial_line_items`
- RLS policies
- indexes
- active-output uniqueness

Then build the extraction route.

Do not start by redesigning the Financials UI. First make the data foundation real.
