-- Invite privacy hardening
--
-- Apply to any deployment created before this file existed.
-- (invites-migration.sql now creates the correct objects from the start,
-- so a fresh setup does not need this.)
--
-- The original policy was:
--
--   create policy "Anyone can read invites by token"
--     on invites for select using (true);
--
-- Despite the name it did not restrict by token, and it had no role
-- restriction — so it applied to `anon` too. Since the anon key ships in
-- the client bundle, anyone could enumerate the whole invites table and
-- read inviter names, avatar URLs, real user ids, and live tokens.
--
-- Replacement: no blanket read. Everything goes through SECURITY DEFINER
-- functions that take the token as an argument, so a caller can only ever
-- resolve a token they already hold — there is no way to list rows.

begin;

drop policy if exists "Anyone can read invites by token" on invites;

-- Needed so `insert ... returning token` still works in /api/invite/create.
drop policy if exists "Creator can read own invites" on invites;
create policy "Creator can read own invites"
  on invites for select to authenticated
  using (created_by = auth.uid());

-- Acceptance is now done entirely by accept_invite() below, which runs as
-- definer. This policy could never fire anyway: Postgres requires SELECT
-- rights for an UPDATE with a WHERE clause, and the accepting user has no
-- select policy covering someone else's invite.
drop policy if exists "Authenticated users can accept invites" on invites;

-- ---------------------------------------------------------------
-- Public invite landing page (/invite/[token]) — a logged-out visitor.
-- Display fields only: deliberately no `created_by`, so a token holder
-- never learns the inviter's user id.
-- ---------------------------------------------------------------
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

-- Superseded by accept_invite().
drop function if exists public.get_invite_for_accept(text);

-- ---------------------------------------------------------------
-- Accept an invite: validate, create the friendship, mark the invite used —
-- in one statement, as one transaction.
--
-- Previously the client did this in four round trips and trusted its own
-- checks, which left a race (two people accepting the same token) and a
-- best-effort "mark used" that was explicitly non-fatal if it failed.
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

commit;
