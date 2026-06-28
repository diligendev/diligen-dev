# Revenue Explorer Production Implementation Plan

## Goal

Revenue Explorer should let a user upload customer-level revenue data, map columns, save the source file and normalized rows, generate useful analytical views, and eventually save those views so every user in the workspace sees the same analysis.

The current workflow is a strong prototype foundation. The correct production direction is to move parsing, validation, and generated-view calculations to trusted server-side code while keeping the current UI flow.

## Correct End-to-End Flow

1. User selects a deal.
2. User uploads a revenue file.
3. Server stores the original file in the `deal-documents` storage bucket.
4. Server parses the uploaded file.
5. Server returns detected columns, sample rows, row count, and validation warnings.
6. User confirms column mapping.
7. Server normalizes rows and writes them to `revenue_rows`.
8. Server creates a `revenue_files` record linked to the source document.
9. User opens the saved analysis from the deal Revenue Explorer tab.
10. User creates a generated view from real saved rows.
11. Server computes the generated view using `revenue_file_id`.
12. User reviews the output.
13. User saves the generated view so the same result is visible to the workspace.

## Important Architecture Rules

- `revenue_file_id` should be the main scope for calculations.
- Do not calculate generated views from every revenue row on a deal unless the user explicitly chooses to combine files.
- The server should parse uploaded files directly instead of trusting browser-parsed rows.
- The frontend can preview results, but saved production outputs should come from server-side compute.
- Source files should remain visible in the Documents tab as financial documents.
- Generated views should store both their configuration and a result snapshot so they remain viewable if raw rows are later purged.

## Phase 1: Stabilize The Current Client-Side Prototype

Status: Mostly done.

- Keep the current upload, mapping, save, and view workflow.
- Keep the current raw-table view.
- Keep generated views in memory for now.
- Fix deterministic date parsing.
- Fix year-over-year growth comparisons.
- Block CSV imports over the current row limit instead of silently truncating.
- Keep generated calculations scoped to the selected saved revenue file.

Remaining:

- Add unit tests for date parsing, number parsing, row limits, and generated-view math.
- Add CSV export hardening for spreadsheet formula injection.

## Phase 2: Make Import Server-Trusted

This is the next major foundation step.

Status: Started.

- Done: change the import route so the uploaded file is the source of truth.
- Done: parse CSV on the server inside `app/api/deals/[id]/revenue/import/route.ts`.
- Done: stop sending full parsed rows from the browser as the trusted input.
- Browser should send:
  - file
  - selected deal
  - confirmed mapping
- Server should:
  - parse the file
  - normalize rows
  - validate row count
  - insert `revenue_files`
  - insert `revenue_rows`
  - create/link the `deal_documents` record
- Keep the existing client parser only for preview and column-mapping UX.

Why this matters:

- Prevents mismatches between what was uploaded and what was saved.
- Makes the backend the single source of truth.
- Prepares the feature for background jobs and server-side analytics.

## Phase 3: Move Generated View Compute Server-Side

Add a server-side analytics module.

Status: Started.

Recommended file:

- `lib/revenue/analytics.ts`

It should calculate:

- Done: period columns
- Done: grouped values
- Done: percent of total
- Done: period growth
- Done: bridge analysis
- Done: concentration analysis
- Done: concentration percent total
- Done: concentration growth

Remaining:

- Done: add preview API route that calls `lib/revenue/analytics.ts`.
- Done: update the frontend to request generated-view previews from the server instead of calculating in the browser.
- Done: add saved generated views with config and result snapshots.

API direction:

- `POST /api/deals/[id]/revenue/[revenueFileId]/views/preview`

Request:

- view name
- period
- measure
- breakdown fields

Server behavior:

- verify user workspace
- verify deal belongs to org
- verify revenue file belongs to deal/org
- fetch rows by `revenue_file_id`
- compute result
- return structured output

Frontend behavior:

- modal collects configuration
- server returns preview
- user reviews output
- save comes later

## Phase 4: Save Generated Views

Add a new table for saved generated views.

Recommended table:

- `revenue_views`

Recommended fields:

- `id`
- `organization_id`
- `deal_id`
- `revenue_file_id`
- `name`
- `period`
- `measure`
- `breakdowns jsonb`
- `result_cache jsonb`
- `result_generated_at`
- `source_row_count`
- `source_date_range_start`
- `source_date_range_end`
- `created_by`
- `created_at`
- `updated_at`

Recommended behavior:

- Save the view configuration and the computed result snapshot together.
- Display saved views from the snapshot.
- Recompute only when a user intentionally regenerates or creates a new view.

Why this matters:

- Avoids storing large duplicate analytical outputs too early.
- Keeps saved outputs available even if raw `revenue_rows` are later purged.
- Lets the same workspace see the same saved views.

## Phase 5: Production Hardening

Add after the core server-side flow works.

- XLS and XLSX support.
- Worksheet selection.
- Rejected-row download.
- Import progress states.
- Background jobs for large files.
- Rename/delete saved analyses.
- Rename/delete generated views.
- Role controls for create/delete/manage.
- Virtualized raw table for large row counts.
- Stored summary metrics for dashboard speed.
- Full integration tests for org isolation.

## Current Biggest Risks

- Generated views are not saved yet.
- Generated calculations still live inside the React detail component.
- Deal-level revenue queries can include multiple files and may double-count if used for analytics.
- Large raw tables are still rendered in the browser.

## Recommended Next Step

Move the import route to server-trusted parsing first.

That gives the feature a stronger foundation before adding saved generated views or heavier server-side calculations.
