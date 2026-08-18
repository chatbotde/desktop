-- Cloud pairing for Remote Pad.
-- Pair once via QR, then reconnect from any network while Buddy is running.
-- Re-run this file in Supabase SQL editor after updates (especially get_remote_pad_credentials).

create table if not exists public.remote_pad_peers (
  buddy_id text primary key,
  pin_hash text not null,
  livekit_url text not null,
  livekit_room text not null,
  subscriber_token text not null,
  token_expires_at timestamptz not null,
  online_at timestamptz not null default now(),
  connection_requested_at timestamptz
);

-- If the table already exists from an older deploy:
alter table public.remote_pad_peers
  add column if not exists connection_requested_at timestamptz;

alter table public.remote_pad_peers enable row level security;

-- Buddy desktop uses service role key (bypasses RLS) for upserts.

create or replace function public.get_remote_pad_credentials(p_buddy_id text, p_pin text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  rec public.remote_pad_peers%rowtype;
  expected_hash text;
begin
  expected_hash := encode(digest(p_buddy_id || ':' || p_pin, 'sha256'), 'hex');

  -- Row exists while Buddy is running; token_expires_at handles stale sessions.
  select *
  into rec
  from public.remote_pad_peers
  where buddy_id = p_buddy_id
    and pin_hash = expected_hash
  limit 1;

  if not found then
    return json_build_object('error', 'not_found');
  end if;

  if rec.token_expires_at < now() then
    return json_build_object('error', 'token_expired');
  end if;

  -- Wake the desktop relay while the phone waits for credentials.
  update public.remote_pad_peers
  set connection_requested_at = now()
  where buddy_id = p_buddy_id
    and pin_hash = expected_hash;

  perform pg_sleep(2.5);

  return json_build_object(
    'livekitUrl', rec.livekit_url,
    'livekitToken', rec.subscriber_token,
    'livekitRoom', rec.livekit_room
  );
end;
$$;

revoke all on function public.get_remote_pad_credentials(text, text) from public;
grant execute on function public.get_remote_pad_credentials(text, text) to anon, authenticated;

-- Phone calls this before joining LiveKit so the PC wakes the relay only when needed.
create or replace function public.request_remote_pad_session(p_buddy_id text, p_pin text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  expected_hash text;
  updated_count int;
begin
  expected_hash := encode(digest(p_buddy_id || ':' || p_pin, 'sha256'), 'hex');

  update public.remote_pad_peers
  set connection_requested_at = now()
  where buddy_id = p_buddy_id
    and pin_hash = expected_hash
    and token_expires_at > now();

  get diagnostics updated_count = row_count;

  if updated_count = 0 then
    return json_build_object('error', 'not_found');
  end if;

  return json_build_object('ok', true);
end;
$$;

revoke all on function public.request_remote_pad_session(text, text) from public;
grant execute on function public.request_remote_pad_session(text, text) to anon, authenticated;

-- Lightweight presence check — does not wake the desktop.
-- Requires a fresh heartbeat (Buddy updates online_at every ~45s while open).
create or replace function public.check_remote_pad_online(p_buddy_id text, p_pin text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  rec public.remote_pad_peers%rowtype;
  expected_hash text;
  heartbeat_stale interval := interval '90 seconds';
begin
  expected_hash := encode(digest(p_buddy_id || ':' || p_pin, 'sha256'), 'hex');

  select *
  into rec
  from public.remote_pad_peers
  where buddy_id = p_buddy_id
    and pin_hash = expected_hash
  limit 1;

  if not found then
    return json_build_object('online', false);
  end if;

  if rec.token_expires_at < now() then
    return json_build_object('online', false);
  end if;

  if rec.online_at < now() - heartbeat_stale then
    return json_build_object('online', false, 'stale', true);
  end if;

  return json_build_object(
    'online', true,
    'onlineAt', rec.online_at
  );
end;
$$;

revoke all on function public.check_remote_pad_online(text, text) from public;
grant execute on function public.check_remote_pad_online(text, text) to anon, authenticated;
