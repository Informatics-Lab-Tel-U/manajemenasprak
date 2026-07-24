-- Allow read access for authenticated users (or anon, if required by your auth setup)
create policy "Allow read access for heartbeat log"
  on public.monitoring_heartbeat_log
  for select
  using (true);
