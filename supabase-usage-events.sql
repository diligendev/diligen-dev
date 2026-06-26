create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid null references public.profiles(id) on delete set null,
  deal_id uuid null references public.deals(id) on delete set null,
  document_id uuid null references public.deal_documents(id) on delete set null,
  feature text not null check (
    feature in (
      'cim_analysis',
      'financial_extraction',
      'ic_memo',
      'call_note_intelligence',
      'document_text_extraction'
    )
  ),
  provider text not null default 'internal',
  model text null,
  input_tokens integer null check (input_tokens is null or input_tokens >= 0),
  output_tokens integer null check (output_tokens is null or output_tokens >= 0),
  estimated_cost_usd numeric(12, 6) null check (
    estimated_cost_usd is null or estimated_cost_usd >= 0
  ),
  status text not null check (status in ('success', 'failed')),
  error_message text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_org_created_idx
  on public.usage_events (organization_id, created_at desc);

create index if not exists usage_events_org_feature_created_idx
  on public.usage_events (organization_id, feature, created_at desc);

create index if not exists usage_events_deal_idx
  on public.usage_events (deal_id)
  where deal_id is not null;

alter table public.usage_events enable row level security;

drop policy if exists "usage_events_select_org_members" on public.usage_events;
create policy "usage_events_select_org_members"
on public.usage_events
for select
using (public.is_org_member(organization_id));

drop policy if exists "usage_events_insert_org_members" on public.usage_events;
create policy "usage_events_insert_org_members"
on public.usage_events
for insert
with check (
  public.is_org_member(organization_id)
  and (user_id is null or user_id = auth.uid())
);
