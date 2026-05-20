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

function cacheKey(userId: string) {
  return `nicotine_settings_${userId}`;
}

function readCache(userId: string): NicotineSettings | null {
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(userId: string, s: NicotineSettings | null) {
  try {
    if (s) localStorage.setItem(cacheKey(userId), JSON.stringify(s));
    else localStorage.removeItem(cacheKey(userId));
  } catch { /* ignore */ }
}

export function useNicotine(userId: string | null): Return {
  // Initialise synchronously from localStorage — no flicker on mount.
  const [settings, setSettings] = useState<NicotineSettings | null>(
    () => (userId ? readCache(userId) : null)
  );
  // If we already have a cached value we're not "loading" from the user's perspective.
  const [loading, setLoading] = useState(!userId || !readCache(userId));

  const sync = useCallback(async () => {
    if (!userId) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('nicotine_settings')
      .select('quit_date, weekly_cost')
      .eq('user_id', userId)
      .maybeSingle();

    // If the table doesn't exist yet (migration not run) just stay with cache / null.
    if (error) { setLoading(false); return; }

    const next = data ? { quitDate: data.quit_date, weeklyCost: data.weekly_cost } : null;
    setSettings(next);
    writeCache(userId, next);
    setLoading(false);
  }, [userId]);

  useEffect(() => { sync(); }, [sync]);

  const saveSettings = async (s: NicotineSettings) => {
    if (!userId) return;
    setSettings(s);
    writeCache(userId, s);
    await supabase.from('nicotine_settings').upsert(
      { user_id: userId, quit_date: s.quitDate, weekly_cost: s.weeklyCost },
      { onConflict: 'user_id' }
    );
  };

  const setWeeklyCost = async (cost: number) => {
    if (!userId || !settings) return;
    const next = { ...settings, weeklyCost: cost };
    setSettings(next);
    writeCache(userId, next);
    await supabase.from('nicotine_settings').upsert(
      { user_id: userId, quit_date: next.quitDate, weekly_cost: cost },
      { onConflict: 'user_id' }
    );
  };

  const clearSettings = async () => {
    if (!userId) return;
    setSettings(null);
    writeCache(userId, null);
    await supabase.from('nicotine_settings').delete().eq('user_id', userId);
  };

  return { settings, loading, saveSettings, setWeeklyCost, clearSettings };
}
