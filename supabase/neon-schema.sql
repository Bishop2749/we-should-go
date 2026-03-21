-- Neon AI city guide schema additions
-- Run this in your Supabase SQL editor

-- Add new columns to the locations table
alter table locations add column if not exists neighborhood text;
alter table locations add column if not exists source_name text;
alter table locations add column if not exists source_url text;

-- Add Neon to auth.users and profiles (same pattern as mock-friends.sql)
do $$
declare
  v_instance_id uuid;
begin
  select instance_id into v_instance_id from auth.users where id != '00000000-0000-0000-0000-000000000099' limit 1;

  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, raw_app_meta_data)
  values ('00000000-0000-0000-0000-000000000099', v_instance_id, 'authenticated', 'authenticated', 'neon@we-should-go.app', '', now(), now(), now(), '{"full_name":"Neon"}'::jsonb, '{}'::jsonb)
  on conflict (id) do nothing;

  insert into profiles (id, display_name) values ('00000000-0000-0000-0000-000000000099', 'Neon')
  on conflict (id) do update set display_name = 'Neon';
end $$;
