# Diligen Implementation Roadmap

Last updated: June 23, 2026

This roadmap reflects the current app after the latest UI/workflow pull. The priority is to keep the polished UI work moving while turning each important surface into real organization-scoped backend functionality.

## Current State

### Working Now

- [x] Supabase Auth is installed and wired into the app.
- [x] Users can sign in, accept invites, set passwords, reset passwords, and access protected app routes.
- [x] Organization/workspace membership exists.
- [x] Team invite, revoke invite, remove member, and role-change flows exist.
- [x] Deals are stored in Supabase and scoped by organization.
- [x] Manual deal creation persists.
- [x] Deal stage changes persist.
- [x] Pass / unpass persists.
- [x] Dashboard reads real deal data.
- [x] Claude CIM analysis can run from pasted text and save structured output.
- [x] Overview reads real saved Claude analysis where available.
- [x] Notes are persistent in Supabase and show author/timestamp.
- [x] Private PDF document upload is wired through Supabase Storage.
- [x] Documents tab can show uploaded document rows and open signed URLs.
- [x] Latest pulled UI builds successfully.

### Still Mock Or Partially Real

- [ ] Document upload is PDF-only and needs broader file support later.
- [ ] Documents tab has secure signed-link viewing, but not an in-app document viewer.
- [ ] PDF text extraction is not connected.
- [ ] OCR is not connected.
- [ ] Analysis still depends on pasted text instead of uploaded documents.
- [ ] Analysis history/jobs/concurrency locking are not implemented.
- [ ] Financials are mostly UI/demo data.
- [ ] Valuation is mostly UI/demo logic and needs real extracted financial data.
- [ ] Diligence checklist still needs persistence.
- [ ] Call notes UI/workflow exists, but backend persistence should be confirmed/implemented.
- [ ] Trend analyzer and some secondary surfaces still use mock data.
- [ ] Audit logging is not implemented across the app.

## Immediate Backend Build Order

### 1. Stabilize The Updated UI Base

Priority: immediate.

- [x] Pull latest UI changes.
- [x] Remove `tsconfig.tsbuildinfo` from Git tracking.
- [x] Add `tsconfig.tsbuildinfo` to `.gitignore`.
- [x] Confirm `npm run lint` passes.
- [x] Confirm `npx tsc --noEmit` passes.
- [x] Confirm `npm run build` passes.
- [ ] Avoid backend edits directly inside unfinished UI-only components unless the data contract is clear.

Goal: everyone can pull and build the same project without generated-file conflicts.

### 2. Secure Documents Foundation

Priority: highest next backend step.

- [x] Create a private Supabase Storage bucket for deal documents.
- [x] Store files under an organization/deal scoped path.
- [ ] Add/confirm document metadata columns: `organization_id`, `deal_id`, `name`, `document_type`, `mime_type`, `size_bytes`, `storage_path`, `extraction_status`, `uploaded_by`, `created_at`.
- [x] Upload real files, not just metadata.
- [x] Validate allowed file types.
- [x] Validate file size limits.
- [ ] Show upload progress and errors.
- [x] Generate short-lived signed URLs for viewing/downloading.
- [x] Make the Documents tab show real uploaded files.
- [x] Open documents in a new browser tab for the MVP.

Goal: a user can upload a CIM/document to a deal, see it in Documents, and open it securely. Another organization cannot access it.

### 3. Document Text Extraction

Priority: after real upload/view works.

- [ ] Extract text from text-layer PDFs.
- [ ] Store extracted text page-by-page.
- [ ] Add document processing statuses: `uploaded`, `extracting`, `ready_for_analysis`, `failed`.
- [ ] Track extraction errors.
- [ ] Add basic quality checks for empty/garbled pages.
- [ ] Add OCR fallback later for scanned PDFs.

Goal: the app can turn an uploaded CIM into usable text without manual copy/paste.

### 4. AI Analysis Jobs

Priority: after extraction.

- [ ] Create `analysis_jobs`.
- [ ] Only allow one active CIM analysis job per deal at a time.
- [ ] Store who started the job.
- [ ] Store job status, timestamps, model, prompt version, and failure reason.
- [ ] Show job progress in the Analysis tab.
- [ ] Save final structured output into `analysis_outputs`.
- [ ] Keep the current Claude JSON schema, but move from pasted text to extracted document text.

Goal: analysis becomes a real backend workflow, not a one-off button call.

### 5. Financials And Valuation

Priority: after CIM upload/extraction is stable.

- [ ] Add real financial extraction output separate from overview analysis.
- [ ] Store numeric values as numbers, not strings.
- [ ] Create tables for historical financials, projections, add-backs, capex, debt, and working capital.
- [ ] Use backend calculations for margins, growth, valuation ranges, MOIC/IRR, and scenario outputs.
- [ ] Make Financials tab read from these tables.
- [ ] Make Valuation tab read from financial tables and user assumptions.
- [ ] Preserve source references back to document/page/chunk where possible.

Goal: Financials become the source data; Valuation becomes calculated investor assumptions on top of that data.

### 6. Persistence For Remaining Workflow Tabs

Priority: medium.

- [ ] Persist diligence checklist items.
- [ ] Persist call notes.
- [ ] Connect call notes to deal, author, organization, and timestamps.
- [ ] Decide whether call intelligence uses raw call notes, transcript files, or both.
- [ ] Persist IC memo edits/versions.
- [ ] Add lightweight history/activity events.

Goal: the full deal workspace survives refresh and supports team collaboration.

### 7. Security And Enterprise Readiness

Priority: before real customers.

- [ ] Add audit events for login, invite, role change, document upload, analysis run, note changes, and deal changes.
- [ ] Add rate limiting on auth-sensitive and AI-costly routes.
- [ ] Add organization-level usage limits.
- [ ] Add admin-only controls for billing/team/security settings.
- [ ] Add production SMTP.
- [ ] Add MFA/TOTP.
- [ ] Add monitoring/error logging.
- [ ] Add tests for RLS assumptions and API authorization.
- [ ] Add backups/export strategy.

Goal: move from investor-demo SaaS to early customer SaaS.

## Recommended Next Sprint

Build the document foundation before adding more AI complexity.

1. Implement private Supabase Storage upload for deal documents.
2. Make Documents tab display real uploaded files.
3. Add secure signed-link viewing in a new tab.
4. Store document metadata correctly.
5. Then connect PDF text extraction.
6. Then route extracted text into the existing Claude analysis flow.

## Demo Guidance

For the current investor demo, the strongest flow is:

1. Sign in.
2. Show Dashboard.
3. Open a real deal.
4. Run or show saved Claude CIM analysis.
5. Show Overview populated from that analysis.
6. Add a persistent note with author/timestamp.
7. Briefly show team/workspace access control.

Avoid presenting these as finished backend features yet:

- Financial model automation.
- Full valuation engine.
- OCR.
- Secure document viewer.
- Complete audit log.
- Enterprise compliance.
