-- Diligen call notes setup.
-- Run after organizations, deals, and profiles exist.

create table if not exists public.deal_call_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,

  title text not null,
  call_date date,
  participants text not null default '',
  body text not null,

  intelligence_status text not null default 'not_generated'
    check (intelligence_status in ('not_generated', 'processing', 'complete', 'failed')),
  intelligence_json jsonb,
  intelligence_model text,
  intelligence_generated_at timestamptz,
  intelligence_error text,

  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint deal_call_notes_title_length check (char_length(title) between 1 and 200),
  constraint deal_call_notes_body_length check (char_length(body) between 1 and 50000)
);

alter table public.deal_call_notes
  add column if not exists intelligence_status text not null default 'not_generated'
    check (intelligence_status in ('not_generated', 'processing', 'complete', 'failed'));

alter table public.deal_call_notes
  add column if not exists intelligence_json jsonb;

alter table public.deal_call_notes
  add column if not exists intelligence_model text;

alter table public.deal_call_notes
  add column if not exists intelligence_generated_at timestamptz;

alter table public.deal_call_notes
  add column if not exists intelligence_error text;

alter table public.deal_call_notes enable row level security;

drop policy if exists "members can read deal call notes" on public.deal_call_notes;
create policy "members can read deal call notes"
on public.deal_call_notes
for select
using (public.is_org_member(organization_id));

drop policy if exists "members can create deal call notes" on public.deal_call_notes;
create policy "members can create deal call notes"
on public.deal_call_notes
for insert
with check (public.is_org_member(organization_id));

drop policy if exists "members can update deal call notes" on public.deal_call_notes;
create policy "members can update deal call notes"
on public.deal_call_notes
for update
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

drop policy if exists "members can delete deal call notes" on public.deal_call_notes;
create policy "members can delete deal call notes"
on public.deal_call_notes
for delete
using (public.is_org_member(organization_id));

create index if not exists deal_call_notes_deal_idx
on public.deal_call_notes (organization_id, deal_id, call_date desc, created_at desc);

create index if not exists deal_call_notes_created_by_idx
on public.deal_call_notes (organization_id, created_by);
