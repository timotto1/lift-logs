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
  const [timer, setTimer] = useState({ active: false, secondsLeft: 0, total: 0 });
  const [startedAt] = useState(new Date().toISOString());
  const [startedAtMs] = useState(Date.now());
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const tickRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.active && timer.secondsLeft > 0) {
      tickRef.current = setTimeout(() => {
        setTimer((t) => ({ ...t, secondsLeft: t.secondsLeft - 1 }));
      }, 1000);
    } else if (timer.active && timer.secondsLeft === 0) {
      setTimer((t) => ({ ...t, active: false }));
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
    return () => {
      if (tickRef.current) clearTimeout(tickRef.current);
    };
  }, [timer.active, timer.secondsLeft]);

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
      setTimer({ active: true, secondsLeft: restSeconds, total: restSeconds });
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
      <header className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="px-5 pt-4 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-lg active:bg-zinc-800">
              <ArrowLeftIcon size={20} />
            </button>
            <div className="flex-1">
              <div
                className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-0.5"
                style={{ color: workout.color.text }}
              >
                Workout {workout.id}
              </div>
              <div className="font-display text-2xl leading-none">{workout.name}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-zinc-500">Elapsed</div>
              <div className="text-base font-mono font-semibold tabular-nums">{elapsedMin}m</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${workout.color.from}, ${workout.color.to})`,
                }}
              />
            </div>
            <div className="text-xs font-mono tabular-nums text-zinc-400 w-12 text-right">
              {doneSets}/{totalSets}
            </div>
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
              className={`rounded-2xl border transition-colors ${
                isComplete
                  ? 'bg-emerald-950/30 border-emerald-900/50'
                  : isExpanded
                  ? 'bg-zinc-900 border-zinc-700'
                  : 'bg-zinc-900/50 border-zinc-800'
              }`}
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : ex.id)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
                  style={{
                    background: isComplete ? '#10b981' : '#27272a',
                    color: isComplete ? '#022c22' : '#d4d4d8',
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

                  <div
                    className="grid gap-2 px-1 mb-1.5"
                    style={{ gridTemplateColumns: '28px 1fr 1fr 44px' }}
                  >
                    <div className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold">
                      Set
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold">
                      Weight (kg)
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold">
                      Reps
                    </div>
                    <div></div>
                  </div>

                  <div className="space-y-1.5">
                    {sets.map((set, idx) => {
                      const lastSet = lastData?.sets[idx];
                      return (
                        <div
                          key={idx}
                          className={`grid gap-2 items-center transition-opacity ${
                            set.done ? 'opacity-60' : ''
                          }`}
                          style={{ gridTemplateColumns: '28px 1fr 1fr 44px' }}
                        >
                          <div className="text-sm font-mono tabular-nums text-zinc-500 text-center">
                            {idx + 1}
                          </div>
                          <input
                            type="number"
                            inputMode="decimal"
                            value={set.weight}
                            onChange={(e) => updateSet(ex.id, idx, { weight: e.target.value })}
                            placeholder={lastSet?.weight != null ? String(lastSet.weight) : '—'}
                            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-base font-mono tabular-nums text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:bg-zinc-900"
                          />
                          <input
                            type="number"
                            inputMode="numeric"
                            value={set.reps}
                            onChange={(e) => updateSet(ex.id, idx, { reps: e.target.value })}
                            placeholder={String(ex.reps)}
                            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-base font-mono tabular-nums text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:bg-zinc-900"
                          />
                          <button
                            onClick={() => completeSet(ex.id, idx, ex.rest)}
                            className="h-11 rounded-lg flex items-center justify-center transition-all active:scale-95"
                            style={{
                              background: set.done ? '#10b981' : '#27272a',
                              color: set.done ? '#022c22' : '#a1a1aa',
                            }}
                            aria-label={set.done ? 'Undo' : 'Complete'}
                          >
                            <CheckIcon size={18} />
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
          className="w-full mt-4 py-4 rounded-xl font-bold text-base active:scale-[0.98] transition-transform disabled:bg-zinc-800 disabled:text-zinc-600"
          style={{
            background: doneSets === 0 ? undefined : workout.color.from,
            color: doneSets === 0 ? undefined : '#000',
          }}
        >
          Finish Session
        </button>
      </main>

      {/* Rest timer */}
      {timer.active && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-900 border-t shadow-2xl"
          style={{ borderColor: workout.color.from + '50' }}
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
                {fmtTime(timer.secondsLeft)}
              </div>
            </div>
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-1000 ease-linear"
                style={{
                  width: `${(timer.secondsLeft / timer.total) * 100}%`,
                  background: workout.color.from,
                }}
              />
            </div>
            <button
              onClick={() => setTimer((t) => ({ ...t, secondsLeft: t.secondsLeft + 15 }))}
              className="px-3 h-10 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold active:scale-95"
            >
              +15
            </button>
            <button
              onClick={() => setTimer({ active: false, secondsLeft: 0, total: 0 })}
              className="px-3 h-10 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold active:scale-95"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Confirm finish modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm">
            <div className="font-display text-3xl mb-2">Save this session?</div>
            <div className="text-zinc-400 text-sm mb-6">
              {doneSets} of {totalSets} sets logged in {elapsedMin} minutes. Next time, beat at least
              one set.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-300 font-medium active:scale-[0.98] transition-transform"
              >
                Keep going
              </button>
              <button
                onClick={handleConfirmFinish}
                disabled={saving}
                className="flex-[2] py-3 rounded-xl font-bold disabled:opacity-60 active:scale-[0.98] transition-transform"
                style={{ background: workout.color.from, color: '#000' }}
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
