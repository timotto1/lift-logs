import { useMemo, useState } from 'react';
import type { SessionWithSets } from '../lib/supabase';
import { WORKOUTS, getAllExercises } from '../lib/workouts';
import { relTime } from '../lib/format';

interface Props {
  history: SessionWithSets[];
}

function TrendingIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

export function Progress({ history }: Props) {
  const allExercises = getAllExercises();
  const [selectedExId, setSelectedExId] = useState<string>(allExercises[0].id);
  const selectedEx = allExercises.find((e) => e.id === selectedExId)!;

  const exerciseData = useMemo(() => {
    const data: Array<{
      date: Date;
      topWeight: number | null;
      topReps: number | null;
      volume: number;
      totalSets: number;
    }> = [];
    [...history].reverse().forEach((session) => {
      const sets = session.sets.filter((s) => s.exercise_id === selectedExId);
      if (sets.length > 0) {
        const topSet = sets.reduce((max, s) =>
          (s.weight ?? 0) > (max.weight ?? 0) ? s : max
        );
        const totalVolume = sets.reduce(
          (sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0),
          0
        );
        data.push({
          date: new Date(session.finished_at),
          topWeight: topSet.weight,
          topReps: topSet.reps,
          volume: totalVolume,
          totalSets: sets.length,
        });
      }
    });
    return data;
  }, [history, selectedExId]);

  // chart geometry
  const chartW = 320;
  const chartH = 180;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerW = chartW - padding.left - padding.right;
  const innerH = chartH - padding.top - padding.bottom;

  const weights = exerciseData.map((d) => d.topWeight ?? 0);
  const maxW = Math.max(...weights, 1);
  const minW = Math.min(...weights, 0);
  const wRange = maxW - minW || 1;

  const points = exerciseData.map((d, i) => {
    const x = padding.left + (i / Math.max(exerciseData.length - 1, 1)) * innerW;
    const y =
      padding.top + innerH - (((d.topWeight ?? 0) - minW) / wRange) * innerH;
    return { x, y, d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD =
    points.length > 1
      ? pathD +
        ` L ${points[points.length - 1].x} ${padding.top + innerH} L ${points[0].x} ${
          padding.top + innerH
        } Z`
      : '';

  const firstW = exerciseData[0]?.topWeight ?? 0;
  const lastW = exerciseData[exerciseData.length - 1]?.topWeight ?? 0;
  const trend = lastW - firstW;
  const trendPct = firstW > 0 ? Math.round((trend / firstW) * 100) : 0;

  const peakReps = exerciseData.length > 0
    ? Math.max(...exerciseData.map((d) => d.topReps ?? 0))
    : 0;

  return (
    <div className="min-h-screen pb-28">
      <div className="px-6 pt-12 pb-6">
        <div className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-2">Progress</div>
        <h1 className="font-display text-5xl leading-none">
          Are you <span className="italic" style={{ color: selectedEx.workout.color.text }}>
            winning
          </span>?
        </h1>
      </div>

      {/* Exercise picker */}
      <div className="px-6 mb-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-semibold mb-2">
          Exercise
        </div>
        <select
          value={selectedExId}
          onChange={(e) => setSelectedExId(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 16px center',
          }}
        >
          {WORKOUTS.map((w) => (
            <optgroup key={w.id} label={`W${w.id} — ${w.name}`}>
              {w.exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Chart card */}
      <div className="px-6 mb-4">
        <div
          className="rounded-3xl p-6 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${selectedEx.workout.color.bg}80 0%, #18181b 100%)`,
            border: `1px solid ${selectedEx.workout.color.from}30`,
          }}
        >
          <div
            className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-2"
            style={{ color: selectedEx.workout.color.text }}
          >
            Top set
          </div>

          {exerciseData.length === 0 ? (
            <div className="py-8 text-center">
              <div className="text-zinc-400 text-sm">No data yet.</div>
              <div className="text-zinc-600 text-xs mt-1">
                Log this exercise to see progress.
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-3">
                <div className="font-display text-6xl leading-none">{lastW || '—'}</div>
                <div className="text-zinc-400 text-lg">kg</div>
                {trend !== 0 && exerciseData.length > 1 && (
                  <div
                    className={`ml-auto flex items-center gap-1 text-sm font-medium ${
                      trend > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    <TrendingIcon size={14} />
                    {trend > 0 ? '+' : ''}
                    {trend}kg ({trendPct > 0 ? '+' : ''}
                    {trendPct}%)
                  </div>
                )}
              </div>

              {exerciseData.length > 1 && (
                <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} className="mt-4">
                  <defs>
                    <linearGradient id={`grad-${selectedExId}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={selectedEx.workout.color.from} stopOpacity="0.4" />
                      <stop offset="100%" stopColor={selectedEx.workout.color.from} stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {[0, 0.5, 1].map((t) => (
                    <line
                      key={t}
                      x1={padding.left}
                      y1={padding.top + innerH * t}
                      x2={padding.left + innerW}
                      y2={padding.top + innerH * t}
                      stroke="#27272a"
                      strokeDasharray="2 4"
                    />
                  ))}

                  {[0, 0.5, 1].map((t) => {
                    const val = minW + (1 - t) * wRange;
                    return (
                      <text
                        key={t}
                        x={padding.left - 8}
                        y={padding.top + innerH * t + 4}
                        fontSize="10"
                        fill="#71717a"
                        textAnchor="end"
                        fontFamily="JetBrains Mono"
                      >
                        {Math.round(val)}
                      </text>
                    );
                  })}

                  <path d={areaD} fill={`url(#grad-${selectedExId})`} />
                  <path
                    d={pathD}
                    fill="none"
                    stroke={selectedEx.workout.color.from}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />

                  {points.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r="3.5"
                      fill="#09090b"
                      stroke={selectedEx.workout.color.from}
                      strokeWidth="2"
                    />
                  ))}
                </svg>
              )}
            </>
          )}
        </div>
      </div>

      {exerciseData.length > 0 && (
        <>
          <div className="px-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800 p-4">
              <div className="text-zinc-500 text-xs mb-1">Sessions</div>
              <div className="font-display text-3xl">{exerciseData.length}</div>
            </div>
            <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800 p-4">
              <div className="text-zinc-500 text-xs mb-1">Best reps</div>
              <div className="font-display text-3xl">{peakReps}</div>
            </div>
          </div>

          <div className="px-6 mt-8">
            <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-semibold mb-3">
              Session history
            </div>
            <div className="space-y-2">
              {[...exerciseData].reverse().map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 px-4 rounded-xl bg-zinc-900/50 border border-zinc-800"
                >
                  <div>
                    <div className="text-sm font-medium font-mono tabular-nums">
                      {d.topWeight ?? 'BW'}kg × {d.topReps}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      {d.totalSets} sets · {d.volume}kg volume
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500">{relTime(d.date.toISOString())}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
