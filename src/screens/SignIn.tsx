import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');
    setErrorMsg(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-24 pb-12">
      <div className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-2">Lift Log</div>
      <h1 className="font-display text-6xl leading-none mb-3">
        Welcome <span className="italic text-rose-300">back</span>
      </h1>
      <p className="text-zinc-500 text-sm mb-12">
        Sign in to your account.
      </p>

      <form onSubmit={signIn} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-base focus:outline-none focus:border-zinc-600 placeholder:text-zinc-700"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-base focus:outline-none focus:border-zinc-600 placeholder:text-zinc-700"
        />
        <button
          type="submit"
          disabled={status === 'loading' || !email || !password}
          className="w-full py-4 rounded-xl bg-zinc-100 text-zinc-950 font-bold disabled:bg-zinc-800 disabled:text-zinc-600 active:scale-[0.98] transition-transform"
        >
          {status === 'loading' ? 'Signing in…' : 'Sign in'}
        </button>
        {errorMsg && <div className="text-rose-400 text-sm mt-2">{errorMsg}</div>}
      </form>
    </div>
  );
}
