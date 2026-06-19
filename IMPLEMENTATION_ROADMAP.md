# Diligen Implementation Roadmap

This roadmap prioritizes the production foundation before AI/document intelligence. The core principle is:

> Before AI, a real user must be able to log in and only see their own firm's data.

## Phase 1: Finish Auth And Account Security

Priority: critical/high.

- [ ] Add organization/workspace-aware invite flow.
- [ ] Add sign-up constraints so users can only join through an invite or approved domain.
- [ ] Add password reset flow.
- [ ] Confirm email verification is enabled and enforced.
- [ ] Add login rate limiting or abuse protection.
- [ ] Add session timeout policy.
- [ ] Add basic audit events for sign-in, sign-out, invite accepted, password reset requested, and profile changes.
- [ ] Add MFA/TOTP support later for enterprise readiness.

Notes:

- Supabase Auth handles the authentication primitives, but the app still needs correct onboarding, organization membership, RLS, and audit behavior.
- Do not claim SOC 2, zero retention, or end-to-end encryption until those controls are implemented and verified.

## Phase 2: Database Schema And Tenant Isolation

Priority: critical.

Build the SaaS data model before replacing all mock data.

Core tables:

- [ ] `organizations`
- [ ] `profiles`
- [ ] `organization_members`
- [ ] `deals`
- [ ] `documents`
- [ ] `audit_events`

Recommended follow-on tables:

- [ ] `deal_notes`
- [ ] `diligence_items`
- [ ] `kpi_entries`
- [ ] `analyses`
- [ ] `analysis_jobs`
- [ ] `financial_models`

Security requirements:

- [ ] Enable Row Level Security on all customer-data tables.
- [ ] Enforce organization-level access on every table.
- [ ] Add role support: owner, admin, member/viewer.
- [ ] Create policies for select/insert/update/delete by organization membership.
- [ ] Confirm one organization cannot query another organization's rows.

Goal:

- [ ] Current user can resolve to exactly one or more organizations.
- [ ] UI can load the active organization.
- [ ] All future data queries are scoped by active organization.

## Phase 3: Replace Mock Data Gradually

Priority: high.

Do not rip out every mock file at once. Replace screen by screen.

Recommended order:

- [ ] Replace dashboard deal counts with real Supabase data.
- [ ] Replace `/deals` list with real deals.
- [ ] Replace `/deals/[id]` with real deal lookup.
- [ ] Persist manual deal creation.
- [ ] Persist deal stage changes.
- [ ] Persist notes.
- [ ] Persist diligence/checklist items.
- [ ] Keep a separate demo workspace or seed script for investor demos.

Goal:

- [ ] A real authenticated user can create a deal.
- [ ] That deal appears only inside that user's organization.
- [ ] Stage changes and notes survive refresh.

## Phase 4: Secure File Upload

Priority: high.

Before AI, uploaded files must be private and tied to an organization/deal.

- [ ] Create private Supabase Storage bucket.
- [ ] Upload PDF, CSV, XLSX, and DOCX files.
- [ ] Save document metadata in `documents`.
- [ ] Scope documents by organization and deal.
- [ ] Add file type validation.
- [ ] Add file size limits.
- [ ] Add upload progress.
- [ ] Add document statuses: uploaded, processing, failed, complete.
- [ ] Ensure private files are only accessed through signed URLs or server-controlled access.

Goal:

- [ ] A user can upload a document to a deal.
- [ ] Another organization cannot access that document.

## Phase 5: Processing Jobs

Priority: medium/high.

Create the job system before adding Claude/AI.

- [ ] Create `analysis_jobs`.
- [ ] Start a job after upload.
- [ ] Show job status in the UI.
- [ ] Add retry behavior.
- [ ] Add failure states and error messages.
- [ ] Initially allow deterministic/demo output.
- [ ] Store job inputs, outputs, status, timestamps, and owner.

Goal:

- [ ] Uploading a document creates a visible processing workflow.
- [ ] The UI does not pretend analysis is instant if it is not.

## Phase 6: AI / Claude Document Intelligence

Priority: after phases 1-5.

Only build the AI layer after auth, tenant isolation, real data, file upload, and job status exist.

- [ ] Extract text from uploaded documents.
- [ ] Extract tables from spreadsheets and PDFs.
- [ ] Add OCR for scanned PDFs.
- [ ] Send controlled chunks to Claude or selected model provider.
- [ ] Require structured JSON output.
- [ ] Store outputs in `analyses`.
- [ ] Add citations back to source documents.
- [ ] Add confidence scores.
- [ ] Add human review/edit workflow.
- [ ] Track prompt versions and model versions.
- [ ] Add eval/test documents to check output quality.

Goal:

- [ ] AI output is saved, auditable, reviewable, and tied to source documents.

## Phase 7: Enterprise Readiness

Priority: after MVP foundation.

- [ ] MFA enforcement by organization.
- [ ] SSO/SAML.
- [ ] SCIM provisioning.
- [ ] Admin audit log UI.
- [ ] Data retention controls.
- [ ] Export/delete organization data.
- [ ] Security policy.
- [ ] Privacy policy.
- [ ] Terms of service.
- [ ] DPA.
- [ ] Vendor/subprocessor list.
- [ ] SOC 2 readiness program.

## Immediate Recommendation

Next build step:

1. Finish auth flows: invite, password reset, email verification behavior, session settings.
2. Create schema and RLS for organizations, profiles, memberships, deals, documents, and audit events.
3. Wire the UI to real organization-scoped deals.
4. Add secure file upload.
5. Add processing jobs.
6. Add Claude/AI document intelligence.

