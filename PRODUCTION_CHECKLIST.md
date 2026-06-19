# Diligen Production Checklist

This is the near-term execution checklist for turning the current frontend prototype into a production-ready enterprise application.

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

- [ ] Create a Supabase dev project.
- [ ] Add Supabase environment variables to `.env.local`.
- [ ] Install Supabase client packages.
- [ ] Create database migrations.
- [ ] Create core tables:
  - [ ] `organizations`
  - [ ] `profiles`
  - [ ] `organization_members`
  - [ ] `deals`
  - [ ] `documents`
  - [ ] `analyses`
  - [ ] `notes`
  - [ ] `kpis`
  - [ ] `audit_events`
- [ ] Enable Row Level Security on all customer-data tables.
- [ ] Add basic organization/workspace isolation policies.

## 4. Add Auth

- [x] Start with Supabase email/password or magic-link auth.
- [ ] Make signup invite-only.
- [x] Protect app routes under `/dashboard`, `/deals`, `/analysis`, `/kpi-tracker`, `/trend-analyzer`, and `/settings`.
- [x] Redirect logged-out users to `/login`.
- [ ] Create a user profile after signup/login.
- [ ] Attach each user to an organization/workspace.
- [x] Replace fake user data in the sidebar with the real logged-in user.
- [x] Add sign-out behavior connected to Supabase.
- [ ] Defer SSO/SAML until later enterprise work.

## 5. Replace Mock Deal Data

- [ ] Replace `lib/mock-data.ts` deal list usage with Supabase-backed queries.
- [ ] Load real deals on `/dashboard`.
- [ ] Load real deals on `/deals`.
- [ ] Load a real deal by ID on `/deals/[id]`.
- [ ] Persist manual deal creation.
- [ ] Persist deal stage changes.
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
