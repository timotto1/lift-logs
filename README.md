# Lift Log

A personal workout tracker that syncs to Supabase. Built as a PWA — add it to your phone's home screen and it behaves like an app.

**What it does**

- Rotates you through a 4-day split (Workouts 1 → 2 → 3 → 4 → repeat) based on what you last logged
- Tracks weights, reps, and rest timer per set
- Shows last session's numbers as placeholders so you know what to beat
- Per-exercise progress charts over time

## Setup (one time, ~10 minutes)

### 1. Create a Supabase project

1. Sign up at [supabase.com](https://supabase.com) (free)
2. Create a new project — any name, any region (London is closest)
3. Set a database password (you won't need it; just save it somewhere)
4. Wait ~2 minutes for it to provision

### 2. Run the schema

1. In your Supabase project, open the SQL Editor (left sidebar)
2. Click "New query"
3. Open `supabase/schema.sql` from this repo, copy the contents, paste into the editor
4. Click "Run". You should see "Success. No rows returned."

### 3. Enable email auth

1. Go to Authentication → Providers
2. "Email" should already be on. Make sure "Confirm email" is **off** (otherwise the magic link flow needs an extra step)
3. Save

### 4. Configure environment variables

1. In Supabase, go to Project Settings → API
2. Copy the **Project URL** and the **anon public** key
3. In the repo, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Paste your values into `.env`

### 5. Install and run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Sign in with your email, click the magic link in your inbox, and you're in.

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com), sign in with GitHub
3. Click "Add New Project", import your repo
4. In the build settings:
   - Framework: **Vite**
   - Add two environment variables:
     - `VITE_SUPABASE_URL` = your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` = your anon key
5. Click Deploy. About 60 seconds.

You'll get a URL like `lift-log.vercel.app`.

### Add to your iPhone home screen

1. Open the Vercel URL in Safari on your phone
2. Tap the Share button → "Add to Home Screen"
3. The icon appears on your home screen. Tap it — fullscreen, no browser chrome, works like an app.

### Update the magic-link redirect URL

After deploying, go back to Supabase → Authentication → URL Configuration and add your Vercel URL to **Site URL** and **Redirect URLs**. Without this, the magic link from a deployed app will try to redirect to localhost.

## Editing the workouts

Open `src/lib/workouts.ts`. That's the single source of truth — change exercise names, sets, reps, rest times, or add new workouts there. Push to GitHub and Vercel auto-deploys.

## File map

```
src/
├── lib/
│   ├── supabase.ts       # Supabase client + types
│   ├── workouts.ts       # workout definitions (edit this to change the split)
│   └── format.ts         # date/time helpers
├── hooks/
│   ├── useAuth.ts        # auth state
│   └── useHistory.ts     # fetch + save sessions
├── screens/
│   ├── SignIn.tsx
│   ├── Home.tsx          # next workout + rotation + stats
│   ├── Workout.tsx       # set logging + rest timer
│   └── Progress.tsx      # per-exercise charts + history
├── components/
│   └── BottomNav.tsx
├── App.tsx               # routing
└── main.tsx              # entry point

supabase/
└── schema.sql            # run once in Supabase SQL editor
```

## Troubleshooting

**Magic link goes to localhost after deploying.** Add your Vercel URL to Supabase → Auth → URL Configuration.

**"Missing Supabase env vars" error.** You didn't set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. In Vercel: Project Settings → Environment Variables.

**Nothing saves when I tap Finish.** Open the browser console. If you see an RLS error, the schema didn't run cleanly — re-run `supabase/schema.sql`.

**I want to wipe my data.** In Supabase SQL editor: `delete from sessions;` (set_logs cascade automatically).
