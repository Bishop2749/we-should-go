-- =============================================================
-- We Should Go — Mock Friends Data
-- Creates 5 demo friend accounts and links them to your account.
-- Run this in the Supabase SQL editor AFTER being logged in.
-- https://supabase.com/dashboard/project/bawzdctzxcslmosixiss/sql
-- =============================================================

do $$
declare
  v_user_id uuid;
  v_alex    uuid := '00000000-0000-0000-0000-000000000001';
  v_jordan  uuid := '00000000-0000-0000-0000-000000000002';
  v_taylor  uuid := '00000000-0000-0000-0000-000000000003';
  v_morgan  uuid := '00000000-0000-0000-0000-000000000004';
  v_riley   uuid := '00000000-0000-0000-0000-000000000005';
begin
  -- Get the most recently created real user (that's you, David)
  select id into v_user_id
  from auth.users
  where id not in (v_alex, v_jordan, v_taylor, v_morgan, v_riley)
  order by created_at desc
  limit 1;

  if v_user_id is null then
    raise exception 'No real user found. Make sure you are signed in to the app first.';
  end if;

  -- Insert mock users into auth.users (they cannot log in — no password hash)
  insert into auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data
  ) values
    (v_alex,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'alex.chen@example.com', '', now(), now(), now(),
     '{"full_name":"Alex Chen","avatar_url":null}'::jsonb, '{}'::jsonb),
    (v_jordan, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'jordan.kim@example.com', '', now(), now(), now(),
     '{"full_name":"Jordan Kim","avatar_url":null}'::jsonb, '{}'::jsonb),
    (v_taylor, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'taylor.brooks@example.com', '', now(), now(), now(),
     '{"full_name":"Taylor Brooks","avatar_url":null}'::jsonb, '{}'::jsonb),
    (v_morgan, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'morgan.lee@example.com', '', now(), now(), now(),
     '{"full_name":"Morgan Lee","avatar_url":null}'::jsonb, '{}'::jsonb),
    (v_riley,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'riley.davis@example.com', '', now(), now(), now(),
     '{"full_name":"Riley Davis","avatar_url":null}'::jsonb, '{}'::jsonb)
  on conflict (id) do nothing;

  -- Insert profiles (trigger may already create them, on conflict do update)
  insert into profiles (id, display_name, avatar_url) values
    (v_alex,   'Alex Chen',     null),
    (v_jordan, 'Jordan Kim',    null),
    (v_taylor, 'Taylor Brooks', null),
    (v_morgan, 'Morgan Lee',    null),
    (v_riley,  'Riley Davis',   null)
  on conflict (id) do update set
    display_name = excluded.display_name;

  -- Create friendships (canonical order: smaller uuid = user_a)
  insert into friendships (user_a, user_b) values
    (least(v_user_id, v_alex),   greatest(v_user_id, v_alex)),
    (least(v_user_id, v_jordan), greatest(v_user_id, v_jordan)),
    (least(v_user_id, v_taylor), greatest(v_user_id, v_taylor)),
    (least(v_user_id, v_morgan), greatest(v_user_id, v_morgan)),
    (least(v_user_id, v_riley),  greatest(v_user_id, v_riley))
  on conflict (user_a, user_b) do nothing;

  raise notice 'Done! Created 5 mock friends for user %', v_user_id;
end $$;
