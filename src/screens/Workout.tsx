import { useEffect, useRef, useState } from 'react';
import type { Workout } from '../lib/workouts';
import type { SessionWithSets } from '../lib/supabase';
import { fmtTime, relTime } from '../lib/format';
import { colors, motion, radii, surfaceSheen } from '../components/ui';

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

  const fieldStyle: React.CSSProperties = {
    background: colors.surface2,
    border: `1px solid ${colors.borderInput}`,
    borderRadius: radii.md,
  };

  return (
    <div className="min-h-screen pb-32">
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ background: 'rgba(10,10,10,0.85)', borderBottom: `1px solid ${colors.borderSubtle}` }}
      >
        <div className="px-5 pt-10 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={onBack} className="active:opacity-60 active:scale-95 transition-[opacity,transform] -ml-0.5">
              <ArrowLeftIcon size={20} />
            </button>
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-[0.3em] mb-0.5" style={{ color: colors.textTertiary }}>
                Workout {workout.id}
              </div>
              <div className="text-xl font-bold leading-none font-display tracking-tight">{workout.name}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest" style={{ color: colors.textDim }}>Elapsed</div>
              <div className="text-sm font-mono font-bold tabular-nums">{elapsedMin}m</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: workout.color.from }}
              />
            </div>
            <div className="text-xs font-mono tabular-nums shrink-0" style={{ color: colors.textTertiary }}>
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
              className="transition-[background,border-color] duration-300"
              style={{
                background: isComplete
                  ? colors.complete
                  : isExpanded
                  ? `${surfaceSheen}, ${colors.surface2}`
                  : `${surfaceSheen}, ${colors.surface1}`,
                border: `1px solid ${isComplete ? colors.completeBorder : colors.border}`,
                borderRadius: radii.lg,
              }}
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : ex.id)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <div
                  className="w-8 h-8 flex items-center justify-center shrink-0 font-bold text-sm transition-colors duration-300"
                  style={{
                    background: isComplete ? colors.positive : colors.surface3,
                    color: isComplete ? '#06281c' : colors.textDim,
                    borderRadius: 10,
                  }}
                >
                  {isComplete ? <CheckIcon size={18} /> : exIdx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium leading-tight">{ex.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
                    {ex.sets} × {ex.reps} · {ex.rest}s rest
                  </div>
                </div>
                <span className="text-xs font-mono tabular-nums" style={{ color: colors.textTertiary }}>
                  {completed}/{ex.sets}
                </span>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 animate-fade-rise">
                  {lastData && (
                    <div
                      className="mb-3 px-3 py-2 flex items-center gap-2"
                      style={{ background: '#101010', border: `1px solid ${colors.borderSubtle}`, borderRadius: radii.md }}
                    >
                      <span style={{ color: workout.color.text, opacity: 0.8 }}>
                        <TrendingIcon size={14} />
                      </span>
                      <div className="text-[11px]" style={{ color: colors.textSecondary }}>
                        <span style={{ color: colors.textTertiary }}>Last ({relTime(lastData.date)}): </span>
                        {lastData.sets.map((s, i) => (
                          <span key={i} className="font-mono">
                            {s.weight ?? 'BW'}×{s.reps}
                            {i < lastData.sets.length - 1 && (
                              <span className="mx-1" style={{ color: colors.textDim }}>·</span>
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
                          className={`flex items-center gap-2 transition-opacity duration-200 ${set.done ? 'opacity-50' : ''}`}
                        >
                          {/* Set number */}
                          <div className="text-xs font-mono w-4 text-center shrink-0" style={{ color: colors.textDim }}>
                            {idx + 1}
                          </div>

                          {/* Weight input */}
                          <div className="flex items-center flex-1 min-w-0" style={fieldStyle}>
                            <input
                              type="number"
                              inputMode="decimal"
                              value={set.weight}
                              onChange={(e) => updateSet(ex.id, idx, { weight: e.target.value })}
                              placeholder={lastSet?.weight != null ? String(lastSet.weight) : '0'}
                              className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm font-mono text-center focus:outline-none placeholder:text-zinc-700"
                            />
                            <span className="text-[11px] pr-2.5 shrink-0" style={{ color: colors.textDim }}>kg</span>
                          </div>

                          <span className="text-xs shrink-0" style={{ color: colors.textDim }}>×</span>

                          {/* Reps input */}
                          <div className="flex items-center flex-1 min-w-0" style={fieldStyle}>
                            <input
                              type="number"
                              inputMode="numeric"
                              value={set.reps}
                              onChange={(e) => updateSet(ex.id, idx, { reps: e.target.value })}
                              placeholder={String(ex.reps)}
                              className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm font-mono text-center focus:outline-none placeholder:text-zinc-700"
                            />
                            <span className="text-[11px] pr-2.5 shrink-0" style={{ color: colors.textDim }}>reps</span>
                          </div>

                          {/* Done button */}
                          <button
                            onClick={() => completeSet(ex.id, idx, ex.rest)}
                            className="h-10 w-10 flex items-center justify-center shrink-0 active:scale-90 transition-[transform,background-color,color] duration-200"
                            style={{
                              background: set.done ? colors.positive : colors.surface3,
                              color: set.done ? '#06281c' : colors.textDim,
                              borderRadius: radii.md,
                            }}
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
          className="w-full mt-4 py-3.5 text-sm font-bold active:scale-[0.97] active:opacity-90 transition-[transform,opacity] duration-150 disabled:opacity-30 disabled:active:scale-100"
          style={{
            background: doneSets === 0 ? colors.surface2 : workout.color.from,
            color: doneSets === 0 ? colors.textDim : '#000',
            borderRadius: radii.button,
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
            className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl animate-sheet-up"
            style={{
              background: 'rgba(20,20,20,0.92)',
              borderTop: `1px solid ${colors.border}`,
              borderRadius: `${radii.xl}px ${radii.xl}px 0 0`,
            }}
          >
            <div
              className="px-5 py-3 flex items-center gap-4"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
            >
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
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500 ease-linear"
                  style={{
                    width: `${(secondsLeft / timer.total) * 100}%`,
                    background: workout.color.from,
                  }}
                />
              </div>
              <button
                onClick={() => setTimer((t) => t ? { ...t, endsAt: t.endsAt + 15000 } : null)}
                className="px-3 h-10 text-xs font-semibold active:scale-95 transition-transform"
                style={{ background: colors.surface3, color: colors.textSecondary, borderRadius: radii.md }}
              >
                +15
              </button>
              <button
                onClick={() => setTimer(null)}
                className="px-3 h-10 text-xs font-semibold active:scale-95 transition-transform"
                style={{ background: colors.surface3, color: colors.textSecondary, borderRadius: radii.md }}
              >
                Skip
              </button>
            </div>
          </div>
        );
      })()}

      {/* Confirm finish modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-backdrop-in" onClick={() => !saving && setShowConfirm(false)} />
          <div
            className="relative w-full p-5 animate-sheet-up"
            style={{
              background: colors.surface2,
              border: `1px solid ${colors.border}`,
              borderBottom: 'none',
              borderRadius: `${radii.sheet}px ${radii.sheet}px 0 0`,
              paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
              transitionTimingFunction: motion.spring,
            }}
          >
            <div className="flex justify-center pb-3 -mt-1">
              <div className="w-9 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
            </div>
            <div className="text-lg font-bold mb-1 font-display tracking-tight">Save this session?</div>
            <div className="text-sm mb-5" style={{ color: colors.textTertiary }}>
              {doneSets} of {totalSets} sets · {elapsedMin} min
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={saving}
                className="flex-1 py-3.5 text-sm font-semibold active:scale-[0.97] transition-[transform,color] duration-150"
                style={{
                  background: colors.surface3,
                  border: `1px solid ${colors.border}`,
                  color: colors.textSecondary,
                  borderRadius: radii.button,
                }}
              >
                Keep going
              </button>
              <button
                onClick={handleConfirmFinish}
                disabled={saving}
                className="flex-[2] py-3.5 text-sm font-bold disabled:opacity-50 active:scale-[0.97] active:opacity-90 transition-[transform,opacity] duration-150"
                style={{ background: workout.color.from, color: '#000', borderRadius: radii.button }}
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
