-- Diligen financial extraction setup.
-- Run after the core organization/deal/document schema exists.

create table if not exists public.financial_outputs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  document_id uuid references public.deal_documents(id) on delete set null,

  status text not null default 'complete'
    check (status in ('processing', 'complete', 'failed')),

  is_active boolean not null default true,

  model text,
  prompt_version text not null default 'financials_v1',
  schema_version text not null default 'financials_schema_v1',

  currency text not null default 'USD',
  scale text not null default 'actual'
    check (scale in ('actual', 'thousands', 'millions')),

  warnings jsonb not null default '[]'::jsonb,

  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.financial_line_items (
  id uuid primary key default gen_random_uuid(),
  financial_output_id uuid not null references public.financial_outputs(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,

  category text not null,
  label text not null,

  period_label text not null,
  period_type text
    check (period_type in ('annual', 'quarterly', 'ttm', 'ltm', 'projection')),

  period_end_date date,

  value numeric,
  unit text not null default 'actual'
    check (unit in ('actual', 'thousands', 'millions')),

  source_page integer,
  confidence text
    check (confidence in ('high', 'medium', 'low')),

  verified boolean not null default false,
  verified_by uuid references public.profiles(id) on delete set null,

  created_at timestamptz not null default now()
);

alter table public.financial_outputs enable row level security;
alter table public.financial_line_items enable row level security;

drop policy if exists "members can read financial outputs" on public.financial_outputs;
create policy "members can read financial outputs"
on public.financial_outputs
for select
using (public.is_org_member(organization_id));

drop policy if exists "members can create financial outputs" on public.financial_outputs;
create policy "members can create financial outputs"
on public.financial_outputs
for insert
with check (public.is_org_member(organization_id));

drop policy if exists "members can update financial outputs" on public.financial_outputs;
create policy "members can update financial outputs"
on public.financial_outputs
for update
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

drop policy if exists "members can delete financial outputs" on public.financial_outputs;
create policy "members can delete financial outputs"
on public.financial_outputs
for delete
using (public.is_org_member(organization_id));

drop policy if exists "members can read financial line items" on public.financial_line_items;
create policy "members can read financial line items"
on public.financial_line_items
for select
using (public.is_org_member(organization_id));

drop policy if exists "members can create financial line items" on public.financial_line_items;
create policy "members can create financial line items"
on public.financial_line_items
for insert
with check (public.is_org_member(organization_id));

drop policy if exists "members can update financial line items" on public.financial_line_items;
create policy "members can update financial line items"
on public.financial_line_items
for update
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

drop policy if exists "members can delete financial line items" on public.financial_line_items;
create policy "members can delete financial line items"
on public.financial_line_items
for delete
using (public.is_org_member(organization_id));

create unique index if not exists financial_outputs_one_active_per_deal_idx
on public.financial_outputs (organization_id, deal_id)
where is_active = true;

create index if not exists financial_outputs_deal_idx
on public.financial_outputs (organization_id, deal_id, created_at desc);

create index if not exists financial_line_items_output_idx
on public.financial_line_items (financial_output_id);

create index if not exists financial_line_items_deal_category_idx
on public.financial_line_items (organization_id, deal_id, category);

create index if not exists financial_line_items_period_idx
on public.financial_line_items (organization_id, deal_id, period_end_date);
