import { colors, font } from './tokens';

interface Props {
  children: React.ReactNode;
  spacing?: 'tight' | 'normal';
  className?: string;
}

export function SectionLabel({ children, spacing = 'normal', className = '' }: Props) {
  return (
    <div
      className={`uppercase font-semibold ${spacing === 'tight' ? 'mb-1.5' : 'mb-3'} ${className}`}
      style={{ fontSize: font.labelSize, letterSpacing: font.labelTracking, color: colors.textTertiary }}
    >
      {children}
    </div>
  );
}
