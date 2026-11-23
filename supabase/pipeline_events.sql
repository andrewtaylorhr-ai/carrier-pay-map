-- Driver Pipeline: one row per no-reply email, written by the Gmail script
-- (pipeline-script.ts) and read by the app. Each run adds only the new emails,
-- and each browser downloads only the rows added since its last visit.
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.

create table if not exists public.pipeline_events (
  id text primary key,                      -- Gmail message id
  type text not null,                       -- submission, followup, dqp
  at timestamptz not null,                  -- when the email arrived
  driver text,
  carrier text,
  recruiter text,
  subject text,
  message text,
  created_at timestamptz not null default now()  -- when the script saved it
);
create index if not exists pipeline_events_created_at on public.pipeline_events (created_at);

-- signed-in managers (and the pipeline account) only, like app_state
alter table public.pipeline_events enable row level security;
revoke all on public.pipeline_events from anon;
grant select, insert on public.pipeline_events to authenticated;
drop policy if exists "signed in can read" on public.pipeline_events;
create policy "signed in can read" on public.pipeline_events for select to authenticated using (true);
drop policy if exists "signed in can add" on public.pipeline_events;
create policy "signed in can add" on public.pipeline_events for insert to authenticated with check (true);
