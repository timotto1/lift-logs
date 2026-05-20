import { colors, radii } from './tokens';

interface Props {
  label: string;
  value: string | number;
  unit?: string;
  className?: string;
}

export function StatCell({ label, value, unit, className = '' }: Props) {
  return (
    <div
      className={`p-3 text-center ${className}`}
      style={{
        background: '#111',
        border: `1px solid ${colors.border}`,
        borderRadius: radii.lg,
      }}
    >
      <div
        className="uppercase font-semibold mb-1"
        style={{ fontSize: '10px', letterSpacing: '0.15em', color: colors.textTertiary }}
      >
        {label}
      </div>
      <div className="text-xl font-bold tabular-nums" style={{ color: colors.textPrimary }}>
        {value}
        {unit && (
          <span className="text-xs font-normal ml-0.5" style={{ color: colors.textTertiary }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
