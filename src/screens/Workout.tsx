import { useEffect, useRef, useState } from 'react';
import type { Workout } from '../lib/workouts';
import type { SessionWithSets } from '../lib/supabase';
import { fmtTime, relTime } from '../lib/format';

interface SetState {
  weight: string;
  reps: string;
  done: boolean;
}

interface Props {
  workout: Workout;
  history: SessionWithSets[];
  onFinish: (session: {
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
  }) => Promise<void>;
  onBack: () => void;
}

function getLastSetsForExercise(history: SessionWithSets[], exerciseId: string) {
  for (const session of history) {
    const sets = session.sets.filter((s) => s.exercise_id === exerciseId);
    if (sets.length > 0) {
      return { sets, date: session.finished_at };
    }
  }
  return null;
}

function CheckIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ArrowLeftIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function TrendingIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

export function WorkoutScreen({ workout, history, onFinish, onBack }: Props) {
  const [setData, setSetData] = useState<Record<string, SetState[]>>(() => {
    const init: Record<string, SetState[]> = {};
    workout.exercises.forEach((ex) => {
      init[ex.id] = Array.from({ length: ex.sets }, () => ({ weight: '', reps: '', done: false }));
    });
    return init;
  });
  const [expanded, setExpanded] = useState<string | null>(workout.exercises[0].id);
  // Timer stores the end timestamp so it survives app backgrounding
  const [timer, setTimer] = useState<{ endsAt: number; total: number } | null>(null);
  const [, forceUpdate] = useState(0);
  const [startedAt] = useState(new Date().toISOString());
  const [startedAtMs] = useState(Date.now());
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!timer) return;
    tickRef.current = setInterval(() => {
      if (Date.now() >= timer.endsAt) {
        setTimer(null);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      } else {
        forceUpdate((n) => n + 1);
      }
    }, 500);
    // Recalculate immediately when returning from background
    const onVisible = () => forceUpdate((n) => n + 1);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [timer]);

  const updateSet = (exId: string, idx: number, patch: Partial<SetState>) => {
    setSetData((prev) => ({
      ...prev,
      [exId]: prev[exId].map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }));
  };

  const completeSet = (exId: string, idx: number, restSeconds: number) => {
    const set = setData[exId][idx];
    const nowDone = !set.done;
    updateSet(exId, idx, { done: nowDone });
    if (nowDone) {
      setTimer({ endsAt: Date.now() + restSeconds * 1000, total: restSeconds });
      const allDone = setData[exId].every((s, i) => (i === idx ? true : s.done));
      if (allDone) {
        const order = workout.exercises.map((e) => e.id);
        const nextId = order[order.indexOf(exId) + 1];
        if (nextId) setExpanded(nextId);
      }
    }
  };

  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const doneSets = workout.exercises.reduce(
    (sum, ex) => sum + setData[ex.id].filter((s) => s.done).length,
    0
  );
  const pct = Math.round((doneSets / totalSets) * 100);
  const elapsedMin = Math.floor((Date.now() - startedAtMs) / 60000);

  const handleConfirmFinish = async () => {
    setSaving(true);
    const sets: Array<{
      exercise_id: string;
      set_number: number;
      weight: number | null;
      reps: number | null;
    }> = [];
    workout.exercises.forEach((ex) => {
      setData[ex.id].forEach((s, i) => {
        if (s.done || s.weight || s.reps) {
          sets.push({
            exercise_id: ex.id,
            set_number: i + 1,
            weight: s.weight ? parseFloat(s.weight) : null,
            reps: s.reps ? parseInt(s.reps) : null,
          });
        }
      });
    });
    await onFinish({
      workoutId: workout.id,
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMinutes: Math.max(elapsedMin, 1),
      sets,
    });
    // parent navigates away
  };

  return (
    <div className="min-h-screen pb-32">
      <header className="sticky top-0 z-30" style={{ background: '#0f0f0f' }}>
        <div className="px-5 pt-10 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={onBack} className="active:opacity-60 transition-opacity -ml-0.5">
              <ArrowLeftIcon size={20} />
            </button>
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-0.5">Workout {workout.id}</div>
              <div className="text-xl font-bold leading-none">{workout.name}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">Elapsed</div>
              <div className="text-sm font-mono font-bold tabular-nums">{elapsedMin}m</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: '#1e1e1e' }}>
              <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, background: workout.color.from }} />
            </div>
            <div className="text-xs font-mono tabular-nums text-zinc-500 shrink-0">{doneSets}/{totalSets}</div>
          </div>
        </div>
      </header>

      <main className="px-5 pt-4 space-y-3">
        {workout.exercises.map((ex, exIdx) => {
          const sets = setData[ex.id];
          const isExpanded = expanded === ex.id;
          const completed = sets.filter((s) => s.done).length;
          const isComplete = completed === ex.sets;
          const lastData = getLastSetsForExercise(history, ex.id);

          return (
            <div
              key={ex.id}
              style={{
                background: isComplete ? '#0d1f0f' : isExpanded ? '#1a1a1a' : '#161616',
                border: `1px solid ${isComplete ? '#1a3d1e' : '#222'}`,
                borderRadius: 8,
              }}
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : ex.id)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <div
                  className="w-8 h-8 flex items-center justify-center shrink-0 font-bold text-sm"
                  style={{
                    background: isComplete ? '#22c55e' : '#1e1e1e',
                    color: isComplete ? '#0a1f0c' : '#555',
                    borderRadius: 6,
                  }}
                >
                  {isComplete ? <CheckIcon size={18} /> : exIdx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium leading-tight">{ex.name}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {ex.sets} × {ex.reps} · {ex.rest}s rest
                  </div>
                </div>
                <span className="text-xs font-mono tabular-nums text-zinc-500">
                  {completed}/{ex.sets}
                </span>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4">
                  {lastData && (
                    <div className="mb-3 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center gap-2">
                      <span style={{ color: workout.color.text, opacity: 0.8 }}>
                        <TrendingIcon size={14} />
                      </span>
                      <div className="text-[11px] text-zinc-400">
                        <span className="text-zinc-500">Last ({relTime(lastData.date)}): </span>
                        {lastData.sets.map((s, i) => (
                          <span key={i} className="font-mono">
                            {s.weight ?? 'BW'}×{s.reps}
                            {i < lastData.sets.length - 1 && (
                              <span className="text-zinc-700 mx-1">·</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {sets.map((set, idx) => {
                      const lastSet = lastData?.sets[idx];
                      return (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 transition-opacity ${set.done ? 'opacity-50' : ''}`}
                        >
                          {/* Set number */}
                          <div className="text-xs font-mono text-zinc-600 w-4 text-center shrink-0">{idx + 1}</div>

                          {/* Weight input */}
                          <div className="flex items-center flex-1 min-w-0" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8 }}>
                            <input
                              type="number"
                              inputMode="decimal"
                              value={set.weight}
                              onChange={(e) => updateSet(ex.id, idx, { weight: e.target.value })}
                              placeholder={lastSet?.weight != null ? String(lastSet.weight) : '0'}
                              className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm font-mono text-center focus:outline-none placeholder:text-zinc-700"
                            />
                            <span className="text-[11px] text-zinc-600 pr-2.5 shrink-0">kg</span>
                          </div>

                          <span className="text-xs text-zinc-600 shrink-0">×</span>

                          {/* Reps input */}
                          <div className="flex items-center flex-1 min-w-0" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8 }}>
                            <input
                              type="number"
                              inputMode="numeric"
                              value={set.reps}
                              onChange={(e) => updateSet(ex.id, idx, { reps: e.target.value })}
                              placeholder={String(ex.reps)}
                              className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm font-mono text-center focus:outline-none placeholder:text-zinc-700"
                            />
                            <span className="text-[11px] text-zinc-600 pr-2.5 shrink-0">reps</span>
                          </div>

                          {/* Done button */}
                          <button
                            onClick={() => completeSet(ex.id, idx, ex.rest)}
                            className="h-10 w-10 flex items-center justify-center shrink-0 active:scale-95 transition-transform"
                            style={{ background: set.done ? '#22c55e' : '#1e1e1e', color: set.done ? '#0a1f0c' : '#555', borderRadius: 8 }}
                            aria-label={set.done ? 'Undo' : 'Complete'}
                          >
                            <CheckIcon size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <button
          onClick={() => setShowConfirm(true)}
          disabled={doneSets === 0}
          className="w-full mt-4 py-3.5 text-sm font-bold active:opacity-80 transition-opacity disabled:opacity-30"
          style={{
            background: doneSets === 0 ? '#1a1a1a' : workout.color.from,
            color: doneSets === 0 ? '#555' : '#000',
            borderRadius: 8,
          }}
        >
          Finish Session
        </button>
      </main>

      {/* Rest timer */}
      {timer && (() => {
        const secondsLeft = Math.max(0, Math.round((timer.endsAt - Date.now()) / 1000));
        return (
          <div
            className="fixed bottom-0 left-0 right-0 z-40"
            style={{ background: '#161616', border: '1px solid #222', borderRadius: '12px 12px 0 0' }}
          >
            <div className="px-5 py-3 flex items-center gap-4">
              <div className="flex-1">
                <div
                  className="text-[10px] uppercase tracking-widest font-semibold"
                  style={{ color: workout.color.text }}
                >
                  Rest
                </div>
                <div className="text-3xl font-mono font-bold tabular-nums leading-none mt-1">
                  {fmtTime(secondsLeft)}
                </div>
              </div>
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500 ease-linear"
                  style={{
                    width: `${(secondsLeft / timer.total) * 100}%`,
                    background: workout.color.from,
                  }}
                />
              </div>
              <button
                onClick={() => setTimer((t) => t ? { ...t, endsAt: t.endsAt + 15000 } : null)}
                className="px-3 h-10 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold active:scale-95"
              >
                +15
              </button>
              <button
                onClick={() => setTimer(null)}
                className="px-3 h-10 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold active:scale-95"
              >
                Skip
              </button>
            </div>
          </div>
        );
      })()}

      {/* Confirm finish modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full p-5" style={{ background: '#161616', border: '1px solid #222', borderRadius: '12px 12px 0 0' }}>
            <div className="text-lg font-bold mb-1">Save this session?</div>
            <div className="text-zinc-500 text-sm mb-5">
              {doneSets} of {totalSets} sets · {elapsedMin} min
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={saving}
                className="flex-1 py-3.5 text-sm font-semibold text-zinc-400 active:text-zinc-200 transition-colors"
                style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: 8 }}
              >
                Keep going
              </button>
              <button
                onClick={handleConfirmFinish}
                disabled={saving}
                className="flex-[2] py-3.5 text-sm font-bold disabled:opacity-50 active:opacity-80 transition-opacity"
                style={{ background: workout.color.from, color: '#000', borderRadius: 8 }}
              >
                {saving ? 'Saving…' : 'Save & finish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
