import { useCallback, useEffect, useState } from 'react';
import { supabase, type SessionWithSets, type SetLog } from '../lib/supabase';

export function useHistory(userId: string | null) {
  const [history, setHistory] = useState<SessionWithSets[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!userId) {
      setHistory([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    // Fetch sessions and sets in parallel, then join client-side
    const [sessionsRes, setsRes] = await Promise.all([
      supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('finished_at', { ascending: false }),
      supabase
        .from('set_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
    ]);

    if (sessionsRes.error) {
      setError(sessionsRes.error.message);
      setLoading(false);
      return;
    }
    if (setsRes.error) {
      setError(setsRes.error.message);
      setLoading(false);
      return;
    }

    const setsBySession = new Map<string, SetLog[]>();
    for (const s of setsRes.data ?? []) {
      const arr = setsBySession.get(s.session_id) ?? [];
      arr.push(s);
      setsBySession.set(s.session_id, arr);
    }

    const joined: SessionWithSets[] = (sessionsRes.data ?? []).map((sess) => ({
      ...sess,
      sets: setsBySession.get(sess.id) ?? [],
    }));

    setHistory(joined);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { history, loading, error, refetch };
}

// Save a finished session: insert session row, then bulk-insert set_logs
export async function saveSession(params: {
  userId: string;
  workoutId: number;
  startedAt: string;
  finishedAt: string;
  durationMinutes: number;
  sets: Array<{
    exercise_id: string;
    set_number: number;
    weight: number | null;
    reps: number | null;
  }>;
}): Promise<{ error: string | null }> {
  const { userId, workoutId, startedAt, finishedAt, durationMinutes, sets } = params;

  const { data: sessionRow, error: sessionErr } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      workout_id: workoutId,
      started_at: startedAt,
      finished_at: finishedAt,
      duration_minutes: durationMinutes,
    })
    .select()
    .single();

  if (sessionErr || !sessionRow) {
    return { error: sessionErr?.message ?? 'Failed to create session' };
  }

  if (sets.length === 0) return { error: null };

  const setRows = sets.map((s) => ({
    session_id: sessionRow.id,
    user_id: userId,
    exercise_id: s.exercise_id,
    set_number: s.set_number,
    weight: s.weight,
    reps: s.reps,
    completed: true,
  }));

  const { error: setsErr } = await supabase.from('set_logs').insert(setRows);
  if (setsErr) return { error: setsErr.message };

  return { error: null };
}
