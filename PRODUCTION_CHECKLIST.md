# Diligen Production Checklist

This is the near-term execution checklist for turning the current frontend prototype into a production-ready enterprise application.

## Current Status

Last updated: June 2026.

The core demo workflow is now real:

1. A user can sign in through Supabase.
2. The app resolves the user's workspace.
3. Deals are stored in Supabase and scoped to the user's organization.
4. Deal stage/status changes persist in Supabase.
5. A user can paste CIM/deal text into a deal.
6. The server sends that text to Claude through the Anthropic API.
7. Claude returns structured JSON.
8. The app saves the analysis JSON to Supabase.
9. The deal score/status/stage update from that analysis.
10. The deal Overview and CIM Analysis tabs display the saved Claude analysis.

This means the investor-demo path should be:

Create or open a deal -> paste CIM text -> run AI analysis -> show Overview/CIM Analysis populated from Supabase.

## What Is Real Right Now

- [x] Supabase auth/login.
- [x] Protected app routes.
- [x] Workspace/org lookup after login.
- [x] Team invite flow.
- [x] Invite acceptance and password setup.
- [x] Password reset flow.
- [x] Real team/member display in Settings.
- [x] Role update/revoke invite/remove member backend behavior.
- [x] Organization-scoped deals table.
- [x] Organization-scoped deal document metadata table.
- [x] Organization-scoped analysis outputs table.
- [x] Real `/deals` list from Supabase.
- [x] Real `/deals/[id]` lookup from Supabase.
- [x] Manual deal creation persists to Supabase.
- [x] Upload dialog creates a real deal and saves document metadata.
- [x] Deal stage changes persist to Supabase.
- [x] Pipeline drag/drop persists stage changes.
- [x] Pass/unpass deal action persists stage changes.
- [x] Manual analysis JSON save persists to Supabase.
- [x] Claude text analysis route persists to Supabase.
- [x] Deal header metrics use the saved analysis object.
- [x] CIM Analysis tab uses the saved analysis object.
- [x] Overview tab uses the saved analysis object.
- [x] IC Memo reads from the same analysis object for core memo content.

## What Is Still Demo Or Mocked

- [ ] Actual PDF file upload to private storage.
- [ ] PDF text extraction.
- [ ] OCR for scanned/image PDFs.
- [ ] Table extraction from PDFs/Excel.
- [ ] Background processing jobs.
- [ ] Source citations/page references.
- [ ] Confidence scoring.
- [ ] Human review/edit workflow for AI outputs.
- [ ] KPI History data.
- [ ] Financial workbook data.
- [ ] Valuation workbench data.
- [ ] Diligence checklist persistence.
- [ ] Notes persistence.
- [ ] Dashboard analytics.
- [ ] Full audit log UI.
- [ ] Billing/Stripe.
- [ ] Production email/SMTP branding.
- [ ] MFA/SSO/SCIM enterprise auth.
- [ ] SOC 2 controls and evidence program.

## How Much Is Left

Demo/MVP readiness:

- The core AI analysis loop is working.
- The surrounding product still needs polish so unsupported tabs do not look like fake data.
- Best next demo work: hide/label mocked tabs, add latest-analysis metadata, and make one golden demo deal feel polished end to end.

Production readiness:

- This is not production-ready yet.
- The largest remaining work is file ingestion, durable job processing, structured data models for diligence/KPIs/financials, auditability, and enterprise security/compliance.
- Realistically, a production enterprise version is a multi-month build, not a weekend cleanup.

## 1. Stabilize The Codebase

- [x] Pick one package manager: `npm` or `pnpm`.
- [x] Remove the unused lockfile: either `package-lock.json` or `pnpm-lock.yaml`.
- [x] Fix `npm run lint` by installing/configuring ESLint or replacing the broken script.
- [x] Remove `typescript.ignoreBuildErrors: true` from `next.config.mjs`.
- [x] Fix the Google font build issue by self-hosting fonts or using system fonts.
- [x] Clean broken encoding characters such as `â€”`, `Â·`, and `â€¦`.
- [x] Confirm `npm run build` passes locally.
- [x] Confirm TypeScript passes with `npx tsc --noEmit`.

## 2. Fix Dependency And Security Problems

- [x] Replace, remove, or isolate the vulnerable `xlsx` dependency.
- [x] Decide whether early exports should use CSV, server-side Excel generation, or a safer maintained Excel library.
- [x] Run `npm audit` after dependency cleanup.
- [ ] Add a repeatable process for dependency updates and vulnerability review.
- [ ] Monitor the remaining moderate `postcss` advisory inside Next.js; do not run `npm audit fix --force` because it proposes an unsafe framework downgrade.

