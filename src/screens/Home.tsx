import type { SessionWithSets } from '../lib/supabase';
import { WORKOUTS, getNextWorkoutId, getWorkoutById, type Workout } from '../lib/workouts';
import { greeting, relTime } from '../lib/format';

interface Props {
  history: SessionWithSets[];
  onStart: (workout: Workout) => void;
  onSignOut: () => void;
}

function PlayIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function FlameIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
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

export function Home({ history, onStart, onSignOut }: Props) {
  const lastId = history[0]?.workout_id ?? null;
  const nextId = getNextWorkoutId(lastId);
  const nextWorkout = getWorkoutById(nextId)!;
  const lastSession = history[0];

  const weekCount = history.filter(
    (s) => Date.now() - new Date(s.finished_at).getTime() < 7 * 24 * 60 * 60 * 1000
  ).length;

  return (
    <div className="min-h-screen pb-28">
      <div className="px-6 pt-12 pb-8 flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-2">Lift Log</div>
          <h1 className="font-display text-5xl leading-none">
            Good{' '}
            <span className="italic" style={{ color: nextWorkout.color.text }}>
              {greeting()}
            </span>
          </h1>
          <div className="text-zinc-500 mt-2 text-sm">
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="text-[10px] uppercase tracking-widest text-zinc-600 mt-3 active:text-zinc-400"
        >
          Sign out
        </button>
      </div>

      {/* Hero: next workout */}
      <div className="px-6">
        <button
          onClick={() => onStart(nextWorkout)}
          className="relative w-full rounded-3xl p-7 overflow-hidden active:scale-[0.98] transition-transform text-left"
          style={{
            background: `linear-gradient(135deg, ${nextWorkout.color.bg} 0%, #18181b 100%)`,
            border: `1px solid ${nextWorkout.color.from}40`,
          }}
        >
          <div
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-30 blur-3xl"
            style={{ background: `radial-gradient(circle, ${nextWorkout.color.from}, transparent)` }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: nextWorkout.color.from }}
              />
              <span
                className="text-[10px] uppercase tracking-[0.25em] font-semibold"
                style={{ color: nextWorkout.color.text }}
              >
                Next session · Workout {nextWorkout.id}
              </span>
            </div>
            <div className="font-display text-4xl mt-3 leading-tight">
              {nextWorkout.name.split(' / ').map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span style={{ color: nextWorkout.color.text, opacity: 0.5 }}> / </span>
                  )}
                </span>
              ))}
            </div>
            <div className="text-zinc-400 text-sm mt-2">
              {nextWorkout.exercises.length} exercises ·{' '}
              {nextWorkout.exercises.reduce((sum, ex) => sum + ex.sets, 0)} sets
            </div>
            <div
              className="mt-6 w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
              style={{ background: nextWorkout.color.from, color: '#000' }}
            >
              <PlayIcon size={18} />
              Start Workout
            </div>
          </div>
        </button>
      </div>

      {/* Stats */}
      <div className="px-6 mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800 p-4">
          <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
            <FlameIcon size={14} />
            This week
          </div>
          <div className="font-display text-3xl">
            {weekCount}
            <span className="text-base text-zinc-600 ml-1">sessions</span>
          </div>
        </div>
        <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800 p-4">
          <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
            <TrendingIcon size={14} />
            Total logged
          </div>
          <div className="font-display text-3xl">
            {history.length}
            <span className="text-base text-zinc-600 ml-1">sessions</span>
          </div>
        </div>
      </div>

      {/* Rotation */}
      <div className="px-6 mt-8">
        <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-semibold mb-3">
          Split rotation
        </div>
        <div className="space-y-2">
          {WORKOUTS.map((w) => {
            const isNext = w.id === nextId;
            return (
              <div
                key={w.id}
                className={`rounded-xl border p-3.5 flex items-center gap-3 transition-all ${
                  isNext ? 'border-zinc-700 bg-zinc-900' : 'border-zinc-900 bg-zinc-950/50'
                }`}
              >
                <div
                  className="w-1 h-10 rounded-full"
                  style={{ background: isNext ? w.color.from : '#27272a' }}
                />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${isNext ? 'text-zinc-100' : 'text-zinc-500'}`}>
                    {w.name}
                  </div>
                  <div className="text-[11px] text-zinc-600 mt-0.5">
                    Workout {w.id} · {w.short}
                  </div>
                </div>
                {isNext && (
                  <span
                    className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md"
                    style={{ background: w.color.from + '20', color: w.color.text }}
                  >
                    Next
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Last session */}
      {lastSession && (
        <div className="px-6 mt-8">
          <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-semibold mb-3">
            Last session
          </div>
          <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800 p-4">
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-sm font-medium">
                {getWorkoutById(lastSession.workout_id)?.name}
              </div>
              <div className="text-xs text-zinc-500">{relTime(lastSession.finished_at)}</div>
            </div>
            <div className="text-xs text-zinc-500">
              {lastSession.sets.length} sets · {lastSession.duration_minutes ?? '—'} min
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
