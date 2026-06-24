-- Diligen document workflow updates
-- Run this after supabase-product-data.sql.

alter table public.deal_documents
  add column if not exists description text,
  add column if not exists document_status text not null default 'stored'
    check (document_status in ('active', 'superseded', 'stored'));

alter table public.deal_documents
  drop constraint if exists deal_documents_description_length;

alter table public.deal_documents
  add constraint deal_documents_description_length
  check (description is null or char_length(description) <= 300);

update public.deal_documents
set document_status = 'stored'
where document_type <> 'CIM'
  and document_status is distinct from 'stored';

with ranked_cims as (
  select
    id,
    row_number() over (
      partition by organization_id, deal_id
      order by created_at desc
    ) as rn
  from public.deal_documents
  where document_type = 'CIM'
)
update public.deal_documents d
set document_status = case when ranked_cims.rn = 1 then 'active' else 'superseded' end
from ranked_cims
where d.id = ranked_cims.id;

create unique index if not exists one_active_cim_per_deal
on public.deal_documents (organization_id, deal_id)
where document_type = 'CIM' and document_status = 'active';
