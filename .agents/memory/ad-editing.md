---
name: Ad editing flow
description: How the create/edit ad modal works for both new and existing ads
---

## Rule
`AdFormModal` is a single unified component for both creating and editing ads. `editAd?: Ad | null` prop controls mode.

**Why:** Avoids two separate modals with duplicated form code.

**How to apply:**
- Creating: `setShowCreateAd(true)` with `editingAd = null`
- Editing: `handleEditAd(ad)` sets `editingAd = ad` then `setShowCreateAd(true)`
- `handleAddOrEditAd(ad)` in App dispatches: if `editingAd` exists → update via map; else → prepend new ad
- On close, always reset: `setShowCreateAd(false); setEditingAd(null)`
- Edit button appears per-ad in ProfileView (My Ads tab) and in AdminPanel/OwnerDashboard
