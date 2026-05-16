import { useMemo, useState } from 'react';
import type { SessionWithSets } from '../lib/supabase';
import { WORKOUTS, getAllExercises, getWorkoutById, type Exercise, type Workout } from '../lib/workouts';
import { relTime } from '../lib/format';

interface Props {
  history: SessionWithSets[];
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEKS = 16;

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
      <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800 p-4">
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-semibold">Consistency</div>
          <div className="flex gap-4">
            {streakDays > 0 && <div className="text-xs font-bold text-emerald-400">{streakDays} day streak</div>}
            <div className="text-xs text-zinc-500">{history.length} total</div>
          </div>
        </div>
        <div className="flex mb-1 pl-6">
          {Array.from({ length: WEEKS }, (_, w) => {
            const label = monthLabels.find((m) => m.col === w);
            return <div key={w} className="flex-1 text-[9px] text-zinc-600 leading-none">{label ? label.label : ''}</div>;
          })}
        </div>
        <div className="flex gap-0.5">
          <div className="flex flex-col gap-0.5 mr-1">
            {DAYS.map((d, i) => (
              <div key={i} className="h-3.5 w-4 text-[9px] text-zinc-600 flex items-center justify-end pr-1">
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
                    style={{ background: cell.isFuture ? 'transparent' : color ? color : '#27272a', opacity: cell.isFuture ? 0 : 1, outline: isToday ? '1.5px solid #a1a1aa' : 'none', outlineOffset: '1px' }} />
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-[9px] text-zinc-600">Less</span>
          <div className="w-3 h-3 rounded-[2px] bg-zinc-800" />
          {WORKOUTS.map((w) => <div key={w.id} className="w-3 h-3 rounded-[2px]" style={{ background: w.color.from }} />)}
          <span className="text-[9px] text-zinc-600">More</span>
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
        <line key={t} x1={pad.left} y1={pad.top + iH * t} x2={pad.left + iW} y2={pad.top + iH * t} stroke="#27272a" strokeDasharray="2 4" />
      ))}
      {[0, 0.5, 1].map((t) => (
        <text key={t} x={pad.left - 6} y={pad.top + iH * t + 4} fontSize="9" fill="#52525b" textAnchor="end">
          {Math.round(min + (1 - t) * range)}
        </text>
      ))}
      <path d={areaD} fill={`url(#g-${exId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#09090b" stroke={color} strokeWidth="1.5" />
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
    <div className="border-b border-zinc-800/60 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-zinc-900/50 transition-colors"
      >
        {/* Left: name + workout */}
        <div className="flex-1 min-w-0 text-left">
          <div className="text-sm font-semibold text-zinc-100 leading-tight truncate">{exercise.name}</div>
          <div className="text-[11px] mt-0.5" style={{ color: exercise.workout.color.text }}>
            W{exercise.workout.id} · {exercise.workout.short}
          </div>
        </div>

        {/* Middle: sparkline */}
        <div className="shrink-0">
          {hasData && weights.length > 1
            ? <Sparkline data={weights} color={change !== null && change >= 0 ? '#22c55e' : '#ef4444'} />
            : <div className="w-16 h-8 flex items-center justify-center text-[10px] text-zinc-700">no data</div>
          }
        </div>

        {/* Right: weight + change */}
        <div className="text-right shrink-0 w-20">
          {hasData ? (
            <>
              <div className="text-sm font-semibold tabular-nums text-zinc-100">{latest ?? '—'}<span className="text-[10px] text-zinc-500 ml-0.5">kg</span></div>
              {change !== null && (
                <div className={`text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded inline-block mt-0.5 ${change >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {change >= 0 ? '+' : ''}{change}kg {changePct !== null ? `(${changePct > 0 ? '+' : ''}${changePct}%)` : ''}
                </div>
              )}
            </>
          ) : (
            <div className="text-xs text-zinc-600">—</div>
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 bg-zinc-900/30">
          {!hasData ? (
            <div className="py-4 text-center text-zinc-600 text-sm">No sessions logged yet.</div>
          ) : (
            <>
              <FullChart data={weights} color={color} exId={exercise.id} />
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 text-center">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Sessions</div>
                  <div className="text-xl font-bold">{sessions.length}</div>
                </div>
                <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 text-center">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Best</div>
                  <div className="text-xl font-bold">{Math.max(...weights)}<span className="text-xs text-zinc-500">kg</span></div>
                </div>
                <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 text-center">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Last</div>
                  <div className="text-xl font-bold">{sessions[sessions.length - 1].topReps}<span className="text-xs text-zinc-500">reps</span></div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                {[...sessions].reverse().slice(0, 5).map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-900/60 border border-zinc-800/50">
                    <div className="text-sm font-mono tabular-nums">{s.topWeight ?? 'BW'}kg × {s.topReps}</div>
                    <div className="text-xs text-zinc-500">{relTime(s.date)}</div>
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

export function Progress({ history }: Props) {
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
        <div className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-1">Progress</div>
        <h1 className="text-4xl font-bold leading-tight">Are you winning?</h1>
      </div>

      <ConsistencyHeatmap history={history} />

      {/* Exercise list grouped by workout */}
      <div className="mt-4">
        {WORKOUTS.map((workout) => {
          const rows = exerciseData.filter((d) => d.exercise.workout.id === workout.id);
          return (
            <div key={workout.id} className="mb-4">
              {/* Group header */}
              <div className="px-4 py-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: workout.color.from }} />
                <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-semibold">
                  W{workout.id} — {workout.name}
                </div>
              </div>
              <div className="mx-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 overflow-hidden">
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
    </div>
  );
}
