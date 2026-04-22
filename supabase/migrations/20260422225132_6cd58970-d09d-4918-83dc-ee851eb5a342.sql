
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

drop policy if exists "activity insert" on public.activity;
create policy "activity insert self" on public.activity for insert to authenticated with check (actor_id = auth.uid());
