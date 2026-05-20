import { colors, radii } from './tokens';

interface Props {
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string;
}

export function Sheet({ onClose, children, maxHeight = '90vh' }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative flex flex-col"
        style={{
          background: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: `${radii.sheet}px ${radii.sheet}px 0 0`,
          maxHeight,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-8 h-1 rounded-full bg-zinc-700" />
        </div>
        {children}
      </div>
    </div>
  );
}
