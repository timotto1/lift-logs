import { colors, motion, radii } from './tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

interface Props {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
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
  size = 'md',
  accentColor,
  accentTextColor,
  disabled,
  className = '',
  style,
  onClick,
  type = 'button',
  fullWidth = true,
}: Props) {
  const base: React.CSSProperties = {
    borderRadius: radii.button,
    transitionTimingFunction: motion.spring,
  };

  const variantStyle: React.CSSProperties =
    variant === 'primary'
      ? { background: accentColor ?? colors.textPrimary, color: accentTextColor ?? colors.bg }
      : variant === 'secondary'
      ? { background: colors.surface2, border: `1px solid ${colors.borderInput}`, color: colors.textSecondary }
      : variant === 'ghost'
      ? { background: 'transparent', color: colors.textTertiary }
      : { background: colors.negativeSubtle, color: colors.negative };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${size === 'lg' ? 'py-4 px-5 text-base' : 'py-3.5 px-4 text-sm'} font-bold
        active:scale-[0.97] active:opacity-90 transition-[transform,opacity] duration-150
        disabled:opacity-40 disabled:active:scale-100
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