## 3. Set Up Supabase Foundation

- [x] Create a Supabase dev project.
- [x] Add Supabase environment variables to `.env.local`.
- [x] Install Supabase client packages.
- [x] Create initial SQL setup files.
- [ ] Create core tables:
  - [x] `organizations`
  - [x] `profiles`
  - [x] `organization_members`
  - [x] `deals`
  - [x] `deal_documents`
  - [x] `analysis_outputs`
  - [ ] `notes`
  - [ ] `kpis`
  - [x] `audit_events`
- [x] Enable Row Level Security on current customer-data tables.
- [x] Add basic organization/workspace isolation policies.

## 4. Add Auth

- [x] Start with Supabase email/password or magic-link auth.
- [x] Make signup invite-only for the current workspace flow.
- [x] Protect app routes under `/dashboard`, `/deals`, `/analysis`, `/kpi-tracker`, `/trend-analyzer`, and `/settings`.
- [x] Redirect logged-out users to `/login`.
- [x] Create a user profile after invite acceptance.
- [x] Attach each user to an organization/workspace.
- [x] Replace fake user data in the sidebar with the real logged-in user.
- [x] Add sign-out behavior connected to Supabase.
- [ ] Defer SSO/SAML until later enterprise work.

## 5. Replace Mock Deal Data

- [ ] Replace all `lib/mock-data.ts` usage with Supabase-backed queries.
- [ ] Load real deals on `/dashboard`.
- [x] Load real deals on `/deals`.
- [x] Load a real deal by ID on `/deals/[id]`.
- [x] Persist manual deal creation.
- [x] Persist deal stage changes.
- [ ] Persist notes.
- [ ] Persist checklist/diligence items.
- [ ] Keep a clearly separated demo workspace for investor demos.

## 6. Add Real File Upload Basics

- [ ] Create private Supabase Storage bucket for deal documents.
- [ ] Upload PDFs to Supabase Storage.
- [ ] Save document metadata in the `documents` table.
- [ ] Restrict document access to the owning organization.
- [ ] Show upload progress in the UI.
- [ ] Show uploaded documents in the deal document tab.
- [ ] Add document statuses:
  - [ ] `uploaded`
  - [ ] `processing`
  - [ ] `failed`
  - [ ] `complete`
- [ ] Add file type and size validation.

## 7. Add Processing And Job Status

- [ ] Create an `analysis_jobs` table.
- [ ] Start a job after document upload.
- [ ] Show job status in the UI.
- [ ] Add failed-job states and retry options.
- [ ] Initially allow jobs to produce demo structured output.
- [ ] Later replace demo output with real OCR/text extraction/AI analysis.

## 8. Add AI And Document Intelligence

- [x] Add first text-to-Claude analysis route for pasted CIM/deal text.
- [x] Require structured JSON output from Claude.
- [x] Save Claude analysis output to Supabase.
- [x] Display saved Claude output in CIM Analysis.
- [x] Display saved Claude output in Overview.
- [ ] Extract text from PDFs.
- [ ] Extract tables from PDFs and Excel files.
- [ ] Add OCR for scanned PDFs.
- [ ] Parse financial statements.
- [ ] Extract KPIs.
- [ ] Extract EBITDA adjustments and add-backs.
- [ ] Extract customer concentration and other risk signals.
- [ ] Generate red flags and diligence questions.
- [ ] Add citations back to source documents.
- [ ] Add confidence scores.
- [ ] Add human review/edit workflow.
- [ ] Track prompt and analysis versions.

## 9. Investor Demo Polish

- [ ] Keep one golden demo workspace.
- [ ] Make one golden demo deal work perfectly end to end.
- [ ] Ensure dashboard, deals, detail page, KPI tracker, trend analyzer, and analysis builder are stable.
- [ ] Remove unsupported buttons or clearly mark them as coming soon.
- [ ] Make exports reliable or hide them for the demo.
- [ ] Remove or soften unsupported claims such as SOC 2, zero data retention, and end-to-end encryption unless they are true.
- [ ] Prepare a clear script explaining what is live now versus what is on the roadmap.

## Recommended Build Order

1. Codebase cleanup and dependency fixes.
2. Supabase environment and client setup.
3. Database schema and Row Level Security.
4. Auth and protected routes.
5. Real deals CRUD.
6. Real document upload.
7. Processing/job status.
8. AI/document analysis.
9. Enterprise security and compliance.
