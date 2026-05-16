import { useEffect, useRef, useState } from 'react';
import type { MobilityRoutine } from '../lib/mobility';
import { fmtTime } from '../lib/format';

interface Props {
  routine: MobilityRoutine;
  onClose: () => void;
}

function ArrowLeftIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function CheckIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function MobilityTimer({ routine, onClose }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [, forceUpdate] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const exercise = routine.exercises[currentIdx];
  const isLast = currentIdx === routine.exercises.length - 1;
  const secondsLeft = endsAt ? Math.max(0, Math.round((endsAt - Date.now()) / 1000)) : exercise.duration;
  const progress = 1 - secondsLeft / exercise.duration;

  const startExercise = (idx: number) => {
    setCurrentIdx(idx);
    setEndsAt(Date.now() + routine.exercises[idx].duration * 1000);
    setStarted(true);
  };

  const goNext = () => {
    if (isLast) {
      setEndsAt(null);
      setFinished(true);
    } else {
      startExercise(currentIdx + 1);
    }
  };

  // Tick
  useEffect(() => {
    if (!endsAt) return;
    tickRef.current = setInterval(() => {
      const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      if (left === 0) {
        clearInterval(tickRef.current!);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
        // Auto-advance after a short pause
        setTimeout(() => goNext(), 1200);
      }
      forceUpdate((n) => n + 1);
    }, 500);
    const onVisible = () => forceUpdate((n) => n + 1);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [endsAt, currentIdx]);

  // Finished screen
  if (finished) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8 text-center"
        style={{ background: routine.color.bg }}>
        <div className="text-6xl mb-6">🙌</div>
        <div className="text-4xl font-bold mb-2">Done!</div>
        <div className="text-zinc-400 mb-10">{routine.name} complete · {routine.totalMinutes} min</div>
        <button
          onClick={onClose}
          className="w-full max-w-xs py-4 rounded-2xl font-bold text-black"
          style={{ background: routine.color.from }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  // Circumference for SVG ring
  const R = 88;
  const circ = 2 * Math.PI * R;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#09090b' }}>
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button
          onClick={onClose}
          className="p-1.5 -ml-1.5 rounded-lg active:bg-zinc-800"
        >
          <ArrowLeftIcon size={20} />
        </button>
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-[0.25em] font-semibold" style={{ color: routine.color.text }}>
            {routine.name}
          </div>
          <div className="text-sm font-medium text-zinc-300">
            {currentIdx + 1} / {routine.exercises.length}
          </div>
        </div>
      </header>

      {/* Exercise list — scrollable context */}
      <div className="px-5 mb-4 flex gap-1.5">
        {routine.exercises.map((ex, i) => (
          <div
            key={ex.id}
            className="h-1 rounded-full flex-1 transition-all"
            style={{
              background: i < currentIdx
                ? routine.color.from
                : i === currentIdx
                ? routine.color.text
                : '#27272a',
            }}
          />
        ))}
      </div>

      {/* Main timer */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Ring */}
        <div className="relative mb-8">
          <svg width={200} height={200} className="-rotate-90">
            <circle cx={100} cy={100} r={R} fill="none" stroke="#27272a" strokeWidth={10} />
            <circle
              cx={100} cy={100} r={R}
              fill="none"
              stroke={routine.color.from}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - progress)}
              style={{ transition: 'stroke-dashoffset 0.5s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {started ? (
              <>
                <div className="text-5xl font-mono font-bold tabular-nums leading-none">
                  {fmtTime(secondsLeft)}
                </div>
                <div className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">remaining</div>
              </>
            ) : (
              <div className="text-zinc-400 text-sm">tap start</div>
            )}
          </div>
        </div>

        {/* Exercise info */}
        <div className="text-center mb-8 px-4">
          <div className="text-2xl font-bold mb-2">{exercise.name}</div>
          <div className="text-sm text-zinc-400 leading-relaxed">{exercise.description}</div>
        </div>

        {/* Controls */}
        <div className="w-full max-w-xs space-y-3">
          {!started ? (
            <button
              onClick={() => startExercise(0)}
              className="w-full py-4 rounded-2xl font-bold text-black text-base"
              style={{ background: routine.color.from }}
            >
              Start
            </button>
          ) : (
            <button
              onClick={goNext}
              className="w-full py-4 rounded-2xl font-bold text-black text-base flex items-center justify-center gap-2"
              style={{ background: routine.color.from }}
            >
              {isLast ? (
                <><CheckIcon size={18} /> Finish</>
              ) : (
                <>Next: {routine.exercises[currentIdx + 1].name}</>
              )}
            </button>
          )}
          {started && (
            <button
              onClick={() => setEndsAt(endsAt ? endsAt + 30000 : null)}
              className="w-full py-3 rounded-2xl font-semibold bg-zinc-900 text-zinc-300 text-sm"
            >
              +30 seconds
            </button>
          )}
        </div>
      </div>

      {/* Up next */}
      {started && !isLast && (
        <div className="px-5 pb-12">
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 flex items-center gap-3">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 shrink-0">Up next</div>
            <div className="text-sm font-medium text-zinc-300 truncate">
              {routine.exercises[currentIdx + 1].name}
            </div>
            <div className="ml-auto text-xs text-zinc-600 shrink-0">
              {fmtTime(routine.exercises[currentIdx + 1].duration)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
