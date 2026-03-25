# We Should Go

**Status:** Pre-prototype  
**Owner:** David Rosen  
**Purpose:** Portfolio project

## Concept

A collaborative web app for friend groups to log and share locations, events, and activities on a shared map. Based on the phrase friends use when making plans — "we should go there."

## Core Features (initial thinking)

- User authentication (friend group login)
- Interactive map (add pins/locations)
- Each pin: name, category (restaurant, event, activity, etc.), notes, added by
- Shared view — everyone sees everyone's additions
- Possibly: voting, "been there" checkoffs, wish lists

## Credentials (stored in workspace/secrets/)
- Service account: `bishop-service-account.json` (project: we-should-go-490705)
- Maps API key: `google-maps-key.txt`
- APIs enabled: Maps JS, Places, Geocoding, API Keys, Cloud Resource Manager, IAM

## Stack

Options to consider:
- **Frontend:** React / Next.js
- **Map:** Mapbox GL or Google Maps API or Leaflet (open source)
- **Backend:** Node/Express or Next.js API routes
- **DB:** Supabase (easy auth + real-time) or Firebase
- **Hosting:** Vercel / Netlify

## Open Questions

- [ ] What's David's preferred stack / comfort zone?
- [ ] Mobile-first or desktop?
- [ ] How do friends get invited — open registration, invite codes, or curated?
- [ ] Real-time updates or refresh-based?
- [ ] Categories/tags for locations?
- [ ] MVP scope vs. v1 scope

## Milestones

- [ ] Define MVP scope
- [ ] Choose tech stack
- [ ] Build prototype
- [ ] Iterate

## Notes

David is building this for his portfolio. It should look good, work well, and demonstrate real skill.
