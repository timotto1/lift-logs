import { useState } from 'react';
import { useNicotine } from '../hooks/useNicotine';
import { daysSince, moneySaved, formatDuration } from '../lib/nicotine';
import { Card, SectionLabel, Input, Button, colors, radii } from './ui';

interface Props {
  userId: string;
}

const DEFAULT_WEEKLY_COST = 40;

/** Setup screen shown when no quit date is recorded yet. */
function SetupCard({ onSave }: { onSave: (quitDate: string, weeklyCost: number) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [cost, setCost] = useState(String(DEFAULT_WEEKLY_COST));

  return (
    <div className="px-5 mb-6">
      <SectionLabel>Nicotine-free</SectionLabel>
      <Card>
        <div className="text-sm font-semibold mb-0.5" style={{ color: colors.textPrimary }}>
          Start tracking
        </div>
        <div className="text-xs mb-4" style={{ color: colors.textTertiary }}>
          Enter your quit date and weekly spend to track your progress.
        </div>

        <div className="space-y-2 mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: colors.textTertiary }}>
              Quit date
            </div>
            <Input
              type="date"
              value={date}
              onChange={setDate}
              max={today}
            />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: colors.textTertiary }}>
              Weekly spend (£)
            </div>
            <Input
              type="number"
              inputMode="decimal"
              value={cost}
              onChange={setCost}
              placeholder="40"
              suffix="/ wk"
            />
          </div>
        </div>

        <Button
          disabled={!date}
          onClick={() => onSave(date, parseFloat(cost) || DEFAULT_WEEKLY_COST)}
        >
          Start tracking
        </Button>
      </Card>
    </div>
  );
}

/** Editable weekly cost — inline input that saves on blur or Enter. */
function CostEditor({
  current,
  onSave,
}: {
  current: number;
  onSave: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(current));

  const commit = () => {
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) onSave(parsed);
    else setVal(String(current));
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        type="number"
        inputMode="decimal"
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        className="w-16 text-center text-xs font-semibold bg-transparent border-b focus:outline-none"
        style={{ color: colors.positive, borderColor: colors.positive }}
      />
    );
  }
  return (
    <button
      onClick={() => setEditing(true)}
      className="text-xs tabular-nums active:opacity-60 transition-opacity"
      style={{ color: colors.textTertiary }}
    >
      £{current}/wk ✎
    </button>
  );
}

export function NicotineCard({ userId }: Props) {
  const { settings, loading, saveSettings, setWeeklyCost, clearSettings } = useNicotine(userId);
  const [confirmReset, setConfirmReset] = useState(false);

  if (loading) return null;

  if (!settings) {
    return (
      <SetupCard
        onSave={(quitDate, weeklyCost) => saveSettings({ quitDate, weeklyCost })}
      />
    );
  }

  const days = daysSince(settings.quitDate);
  const saved = moneySaved(days, settings.weeklyCost);
  const { primary, secondary } = formatDuration(days);

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    // Second tap — confirmed
    clearSettings();
    setConfirmReset(false);
  };

  return (
    <div className="px-5 mb-6">
      <SectionLabel>Nicotine-free</SectionLabel>
      <Card>
        {/* Day count */}
        <div className="flex items-end gap-3 mb-1">
          <div className="text-5xl font-bold tabular-nums leading-none" style={{ color: colors.textPrimary }}>
            {primary}
          </div>
          <div className="pb-1">
            <div className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
              {days === 1 ? 'day' : 'days'}
            </div>
            {secondary && (
              <div className="text-xs" style={{ color: colors.textTertiary }}>
                {secondary}
              </div>
            )}
          </div>
        </div>

        {/* Money saved */}
        <div
          className="mt-3 px-3 py-2.5 flex items-center justify-between"
          style={{ background: colors.positiveSubtle, borderRadius: radii.md }}
        >
          <div className="text-sm font-bold" style={{ color: colors.positive }}>
            £{saved.toFixed(2)} saved
          </div>
          <CostEditor current={settings.weeklyCost} onSave={setWeeklyCost} />
        </div>

        {/* Reset */}
        <div className="mt-3 flex justify-end">
          {confirmReset ? (
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: colors.textTertiary }}>
                Reset your streak?
              </span>
              <button
                onClick={handleReset}
                className="text-xs font-semibold active:opacity-60"
                style={{ color: colors.negative }}
              >
                Yes, reset
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="text-xs active:opacity-60"
                style={{ color: colors.textTertiary }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="text-[11px] active:opacity-60 transition-opacity"
              style={{ color: colors.textDim }}
            >
              Reset
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
