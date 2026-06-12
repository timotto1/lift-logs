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

function LoadingSkeleton() {
  return (
    <div className="min-h-screen px-5 pt-12 animate-fade-in">
      <div className="skeleton h-3 w-14 mb-4" />
      <div className="skeleton h-9 w-52 mb-3" />
      <div className="skeleton h-3 w-36 mb-8" />
      <div className="skeleton h-36 w-full mb-4" style={{ borderRadius: 16 }} />
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="skeleton h-24" style={{ borderRadius: 16 }} />
        <div className="skeleton h-24" style={{ borderRadius: 16 }} />
      </div>
      <div className="skeleton h-56 w-full" style={{ borderRadius: 16 }} />
    </div>
  );
}

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { history, loading: historyLoading, refetch } = useHistory(user?.id ?? null);

  const [screen, setScreen] = useState<Screen>('home');
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [activeMobility, setActiveMobility] = useState<MobilityRoutine | null>(null);

  if (authLoading) {
    return <LoadingSkeleton />;
  }

  if (!user) {
    return <SignIn />;
  }

  if (historyLoading) {
    return <LoadingSkeleton />;
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
      {/* key remounts the wrapper per screen so the fade-in plays on switch */}
      <div key={screen} className="animate-fade-in">
        {screen === 'home' && (
          <Home
            userId={user.id}
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
        {screen === 'progress' && <Progress history={history} onRefetch={refetch} userId={user.id} />}
      </div>

      {screen !== 'workout' && screen !== 'mobility' && (
        <BottomNav
          current={screen === 'progress' ? 'progress' : 'home'}
          onNavigate={(s) => setScreen(s)}
        />
      )}
    </>
  );
}
