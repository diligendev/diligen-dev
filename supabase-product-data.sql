-- Diligen product data setup
-- Run after the base auth/workspace schema exists.

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  sector text,
  source text,
  stage text not null default 'New'
    check (stage in ('New', 'Analyzing', 'Reviewed', 'Pursuing', 'Passed', 'Closed')),
  status text not null default 'Complete'
    check (status in ('Processing', 'Complete', 'Error')),
  score numeric,
  has_cim boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table if not exists public.deal_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  name text not null,
  document_type text not null default 'Other'
    check (document_type in ('CIM', 'Financials', 'Call Notes', 'Data Request', 'Other')),
  file_size text,
  storage_path text,
  extraction_status text not null default 'pending'
    check (extraction_status in ('pending', 'processing', 'complete', 'failed')),
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.analysis_outputs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  analysis_type text not null default 'cim'
    check (analysis_type in ('cim', 'kpi', 'trend', 'financials', 'valuation', 'memo')),
  status text not null default 'draft'
    check (status in ('draft', 'processing', 'complete', 'failed')),
  output jsonb not null default '{}'::jsonb,
  model text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.deals enable row level security;
alter table public.deal_documents enable row level security;
alter table public.analysis_outputs enable row level security;

drop policy if exists "members can read deals" on public.deals;
create policy "members can read deals"
on public.deals
for select
using (public.is_org_member(organization_id));

drop policy if exists "members can create deals" on public.deals;
create policy "members can create deals"
on public.deals
for insert
with check (public.is_org_member(organization_id));

drop policy if exists "members can update deals" on public.deals;
create policy "members can update deals"
on public.deals
for update
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

drop policy if exists "members can read deal documents" on public.deal_documents;
create policy "members can read deal documents"
on public.deal_documents
for select
using (public.is_org_member(organization_id));

drop policy if exists "members can create deal documents" on public.deal_documents;
create policy "members can create deal documents"
on public.deal_documents
for insert
with check (public.is_org_member(organization_id));

drop policy if exists "members can update deal documents" on public.deal_documents;
create policy "members can update deal documents"
on public.deal_documents
for update
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

drop policy if exists "members can read analysis outputs" on public.analysis_outputs;
create policy "members can read analysis outputs"
on public.analysis_outputs
for select
using (public.is_org_member(organization_id));

drop policy if exists "members can create analysis outputs" on public.analysis_outputs;
create policy "members can create analysis outputs"
on public.analysis_outputs
for insert
with check (public.is_org_member(organization_id));

drop policy if exists "members can update analysis outputs" on public.analysis_outputs;
create policy "members can update analysis outputs"
on public.analysis_outputs
for update
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));
