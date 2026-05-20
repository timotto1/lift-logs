import { useNicotine } from '../hooks/useNicotine';
import {
  daysSince,
  moneySaved,
  formatDuration,
  nextMilestone,
  lastReachedMilestone,
  MILESTONES,
} from '../lib/nicotine';
import { Card, SectionLabel, StatCell, colors, radii } from './ui';

interface Props {
  userId: string;
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/** Progress bar from last milestone to next. */
function MilestoneProgress({ days }: { days: number }) {
  const last = lastReachedMilestone(days);
  const next = nextMilestone(days);

  if (!next) return null; // all milestones done — could show a completion state

  const from = last?.days ?? 0;
  const to = next.days;
  const pct = Math.min(100, Math.round(((days - from) / (to - from)) * 100));
  const daysLeft = next.days - days;

  return (
    <div
      className="mb-4 px-4 py-3.5"
      style={{
        background: colors.cardElevated,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.lg,
      }}
    >
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-xs font-semibold" style={{ color: colors.textPrimary }}>
          Next: {next.label}
        </div>
        <div className="text-xs tabular-nums" style={{ color: colors.textTertiary }}>
          {daysLeft} day{daysLeft !== 1 ? 's' : ''} away
        </div>
      </div>
      <div className="text-[11px] mb-3" style={{ color: colors.textTertiary }}>
        {next.benefit}
      </div>
      {/* Track */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1e1e1e' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: colors.positive }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <div className="text-[10px]" style={{ color: colors.textDim }}>
          {last ? `Day ${last.days}` : 'Start'}
        </div>
        <div className="text-[10px]" style={{ color: colors.textDim }}>
          Day {next.days}
        </div>
      </div>
    </div>
  );
}

export function NicotineMilestones({ userId }: Props) {
  const { settings, loading } = useNicotine(userId);

  if (loading || !settings) return null;

  const days = daysSince(settings.quitDate);
  const saved = moneySaved(days, settings.weeklyCost);
  const { primary, secondary } = formatDuration(days);

  return (
    <div className="px-4 mb-6">
      <SectionLabel>Nicotine-free</SectionLabel>

      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCell
          label={days === 1 ? 'Day' : 'Days'}
          value={primary}
          unit={secondary ?? undefined}
        />
        <StatCell
          label="Saved"
          value={`£${saved.toFixed(0)}`}
        />
      </div>

      {/* Progress to next milestone */}
      <MilestoneProgress days={days} />

      {/* All milestones list */}
      <SectionLabel spacing="tight">Health milestones</SectionLabel>
      <Card variant="flush">
        {MILESTONES.map((m, i) => {
          const reached = days >= m.days;
          const isNext = !reached && nextMilestone(days)?.days === m.days;
          const daysLeft = m.days - days;

          return (
            <div
              key={m.days}
              className="flex items-center gap-3 px-4 py-3.5"
              style={{
                borderBottom: i < MILESTONES.length - 1 ? `1px solid ${colors.borderSubtle}` : 'none',
                background: isNext ? colors.positiveSubtle : 'transparent',
              }}
            >
              {/* Status indicator */}
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: reached ? colors.positiveSubtle : '#1a1a1a',
                  color: reached ? colors.positive : colors.textDim,
                  border: `1px solid ${reached ? colors.positive : colors.border}`,
                }}
              >
                {reached
                  ? <CheckIcon size={12} />
                  : <span className="text-[9px] font-bold">{m.days}</span>
                }
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-semibold leading-tight"
                  style={{ color: reached ? colors.textPrimary : isNext ? colors.textPrimary : colors.textTertiary }}
                >
                  {m.label}
                </div>
                <div className="text-[11px] mt-0.5 leading-tight" style={{ color: colors.textTertiary }}>
                  {m.benefit}
                </div>
              </div>

              {/* Right: date reached or days away */}
              <div className="text-right shrink-0">
                {reached ? (
                  <div className="text-[11px] font-semibold" style={{ color: colors.positive }}>
                    ✓ Reached
                  </div>
                ) : (
                  <div className="text-[11px] tabular-nums" style={{ color: isNext ? colors.textSecondary : colors.textDim }}>
                    {daysLeft}d away
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
