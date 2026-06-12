import { colors, motion } from './ui/tokens';

interface Props {
  current: 'home' | 'progress';
  onNavigate: (screen: 'home' | 'progress') => void;
}

function HomeIcon({ size = 19 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function BarChartIcon({ size = 19 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

const TABS = [
  { id: 'home', label: 'Today', Icon: HomeIcon },
  { id: 'progress', label: 'Progress', Icon: BarChartIcon },
] as const;

export function BottomNav({ current, onNavigate }: Props) {
  const activeIndex = TABS.findIndex((t) => t.id === current);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl"
      style={{
        background: 'rgba(10,10,10,0.82)',
        borderTop: `1px solid ${colors.borderSubtle}`,
      }}
    >
      {/* Sliding active indicator */}
      <div
        className="absolute top-0 h-0.5 rounded-full"
        style={{
          width: 32,
          left: `calc(${(activeIndex + 0.5) * (100 / TABS.length)}% - 16px)`,
          background: colors.textPrimary,
          transition: `left 400ms ${motion.spring}`,
        }}
      />
      <div className="flex items-center" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}>
        {TABS.map(({ id, label, Icon }) => {
          const active = current === id;
          return (
            <button
              key={id}
              onClick={() => {
                if (!active) navigator.vibrate?.(8);
                onNavigate(id);
              }}
              className="flex-1 flex flex-col items-center gap-1.5 pt-3.5 pb-1 active:scale-95 transition-transform duration-150"
            >
              <span
                className="transition-colors duration-200"
                style={{ color: active ? colors.textPrimary : colors.textDim }}
              >
                <Icon size={19} />
              </span>
              <span
                className="text-[10px] uppercase tracking-widest font-semibold transition-colors duration-200"
                style={{ color: active ? colors.textPrimary : colors.textDim }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
