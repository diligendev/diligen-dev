-- Diligen IC memo setup.
-- Run after organizations, deals, profiles, analysis_outputs, and financial_outputs exist.

create table if not exists public.ic_memos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  analysis_output_id uuid references public.analysis_outputs(id) on delete set null,
  financial_output_id uuid references public.financial_outputs(id) on delete set null,

  status text not null default 'built'
    check (status in ('built', 'archived')),

  is_active boolean not null default true,
  thesis text not null default '',
  memo_json jsonb not null default '{}'::jsonb,

  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ic_memos enable row level security;

drop policy if exists "members can read ic memos" on public.ic_memos;
create policy "members can read ic memos"
on public.ic_memos
for select
using (public.is_org_member(organization_id));

drop policy if exists "members can create ic memos" on public.ic_memos;
create policy "members can create ic memos"
on public.ic_memos
for insert
with check (public.is_org_member(organization_id));

drop policy if exists "members can update ic memos" on public.ic_memos;
create policy "members can update ic memos"
on public.ic_memos
for update
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

drop policy if exists "members can delete ic memos" on public.ic_memos;
create policy "members can delete ic memos"
on public.ic_memos
for delete
using (public.is_org_member(organization_id));

create unique index if not exists ic_memos_one_per_deal_idx
on public.ic_memos (organization_id, deal_id);

create index if not exists ic_memos_deal_idx
on public.ic_memos (organization_id, deal_id, updated_at desc);

create index if not exists ic_memos_analysis_output_idx
on public.ic_memos (analysis_output_id);

create index if not exists ic_memos_financial_output_idx
on public.ic_memos (financial_output_id);
