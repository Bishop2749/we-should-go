-- =============================================================
-- We Should Go — Friend Invite System Migration
-- Run this in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/bawzdctzxcslmosixiss/sql
-- =============================================================

-- Invites table
create table invites (
  id uuid default uuid_generate_v4() primary key,
  token text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_by uuid references auth.users(id) not null,
  created_by_name text not null,
  created_by_avatar text,
  used_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  used_at timestamp with time zone,
  expires_at timestamp with time zone default now() + interval '7 days'
);

alter table invites enable row level security;

-- Reading an invite goes through the SECURITY DEFINER functions at the bottom
-- of this file, which require the caller to supply the token. There is
-- deliberately no blanket select policy: the anon key ships in the client
-- bundle, so `using (true)` here would let anyone enumerate every invite —
-- inviter names, avatar URLs, real user ids, and live tokens.
--
-- Direct select is limited to invites you created, which is what makes the
-- `insert ... returning token` in /api/invite/create work.
create policy "Creator can read own invites"
  on invites for select to authenticated
  using (created_by = auth.uid());

-- Authenticated users can create invites
create policy "Authenticated users can create invites"
  on invites for insert to authenticated
  with check (created_by = auth.uid());

-- Creator can update their own invites (e.g. revoke)
create policy "Invite creator can update"
  on invites for update to authenticated
  using (created_by = auth.uid());

-- Acceptance is handled by accept_invite() at the bottom of this file, which
-- runs as definer. A policy here could not work anyway: Postgres requires
-- SELECT rights for an UPDATE with a WHERE clause, and the accepting user
-- has no select policy covering someone else's invite.

-- =============================================================
-- Friendships table (symmetric — user_a < user_b enforced in app)
-- =============================================================

create table friendships (
  id uuid default uuid_generate_v4() primary key,
  user_a uuid references auth.users(id) not null,
  user_b uuid references auth.users(id) not null,
  created_at timestamp with time zone default now(),
  unique(user_a, user_b)
);

alter table friendships enable row level security;

create policy "Users can see their own friendships"
  on friendships for select to authenticated
  using (user_a = auth.uid() or user_b = auth.uid());

create policy "Users can create friendships"
  on friendships for insert to authenticated
  with check (user_a = auth.uid() or user_b = auth.uid());

-- =============================================================
-- Token lookup functions
--
-- These are how invites get read. Taking the token as an argument means a
-- caller can only resolve a token they already hold — unlike a select
-- policy, there is no way to list rows.
-- =============================================================

-- Public invite landing page (/invite/[token]) — a logged-out visitor.
-- Display fields only: deliberately no `created_by`, so a token holder
-- never learns the inviter's user id.
create or replace function public.get_invite(invite_token text)
returns table (
  token             text,
  created_by_name   text,
  created_by_avatar text,
  used_by           uuid,
  expires_at        timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select i.token, i.created_by_name, i.created_by_avatar, i.used_by, i.expires_at
  from invites i
  where i.token = invite_token
  limit 1;
$$;

revoke all on function public.get_invite(text) from public;
grant execute on function public.get_invite(text) to anon, authenticated;

-- ---------------------------------------------------------------
-- Accept an invite: validate, create the friendship, mark the invite used —
-- in one call, as one transaction.
--
-- Doing this server-side keeps the checks authoritative and serialises
-- concurrent accepts of the same token, which a client-side sequence of
-- reads and writes cannot.
-- ---------------------------------------------------------------
create or replace function public.accept_invite(invite_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user     uuid := auth.uid();
  v_inv      invites%rowtype;
  v_a        uuid;
  v_b        uuid;
  v_existing boolean;
begin
  if v_user is null then
    return jsonb_build_object('status', 'error', 'reason', 'not_signed_in');
  end if;

  -- Lock the row so concurrent accepts of the same token serialise here.
  select * into v_inv from invites where token = invite_token for update;

  if not found then
    return jsonb_build_object('status', 'error', 'reason', 'not_found');
  end if;

  if v_inv.expires_at <= now() then
    return jsonb_build_object('status', 'error', 'reason', 'expired');
  end if;

  if v_inv.created_by = v_user then
    return jsonb_build_object('status', 'error', 'reason', 'own_invite');
  end if;

  if v_inv.used_by is not null and v_inv.used_by <> v_user then
    return jsonb_build_object('status', 'error', 'reason', 'already_used');
  end if;

  v_a := least(v_user, v_inv.created_by);
  v_b := greatest(v_user, v_inv.created_by);

  select exists (
    select 1 from friendships where user_a = v_a and user_b = v_b
  ) into v_existing;

  if not v_existing then
    insert into friendships (user_a, user_b)
    values (v_a, v_b)
    on conflict (user_a, user_b) do nothing;
  end if;

  update invites
     set used_by = v_user, used_at = now()
   where token = invite_token
     and used_by is null;

  return jsonb_build_object(
    'status',      case when v_existing then 'already_friends' else 'success' end,
    'friend_name', v_inv.created_by_name
  );
end;
$$;

-- Supabase's default privileges grant EXECUTE on new public functions to
-- anon and authenticated, so revoking from PUBLIC alone is not enough —
-- anon keeps its own explicit grant. Revoke it by name.
revoke all on function public.accept_invite(text) from public;
revoke all on function public.accept_invite(text) from anon;
grant execute on function public.accept_invite(text) to authenticated;
