import { colors, radii } from './tokens';

interface Props {
  /** Positive = green, negative = red, zero = neutral */
  value: number;
  unit?: string;
  /** If provided, shows "(+N%)" suffix */
  percentValue?: number;
  className?: string;
}

export function Badge({ value, unit = '', percentValue, className = '' }: Props) {
  const positive = value >= 0;
  const bg = positive ? colors.positiveSubtle : colors.negativeSubtle;
  const color = positive ? '#4ade80' : '#f87171';
  const prefix = value > 0 ? '+' : '';

  return (
    <span
      className={`inline-block text-[11px] font-semibold tabular-nums px-1.5 py-0.5 ${className}`}
      style={{ background: bg, color, borderRadius: radii.sm }}
    >
      {prefix}{value}{unit}
      {percentValue !== undefined && ` (${percentValue > 0 ? '+' : ''}${percentValue}%)`}
    </span>
  );
}
