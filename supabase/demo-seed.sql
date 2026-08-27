-- Demo social content
--
-- Seeds events, RSVPs, and pin reactions attributed entirely to the mock
-- friend accounts created by mock-friends.sql, plus the Neon curator.
-- No row here ever references the real account — the demo shows a group
-- of synthetic people being active, never David's own activity.
--
-- Idempotent: safe to re-run. Run after mock-friends.sql.

do $$
declare
  v_alex   uuid := '00000000-0000-0000-0000-000000000001'; -- Alex Chen
  v_jordan uuid := '00000000-0000-0000-0000-000000000002'; -- Jordan Kim
  v_taylor uuid := '00000000-0000-0000-0000-000000000003'; -- Taylor Brooks
  v_morgan uuid := '00000000-0000-0000-0000-000000000004'; -- Morgan Lee
  v_riley  uuid := '00000000-0000-0000-0000-000000000005'; -- Riley Davis

  v_event_goat      uuid := 'a0000000-0000-0000-0000-00000000e001';
  v_event_soho      uuid := 'a0000000-0000-0000-0000-00000000e002';
  v_event_normandie uuid := 'a0000000-0000-0000-0000-00000000e003';
begin
  if not exists (select 1 from auth.users where id = v_alex) then
    raise exception 'Mock friends not found — run mock-friends.sql first.';
  end if;

  -- Events, organized by mock friends, at real curated (Neon) venues
  insert into events (
    id, title, description, location_name, address, lat, lng, place_id,
    google_maps_url, starts_at, ends_at, organizer_id, organizer_name, visibility
  ) values
    (v_event_goat, 'Girl & the Goat birthday dinner',
     'Celebrating Jordan''s birthday — group table booked for 7.',
     'Girl & the Goat Los Angeles', '555-3 Mateo St, Los Angeles, CA 90013, USA',
     34.0402258, -118.2331693, 'ChIJXVodUFfHwoARe63Z7LSuUnY',
     'https://maps.google.com/?cid=8526069136656805243',
     '2026-09-05 19:00:00-07', '2026-09-05 21:30:00-07',
     v_alex, 'Alex Chen', 'public'),
    (v_event_soho, 'Rooftop hang at Soho House',
     'Low-key rooftop drinks before the weekend gets busy.',
     'Soho House Holloway', '8465 Holloway Dr, West Hollywood, CA 90069, USA',
     34.090952, -118.3756375, 'ChIJ0cwCN6m_woAROTFGPVdjWms',
     'https://maps.google.com/?place_id=ChIJ0cwCN6m_woAROTFGPVdjWms',
     '2026-09-12 18:30:00-07', null,
     v_jordan, 'Jordan Kim', 'public'),
    (v_event_normandie, 'Friday night at The Normandie Club',
     'K-town crawl starts here.',
     'The Normandie Club', '3612 W 6th St, Los Angeles, CA 90020, USA',
     34.0634563, -118.3008976, 'ChIJCUNzt4K4woAR-z4MIi0ONo4',
     'https://maps.google.com/?place_id=ChIJCUNzt4K4woAR-z4MIi0ONo4',
     '2026-09-18 20:00:00-07', null,
     v_taylor, 'Taylor Brooks', 'public')
  on conflict (id) do nothing;

  -- RSVPs. No unique constraint on (event_id, user_id), so guard manually.
  insert into event_attendees (event_id, user_id, display_name, status, invited_by)
  select v_event_goat, v_jordan, 'Jordan Kim', 'accepted', v_alex
  where not exists (select 1 from event_attendees where event_id = v_event_goat and user_id = v_jordan);
  insert into event_attendees (event_id, user_id, display_name, status, invited_by)
  select v_event_goat, v_taylor, 'Taylor Brooks', 'accepted', v_alex
  where not exists (select 1 from event_attendees where event_id = v_event_goat and user_id = v_taylor);
  insert into event_attendees (event_id, user_id, display_name, status, invited_by)
  select v_event_goat, v_morgan, 'Morgan Lee', 'invited', v_alex
  where not exists (select 1 from event_attendees where event_id = v_event_goat and user_id = v_morgan);
  insert into event_attendees (event_id, user_id, display_name, status, invited_by)
  select v_event_goat, v_riley, 'Riley Davis', 'declined', v_alex
  where not exists (select 1 from event_attendees where event_id = v_event_goat and user_id = v_riley);

  insert into event_attendees (event_id, user_id, display_name, status, invited_by)
  select v_event_soho, v_alex, 'Alex Chen', 'accepted', v_jordan
  where not exists (select 1 from event_attendees where event_id = v_event_soho and user_id = v_alex);
  insert into event_attendees (event_id, user_id, display_name, status, invited_by)
  select v_event_soho, v_morgan, 'Morgan Lee', 'accepted', v_jordan
  where not exists (select 1 from event_attendees where event_id = v_event_soho and user_id = v_morgan);
  insert into event_attendees (event_id, user_id, display_name, status, invited_by)
  select v_event_soho, v_riley, 'Riley Davis', 'invited', v_jordan
  where not exists (select 1 from event_attendees where event_id = v_event_soho and user_id = v_riley);

  insert into event_attendees (event_id, user_id, display_name, status, invited_by)
  select v_event_normandie, v_alex, 'Alex Chen', 'accepted', v_taylor
  where not exists (select 1 from event_attendees where event_id = v_event_normandie and user_id = v_alex);
  insert into event_attendees (event_id, user_id, display_name, status, invited_by)
  select v_event_normandie, v_jordan, 'Jordan Kim', 'accepted', v_taylor
  where not exists (select 1 from event_attendees where event_id = v_event_normandie and user_id = v_jordan);
  insert into event_attendees (event_id, user_id, display_name, status, invited_by)
  select v_event_normandie, v_morgan, 'Morgan Lee', 'accepted', v_taylor
  where not exists (select 1 from event_attendees where event_id = v_event_normandie and user_id = v_morgan);
  insert into event_attendees (event_id, user_id, display_name, status, invited_by)
  select v_event_normandie, v_riley, 'Riley Davis', 'accepted', v_taylor
  where not exists (select 1 from event_attendees where event_id = v_event_normandie and user_id = v_riley);

  -- Reactions on curated (Neon) pins, from mock friends.
  -- pin_reactions has a real unique(location_id, user_id) constraint.
  insert into pin_reactions (location_id, user_id, reaction) values
    ('45b059c8-2fcb-4e52-8fff-fbbc96444f14', v_alex,   'fire'),    -- Hae Jang Chon Korean BBQ
    ('45b059c8-2fcb-4e52-8fff-fbbc96444f14', v_jordan, 'fire'),
    ('45b059c8-2fcb-4e52-8fff-fbbc96444f14', v_taylor, 'check'),
    ('6686779d-0570-4bd7-86a1-0a304f686be3', v_alex,   'hundred'), -- Girl & the Goat
    ('6686779d-0570-4bd7-86a1-0a304f686be3', v_morgan, 'fire'),
    ('78ff3bf7-4818-48aa-9c0a-e1ad251e2ed8', v_jordan, 'fire'),    -- Soho House Holloway
    ('78ff3bf7-4818-48aa-9c0a-e1ad251e2ed8', v_riley,  'check'),
    ('5306e2fb-f642-4838-8361-43b736116ffc', v_taylor, 'fire'),    -- The Normandie Club
    ('5306e2fb-f642-4838-8361-43b736116ffc', v_morgan, 'fire'),
    ('5306e2fb-f642-4838-8361-43b736116ffc', v_riley,  'hundred'),
    ('3c42ce52-ae5f-4e05-8048-cb149bc394c1', v_alex,   'check'),   -- Musso & Frank Grill
    ('eee35bbf-c35a-402a-b6b6-0a3505172377', v_jordan, 'hundred')  -- Providence
  on conflict (location_id, user_id) do nothing;

  raise notice 'Demo seed complete: 3 events, RSVPs, and pin reactions.';
end $$;
