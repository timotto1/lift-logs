import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useHistory, saveSession } from './hooks/useHistory';
import { SignIn } from './screens/SignIn';
import { Home } from './screens/Home';
import { WorkoutScreen } from './screens/Workout';
import { MobilityTimer } from './screens/MobilityTimer';
import { Progress } from './screens/Progress';
import { BottomNav } from './components/BottomNav';
import type { Workout } from './lib/workouts';
import type { MobilityRoutine } from './lib/mobility';

type Screen = 'home' | 'workout' | 'mobility' | 'progress';

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { history, loading: historyLoading, refetch } = useHistory(user?.id ?? null);

  const [screen, setScreen] = useState<Screen>('home');
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [activeMobility, setActiveMobility] = useState<MobilityRoutine | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-600 text-xs uppercase tracking-[0.3em]">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <SignIn />;
  }

  if (historyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-600 text-xs uppercase tracking-[0.3em]">Syncing…</div>
      </div>
    );
  }

  const startWorkout = (workout: Workout) => {
    setActiveWorkout(workout);
    setScreen('workout');
  };

  const finishWorkout = async (session: {
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
  }) => {
    const { error } = await saveSession({
      userId: user.id,
      ...session,
    });
    if (error) {
      alert(`Couldn't save: ${error}`);
      return;
    }
    await refetch();
    setActiveWorkout(null);
    setScreen('home');
  };

  return (
    <>
      {screen === 'home' && (
        <Home
          history={history}
          onStart={startWorkout}
          onStartMobility={(routine) => { setActiveMobility(routine); setScreen('mobility'); }}
          onSignOut={signOut}
        />
      )}
      {screen === 'workout' && activeWorkout && (
        <WorkoutScreen
          workout={activeWorkout}
          history={history}
          onFinish={finishWorkout}
          onBack={() => {
            if (confirm('Leave this session? Anything you logged but didn\'t save will be lost.')) {
              setActiveWorkout(null);
              setScreen('home');
            }
          }}
        />
      )}
      {screen === 'mobility' && activeMobility && (
        <MobilityTimer
          routine={activeMobility}
          onClose={() => { setActiveMobility(null); setScreen('home'); }}
        />
      )}
      {screen === 'progress' && <Progress history={history} onRefetch={refetch} />}

      {screen !== 'workout' && screen !== 'mobility' && (
        <BottomNav
          current={screen === 'progress' ? 'progress' : 'home'}
          onNavigate={(s) => setScreen(s)}
        />
      )}
    </>
  );
}
