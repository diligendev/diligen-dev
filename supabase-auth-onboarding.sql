-- Diligen auth onboarding setup
-- Run this in the Supabase SQL editor after the base organization tables exist.

create or replace function public.is_org_admin(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from organization_members om
    where om.organization_id = org_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
  );
$$;

create table if not exists public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'member', 'viewer')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid references public.profiles(id) on delete set null,
  accepted_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists organization_invites_one_pending_per_email
on public.organization_invites (organization_id, lower(email))
where status = 'pending';

alter table public.organization_invites enable row level security;

drop policy if exists "org admins can read invites" on public.organization_invites;
create policy "org admins can read invites"
on public.organization_invites
for select
using (public.is_org_admin(organization_id));

drop policy if exists "org admins can create invites" on public.organization_invites;
create policy "org admins can create invites"
on public.organization_invites
for insert
with check (public.is_org_admin(organization_id));

drop policy if exists "org admins can update invites" on public.organization_invites;
create policy "org admins can update invites"
on public.organization_invites
for update
using (public.is_org_admin(organization_id))
with check (public.is_org_admin(organization_id));
