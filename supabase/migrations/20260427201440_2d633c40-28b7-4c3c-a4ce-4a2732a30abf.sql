-- Truncate all app data; keep users/profiles/roles intact
truncate table
  public.activity,
  public.notifications,
  public.comments,
  public.dependencies,
  public.release_epics,
  public.initiative_products,
  public.tasks,
  public.stories,
  public.epics,
  public.releases,
  public.initiatives,
  public.products,
  public.portfolios,
  public.initiative_types
restart identity cascade;

-- Re-seed built-in initiative types
insert into public.initiative_types (key, label, color, built_in, field_schema) values
  ('customization', 'Customization', '#6366f1', true, '[
    {"key":"customer","label":"Customer","type":"text","required":true},
    {"key":"contract_value","label":"Contract value","type":"text"},
    {"key":"due_date","label":"Due date","type":"date"}
  ]'::jsonb),
  ('variant', 'Variant', '#0ea5e9', true, '[
    {"key":"base_product","label":"Base product","type":"text"},
    {"key":"variant_name","label":"Variant name","type":"text","required":true},
    {"key":"market","label":"Target market","type":"text"}
  ]'::jsonb),
  ('demo', 'Demo', '#10b981', true, '[
    {"key":"customer","label":"Customer","type":"text","required":true},
    {"key":"domain","label":"Domain / vertical","type":"text"},
    {"key":"demo_date","label":"Demo date","type":"date"}
  ]'::jsonb),
  ('event', 'Event', '#f59e0b', true, '[
    {"key":"event_name","label":"Event name","type":"text","required":true},
    {"key":"location","label":"Location","type":"text"},
    {"key":"event_date","label":"Event date","type":"date","required":true}
  ]'::jsonb),
  ('pov', 'PoV', '#ef4444', true, '[
    {"key":"customer","label":"Customer","type":"text","required":true},
    {"key":"success_criteria","label":"Success criteria","type":"text"},
    {"key":"end_date","label":"End date","type":"date"}
  ]'::jsonb),
  ('other', 'Other', '#64748b', true, '[
    {"key":"notes","label":"Notes","type":"text"}
  ]'::jsonb);
