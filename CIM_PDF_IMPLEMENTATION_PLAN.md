# CIM PDF Implementation Plan

Goal: build the CIM PDF workflow in layers so each phase works on its own, proves functionality, and becomes the foundation for the next phase.

## Product Principle

The active CIM should become the source document for the deal analysis.

The long-term flow is:

```text
Upload active CIM
-> store private PDF
-> extract page text
-> save page text
-> run Claude from extracted text
-> save structured analysis
-> display analysis in Overview / CIM Analysis / Memo
```

The current app already has:

- [x] Private Supabase Storage bucket.
- [x] Real PDF upload.
- [x] `deal_documents` metadata.
- [x] One active CIM per deal.
- [x] CIM replacement flow.
- [x] Signed URL viewing.
- [x] Outdated-analysis warning when active CIM is newer than latest analysis.

## Phase 1: Page-Level PDF Text Extraction

Purpose: prove that uploaded CIM PDFs can be converted into usable text without copy/paste.

Build:

- [ ] Add `document_pages` table.
- [ ] Store one row per page.
- [ ] Extract text from active CIM PDF.
- [ ] Save page number, text, extraction method, and quality status.
- [ ] Mark `deal_documents.extraction_status` as `processing`, `complete`, or `failed`.
- [ ] Add backend route to extract the active CIM.

Suggested table:

```sql
create table public.document_pages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  document_id uuid not null references public.deal_documents(id) on delete cascade,
  page_number integer not null,
  text text not null default '',
  extraction_method text not null default 'pdf_text'
    check (extraction_method in ('pdf_text', 'ocr')),
  quality_status text not null default 'unchecked'
    check (quality_status in ('unchecked', 'good', 'empty', 'garbled', 'failed')),
  created_at timestamptz not null default now(),
  unique (document_id, page_number)
);
```

Success test:

- Upload a CIM.
- Click extract.
- Confirm page rows exist in Supabase.
- Confirm the document status changes to `complete`.

## Phase 2: Use Extracted Text For CIM Analysis

Purpose: remove the manual paste-text requirement.

Build:

- [ ] CIM Analysis tab detects active CIM extraction status.
- [ ] If active CIM is extracted, show `Run analysis from active CIM`.
- [ ] Backend loads `document_pages`.
- [ ] Combines page text in order.
- [ ] Sends extracted text to existing Claude analysis route.
- [ ] Saves output to `analysis_outputs`.
- [ ] Keeps paste-text fallback for debugging and bad PDFs.

Success test:

- Upload CIM.
- Extract text.
- Run analysis without pasting.
- Overview updates from saved Claude output.

## Phase 3: Processing Jobs

Purpose: make long-running extraction/analysis reliable.

Build:

- [ ] Add `document_processing_jobs`.
- [ ] Add `analysis_jobs`.
- [ ] Track status: `queued`, `processing`, `complete`, `failed`.
- [ ] Track `started_by`, `started_at`, `completed_at`, `error_message`.
- [ ] Prevent duplicate active jobs for the same active CIM.
- [ ] Show job state in Documents and CIM Analysis tabs.

Success test:

- User sees progress/status instead of a silent request.
- Failed extraction shows a clear retry option.

## Phase 4: Chunking And Source References

Purpose: make analysis scalable and auditable.

Build:

- [ ] Add `document_chunks`.
- [ ] Chunk page text by section/page range.
- [ ] Store `page_start`, `page_end`, `text`, `section_label`, and `token_count`.
- [ ] Send relevant chunks to Claude instead of raw full-document text.
- [ ] Save source references in the analysis output.

Success test:

- Analysis can cite source pages.
- Large CIMs can be handled without sending the entire document blindly.

## Phase 5: OCR Fallback

Purpose: support scanned CIMs and image-heavy PDFs.

Build:

- [ ] Detect empty/low-quality pages after normal PDF extraction.
- [ ] Send only bad pages to OCR.
- [ ] Store OCR text in `document_pages`.
- [ ] Track extraction method per page.
- [ ] Show warning when OCR was required.

Success test:

- Scanned PDF pages produce usable text.
- Text-based PDFs do not pay OCR costs.

## Phase 6: Financial Extraction

Purpose: power real Financials and Valuation tabs.

Build:

- [ ] Add financial extraction prompt separate from overview analysis.
- [ ] Store revenue, EBITDA, margins, capex, debt, add-backs, and projections as structured numeric data.
- [ ] Keep source page references.
- [ ] Financials tab reads from structured tables.
- [ ] Valuation tab calculates from structured financials and user assumptions.

Success test:

- Financials tab shows real extracted data from the CIM.
- Valuation tab uses real numbers instead of mock/demo values.

## Phase 7: Enterprise Hardening

Purpose: make the workflow production-grade.

Build:

- [ ] Audit events for extract, analyze, retry, replace CIM, and delete.
- [ ] Rate limits for extraction and AI routes.
- [ ] Virus scanning before extraction.
- [ ] Background queue for long-running processing.
- [ ] Retry and cleanup jobs for partial failures.
- [ ] Tests for org isolation and active-CIM rules.
- [ ] Monitoring for extraction/AI failures.

## Recommended Immediate Build

Start with Phase 1 and Phase 2 only.

That gives the product a real end-to-end loop:

```text
Upload CIM PDF
-> extract text
-> run Claude
-> save analysis
-> display Overview
```

Do not start with OCR, financial extraction, or enterprise queues yet. The foundation should support them, but the first win is getting active-CIM PDF text into the existing Claude analysis flow.

