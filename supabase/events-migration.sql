-- We Should Go — Events Feature Migration
-- Run this in the Supabase SQL editor: https://supabase.com/dashboard/project/bawzdctzxcslmosixiss/sql/new

-- User profiles (phone number + display name)
create table if not exists profiles (
  id uuid references auth.users(id) primary key,
  display_name text,
  avatar_url text,
  phone text, -- E.164 format e.g. +12135550100
  updated_at timestamp with time zone default now()
);

alter table profiles enable row level security;

create policy "Users can view any profile"
  on profiles for select to authenticated using (true);

create policy "Users can update own profile"
  on profiles for update to authenticated using (id = auth.uid());

create policy "Users can insert own profile"
  on profiles for insert to authenticated with check (id = auth.uid());

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Events table
create table if not exists events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  location_name text not null,
  address text,
  lat double precision not null,
  lng double precision not null,
  place_id text,
  google_maps_url text,
  starts_at timestamp with time zone not null,
  ends_at timestamp with time zone,
  organizer_id uuid references auth.users(id) not null,
  organizer_name text not null,
  visibility text not null default 'private' check (visibility in ('public', 'private')),
  max_attendees integer,
  created_at timestamp with time zone default now()
);

alter table events enable row level security;

-- Public events visible to all authenticated users
-- Private events visible only to organizer + invited attendees
create policy "Users can view public events"
  on events for select to authenticated
  using (visibility = 'public');

create policy "Organizer can view their private events"
  on events for select to authenticated
  using (organizer_id = auth.uid());

create policy "Invited users can view private events"
  on events for select to authenticated
  using (
    exists (
      select 1 from event_attendees
      where event_attendees.event_id = events.id
      and event_attendees.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create events"
  on events for insert to authenticated
  with check (organizer_id = auth.uid());

create policy "Organizer can update their events"
  on events for update to authenticated
  using (organizer_id = auth.uid());

create policy "Organizer can delete their events"
  on events for delete to authenticated
  using (organizer_id = auth.uid());

-- Event attendees
create table if not exists event_attendees (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references events(id) on delete cascade not null,
  user_id uuid references auth.users(id),
  display_name text not null,
  phone text, -- for non-user invites
  email text, -- for non-user invites
  status text not null default 'invited' check (status in ('invited', 'accepted', 'declined')),
  invited_by uuid references auth.users(id) not null,
  created_at timestamp with time zone default now(),
  responded_at timestamp with time zone
);

alter table event_attendees enable row level security;

create policy "Organizer and attendees can view attendees"
  on event_attendees for select to authenticated
  using (
    user_id = auth.uid()
    or invited_by = auth.uid()
    or exists (
      select 1 from events
      where events.id = event_attendees.event_id
      and events.organizer_id = auth.uid()
    )
  );

create policy "Authenticated users can invite attendees"
  on event_attendees for insert to authenticated
  with check (invited_by = auth.uid());

create policy "Attendees can update their own RSVP"
  on event_attendees for update to authenticated
  using (user_id = auth.uid());
