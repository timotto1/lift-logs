import { useEffect, useRef, useState } from 'react';
import type { MobilityRoutine } from '../lib/mobility';
import { fmtTime } from '../lib/format';
import { colors, radii } from '../components/ui';

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
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8 text-center animate-fade-rise"
        style={{ background: colors.bg }}
      >
        <div
          className="w-16 h-16 mb-7 flex items-center justify-center rounded-full"
          style={{ background: colors.positiveSubtle, color: colors.positive }}
        >
          <CheckIcon size={28} />
        </div>
        <div className="text-3xl font-bold mb-2 font-display tracking-tight">Done</div>
        <div className="text-sm mb-10" style={{ color: colors.textTertiary }}>
          {routine.name} · {routine.totalMinutes} min
        </div>
        <button
          onClick={onClose}
          className="w-full max-w-xs py-3.5 text-sm font-bold active:scale-[0.97] transition-transform duration-150"
          style={{ background: colors.textPrimary, color: colors.bg, borderRadius: radii.button }}
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
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: colors.bg }}>
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={onClose} className="active:opacity-60 active:scale-95 transition-[opacity,transform]">
          <ArrowLeftIcon size={20} />
        </button>
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: colors.textTertiary }}>
            {routine.name}
          </div>
          <div className="text-sm font-semibold">{currentIdx + 1} / {routine.exercises.length}</div>
        </div>
      </header>

      {/* Progress segments */}
      <div className="px-5 py-3 flex gap-1">
        {routine.exercises.map((ex, i) => (
          <div
            key={ex.id}
            className="h-0.5 flex-1 rounded-full transition-colors duration-300"
            style={{
              background:
                i < currentIdx
                  ? routine.color.from
                  : i === currentIdx
                  ? colors.textPrimary
                  : 'rgba(255,255,255,0.08)',
            }}
          />
        ))}
      </div>

      {/* Main timer */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 animate-fade-rise">
        {/* Ring */}
        <div className="relative mb-8">
          <svg width={200} height={200} className="-rotate-90">
            <circle cx={100} cy={100} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={10} />
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
                <div className="text-xs mt-1.5 uppercase tracking-widest" style={{ color: colors.textTertiary }}>
                  remaining
                </div>
              </>
            ) : (
              <div className="text-sm" style={{ color: colors.textSecondary }}>tap start</div>
            )}
          </div>
        </div>

        {/* Exercise info */}
        <div className="text-center mb-8 px-4">
          <div className="text-2xl font-bold mb-2 font-display tracking-tight">{exercise.name}</div>
          <div className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
            {exercise.description}
          </div>
        </div>

        {/* Controls */}
        <div className="w-full max-w-xs space-y-2">
          {!started ? (
            <button
              onClick={() => startExercise(0)}
              className="w-full py-3.5 text-sm font-bold active:scale-[0.97] active:opacity-90 transition-[transform,opacity] duration-150"
              style={{ background: routine.color.from, color: '#000', borderRadius: radii.button }}
            >
              Start
            </button>
          ) : (
            <button
              onClick={goNext}
              className="w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.97] active:opacity-90 transition-[transform,opacity] duration-150"
              style={{ background: routine.color.from, color: '#000', borderRadius: radii.button }}
            >
              {isLast ? <><CheckIcon size={16} /> Finish</> : <>Skip →</>}
            </button>
          )}
          {started && (
            <button
              onClick={() => setEndsAt(endsAt ? endsAt + 30000 : null)}
              className="w-full py-3 text-sm font-semibold active:scale-[0.97] transition-[transform,color] duration-150"
              style={{
                background: colors.surface2,
                border: `1px solid ${colors.border}`,
                color: colors.textSecondary,
                borderRadius: radii.button,
              }}
            >
              +30 seconds
            </button>
          )}
        </div>
      </div>

      {/* Up next */}
      {started && !isLast && (
        <div className="px-5 pb-10">
          <div
            className="flex items-center gap-3 px-4 py-3.5"
            style={{ background: colors.surface1, border: `1px solid ${colors.borderSubtle}`, borderRadius: radii.md }}
          >
            <div className="text-[10px] uppercase tracking-widest shrink-0" style={{ color: colors.textDim }}>
              Up next
            </div>
            <div className="text-sm truncate" style={{ color: colors.textSecondary }}>
              {routine.exercises[currentIdx + 1].name}
            </div>
            <div className="ml-auto text-xs shrink-0 tabular-nums" style={{ color: colors.textDim }}>
              {fmtTime(routine.exercises[currentIdx + 1].duration)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
