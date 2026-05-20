import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface NicotineSettings {
  quitDate: string;   // "YYYY-MM-DD"
  weeklyCost: number; // £ per week
}

interface Return {
  settings: NicotineSettings | null;
  loading: boolean;
  saveSettings: (s: NicotineSettings) => Promise<void>;
  setWeeklyCost: (cost: number) => Promise<void>;
  clearSettings: () => Promise<void>;
}

export function useNicotine(userId: string | null): Return {
  const [settings, setSettings] = useState<NicotineSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    const { data } = await supabase
      .from('nicotine_settings')
      .select('quit_date, weekly_cost')
      .eq('user_id', userId)
      .maybeSingle();
    setSettings(data ? { quitDate: data.quit_date, weeklyCost: data.weekly_cost } : null);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  /** Upsert a full settings row (used for first-time setup and reset). */
  const saveSettings = async (s: NicotineSettings) => {
    if (!userId) return;
    setSettings(s); // optimistic
    await supabase.from('nicotine_settings').upsert(
      { user_id: userId, quit_date: s.quitDate, weekly_cost: s.weeklyCost },
      { onConflict: 'user_id' }
    );
  };

  /** Patch only the weekly cost without touching the quit date. */
  const setWeeklyCost = async (cost: number) => {
    if (!userId || !settings) return;
    const next = { ...settings, weeklyCost: cost };
    setSettings(next);
    await supabase.from('nicotine_settings').upsert(
      { user_id: userId, quit_date: next.quitDate, weekly_cost: cost },
      { onConflict: 'user_id' }
    );
  };

  /** Remove the row entirely (user wants a full reset / delete). */
  const clearSettings = async () => {
    if (!userId) return;
    setSettings(null);
    await supabase.from('nicotine_settings').delete().eq('user_id', userId);
  };

  return { settings, loading, saveSettings, setWeeklyCost, clearSettings };
}
