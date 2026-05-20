import { colors, radii } from './tokens';

type Variant = 'default' | 'elevated' | 'complete' | 'inset' | 'flush';

interface Props {
  children: React.ReactNode;
  variant?: Variant;
  padding?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const styles: Record<Variant, React.CSSProperties> = {
  default:  { background: colors.card, border: `1px solid ${colors.border}`, borderRadius: radii.lg },
  elevated: { background: colors.cardElevated, border: `1px solid ${colors.border}`, borderRadius: radii.lg },
  complete: { background: colors.complete, border: `1px solid ${colors.completeBorder}`, borderRadius: radii.md },
  inset:    { background: '#111', border: `1px solid ${colors.borderSubtle}`, borderRadius: radii.md },
  flush:    { background: colors.card, border: `1px solid ${colors.border}`, borderRadius: radii.lg, overflow: 'hidden', padding: 0 },
};

export function Card({ children, variant = 'default', padding, className = '', style, onClick }: Props) {
  const base = styles[variant];
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      onClick={onClick}
      className={`${onClick ? 'w-full text-left active:opacity-70 transition-opacity' : ''} ${className}`}
      style={{ ...base, ...(padding ? { padding } : variant !== 'flush' ? { padding: '1rem' } : {}), ...style }}
    >
      {children}
    </Tag>
  );
}
