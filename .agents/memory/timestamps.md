---
name: Real-time ad timestamps
description: How ads display relative time that updates live
---

## Rule
All ads have `createdAtISO: string` (ISO 8601). `useRelativeTime(iso)` hook returns Arabic relative string ("منذ X ثانية/دقيقة/ساعة/يوم") and updates every 10 seconds via `setInterval`.

**Why:** User wants live time feedback ("منذ 5 ثواني") on newly posted ads.

**How to apply:**
- New ads: `createdAtISO: new Date().toISOString()` set in `AdFormModal.handleSubmit`
- Old/migrated ads: on app init, ads without `createdAtISO` get it set from `createdAt` date or `Date.now()`
- `TimeAgo` component wraps `useRelativeTime` for declarative use
- `getRelative(iso)` is also available as a plain function (used in non-hook contexts like OwnerDashboard tables)
