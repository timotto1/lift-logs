import { colors, radii } from './tokens';

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
  return (
    <div
      className={`flex p-1 ${className}`}
      style={{
        background: '#111',
        border: `1px solid ${colors.border}`,
        borderRadius: radii.lg,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex-1 py-2 text-sm font-semibold transition-all"
            style={{
              background: isActive ? colors.textPrimary : 'transparent',
              color: isActive ? '#09090b' : colors.textSecondary,
              borderRadius: radii.md,
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
