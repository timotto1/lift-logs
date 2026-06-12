import { useMemo, useState } from 'react';
import type { SessionWithSets, SetLog } from '../lib/supabase';
import { NicotineMilestones } from '../components/NicotineMilestones';
import { WORKOUTS, getAllExercises, getWorkoutById, type Exercise, type Workout } from '../lib/workouts';
import { relTime } from '../lib/format';
import { updateSetLog, deleteSession, saveSession } from '../hooks/useHistory';
import { SegmentedControl, Sheet, colors, radii, surfaceSheen } from '../components/ui';

interface Props {
  history: SessionWithSets[];
  onRefetch: () => Promise<void>;
  userId: string;
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEKS = 16;

const panelStyle: React.CSSProperties = {
  background: `${surfaceSheen}, ${colors.surface1}`,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.lg,
};

const fieldStyle: React.CSSProperties = {
  background: colors.surface2,
  border: `1px solid ${colors.borderInput}`,
  borderRadius: radii.md,
};

function ConsistencyHeatmap({ history }: { history: SessionWithSets[] }) {
  const sessionMap = useMemo(() => {
    const map: Record<string, string> = {};
    history.forEach((s) => {
      const d = new Date(s.finished_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const workout = getWorkoutById(s.workout_id);
      if (workout) map[key] = workout.color.from;
    });
    return map;
  }, [history]);

  const today = new Date();
  const todayDay = today.getDay();
  const daysSinceMonday = (todayDay + 6) % 7;
  const gridEnd = new Date(today);
  gridEnd.setDate(today.getDate() + (6 - daysSinceMonday));

  const cells: Array<{ date: Date; key: string; isFuture: boolean }> = [];
  for (let w = WEEKS - 1; w >= 0; w--) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(gridEnd);
      date.setDate(gridEnd.getDate() - w * 7 - (6 - d));
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      cells.push({ date, key, isFuture: date > today });
    }
  }

  const monthLabels: Array<{ label: string; col: number }> = [];
  cells.forEach((cell, i) => {
    const col = Math.floor(i / 7);
    if (cell.date.getDate() <= 7) {
      const label = cell.date.toLocaleDateString('en-GB', { month: 'short' });
      if (!monthLabels.find((m) => m.col === col)) {
        monthLabels.push({ label, col });
      }
    }
  });

  const weeks = Array.from({ length: WEEKS }, (_, w) => cells.slice(w * 7, w * 7 + 7));

  const streakDays = useMemo(() => {
    let streak = 0;
    const check = new Date(today);
    while (true) {
      const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
      if (sessionMap[key]) { streak++; check.setDate(check.getDate() - 1); }
      else break;
    }
    return streak;
  }, [sessionMap]);

