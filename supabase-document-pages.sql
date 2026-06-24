-- Diligen document page extraction setup
-- Run after supabase-product-data.sql and supabase-document-workflow.sql.

create table if not exists public.document_pages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  document_id uuid not null references public.deal_documents(id) on delete cascade,
  page_number integer not null check (page_number > 0),
  text text not null default '',
  extraction_method text not null default 'pdf_text'
    check (extraction_method in ('pdf_text', 'ocr')),
  quality_status text not null default 'unchecked'
    check (quality_status in ('unchecked', 'good', 'empty', 'garbled', 'failed', 'needs_ocr')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, page_number)
);

alter table public.document_pages enable row level security;

drop policy if exists "members can read document pages" on public.document_pages;
create policy "members can read document pages"
on public.document_pages
for select
using (public.is_org_member(organization_id));

drop policy if exists "members can create document pages" on public.document_pages;
create policy "members can create document pages"
on public.document_pages
for insert
with check (public.is_org_member(organization_id));

drop policy if exists "members can update document pages" on public.document_pages;
create policy "members can update document pages"
on public.document_pages
for update
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

drop policy if exists "members can delete document pages" on public.document_pages;
create policy "members can delete document pages"
on public.document_pages
for delete
using (public.is_org_member(organization_id));

create index if not exists document_pages_document_idx
on public.document_pages (document_id, page_number);

create index if not exists document_pages_org_deal_idx
on public.document_pages (organization_id, deal_id);
