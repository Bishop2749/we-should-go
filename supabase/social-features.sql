-- Social features migration
-- Run this in the Supabase SQL editor: https://supabase.com/dashboard/project/bawzdctzxcslmosixiss/sql

-- Want to go / Been here status per user per location
create table if not exists location_user_status (
  id uuid default uuid_generate_v4() primary key,
  location_id uuid references locations(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  status text not null check (status in ('want_to_go', 'been_here')),
  created_at timestamp with time zone default now(),
  unique(location_id, user_id)
);
alter table location_user_status enable row level security;
create policy "Users can manage their own status" on location_user_status
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can see all statuses" on location_user_status
  for select to authenticated using (true);

-- Reactions on pins: 🔥 fire, ✅ check, 💯 hundred
create table if not exists pin_reactions (
  id uuid default uuid_generate_v4() primary key,
  location_id uuid references locations(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  reaction text not null check (reaction in ('fire', 'check', 'hundred')),
  created_at timestamp with time zone default now(),
  unique(location_id, user_id)
);
alter table pin_reactions enable row level security;
create policy "Users can manage their own reactions" on pin_reactions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can see all reactions" on pin_reactions
  for select to authenticated using (true);
