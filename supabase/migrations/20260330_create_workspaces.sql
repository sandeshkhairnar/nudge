-- 20260330_create_workspaces.sql

create table public.workspaces (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  slug text not null,
  logo_url text null,
  owner_id uuid not null,
  plan text null default 'solo'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  nudge_engine_active boolean null default false,
  nudge_check_time text null default '02:00'::text,
  nudge_check_times text[] null default '{}'::text[],
  constraint workspaces_pkey primary key (id),
  constraint workspaces_slug_key unique (slug),
  constraint workspaces_owner_id_fkey foreign KEY (owner_id) references profiles (id) on delete CASCADE,
  constraint workspaces_plan_check check (
    (
      plan = any (
        array['solo'::text, 'team'::text, 'enterprise'::text]
      )
    )
  )
) TABLESPACE pg_default;

create trigger set_updated_at_workspaces BEFORE
update on workspaces for EACH row
execute FUNCTION set_updated_at ();  

create table public.workspace_members (
  workspace_id uuid not null references workspaces (id) on delete CASCADE,
  user_id uuid not null references profiles (id) on delete CASCADE,
  role text not null default 'member'::text,
  created_at timestamp with time zone not null default now(),
  constraint workspace_members_pkey primary key (workspace_id, user_id),
  constraint workspace_members_role_check check (role = any (array['owner'::text, 'admin'::text, 'member'::text]))
) TABLESPACE pg_default;
