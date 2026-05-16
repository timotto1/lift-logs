interface Props {
  current: 'home' | 'progress';
  onNavigate: (screen: 'home' | 'progress') => void;
}

function HomeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function BarChartIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

export function BottomNav({ current, onNavigate }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800">
      <div className="flex items-center justify-around py-3 px-6" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}>
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center gap-1 px-6 py-1 ${
            current === 'home' ? 'text-zinc-100' : 'text-zinc-600'
          }`}
        >
          <HomeIcon size={20} />
          <span className="text-[10px] uppercase tracking-widest font-semibold">Today</span>
        </button>
        <button
          onClick={() => onNavigate('progress')}
          className={`flex flex-col items-center gap-1 px-6 py-1 ${
            current === 'progress' ? 'text-zinc-100' : 'text-zinc-600'
          }`}
        >
          <BarChartIcon size={20} />
          <span className="text-[10px] uppercase tracking-widest font-semibold">Progress</span>
        </button>
      </div>
    </nav>
  );
}
