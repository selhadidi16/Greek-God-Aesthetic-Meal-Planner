# Greek God Aesthetic Meal Planner (PRO Starter)

Adds on top of MVP:
- 7-day plan generator + grocery list
- Grocery list CSV export
- Client check-ins (weekly weight + notes)
- Admin: client list + client detail + macro tweaks/regeneration
- Print-friendly plan view (use browser “Save as PDF”)

## Setup
1) Create Supabase project, set env vars in `.env.local` from `.env.example`
2) Enable Google login:
   - Supabase -> Authentication -> Providers -> Google -> Enable
   - Redirect URLs:
     - http://localhost:3000/auth/callback
     - https://YOUR_DOMAIN/auth/callback
3) Run SQL: `supabase/schema.sql`
4) Run:
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Admin
Set your role to admin in `profiles.role` for your user id.

## PDF
Open a plan -> click **Print / PDF** -> browser print dialog -> “Save as PDF”.
