// Pure data and calculation functions for the nicotine-free tracker.
// Nothing here touches React or Supabase — easy to test in isolation.

export interface Milestone {
  days: number;
  label: string;
  benefit: string;
}

export const MILESTONES: Milestone[] = [
  { days: 1,   label: '24 hours',  benefit: 'Heart attack risk starts to drop' },
  { days: 3,   label: '3 days',    benefit: 'Nicotine fully cleared from your body' },
  { days: 7,   label: '1 week',    benefit: 'Taste and smell noticeably sharper' },
  { days: 14,  label: '2 weeks',   benefit: 'Circulation and lung function improving' },
  { days: 30,  label: '1 month',   benefit: 'Coughing and breathlessness reduce' },
  { days: 90,  label: '3 months',  benefit: 'Lung function significantly better' },
  { days: 365, label: '1 year',    benefit: 'Heart disease risk cut in half' },
];

/** Full days elapsed since midnight on quitDate. Returns 0 on quit day itself. */
export function daysSince(quitDate: string): number {
  const quit = new Date(quitDate);
  quit.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((now.getTime() - quit.getTime()) / (1000 * 60 * 60 * 24)));
}

/** Money saved in £, derived from days elapsed and a weekly spend figure. */
export function moneySaved(days: number, weeklyCost: number): number {
  return (days / 7) * weeklyCost;
}

/**
 * Human-readable breakdown of a day count.
 * primary: the raw number to display large.
 * secondary: contextual breakdown string, or null if < 7 days (raw count speaks for itself).
 */
export function formatDuration(days: number): { primary: string; secondary: string | null } {
  if (days < 7) {
    return { primary: String(days), secondary: null };
  }
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    const rem = days % 7;
    const parts = [`${weeks} week${weeks !== 1 ? 's' : ''}`];
    if (rem > 0) parts.push(`${rem} day${rem !== 1 ? 's' : ''}`);
    return { primary: String(days), secondary: parts.join(', ') };
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    const rem = days % 30;
    const parts = [`${months} month${months !== 1 ? 's' : ''}`];
    if (rem > 0) parts.push(`${rem} day${rem !== 1 ? 's' : ''}`);
    return { primary: String(days), secondary: parts.join(', ') };
  }
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const parts = [`${years} year${years !== 1 ? 's' : ''}`];
  if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
  return { primary: String(days), secondary: parts.join(', ') };
}

/** The next milestone not yet reached, or null if all are done. */
export function nextMilestone(days: number): Milestone | null {
  return MILESTONES.find((m) => m.days > days) ?? null;
}

/** The most recently passed milestone, or null if none reached yet. */
export function lastReachedMilestone(days: number): Milestone | null {
  const reached = MILESTONES.filter((m) => m.days <= days);
  return reached[reached.length - 1] ?? null;
}
