import { colors, motion, radii } from './tokens';

interface Tab {
  id: string;
  label: string;
}

interface Props {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function SegmentedControl({ tabs, active, onChange, className = '' }: Props) {
  const activeIndex = Math.max(0, tabs.findIndex((t) => t.id === active));

  return (
    <div
      className={`relative flex p-1 ${className}`}
      style={{
        background: '#101010',
        border: `1px solid ${colors.border}`,
        borderRadius: radii.lg,
      }}
    >
      {/* Sliding thumb */}
      <div
        className="absolute top-1 bottom-1"
        style={{
          // 100% here is the container's padding box; subtract the 8px of
          // p-1 so the thumb width exactly equals one tab's width.
          width: `calc((100% - 8px) / ${tabs.length})`,
          left: 4,
          transform: `translateX(${activeIndex * 100}%)`,
          background: colors.textPrimary,
          borderRadius: radii.md,
          transition: `transform 350ms ${motion.spring}`,
        }}
      />
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="relative flex-1 py-2 text-sm font-semibold transition-colors duration-200"
            style={{ color: isActive ? colors.bg : colors.textSecondary }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
