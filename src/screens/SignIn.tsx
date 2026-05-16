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
    if (error) { setStatus('error'); setErrorMsg(error.message); }
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-24 pb-12">
      <div className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 mb-8">Lift Log</div>
      <h1 className="text-5xl font-bold leading-none mb-1">Sign in</h1>
      <p className="text-zinc-500 text-sm mb-10">Enter your credentials to continue.</p>

      <form onSubmit={signIn} className="space-y-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          className="w-full text-sm px-4 py-3.5 focus:outline-none placeholder:text-zinc-600"
          style={{ background: '#161616', border: '1px solid #222', borderRadius: 8 }}
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          className="w-full text-sm px-4 py-3.5 focus:outline-none placeholder:text-zinc-600"
          style={{ background: '#161616', border: '1px solid #222', borderRadius: 8 }}
        />
        <div className="pt-2">
          <button
            type="submit"
            disabled={status === 'loading' || !email || !password}
            className="w-full py-3.5 text-sm font-bold tracking-wide disabled:opacity-40 active:opacity-80 transition-opacity"
            style={{ background: '#efefef', color: '#0f0f0f', borderRadius: 8 }}
          >
            {status === 'loading' ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
        {errorMsg && <div className="text-red-400 text-xs mt-2 pt-1">{errorMsg}</div>}
      </form>
    </div>
  );
}
