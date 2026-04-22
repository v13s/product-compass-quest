
-- =========== ENUMS ===========
create type public.app_role as enum ('admin','leader','pm','member');
create type public.work_status as enum ('draft','planned','in_progress','in_review','done','released','cancelled');
create type public.priority as enum ('p0','p1','p2','p3');
create type public.release_status as enum ('planned','in_development','released','deprecated');

-- =========== PROFILES ===========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  team text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- =========== ROLES ===========
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_admin_or_pm(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','pm'))
$$;

-- profile autocreate trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
          new.email,
          new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  -- default role: member
  insert into public.user_roles(user_id, role) values (new.id, 'member')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- =========== PORTFOLIOS ===========
create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.portfolios enable row level security;
create trigger portfolios_touch before update on public.portfolios for each row execute function public.touch_updated_at();

-- =========== PRODUCTS ===========
create table public.products (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid references public.portfolios(id) on delete set null,
  name text not null,
  description text,
  owner_id uuid references auth.users(id),
  status public.work_status not null default 'planned',
  priority public.priority not null default 'p2',
  start_date date,
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();

-- =========== INITIATIVE TYPES ===========
create table public.initiative_types (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  color text default '#64748b',
  built_in boolean not null default false,
  field_schema jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.initiative_types enable row level security;

insert into public.initiative_types (key,label,color,built_in,field_schema) values
 ('customization','Customization','#3b82f6',true,'[{"key":"customer","label":"Customer","type":"text"},{"key":"base_product","label":"Base Product","type":"text"},{"key":"variant_spec","label":"Variant Spec","type":"text"}]'::jsonb),
 ('variant','Variant','#8b5cf6',true,'[{"key":"customer","label":"Customer","type":"text"},{"key":"base_product","label":"Base Product","type":"text"},{"key":"variant_spec","label":"Variant Spec","type":"text"}]'::jsonb),
 ('demo','Demo','#10b981',true,'[{"key":"customer","label":"Customer/Domain","type":"text"},{"key":"demo_date","label":"Demo Date","type":"date"},{"key":"audience","label":"Audience","type":"text"}]'::jsonb),
 ('event','Event','#f59e0b',true,'[{"key":"event_name","label":"Event Name","type":"text"},{"key":"event_date","label":"Date","type":"date"},{"key":"location","label":"Location","type":"text"},{"key":"booth","label":"Booth/Session","type":"text"}]'::jsonb),
 ('pov','PoV','#ef4444',true,'[{"key":"customer","label":"Customer","type":"text"},{"key":"success_criteria","label":"Success Criteria","type":"text"},{"key":"start_date","label":"Start","type":"date"},{"key":"end_date","label":"End","type":"date"}]'::jsonb),
 ('other','Other','#64748b',true,'[]'::jsonb);

-- =========== INITIATIVES ===========
create table public.initiatives (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid references public.portfolios(id) on delete set null,
  type_id uuid references public.initiative_types(id),
  name text not null,
  description text,
  owner_id uuid references auth.users(id),
  status public.work_status not null default 'planned',
  priority public.priority not null default 'p2',
  start_date date,
  target_date date,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.initiatives enable row level security;
create trigger initiatives_touch before update on public.initiatives for each row execute function public.touch_updated_at();

-- many-to-many initiative <-> product
create table public.initiative_products (
  initiative_id uuid not null references public.initiatives(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  primary key (initiative_id, product_id)
);
alter table public.initiative_products enable row level security;

-- =========== RELEASES ===========
create table public.releases (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  description text,
  status public.release_status not null default 'planned',
  target_date date,
  released_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.releases enable row level security;
create trigger releases_touch before update on public.releases for each row execute function public.touch_updated_at();

-- =========== EPICS ===========
create table public.epics (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  initiative_id uuid references public.initiatives(id) on delete set null,
  name text not null,
  description text,
  owner_id uuid references auth.users(id),
  status public.work_status not null default 'planned',
  priority public.priority not null default 'p2',
  start_date date,
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.epics enable row level security;
create trigger epics_touch before update on public.epics for each row execute function public.touch_updated_at();

create table public.release_epics (
  release_id uuid not null references public.releases(id) on delete cascade,
  epic_id uuid not null references public.epics(id) on delete cascade,
  primary key (release_id, epic_id)
);
alter table public.release_epics enable row level security;

-- =========== STORIES ===========
create table public.stories (
  id uuid primary key default gen_random_uuid(),
  epic_id uuid references public.epics(id) on delete set null,
  release_id uuid references public.releases(id) on delete set null,
  name text not null,
  description text,
  assignee_id uuid references auth.users(id),
  status public.work_status not null default 'planned',
  priority public.priority not null default 'p2',
  start_date date,
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.stories enable row level security;
create trigger stories_touch before update on public.stories for each row execute function public.touch_updated_at();

-- =========== TASKS ===========
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references public.stories(id) on delete cascade,
  name text not null,
  description text,
  assignee_id uuid references auth.users(id),
  status public.work_status not null default 'planned',
  priority public.priority not null default 'p2',
  start_date date,
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tasks enable row level security;
create trigger tasks_touch before update on public.tasks for each row execute function public.touch_updated_at();

-- =========== COMMENTS ===========
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.comments enable row level security;

-- =========== ACTIVITY ===========
create table public.activity (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  actor_id uuid references auth.users(id),
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);
alter table public.activity enable row level security;

-- =========================================
-- RLS POLICIES
-- =========================================

-- profiles: readable to authenticated, self-update
create policy "profiles read all auth" on public.profiles for select to authenticated using (true);
create policy "profiles self insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles self update" on public.profiles for update to authenticated using (id = auth.uid());

-- user_roles: read own + admins read all; only admin can write
create policy "user_roles self read" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "user_roles admin manage" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- generic helper policy creators via SQL: for each work table allow:
-- read: any authenticated
-- write: admin or pm; assignees can update their items (status only at app layer; here allow update)
-- insert: admin/pm
-- delete: admin/pm

-- portfolios
create policy "portfolios read" on public.portfolios for select to authenticated using (true);
create policy "portfolios write" on public.portfolios for insert to authenticated with check (public.is_admin_or_pm(auth.uid()));
create policy "portfolios update" on public.portfolios for update to authenticated using (public.is_admin_or_pm(auth.uid()));
create policy "portfolios delete" on public.portfolios for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- products
create policy "products read" on public.products for select to authenticated using (true);
create policy "products write" on public.products for insert to authenticated with check (public.is_admin_or_pm(auth.uid()));
create policy "products update" on public.products for update to authenticated using (public.is_admin_or_pm(auth.uid()));
create policy "products delete" on public.products for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- initiative_types
create policy "itypes read" on public.initiative_types for select to authenticated using (true);
create policy "itypes write" on public.initiative_types for insert to authenticated with check (public.is_admin_or_pm(auth.uid()));
create policy "itypes update" on public.initiative_types for update to authenticated using (public.is_admin_or_pm(auth.uid()));
create policy "itypes delete" on public.initiative_types for delete to authenticated using (public.has_role(auth.uid(),'admin') and built_in = false);

-- initiatives
create policy "init read" on public.initiatives for select to authenticated using (true);
create policy "init write" on public.initiatives for insert to authenticated with check (public.is_admin_or_pm(auth.uid()));
create policy "init update" on public.initiatives for update to authenticated using (public.is_admin_or_pm(auth.uid()));
create policy "init delete" on public.initiatives for delete to authenticated using (public.is_admin_or_pm(auth.uid()));

create policy "init_prod read" on public.initiative_products for select to authenticated using (true);
create policy "init_prod write" on public.initiative_products for all to authenticated using (public.is_admin_or_pm(auth.uid())) with check (public.is_admin_or_pm(auth.uid()));

-- releases
create policy "rel read" on public.releases for select to authenticated using (true);
create policy "rel write" on public.releases for insert to authenticated with check (public.is_admin_or_pm(auth.uid()));
create policy "rel update" on public.releases for update to authenticated using (public.is_admin_or_pm(auth.uid()));
create policy "rel delete" on public.releases for delete to authenticated using (public.is_admin_or_pm(auth.uid()));

create policy "rel_epic read" on public.release_epics for select to authenticated using (true);
create policy "rel_epic write" on public.release_epics for all to authenticated using (public.is_admin_or_pm(auth.uid())) with check (public.is_admin_or_pm(auth.uid()));

-- epics
create policy "epic read" on public.epics for select to authenticated using (true);
create policy "epic write" on public.epics for insert to authenticated with check (public.is_admin_or_pm(auth.uid()));
create policy "epic update" on public.epics for update to authenticated using (public.is_admin_or_pm(auth.uid()) or owner_id = auth.uid());
create policy "epic delete" on public.epics for delete to authenticated using (public.is_admin_or_pm(auth.uid()));

-- stories
create policy "story read" on public.stories for select to authenticated using (true);
create policy "story write" on public.stories for insert to authenticated with check (public.is_admin_or_pm(auth.uid()));
create policy "story update" on public.stories for update to authenticated using (public.is_admin_or_pm(auth.uid()) or assignee_id = auth.uid());
create policy "story delete" on public.stories for delete to authenticated using (public.is_admin_or_pm(auth.uid()));

-- tasks
create policy "task read" on public.tasks for select to authenticated using (true);
create policy "task write" on public.tasks for insert to authenticated with check (public.is_admin_or_pm(auth.uid()));
create policy "task update" on public.tasks for update to authenticated using (public.is_admin_or_pm(auth.uid()) or assignee_id = auth.uid());
create policy "task delete" on public.tasks for delete to authenticated using (public.is_admin_or_pm(auth.uid()));

-- comments
create policy "comments read" on public.comments for select to authenticated using (true);
create policy "comments insert self" on public.comments for insert to authenticated with check (author_id = auth.uid());
create policy "comments update self" on public.comments for update to authenticated using (author_id = auth.uid());
create policy "comments delete self or admin" on public.comments for delete to authenticated using (author_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- activity
create policy "activity read" on public.activity for select to authenticated using (true);
create policy "activity insert" on public.activity for insert to authenticated with check (true);
