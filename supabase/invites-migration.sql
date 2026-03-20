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

-- Anyone can read an invite by token (needed for the public invite page)
create policy "Anyone can read invites by token"
  on invites for select using (true);

-- Authenticated users can create invites
create policy "Authenticated users can create invites"
  on invites for insert to authenticated
  with check (created_by = auth.uid());

-- Creator can update their own invites (e.g. revoke)
create policy "Invite creator can update"
  on invites for update to authenticated
  using (created_by = auth.uid());

-- Invited user can mark an invite as used (accept flow)
-- Only applies to unused, non-expired invites created by someone else
create policy "Authenticated users can accept invites"
  on invites for update to authenticated
  using (
    used_by is null
    and expires_at > now()
    and created_by != auth.uid()
  )
  with check (used_by = auth.uid());

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
