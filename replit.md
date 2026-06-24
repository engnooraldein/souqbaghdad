# سوك بغداد — Souq Baghdad

Iraqi digital marketplace. Browse as a guest; register to post ads and open a store.

## Run & Operate

- `pnpm --filter @workspace/souq-baghdad run dev` — run the frontend (Vite, port from env)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7 + Tailwind CSS v4
- Animations: Framer Motion
- Icons: Lucide React + Recharts (owner dashboard charts)
- No backend — all state via React + localStorage

## Where things live

- `artifacts/souq-baghdad/src/App.tsx` — entire frontend (~2700 lines, single-file monolith)
- `artifacts/souq-baghdad/src/index.css` — Tailwind v4 with Baghdad custom theme

## Architecture decisions

- **Guest browsing**: Full marketplace browsable without auth. Auth only required to post/manage.
- **Ad state**: `souqAds` localStorage. All ads have `postedBy: user.id` and `createdAtISO`.
- **Product state**: `souqProducts` localStorage. Separate from ads. Has `condition`, `stock`, `postedBy`.
- **Image storage**: All images converted to base64 via `compressImage()` (max 900px, 0.78 quality). Never blob URLs.
- **Seller public page**: `view='seller'` + `selectedSellerId`. Visible to any visitor without login.
- **ImageCropModal**: Drag-to-pan + zoom slider. Canvas exports cropped base64. Used for avatar (1:1) and cover (3:1).
- **ProfileView tabs**: Ads (إعلاناتي) / Store (متجري) / Account (الحساب).
- **Admin panel**: `user.role === 'admin'` (email contains "admin"). Delete ads.
- **Owner dashboard**: `user.email === OWNER_EMAIL` → role='owner'. Full analytics, user ban/unban, content management.
- **Tailwind v4**: Uses `@import "tailwindcss"` + `@theme` block. No `tailwind.config.js`. Dark mode via `.dark` class.

## Content visibility

Published ads and products appear on:
- Home page (MarketView, with tabs: الكل / إعلانات / منتجات)
- Search results
- Category filters
- Seller's public page

## Roles

- **Visitor**: Browse, search, view seller pages, view ads/products
- **User**: All visitor permissions + post ads, post products, manage own content, favorites, edit profile/cover/avatar
- **Admin**: All user permissions + admin panel (delete any content)
- **Owner** (`nooraldeinsbah@gmail.com`): All admin permissions + owner dashboard (analytics, visitor tracking, user management)

## User preferences

- Arabic RTL throughout
- Dark Baghdad blue/gold theme always active
- Iraqi identity: 18 governorates, Iraqi Eagle logo, Arabic font (Cairo)

## Gotchas

- Tailwind v4 does NOT support `@apply border-border` — use plain CSS
- The `dark` class is always on the root `div` — site is always dark-mode
- Images: ALWAYS use `compressImage()` → base64, never `URL.createObjectURL()`
- New content (ads/products) prepended to state and immediately visible everywhere
- ImageCropModal: aspectRatio=1 for avatar, aspectRatio=3 for cover photo
