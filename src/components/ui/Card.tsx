import { colors, radii, surfaceSheen } from './tokens';

type Variant = 'default' | 'elevated' | 'complete' | 'inset' | 'flush';

interface Props {
  children: React.ReactNode;
  variant?: Variant;
  padding?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

// Sheen overlays the surface color so cards read as lit from above
// rather than flat fills — depth without drop shadows.
const styles: Record<Variant, React.CSSProperties> = {
  default: {
    background: `${surfaceSheen}, ${colors.surface1}`,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.lg,
  },
  elevated: {
    background: `${surfaceSheen}, ${colors.surface2}`,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.lg,
  },
  complete: {
    background: colors.complete,
    border: `1px solid ${colors.completeBorder}`,
    borderRadius: radii.md,
  },
  inset: {
    background: '#101010',
    border: `1px solid ${colors.borderSubtle}`,
    borderRadius: radii.md,
  },
  flush: {
    background: `${surfaceSheen}, ${colors.surface1}`,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.lg,
    overflow: 'hidden',
    padding: 0,
  },
};

export function Card({ children, variant = 'default', padding, className = '', style, onClick }: Props) {
  const base = styles[variant];
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      onClick={onClick}
      className={`${
        onClick
          ? 'w-full text-left active:scale-[0.98] active:opacity-90 transition-[transform,opacity] duration-150'
          : ''
      } ${className}`}
      style={{ ...base, ...(padding ? { padding } : variant !== 'flush' ? { padding: '1rem' } : {}), ...style }}
    >
      {children}
    </Tag>
  );
}
