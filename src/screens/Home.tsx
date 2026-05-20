import { useState } from 'react';
import type { SessionWithSets } from '../lib/supabase';
import { WORKOUTS, getNextWorkoutId, getWorkoutById, type Workout } from '../lib/workouts';
import { MOBILITY_ROUTINES, type MobilityRoutine } from '../lib/mobility';
import { greeting, relTime } from '../lib/format';
import { Card, SectionLabel, Sheet, Button, colors } from '../components/ui';
import { NicotineCard } from '../components/NicotineCard';

interface Props {
  userId: string;
  history: SessionWithSets[];
  onStart: (workout: Workout) => void;
  onStartMobility: (routine: MobilityRoutine) => void;
  onSignOut: () => void;
}

function PlayIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function WorkoutPreview({ workout, onStart, onClose }: { workout: Workout; onStart: () => void; onClose: () => void }) {
  return (
    <Sheet onClose={onClose}>
      <div className="px-6 pb-5">
        <div className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: colors.textTertiary }}>
          Workout {workout.id} · {workout.short}
        </div>
        <div className="text-2xl font-bold">{workout.name}</div>
        <div className="text-xs mt-1" style={{ color: colors.textTertiary }}>
          {workout.exercises.length} exercises · {workout.exercises.reduce((s, e) => s + e.sets, 0)} sets
        </div>
      </div>

      <div className="px-6 pb-5 space-y-3 max-h-64 overflow-y-auto">
        {workout.exercises.map((ex, i) => (
          <div key={ex.id} className="flex items-center gap-4">
            <div className="text-[10px] w-4 tabular-nums" style={{ color: colors.textDim }}>
              {String(i + 1).padStart(2, '0')}
            </div>
            <div className="flex-1">
              <div className="text-sm" style={{ color: colors.textSecondary }}>{ex.name}</div>
              <div className="text-[11px] mt-0.5" style={{ color: colors.textDim }}>
                {ex.sets} × {ex.reps} · {ex.rest}s rest
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-5 flex gap-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
        <Button variant="secondary" fullWidth={false} className="flex-1" onClick={onClose}>
          Back
        </Button>
        <button
          onClick={onStart}
          className="flex-[2] py-3.5 text-sm font-bold flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
          style={{ background: workout.color.from, color: '#000', borderRadius: 8 }}
        >
          <PlayIcon size={13} />
          Start Workout
        </button>
      </div>
    </Sheet>
  );
}

export function Home({ userId, history, onStart, onStartMobility, onSignOut }: Props) {
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
      <div className="px-5 pt-12 pb-6 flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.4em] mb-3" style={{ color: colors.textDim }}>Lift Log</div>
          <h1 className="text-4xl font-bold leading-none">Good {greeting()}</h1>
          <div className="text-xs mt-2 uppercase tracking-widest" style={{ color: colors.textDim }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="text-[10px] uppercase tracking-widest mt-1 active:opacity-60 transition-opacity"
          style={{ color: colors.textDim }}
        >
          Sign out
        </button>
      </div>

      {/* Nicotine-free tracker */}
      <NicotineCard userId={userId} />

      {/* Next workout */}
      <div className="px-5">
        <SectionLabel>Next session</SectionLabel>
        <Card onClick={() => setPreviewing(nextWorkout)}>
          <div className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: colors.textTertiary }}>
            Workout {nextWorkout.id}
          </div>
          <div className="text-2xl font-bold leading-tight mb-1">{nextWorkout.name}</div>
          <div className="text-xs" style={{ color: colors.textTertiary }}>
            {nextWorkout.exercises.length} exercises · {nextWorkout.exercises.reduce((s, e) => s + e.sets, 0)} sets
          </div>
          <div
            className="mt-5 py-3 text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: nextWorkout.color.from, color: '#000', borderRadius: 6 }}
          >
            <PlayIcon size={13} />
            Preview workout
          </div>
        </Card>
      </div>

      {/* Stats */}
      <div className="px-5 mt-4 grid grid-cols-2 gap-3">
        {[
          { label: 'This week', value: weekCount, unit: 'sessions' },
          { label: 'All time', value: history.length, unit: 'sessions' },
        ].map((stat) => (
          <Card key={stat.label} padding="1rem">
            <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: colors.textDim }}>
              {stat.label}
            </div>
            <div className="text-3xl font-bold tabular-nums leading-none">
              {stat.value}
              <span className="text-xs ml-1.5 font-normal" style={{ color: colors.textDim }}>{stat.unit}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Split rotation */}
      <div className="px-5 mt-6">
        <SectionLabel>Split rotation</SectionLabel>
        <Card variant="flush">
          {WORKOUTS.map((w, i) => {
            const isNext = w.id === nextId;
            return (
              <button
                key={w.id}
                onClick={() => setPreviewing(w)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left active:bg-white/[0.03] transition-colors"
                style={{ borderBottom: i < WORKOUTS.length - 1 ? `1px solid ${colors.borderSubtle}` : 'none' }}
              >
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: isNext ? w.color.from : '#333' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: isNext ? colors.textPrimary : colors.textTertiary }}>
                    {w.name}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: colors.textDim }}>
                    W{w.id} · {w.short}
                  </div>
                </div>
                {isNext && (
                  <div className="text-[10px] uppercase tracking-widest font-bold shrink-0" style={{ color: w.color.from }}>
                    Next
                  </div>
                )}
              </button>
            );
          })}
        </Card>
      </div>

      {/* Daily mobility */}
      <div className="px-5 mt-6">
        <SectionLabel>Daily mobility</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          {MOBILITY_ROUTINES.map((routine) => (
            <Card key={routine.id} onClick={() => onStartMobility(routine)} padding="1rem">
              <div className="text-base mb-2">{routine.id === 'morning' ? '🌅' : '🌙'}</div>
              <div className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
                {routine.id === 'morning' ? 'Morning' : 'Evening'}
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: colors.textDim }}>{routine.totalMinutes} min</div>
            </Card>
          ))}
        </div>
      </div>

      {/* Last session */}
      {lastSession && (
        <div className="px-5 mt-6 mb-4">
          <SectionLabel>Last session</SectionLabel>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{getWorkoutById(lastSession.workout_id)?.name}</div>
                <div className="text-xs mt-0.5" style={{ color: colors.textDim }}>
                  {lastSession.sets.length} sets · {lastSession.duration_minutes ?? '—'} min
                </div>
              </div>
              <div className="text-xs" style={{ color: colors.textDim }}>{relTime(lastSession.finished_at)}</div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
