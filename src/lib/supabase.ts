import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Types matching the schema
export interface Session {
  id: string;
  user_id: string;
  workout_id: number;
  started_at: string;
  finished_at: string;
  duration_minutes: number | null;
  created_at: string;
}

export interface SetLog {
  id: string;
  session_id: string;
  user_id: string;
  exercise_id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  completed: boolean;
  created_at: string;
}

// A session joined with its set_logs (what we mostly query)
export interface SessionWithSets extends Session {
  sets: SetLog[];
}
