---
name: Owner Dashboard
description: Special role and dashboard for the site owner email nooraldeinsbah@gmail.com
---

## Rule
When a user logs in with exactly `nooraldeinsbah@gmail.com`, their role is set to `'owner'` (checked in AuthModal handleSubmit against `OWNER_EMAIL` constant). The owner sees a Crown icon in the nav and has access to `OwnerDashboard`.

**Why:** Site owner needs full analytics + user management that admins don't get.

**How to apply:** Check `user?.role === 'owner'` to gate OwnerDashboard. `isOwner` flag in App. Admin panel is separate for `role === 'admin'` only (not owner).

## OwnerDashboard tabs
- Overview: 7-day visit bar chart (recharts), device pie chart, location bar chart, category stats
- Visitors: table of recent visits from `souqVisits` localStorage (max 2000)
- Users: list from `souqUsers` localStorage with ban/unban toggle
- Ads: all ads with delete, view count

## Visitor tracking
`recordVisit(user)` called on app init and on user login. Detects device via userAgent. Location from user.location or 'زائر'. Stored in `souqVisits` localStorage array.

## User management
`saveStoredUser(user, adCount)` called on login and profile update. `isBanned(email)` checked at login. Owner toggles `isBanned` on StoredUser objects in `souqUsers` localStorage.
