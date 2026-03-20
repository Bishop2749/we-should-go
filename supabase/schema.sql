-- We Should Go — Supabase Schema
-- Run this in the Supabase SQL editor: https://supabase.com/dashboard/project/bawzdctzxcslmosixiss/sql/new

create extension if not exists "uuid-ossp";

create table locations (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default now(),
  name text not null,
  description text,
  category text default 'other',
  lat double precision not null,
  lng double precision not null,
  place_id text,
  address text,
  google_maps_url text,
  added_by uuid references auth.users(id),
  added_by_name text
);

alter table locations enable row level security;

create policy "Authenticated users can read locations"
  on locations for select to authenticated using (true);

create policy "Authenticated users can insert locations"
  on locations for insert to authenticated
  with check (added_by = auth.uid());

create policy "Users can delete own locations"
  on locations for delete to authenticated
  using (added_by = auth.uid());
