create table if not exists public.monitoring_heartbeat_log (
  id bigint generated always as identity primary key,
  lab_id text not null,
  kelas text,
  status text not null default 'online',
  response_time_ms integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_heartbeat_log_lab_created
  on public.monitoring_heartbeat_log (lab_id, created_at desc);

create index if not exists idx_heartbeat_log_created
  on public.monitoring_heartbeat_log (created_at desc);

alter table public.monitoring_heartbeat_log enable row level security;

create policy "Service role full access on heartbeat log"
  on public.monitoring_heartbeat_log
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- WAJIB, jangan lupa — tanpa ini Realtime subscription di frontend
-- subscribe sukses tapi TIDAK PERNAH terima event INSERT (gagal senyap, tanpa error):
alter publication supabase_realtime add table public.monitoring_heartbeat_log;
