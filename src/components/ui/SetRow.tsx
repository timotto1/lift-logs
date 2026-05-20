import { colors } from './tokens';
import { Input } from './Input';

function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

interface Props {
  setNumber: number;
  weight: string;
  reps: string;
  onWeightChange: (val: string) => void;
  onRepsChange: (val: string) => void;
  // Workout mode
  done?: boolean;
  onToggleDone?: () => void;
  // Edit mode (Progress history)
  dirty?: boolean;
  onSave?: () => void;
  saving?: boolean;
}

export function SetRow({
  setNumber,
  weight,
  reps,
  onWeightChange,
  onRepsChange,
  done,
  onToggleDone,
  dirty,
  onSave,
  saving,
}: Props) {
  const isWorkoutMode = onToggleDone !== undefined;

  return (
    <div className={`flex items-center gap-2 transition-opacity ${done ? 'opacity-50' : ''}`}>
      {/* Set number */}
      <div className="text-xs font-mono w-4 text-center shrink-0" style={{ color: colors.textTertiary }}>
        {setNumber}
      </div>

      {/* Weight */}
      <Input
        type="number"
        inputMode="decimal"
        value={weight}
        onChange={onWeightChange}
        placeholder="0"
        suffix="kg"
        className="flex-1 min-w-0"
      />

      <span className="text-xs shrink-0" style={{ color: colors.textTertiary }}>×</span>

      {/* Reps */}
      <Input
        type="number"
        inputMode="numeric"
        value={reps}
        onChange={onRepsChange}
        placeholder="0"
        suffix="reps"
        className="flex-1 min-w-0"
      />

      {/* Workout mode: done toggle */}
      {isWorkoutMode && (
        <button
          onClick={onToggleDone}
          className="h-10 w-10 flex items-center justify-center shrink-0 active:scale-95 transition-transform"
          style={{
            background: done ? colors.positive : '#1e1e1e',
            color: done ? '#0a1f0c' : '#555',
            borderRadius: 8,
          }}
        >
          <CheckIcon size={16} />
        </button>
      )}

      {/* Edit mode: save button when dirty */}
      {!isWorkoutMode && dirty && (
        <button
          onClick={onSave}
          disabled={saving}
          className="text-[11px] font-semibold px-2.5 py-1 shrink-0 active:scale-95 transition-transform"
          style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', borderRadius: 6 }}
        >
          {saving ? '…' : 'Save'}
        </button>
      )}
    </div>
  );
}
