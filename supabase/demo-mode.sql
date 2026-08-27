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

create policy "Anon can read curated demo locations"
  on locations for select to anon
  using (added_by = '00000000-0000-0000-0000-000000000099');

-- Needed only so the demo can render the "Neon" attribution name
create policy "Anon can read the demo curator profile"
  on profiles for select to anon
  using (id = '00000000-0000-0000-0000-000000000099');
