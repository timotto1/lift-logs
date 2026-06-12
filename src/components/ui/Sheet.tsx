import { useEffect, useState } from 'react';
import { colors, motion, radii } from './tokens';

interface Props {
  onClose: () => void;
  /** Plain children, or a render-prop receiving an animated `close` —
   *  use the render-prop for in-sheet buttons so dismissal plays the exit. */
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  maxHeight?: string;
}

const EXIT_MS = 320;

export function Sheet({ onClose, children, maxHeight = '90vh' }: Props) {
  // Mount hidden, then flip visible on the next frame so the enter
  // transition plays; reverse before unmounting for a soft exit.
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const close = () => {
    if (closing) return;
    setClosing(true);
    setVisible(false);
    setTimeout(onClose, EXIT_MS);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={close}>
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />
      <div
        className="relative flex flex-col transition-transform"
        style={{
          background: colors.surface2,
          border: `1px solid ${colors.border}`,
          borderBottom: 'none',
          borderRadius: `${radii.sheet}px ${radii.sheet}px 0 0`,
          maxHeight,
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transitionDuration: '400ms',
          transitionTimingFunction: motion.spring,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>
        {typeof children === 'function' ? children(close) : children}
      </div>
    </div>
  );
}