  return (
    <div className="px-4 mb-2">
      <div className="p-4" style={panelStyle}>
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-[10px] uppercase tracking-[0.25em] font-semibold" style={{ color: colors.textTertiary }}>
            Consistency
          </div>
          <div className="flex gap-4">
            {streakDays > 0 && (
              <div className="text-xs font-bold" style={{ color: colors.positive }}>{streakDays} day streak</div>
            )}
            <div className="text-xs" style={{ color: colors.textTertiary }}>{history.length} total</div>
          </div>
        </div>
        <div className="flex mb-1 pl-6">
          {Array.from({ length: WEEKS }, (_, w) => {
            const label = monthLabels.find((m) => m.col === w);
            return (
              <div key={w} className="flex-1 text-[9px] leading-none" style={{ color: colors.textDim }}>
                {label ? label.label : ''}
              </div>
            );
          })}
        </div>
        <div className="flex gap-0.5">
          <div className="flex flex-col gap-0.5 mr-1">
            {DAYS.map((d, i) => (
              <div key={i} className="h-3.5 w-4 text-[9px] flex items-center justify-end pr-1" style={{ color: colors.textDim }}>
                {i % 2 === 0 ? d : ''}
              </div>
            ))}
          </div>
          {weeks.map((week, w) => (
            <div key={w} className="flex flex-col gap-0.5 flex-1">
              {week.map((cell, d) => {
                const color = sessionMap[cell.key];
                const isToday = cell.date.getDate() === today.getDate() && cell.date.getMonth() === today.getMonth() && cell.date.getFullYear() === today.getFullYear();
                return (
                  <div key={d} className="rounded-[2px] aspect-square"
                    style={{
                      background: cell.isFuture ? 'transparent' : color ? color : 'rgba(255,255,255,0.07)',
                      opacity: cell.isFuture ? 0 : 1,
                      outline: isToday ? `1.5px solid ${colors.textSecondary}` : 'none',
                      outlineOffset: '1px',
                    }} />
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-[9px]" style={{ color: colors.textDim }}>Less</span>
          <div className="w-3 h-3 rounded-[2px]" style={{ background: 'rgba(255,255,255,0.07)' }} />
          {WORKOUTS.map((w) => <div key={w.id} className="w-3 h-3 rounded-[2px]" style={{ background: w.color.from }} />)}
          <span className="text-[9px]" style={{ color: colors.textDim }}>More</span>
        </div>
      </div>
    </div>
  );
}

// Mini sparkline for the list row
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) {
    return <div className="w-16 h-8" />;
  }
  const w = 64, h = 32;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const pathD = 'M ' + pts.join(' L ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Full chart for expanded view
function FullChart({ data, color, exId }: { data: number[]; color: string; exId: string }) {
  if (data.length < 2) return null;
  const chartW = 320, chartH = 140;
  const pad = { top: 16, right: 16, bottom: 24, left: 36 };
  const iW = chartW - pad.left - pad.right;
  const iH = chartH - pad.top - pad.bottom;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => ({
    x: pad.left + (i / (data.length - 1)) * iW,
    y: pad.top + iH - ((v - min) / range) * iH,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = pathD + ` L ${points[points.length - 1].x} ${pad.top + iH} L ${points[0].x} ${pad.top + iH} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`}>
      <defs>
        <linearGradient id={`g-${exId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t) => (
        <line key={t} x1={pad.left} y1={pad.top + iH * t} x2={pad.left + iW} y2={pad.top + iH * t} stroke="rgba(255,255,255,0.08)" strokeDasharray="2 4" />
      ))}
      {[0, 0.5, 1].map((t) => (
        <text key={t} x={pad.left - 6} y={pad.top + iH * t + 4} fontSize="9" fill={colors.textDim} textAnchor="end">
          {Math.round(min + (1 - t) * range)}
        </text>
      ))}
      <path d={areaD} fill={`url(#g-${exId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={colors.bg} stroke={color} strokeWidth="1.5" />
      ))}
    </svg>
  );
}

interface ExerciseRowData {
  exercise: Exercise & { workout: Workout };
  sessions: Array<{ date: string; topWeight: number | null; topReps: number | null; volume: number; totalSets: number }>;
}

function ExerciseRow({ data, expanded, onToggle }: { data: ExerciseRowData; expanded: boolean; onToggle: () => void }) {
  const { exercise, sessions } = data;
  const color = exercise.workout.color.from;
  const weights = sessions.map((s) => s.topWeight ?? 0);
  const latest = weights[weights.length - 1] ?? null;
  const first = weights[0] ?? null;
  const change = latest !== null && first !== null && sessions.length > 1 ? latest - first : null;
  const changePct = change !== null && first! > 0 ? Math.round((change / first!) * 100) : null;
  const hasData = sessions.length > 0;

  return (
    <div style={{ borderBottom: `1px solid ${colors.borderSubtle}` }} className="last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-white/[0.03] transition-colors"
      >
        {/* Left: name + workout */}
        <div className="flex-1 min-w-0 text-left">
          <div className="text-sm font-semibold leading-tight truncate">{exercise.name}</div>
          <div className="text-[11px] mt-0.5" style={{ color: exercise.workout.color.text }}>
            W{exercise.workout.id} · {exercise.workout.short}
          </div>
        </div>

        {/* Middle: sparkline */}
        <div className="shrink-0">
          {hasData && weights.length > 1
            ? <Sparkline data={weights} color={change !== null && change >= 0 ? colors.positive : colors.negative} />
            : <div className="w-16 h-8 flex items-center justify-center text-[10px]" style={{ color: colors.textDim }}>no data</div>
          }
        </div>

        {/* Right: weight + change */}
        <div className="text-right shrink-0 w-20">
          {hasData ? (
            <>
              <div className="text-sm font-semibold tabular-nums">
                {latest ?? '—'}
                <span className="text-[10px] ml-0.5" style={{ color: colors.textTertiary }}>kg</span>
              </div>
              {change !== null && (
                <div
                  className="text-[11px] font-semibold tabular-nums px-1.5 py-0.5 inline-block mt-0.5"
                  style={{
                    background: change >= 0 ? colors.positiveSubtle : colors.negativeSubtle,
                    color: change >= 0 ? colors.positive : colors.negative,
                    borderRadius: radii.sm,
                  }}
                >
                  {change >= 0 ? '+' : ''}{change}kg {changePct !== null ? `(${changePct > 0 ? '+' : ''}${changePct}%)` : ''}
                </div>
              )}
            </>
          ) : (
            <div className="text-xs" style={{ color: colors.textDim }}>—</div>
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 animate-fade-rise" style={{ background: 'rgba(255,255,255,0.02)' }}>
          {!hasData ? (
            <div className="py-4 text-center text-sm" style={{ color: colors.textDim }}>No sessions logged yet.</div>
          ) : (
            <>
              <FullChart data={weights} color={color} exId={exercise.id} />
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  { label: 'Sessions', value: sessions.length, unit: '' },
                  { label: 'Best', value: Math.max(...weights), unit: 'kg' },
                  { label: 'Last', value: sessions[sessions.length - 1].topReps ?? '—', unit: 'reps' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="p-3 text-center"
                    style={{ background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: radii.md }}
                  >
                    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: colors.textTertiary }}>
                      {stat.label}
                    </div>
                    <div className="text-xl font-bold font-display">
                      {stat.value}
                      {stat.unit && <span className="text-xs font-sans font-normal" style={{ color: colors.textTertiary }}>{stat.unit}</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1">
                {[...sessions].reverse().slice(0, 5).map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 px-3"
                    style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.borderSubtle}`, borderRadius: radii.md }}
                  >
                    <div className="text-sm font-mono tabular-nums">{s.topWeight ?? 'BW'}kg × {s.topReps}</div>
                    <div className="text-xs" style={{ color: colors.textTertiary }}>{relTime(s.date)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function EditableSet({ set, onSaved }: { set: SetLog; onSaved: () => void }) {
  const [weight, setWeight] = useState(set.weight != null ? String(set.weight) : '');
  const [reps, setReps] = useState(set.reps != null ? String(set.reps) : '');
  const [saving, setSaving] = useState(false);
  const dirty = weight !== (set.weight != null ? String(set.weight) : '') || reps !== (set.reps != null ? String(set.reps) : '');

  const save = async () => {
    setSaving(true);
    await updateSetLog(set.id, {
      weight: weight ? parseFloat(weight) : null,
      reps: reps ? parseInt(reps) : null,
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="text-xs w-5 text-center tabular-nums" style={{ color: colors.textTertiary }}>{set.set_number}</div>
      <input
        type="number"
        inputMode="decimal"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        placeholder="—"
        className="w-16 px-2 py-1.5 text-sm font-mono text-center focus:outline-none"
        style={fieldStyle}
      />
      <span className="text-xs" style={{ color: colors.textDim }}>kg ×</span>
      <input
        type="number"
        inputMode="numeric"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        placeholder="—"
        className="w-14 px-2 py-1.5 text-sm font-mono text-center focus:outline-none"
        style={fieldStyle}
      />
      <span className="text-xs" style={{ color: colors.textDim }}>reps</span>
      {dirty && (
        <button
          onClick={save}
          disabled={saving}
          className="ml-auto text-[11px] font-semibold px-2.5 py-1 active:scale-95 transition-transform"
          style={{ background: colors.positiveSubtle, color: colors.positive, borderRadius: radii.sm }}
        >
          {saving ? '…' : 'Save'}
        </button>
      )}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="transition-transform duration-300"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SessionCard({ session, onDeleted, onSaved }: { session: SessionWithSets; onDeleted: () => void; onSaved: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const workout = getWorkoutById(session.workout_id);

  // Group sets by exercise
  const byExercise = useMemo(() => {
    const map = new Map<string, SetLog[]>();
    session.sets.forEach((s) => {
      const arr = map.get(s.exercise_id) ?? [];
      arr.push(s);
      map.set(s.exercise_id, arr);
    });
    return map;
  }, [session]);

  const handleDelete = async () => {
    setDeleting(true);
    await deleteSession(session.id);
    onDeleted();
  };

  return (
    <div className="overflow-hidden" style={panelStyle}>
      {/* Header row */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-white/[0.03] transition-colors text-left"
      >
        <div
          className="w-1 h-10 rounded-full shrink-0"
          style={{ background: workout?.color.from ?? colors.surface3 }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{workout?.name ?? 'Workout'}</div>
          <div className="text-[11px] mt-0.5" style={{ color: colors.textTertiary }}>
            {session.sets.length} sets · {session.duration_minutes ?? '—'} min
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs" style={{ color: colors.textSecondary }}>
            {new Date(session.finished_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: colors.textDim }}>{relTime(session.finished_at)}</div>
        </div>
        <div className="ml-1" style={{ color: colors.textDim }}>
          <ChevronIcon open={expanded} />
        </div>
      </button>

      {/* Expanded: editable sets */}
      {expanded && (
        <div className="px-4 pb-4 animate-fade-rise" style={{ borderTop: `1px solid ${colors.borderSubtle}` }}>
          {Array.from(byExercise.entries()).map(([exId, sets]) => {
            const allExercises = getAllExercises();
            const ex = allExercises.find((e) => e.id === exId);
            return (
              <div key={exId} className="mt-3">
                <div className="text-[11px] font-semibold mb-1.5" style={{ color: colors.textSecondary }}>
                  {ex?.name ?? exId}
                </div>
                {sets.map((s) => (
                  <EditableSet key={s.id} set={s} onSaved={onSaved} />
                ))}
              </div>
            );
          })}

          {/* Delete */}
          <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${colors.borderSubtle}` }}>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs transition-colors"
                style={{ color: colors.textDim }}
              >
                Delete session
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: colors.textTertiary }}>Are you sure?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs font-semibold active:scale-95 transition-transform"
                  style={{ color: colors.negative }}
                >
                  {deleting ? 'Deleting…' : 'Yes, delete'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs"
                  style={{ color: colors.textTertiary }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AddSessionSheet({ userId, onSaved, onClose }: { userId: string; onSaved: () => Promise<void>; onClose: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [workoutId, setWorkoutId] = useState<number>(1);
  const [saving, setSaving] = useState(false);

  const workout = WORKOUTS.find((w) => w.id === workoutId)!;

  // set data: exId -> array of { weight, reps }
  const [setData, setSetData] = useState<Record<string, Array<{ weight: string; reps: string }>>>(() => {
    const init: Record<string, Array<{ weight: string; reps: string }>> = {};
    WORKOUTS[0].exercises.forEach((ex) => { init[ex.id] = Array.from({ length: ex.sets }, () => ({ weight: '', reps: '' })); });
    return init;
  });

  // Reinitialise set data when workout changes
  const switchWorkout = (id: number) => {
    setWorkoutId(id);
    const w = WORKOUTS.find((w) => w.id === id)!;
    const init: Record<string, Array<{ weight: string; reps: string }>> = {};
    w.exercises.forEach((ex) => { init[ex.id] = Array.from({ length: ex.sets }, () => ({ weight: '', reps: '' })); });
    setSetData(init);
  };

  const updateCell = (exId: string, idx: number, field: 'weight' | 'reps', val: string) => {
    setSetData((prev) => ({
      ...prev,
      [exId]: prev[exId].map((s, i) => i === idx ? { ...s, [field]: val } : s),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const sets: Array<{ exercise_id: string; set_number: number; weight: number | null; reps: number | null }> = [];
    workout.exercises.forEach((ex) => {
      (setData[ex.id] ?? []).forEach((s, i) => {
        if (s.weight || s.reps) {
          sets.push({ exercise_id: ex.id, set_number: i + 1, weight: s.weight ? parseFloat(s.weight) : null, reps: s.reps ? parseInt(s.reps) : null });
        }
      });
    });
    if (sets.length === 0) { setSaving(false); return; }
    const dt = new Date(date);
    const iso = dt.toISOString();
    const { error } = await saveSession({ userId, workoutId, startedAt: iso, finishedAt: iso, durationMinutes: 0, sets });
    if (error) { alert(`Couldn't save: ${error}`); setSaving(false); return; }
    await onSaved();
    onClose();
  };

  return (
    <Sheet onClose={onClose}>
      {(close) => (
        <>
          {/* Header */}
          <div className="px-5 pt-2 pb-4 shrink-0" style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold font-display tracking-tight">Log past session</div>
              <button onClick={close} className="text-sm active:opacity-60 transition-opacity" style={{ color: colors.textTertiary }}>
                Cancel
              </button>
            </div>

            {/* Date picker — full width */}
            <div className="mb-3">
              <div className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: colors.textTertiary }}>Date</div>
              <input
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm px-4 py-3 focus:outline-none"
                style={{ ...fieldStyle, color: colors.textPrimary }}
              />
            </div>

            {/* Workout picker — full width, 2×2 grid */}
            <div>
              <div className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: colors.textTertiary }}>Workout</div>
              <div className="grid grid-cols-2 gap-2">
                {WORKOUTS.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => switchWorkout(w.id)}
                    className="py-3 text-sm font-bold text-left px-3 transition-all duration-200 active:scale-[0.97]"
                    style={{
                      background: workoutId === w.id ? w.color.from + '20' : colors.surface2,
                      border: `1px solid ${workoutId === w.id ? w.color.from : colors.borderInput}`,
                      borderRadius: radii.md,
                      color: workoutId === w.id ? w.color.text : colors.textDim,
                    }}
                  >
                    <div className="text-xs font-bold mb-0.5">W{w.id}</div>
                    <div className="text-[11px] font-normal truncate">{w.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scrollable exercise list */}
          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
            {workout.exercises.map((ex) => (
              <div key={ex.id}>
                <div className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>{ex.name}</div>
                <div className="space-y-2">
                  {(setData[ex.id] ?? []).map((s, i) => (
                    <div key={i} className="flex items-center gap-2 w-full">
                      <div className="text-xs w-4 text-center shrink-0" style={{ color: colors.textDim }}>{i + 1}</div>
                      <div className="flex items-center gap-1 flex-1 min-w-0" style={fieldStyle}>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={s.weight}
                          onChange={(e) => updateCell(ex.id, i, 'weight', e.target.value)}
                          placeholder="0"
                          className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm font-mono text-center focus:outline-none placeholder:text-zinc-700"
                        />
                        <span className="text-xs shrink-0 pr-2" style={{ color: colors.textDim }}>kg</span>
                      </div>
                      <span className="text-xs shrink-0" style={{ color: colors.textDim }}>×</span>
                      <div className="flex items-center gap-1 flex-1 min-w-0" style={fieldStyle}>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={s.reps}
                          onChange={(e) => updateCell(ex.id, i, 'reps', e.target.value)}
                          placeholder="0"
                          className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm font-mono text-center focus:outline-none placeholder:text-zinc-700"
                        />
                        <span className="text-xs shrink-0 pr-2" style={{ color: colors.textDim }}>reps</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Save button */}
          <div
            className="px-5 pt-3 shrink-0"
            style={{
              paddingBottom: 'max(calc(env(safe-area-inset-bottom) + 16px), 32px)',
              borderTop: `1px solid ${colors.borderSubtle}`,
            }}
          >
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3.5 text-sm font-bold disabled:opacity-50 active:scale-[0.97] active:opacity-90 transition-[transform,opacity] duration-150"
              style={{ background: workout.color.from, color: '#000', borderRadius: radii.button }}
            >
              {saving ? 'Saving…' : 'Save session'}
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}

function HistoryView({ history, onRefetch, userId }: { history: SessionWithSets[]; onRefetch: () => Promise<void>; userId: string }) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <>
      {showAdd && (
        <AddSessionSheet userId={userId} onSaved={onRefetch} onClose={() => setShowAdd(false)} />
      )}
      <div className="px-4 mt-2">
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-3.5 text-sm font-bold active:scale-[0.97] active:opacity-90 transition-[transform,opacity] duration-150 mb-4"
          style={{ background: colors.textPrimary, color: colors.bg, borderRadius: radii.button }}
        >
          + Add past session
        </button>
        {history.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-sm" style={{ color: colors.textDim }}>No sessions logged yet.</div>
            <div className="text-xs mt-1" style={{ color: colors.textDim, opacity: 0.7 }}>Finish a workout to see it here.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onDeleted={onRefetch}
                onSaved={onRefetch}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function Progress({ history, onRefetch, userId }: Props) {
  const [tab, setTab] = useState<'exercises' | 'history'>('exercises');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const allExercises = getAllExercises();

  const exerciseData: ExerciseRowData[] = useMemo(() => {
    return allExercises.map((exercise) => {
      const sessions: ExerciseRowData['sessions'] = [];
      [...history].reverse().forEach((session) => {
        const sets = session.sets.filter((s) => s.exercise_id === exercise.id);
        if (sets.length > 0) {
          const topSet = sets.reduce((max, s) => (s.weight ?? 0) > (max.weight ?? 0) ? s : max);
          const volume = sets.reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0);
          sessions.push({ date: session.finished_at, topWeight: topSet.weight, topReps: topSet.reps, volume, totalSets: sets.length });
        }
      });
      return { exercise, sessions };
    });
  }, [history]);

  return (
    <div className="min-h-screen pb-28">
      <div className="px-4 pt-12 pb-4">
        <div className="text-xs uppercase tracking-[0.3em] mb-1" style={{ color: colors.textTertiary }}>Progress</div>
        <h1 className="text-4xl font-bold leading-tight font-display tracking-tight">Are you winning?</h1>
      </div>

      {/* Segmented control */}
      <div className="px-4 mb-4">
        <SegmentedControl
          tabs={[
            { id: 'exercises', label: 'Exercises' },
            { id: 'history', label: 'History' },
          ]}
          active={tab}
          onChange={(id) => setTab(id as 'exercises' | 'history')}
        />
      </div>

      {tab === 'exercises' && (
        <>
          <ConsistencyHeatmap history={history} />
        </>
      )}

      {tab === 'history' && (
        <HistoryView history={history} onRefetch={onRefetch} userId={userId} />
      )}

      {/* Exercise list grouped by workout */}
      {tab === 'exercises' && (
        <div className="mt-4">
          {WORKOUTS.map((workout) => {
            const rows = exerciseData.filter((d) => d.exercise.workout.id === workout.id);
            return (
              <div key={workout.id} className="mb-4">
                <div className="px-4 py-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: workout.color.from }} />
                  <div className="text-[10px] uppercase tracking-[0.25em] font-semibold" style={{ color: colors.textTertiary }}>
                    W{workout.id} — {workout.name}
                  </div>
                </div>
                <div className="mx-4 overflow-hidden" style={panelStyle}>
                  {rows.map((row) => (
                    <ExerciseRow
                      key={row.exercise.id}
                      data={row}
                      expanded={expandedId === row.exercise.id}
                      onToggle={() => setExpandedId(expandedId === row.exercise.id ? null : row.exercise.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Nicotine-free milestones */}
      <NicotineMilestones userId={userId} />
    </div>
  );
}
