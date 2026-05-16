interface Props {
  current: 'home' | 'progress';
  onNavigate: (screen: 'home' | 'progress') => void;
}

function HomeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function BarChartIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

export function BottomNav({ current, onNavigate }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40" style={{ background: '#0f0f0f', borderTop: '1px solid #1a1a1a' }}>
      <div className="flex items-center" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}>
        {([
          { id: 'home', label: 'Today', Icon: HomeIcon },
          { id: 'progress', label: 'Progress', Icon: BarChartIcon },
        ] as const).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className="flex-1 flex flex-col items-center gap-1.5 pt-3 pb-1 active:opacity-60 transition-opacity"
          >
            <span style={{ color: current === id ? '#efefef' : '#444' }}>
              <Icon size={18} />
            </span>
            <span
              className="text-[10px] uppercase tracking-widest font-semibold"
              style={{ color: current === id ? '#efefef' : '#444' }}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
