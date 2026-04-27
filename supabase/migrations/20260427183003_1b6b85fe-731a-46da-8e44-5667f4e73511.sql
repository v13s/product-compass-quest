-- Dependencies between work items
create table public.dependencies (
  id uuid primary key default gen_random_uuid(),
  from_type text not null check (from_type in ('epic','story','task','initiative')),
  from_id uuid not null,
  to_type text not null check (to_type in ('epic','story','task','initiative')),
  to_id uuid not null,
  dep_type text not null default 'blocks' check (dep_type in ('blocks','relates_to','duplicates')),
  created_at timestamptz not null default now(),
  created_by uuid,
  unique (from_type, from_id, to_type, to_id, dep_type)
);
create index idx_dependencies_from on public.dependencies(from_type, from_id);
create index idx_dependencies_to on public.dependencies(to_type, to_id);

alter table public.dependencies enable row level security;

create policy "deps read" on public.dependencies for select to authenticated using (true);
create policy "deps write" on public.dependencies for insert to authenticated with check (public.is_admin_or_pm(auth.uid()));
create policy "deps update" on public.dependencies for update to authenticated using (public.is_admin_or_pm(auth.uid()));
create policy "deps delete" on public.dependencies for delete to authenticated using (public.is_admin_or_pm(auth.uid()));

-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  body text,
  link text,
  entity_type text,
  entity_id uuid,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notifications_user_unread on public.notifications(user_id, read, created_at desc);

alter table public.notifications enable row level security;

create policy "notif read own" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notif insert any" on public.notifications for insert to authenticated with check (true);
create policy "notif update own" on public.notifications for update to authenticated using (user_id = auth.uid());
create policy "notif delete own" on public.notifications for delete to authenticated using (user_id = auth.uid());

alter publication supabase_realtime add table public.notifications;