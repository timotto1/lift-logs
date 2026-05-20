import { colors, radii } from './tokens';

interface Props {
  type?: 'text' | 'email' | 'password' | 'number' | 'date';
  inputMode?: 'text' | 'numeric' | 'decimal' | 'email';
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  suffix?: string;
  autoComplete?: string;
  max?: string;
  required?: boolean;
  className?: string;
}

export function Input({
  type = 'text',
  inputMode,
  value,
  onChange,
  placeholder,
  suffix,
  autoComplete,
  max,
  required,
  className = '',
}: Props) {
  const containerStyle: React.CSSProperties = {
    background: colors.cardElevated,
    border: `1px solid ${colors.borderInput}`,
    borderRadius: radii.md,
    display: 'flex',
    alignItems: 'center',
  };

  return (
    <div style={containerStyle} className={className}>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        max={max}
        required={required}
        className="flex-1 min-w-0 bg-transparent px-4 py-3 text-sm focus:outline-none placeholder:text-zinc-700"
        style={{ color: colors.textPrimary }}
      />
      {suffix && (
        <span className="pr-3 text-xs shrink-0" style={{ color: colors.textTertiary }}>
          {suffix}
        </span>
      )}
    </div>
  );
}
