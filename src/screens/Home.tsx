import { useState } from 'react';
import type { SessionWithSets } from '../lib/supabase';
import { WORKOUTS, getNextWorkoutId, getWorkoutById, type Workout } from '../lib/workouts';
import { MOBILITY_ROUTINES, type MobilityRoutine } from '../lib/mobility';
import { greeting, relTime } from '../lib/format';

interface Props {
  history: SessionWithSets[];
  onStart: (workout: Workout) => void;
  onStartMobility: (routine: MobilityRoutine) => void;
  onSignOut: () => void;
}

function PlayIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function WorkoutPreview({ workout, onStart, onClose }: { workout: Workout; onStart: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative flex flex-col"
        style={{ background: '#111', borderTop: `3px solid ${workout.color.from}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-8 h-0.5 bg-zinc-700" />
        </div>

        <div className="px-6 pt-4 pb-5" style={{ borderBottom: '1px solid #1e1e1e' }}>
          <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-1">
            Workout {workout.id} · {workout.short}
          </div>
          <div className="text-2xl font-bold">{workout.name}</div>
          <div className="text-xs text-zinc-500 mt-1">
            {workout.exercises.length} exercises · {workout.exercises.reduce((s, e) => s + e.sets, 0)} sets
          </div>
        </div>

        <div className="px-6 py-4 space-y-3 max-h-64 overflow-y-auto" style={{ borderBottom: '1px solid #1e1e1e' }}>
          {workout.exercises.map((ex, i) => (
            <div key={ex.id} className="flex items-center gap-4">
              <div className="text-[10px] text-zinc-600 w-4 tabular-nums">{String(i + 1).padStart(2, '0')}</div>
              <div className="flex-1">
                <div className="text-sm text-zinc-200">{ex.name}</div>
                <div className="text-[11px] text-zinc-600 mt-0.5">{ex.sets} × {ex.reps} · {ex.rest}s rest</div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-5 flex gap-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
          <button
            onClick={onClose}
            className="flex-1 py-3.5 text-sm font-semibold text-zinc-400 active:text-zinc-200 transition-colors"
            style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: 8 }}
          >
            Back
          </button>
          <button
            onClick={onStart}
            className="flex-[2] py-3.5 text-sm font-bold flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
            style={{ background: workout.color.from, color: '#000', borderRadius: 8 }}
          >
            <PlayIcon size={14} />
            Start Workout
          </button>
        </div>
      </div>
    </div>
  );
}

export function Home({ history, onStart, onStartMobility, onSignOut }: Props) {
  const [previewing, setPreviewing] = useState<Workout | null>(null);
  const lastId = history[0]?.workout_id ?? null;
  const nextId = getNextWorkoutId(lastId);
  const nextWorkout = getWorkoutById(nextId)!;
  const lastSession = history[0];

  const weekCount = history.filter(
    (s) => Date.now() - new Date(s.finished_at).getTime() < 7 * 24 * 60 * 60 * 1000
  ).length;

  return (
    <div className="min-h-screen pb-28">
      {previewing && (
        <WorkoutPreview
          workout={previewing}
          onStart={() => { const w = previewing; setPreviewing(null); onStart(w); }}
          onClose={() => setPreviewing(null)}
        />
      )}

      {/* Header */}
      <div className="px-5 pt-12 pb-6 flex items-start justify-between" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <div>
          <div className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 mb-3">Lift Log</div>
          <h1 className="text-4xl font-bold leading-none">
            Good {greeting()}
          </h1>
          <div className="text-zinc-600 text-xs mt-2 uppercase tracking-widest">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="text-[10px] uppercase tracking-widest text-zinc-700 mt-1 active:text-zinc-400 transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* Next workout */}
      <div className="px-5 pt-5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 mb-3">Next session</div>
        <button
          onClick={() => setPreviewing(nextWorkout)}
          className="w-full text-left active:opacity-70 transition-opacity"
          style={{ border: '1px solid #1e1e1e', borderLeft: `3px solid ${nextWorkout.color.from}`, background: '#131313', borderRadius: 8 }}
        >
          <div className="px-5 py-5">
            <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-2">
              Workout {nextWorkout.id}
            </div>
            <div className="text-2xl font-bold leading-tight mb-1">{nextWorkout.name}</div>
            <div className="text-xs text-zinc-500">
              {nextWorkout.exercises.length} exercises · {nextWorkout.exercises.reduce((s, e) => s + e.sets, 0)} sets
            </div>
          </div>
          <div style={{ borderTop: '1px solid #1e1e1e' }}>
            <div
              className="px-5 py-3.5 text-sm font-bold flex items-center gap-2"
              style={{ color: nextWorkout.color.from }}
            >
              <PlayIcon size={13} />
              Preview workout
            </div>
          </div>
        </button>
      </div>

      {/* Stats row */}
      <div className="px-5 mt-5 grid grid-cols-2 gap-3">
        {[
          { label: 'This week', value: weekCount, unit: 'sessions' },
          { label: 'All time', value: history.length, unit: 'sessions' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: '#131313', border: '1px solid #1e1e1e', borderRadius: 8 }} className="px-4 py-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">{stat.label}</div>
            <div className="text-3xl font-bold tabular-nums leading-none">
              {stat.value}
              <span className="text-xs text-zinc-600 ml-1.5 font-normal">{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Split rotation */}
      <div className="px-5 mt-8">
        <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 mb-3">Split rotation</div>
        <div style={{ border: '1px solid #1e1e1e', borderRadius: 8, overflow: 'hidden' }}>
          {WORKOUTS.map((w, i) => {
            const isNext = w.id === nextId;
            return (
              <button
                key={w.id}
                onClick={() => setPreviewing(w)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left active:bg-white/5 transition-colors"
                style={{
                  borderBottom: i < WORKOUTS.length - 1 ? '1px solid #1a1a1a' : 'none',
                  background: isNext ? '#161616' : 'transparent',
                }}
              >
                <div
                  className="w-0.5 h-8 rounded-full shrink-0"
                  style={{ background: isNext ? w.color.from : '#222' }}
                />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${isNext ? 'text-zinc-100' : 'text-zinc-500'}`}>
                    {w.name}
                  </div>
                  <div className="text-[11px] text-zinc-600 mt-0.5">W{w.id} · {w.short}</div>
                </div>
                {isNext && (
                  <div className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 shrink-0"
                    style={{ color: w.color.from, border: `1px solid ${w.color.from}40`, borderRadius: 4 }}>
                    Next
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily mobility */}
      <div className="px-5 mt-8">
        <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 mb-3">Daily mobility</div>
        <div className="grid grid-cols-2 gap-3">
          {MOBILITY_ROUTINES.map((routine) => (
            <button
              key={routine.id}
              onClick={() => onStartMobility(routine)}
              className="text-left px-4 py-4 active:opacity-70 transition-opacity"
              style={{ background: '#131313', border: '1px solid #1e1e1e', borderTop: `2px solid ${routine.color.from}`, borderRadius: 8 }}
            >
              <div className="text-base mb-2">{routine.id === 'morning' ? '🌅' : '🌙'}</div>
              <div className="text-sm font-semibold text-zinc-200">{routine.id === 'morning' ? 'Morning' : 'Evening'}</div>
              <div className="text-[11px] text-zinc-600 mt-0.5">{routine.totalMinutes} min</div>
            </button>
          ))}
        </div>
      </div>

      {/* Last session */}
      {lastSession && (
        <div className="px-5 mt-8 mb-4">
          <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 mb-3">Last session</div>
          <div className="flex items-center justify-between px-4 py-4"
            style={{ background: '#131313', border: '1px solid #1e1e1e', borderRadius: 8 }}>
            <div>
              <div className="text-sm font-semibold">{getWorkoutById(lastSession.workout_id)?.name}</div>
              <div className="text-xs text-zinc-600 mt-0.5">{lastSession.sets.length} sets · {lastSession.duration_minutes ?? '—'} min</div>
            </div>
            <div className="text-xs text-zinc-600">{relTime(lastSession.finished_at)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
