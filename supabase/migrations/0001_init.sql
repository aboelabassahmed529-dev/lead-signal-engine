-- Lead Signal Engine — initial schema
-- Multi-tenant CRM foundation: accounts (tenants), members (auth users + roles),
-- leads, lead_events (history), objections, ads. Row-Level Security isolates every
-- account so one client can never see another's data.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'حسابي',
  meta_ad_account_id text,
  timezone text not null default 'Africa/Cairo',
  currency text not null default 'EGP',
  created_at timestamptz not null default now()
);

create table if not exists public.account_members (
  account_id uuid not null references public.accounts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'sales' check (role in ('admin', 'sales')),
  created_at timestamptz not null default now(),
  primary key (account_id, user_id)
);

create table if not exists public.objections (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  label text not null,
  suggested_angle text,
  created_at timestamptz not null default now()
);

create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  meta_ad_id text,
  name text not null,
  spend numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  meta_lead_id text,
  full_name text,
  phone text,
  email text,
  fbclid text,
  campaign_id text,
  adset_id text,
  ad_id uuid references public.ads(id) on delete set null,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'in_progress', 'won', 'lost')),
  value numeric,
  objection_id uuid references public.objections(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  type text not null check (type in ('new', 'contacted', 'qualified', 'in_progress', 'won', 'lost', 'note')),
  value numeric,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  sent_to_meta_at timestamptz
);

create index if not exists idx_leads_account on public.leads(account_id);
create index if not exists idx_leads_status on public.leads(account_id, status);
create index if not exists idx_leads_ad on public.leads(ad_id);
create index if not exists idx_events_account on public.lead_events(account_id, created_at desc);
create index if not exists idx_members_user on public.account_members(user_id);

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER — bypass RLS to avoid policy recursion)
-- ---------------------------------------------------------------------------

create or replace function public.is_account_member(aid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.account_members m
    where m.account_id = aid and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_account_admin(aid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.account_members m
    where m.account_id = aid and m.user_id = auth.uid() and m.role = 'admin'
  );
$$;

-- Create a fresh account and make the current user its admin. Called right
-- after sign-up so every user lands with exactly one account they own.
create or replace function public.bootstrap_account(account_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  insert into public.accounts (name)
    values (coalesce(nullif(trim(account_name), ''), 'حسابي'))
    returning id into new_id;
  insert into public.account_members (account_id, user_id, role)
    values (new_id, auth.uid(), 'admin');
  return new_id;
end;
$$;

-- keep leads.updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_leads_touch on public.leads;
create trigger trg_leads_touch
  before update on public.leads
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Ad performance view (the closed-loop numbers): CPQL, CPS, ROAS per ad.
-- security_invoker = on → the view respects the caller's RLS on base tables.
-- ---------------------------------------------------------------------------

create or replace view public.ad_performance
with (security_invoker = on) as
select
  a.account_id,
  a.id as ad_id,
  a.name,
  a.spend,
  count(l.id) as leads_count,
  count(l.id) filter (where l.status in ('qualified', 'in_progress', 'won')) as qualified_count,
  count(l.id) filter (where l.status = 'won') as sales_count,
  coalesce(sum(l.value) filter (where l.status = 'won'), 0) as sales_value,
  case when count(l.id) filter (where l.status = 'won') > 0
       then round(a.spend / count(l.id) filter (where l.status = 'won'), 2) end as cost_per_sale,
  case when count(l.id) filter (where l.status in ('qualified', 'in_progress', 'won')) > 0
       then round(a.spend / count(l.id) filter (where l.status in ('qualified', 'in_progress', 'won')), 2) end as cost_per_qualified,
  case when a.spend > 0
       then round(coalesce(sum(l.value) filter (where l.status = 'won'), 0) / a.spend, 2) end as roas
from public.ads a
left join public.leads l on l.ad_id = a.id
group by a.id;

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------

alter table public.accounts        enable row level security;
alter table public.account_members enable row level security;
alter table public.objections      enable row level security;
alter table public.ads             enable row level security;
alter table public.leads           enable row level security;
alter table public.lead_events     enable row level security;

-- accounts
create policy "members read their accounts" on public.accounts
  for select using (public.is_account_member(id));
create policy "admins update their account" on public.accounts
  for update using (public.is_account_admin(id)) with check (public.is_account_admin(id));

-- account_members
create policy "members read co-members" on public.account_members
  for select using (public.is_account_member(account_id));
create policy "admins add members" on public.account_members
  for insert with check (public.is_account_admin(account_id));
create policy "admins remove members" on public.account_members
  for delete using (public.is_account_admin(account_id));

-- objections / ads / leads / lead_events — full CRUD scoped to the account
create policy "members rw objections" on public.objections
  for all using (public.is_account_member(account_id)) with check (public.is_account_member(account_id));
create policy "members rw ads" on public.ads
  for all using (public.is_account_member(account_id)) with check (public.is_account_member(account_id));
create policy "members rw leads" on public.leads
  for all using (public.is_account_member(account_id)) with check (public.is_account_member(account_id));
create policy "members rw lead_events" on public.lead_events
  for all using (public.is_account_member(account_id)) with check (public.is_account_member(account_id));
