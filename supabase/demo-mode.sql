-- Read-only public demo
--
-- Lets a logged-out visitor browse the curated "Neon" pins (and nothing else)
-- so the live site has something to show without forcing a sign-up.
--
-- Scope: SELECT only, and only rows owned by the synthetic Neon user.
-- Real user locations, friendships, invites, events, statuses and reactions
-- stay invisible to the anon role — none of those get an anon policy.
--
-- Run in the Supabase SQL editor after schema.sql + neon-schema.sql + neon-seed.sql.

-- The synthetic account that owns all curated content
-- 00000000-0000-0000-0000-000000000099  ("Neon")

drop policy if exists "Anon can read curated demo locations" on locations;
create policy "Anon can read curated demo locations"
  on locations for select to anon
  using (added_by = '00000000-0000-0000-0000-000000000099');

-- Needed only so the demo can render the "Neon" attribution name
drop policy if exists "Anon can read the demo curator profile" on profiles;
create policy "Anon can read the demo curator profile"
  on profiles for select to anon
  using (id = '00000000-0000-0000-0000-000000000099');

-- The 5 mock friend accounts created by mock-friends.sql. Demo events, RSVPs,
-- and reactions are only ever seeded (see demo-seed.sql) as belonging to one
-- of these — never the real account — so scoping anon reads to this exact
-- set is sufficient to keep David's own activity invisible.
--
-- (Deliberately NOT exposing `friendships`: every row in that table links a
-- mock friend to the real account, so there is no safe subset to expose.)

drop policy if exists "Anon can read demo events" on events;
create policy "Anon can read demo events"
  on events for select to anon
  using (
    visibility = 'public'
    and organizer_id = any (array[
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000004',
      '00000000-0000-0000-0000-000000000005'
    ]::uuid[])
  );

drop policy if exists "Anon can read demo event RSVPs" on event_attendees;
create policy "Anon can read demo event RSVPs"
  on event_attendees for select to anon
  using (
    exists (
      select 1 from events
      where events.id = event_attendees.event_id
      and events.organizer_id = any (array[
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000004',
        '00000000-0000-0000-0000-000000000005'
      ]::uuid[])
    )
  );

drop policy if exists "Anon can read demo pin reactions" on pin_reactions;
create policy "Anon can read demo pin reactions"
  on pin_reactions for select to anon
  using (
    user_id = any (array[
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000004',
      '00000000-0000-0000-0000-000000000005'
    ]::uuid[])
    and exists (
      select 1 from locations
      where locations.id = pin_reactions.location_id
      and locations.added_by = '00000000-0000-0000-0000-000000000099'
    )
  );
