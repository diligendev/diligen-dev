create table if not exists public.revenue_files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  document_id uuid null references public.deal_documents(id) on delete set null,
  file_name text not null,
  row_count integer not null default 0 check (row_count >= 0),
  imported_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.revenue_files
  add column if not exists document_id uuid null references public.deal_documents(id) on delete set null;

create table if not exists public.revenue_rows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  revenue_file_id uuid not null references public.revenue_files(id) on delete cascade,
  row_number integer not null check (row_number >= 1),
  customer text not null,
  revenue_date date not null,
  revenue numeric(18, 2) not null,
  product text null,
  channel text null,
  gross_profit numeric(18, 2) null,
  units numeric(18, 4) null,
  recurring_revenue numeric(18, 2) null,
  created_at timestamptz not null default now()
);

create index if not exists revenue_files_org_deal_created_idx
  on public.revenue_files (organization_id, deal_id, created_at desc);

create index if not exists revenue_files_document_idx
  on public.revenue_files (document_id);

create index if not exists revenue_rows_org_deal_date_idx
  on public.revenue_rows (organization_id, deal_id, revenue_date);

create index if not exists revenue_rows_file_idx
  on public.revenue_rows (revenue_file_id);

alter table public.revenue_files enable row level security;
alter table public.revenue_rows enable row level security;

drop policy if exists "revenue_files_select_org_members" on public.revenue_files;
create policy "revenue_files_select_org_members"
on public.revenue_files
for select
using (public.is_org_member(organization_id));

drop policy if exists "revenue_files_insert_org_members" on public.revenue_files;
create policy "revenue_files_insert_org_members"
on public.revenue_files
for insert
with check (
  public.is_org_member(organization_id)
  and (imported_by is null or imported_by = auth.uid())
);

drop policy if exists "revenue_rows_select_org_members" on public.revenue_rows;
create policy "revenue_rows_select_org_members"
on public.revenue_rows
for select
using (public.is_org_member(organization_id));

drop policy if exists "revenue_rows_insert_org_members" on public.revenue_rows;
create policy "revenue_rows_insert_org_members"
on public.revenue_rows
for insert
with check (public.is_org_member(organization_id));

update storage.buckets
set
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = array[
    'application/pdf',
    'text/csv',
    'application/csv',
    'application/vnd.ms-excel'
  ]
where id = 'deal-documents';
