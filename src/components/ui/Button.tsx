import { radii } from './tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  children: React.ReactNode;
  variant?: Variant;
  accentColor?: string;       // overrides background for primary
  accentTextColor?: string;   // overrides text color for primary
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  accentColor,
  accentTextColor,
  disabled,
  className = '',
  style,
  onClick,
  type = 'button',
  fullWidth = true,
}: Props) {
  const base: React.CSSProperties = { borderRadius: radii.md };

  const variantStyle: React.CSSProperties =
    variant === 'primary'
      ? { background: accentColor ?? '#efefef', color: accentTextColor ?? '#0f0f0f' }
      : variant === 'secondary'
      ? { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#a1a1aa' }
      : variant === 'ghost'
      ? { background: 'transparent', color: '#71717a' }
      : { background: 'rgba(239,68,68,0.15)', color: '#f87171' };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        py-3.5 px-4 text-sm font-bold
        active:opacity-75 transition-opacity
        disabled:opacity-40
        flex items-center justify-center gap-2
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      style={{ ...base, ...variantStyle, ...style }}
    >
      {children}
    </button>
  );
}
