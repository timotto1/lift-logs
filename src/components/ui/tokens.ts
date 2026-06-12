// Design tokens — single source of truth for the app's visual language.
// Change here and it propagates everywhere.
// NOTE: color/radius values are mirrored in tailwind.config.js — keep in sync.

export const colors = {
  // ---- Background layers (OLED studio) ----
  bg: '#0a0a0a',
  surface1: '#141414', // resting cards
  surface2: '#1a1a1a', // elevated cards / sheets / inputs
  surface3: '#202020', // highest elevation (popovers, active states)

  // Legacy aliases — kept so unmigrated call sites keep compiling
  card: '#141414',
  cardElevated: '#1a1a1a',

  // ---- Hairlines (alpha-based so they sit on any surface) ----
  border: 'rgba(255,255,255,0.08)',
  borderSubtle: 'rgba(255,255,255,0.05)',
  borderInput: 'rgba(255,255,255,0.12)',

  // ---- Text (4-step) ----
  textPrimary: '#f5f5f4',
  textSecondary: '#a1a1aa', // zinc-400
  textTertiary: '#71717a', // zinc-500
  textDim: '#52525b', // zinc-600

  // ---- Semantic ----
  positive: '#34d399',
  positiveSubtle: 'rgba(52,211,153,0.12)',
  negative: '#f87171',
  negativeSubtle: 'rgba(248,113,113,0.12)',
  complete: '#0c1a0f',
  completeBorder: 'rgba(52,211,153,0.2)',
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  button: 14,
  sheet: 28,
};

export const font = {
  labelSize: '10px',
  labelTracking: '0.3em',
};

// ---- Motion ----
// One easing family for everything interactive.
export const motion = {
  /** iOS sheet spring — use for anything that slides or settles */
  spring: 'cubic-bezier(0.32, 0.72, 0, 1)',
  /** Fast decel — use for fades and small movements */
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  fast: '150ms',
  base: '250ms',
  slow: '400ms',
};

// Subtle top-light sheen that gives surfaces depth without visible banding.
// Layer over a surface color: `background: ${surfaceSheen}, ${colors.surface1}`.
export const surfaceSheen =
  'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 45%)';
