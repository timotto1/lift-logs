import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Input, Button } from '../components/ui';

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
        <Input
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="Email"
          autoComplete="email"
          required
        />
        <Input
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Password"
          autoComplete="current-password"
          required
        />
        <div className="pt-2">
          <Button
            type="submit"
            disabled={status === 'loading' || !email || !password}
          >
            {status === 'loading' ? 'Signing in…' : 'Sign in'}
          </Button>
        </div>
        {errorMsg && <div className="text-red-400 text-xs mt-2 pt-1">{errorMsg}</div>}
      </form>
    </div>
  );
}
