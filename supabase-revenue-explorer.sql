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

create table if not exists public.revenue_views (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  revenue_file_id uuid not null references public.revenue_files(id) on delete cascade,
  name text not null,
  period text not null check (period in ('Monthly', 'Quarterly', 'Annual')),
  measure text not null check (measure in ('revenue', 'grossProfit', 'units', 'recurringRevenue')),
  breakdowns jsonb not null default '[]'::jsonb,
  result_cache jsonb not null,
  result_generated_at timestamptz not null default now(),
  source_row_count integer not null default 0 check (source_row_count >= 0),
  source_date_range_start date null,
  source_date_range_end date null,
  created_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists revenue_files_org_deal_created_idx
  on public.revenue_files (organization_id, deal_id, created_at desc);

create index if not exists revenue_files_document_idx
  on public.revenue_files (document_id);

create index if not exists revenue_rows_org_deal_date_idx
  on public.revenue_rows (organization_id, deal_id, revenue_date);

create index if not exists revenue_rows_file_idx
  on public.revenue_rows (revenue_file_id);

create index if not exists revenue_views_org_deal_file_created_idx
  on public.revenue_views (organization_id, deal_id, revenue_file_id, created_at desc);

alter table public.revenue_files enable row level security;
alter table public.revenue_rows enable row level security;
alter table public.revenue_views enable row level security;

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

drop policy if exists "revenue_views_select_org_members" on public.revenue_views;
create policy "revenue_views_select_org_members"
on public.revenue_views
for select
using (public.is_org_member(organization_id));

drop policy if exists "revenue_views_insert_org_members" on public.revenue_views;
create policy "revenue_views_insert_org_members"
on public.revenue_views
for insert
with check (
  public.is_org_member(organization_id)
  and (created_by is null or created_by = auth.uid())
);

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
