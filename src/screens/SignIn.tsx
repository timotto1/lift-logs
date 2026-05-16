import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function SignIn() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'sending') return;
    setStatus('sending');
    setErrorMsg(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
    } else {
      setStatus('sent');
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-24 pb-12">
      <div className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-2">Lift Log</div>
      <h1 className="font-display text-6xl leading-none mb-3">
        Welcome <span className="italic text-rose-300">back</span>
      </h1>
      <p className="text-zinc-500 text-sm mb-12">
        Sign in with a magic link. No passwords, no faff.
      </p>

      {status !== 'sent' ? (
        <form onSubmit={sendLink} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-base focus:outline-none focus:border-zinc-600 placeholder:text-zinc-700"
          />
          <button
            type="submit"
            disabled={status === 'sending' || !email}
            className="w-full py-4 rounded-xl bg-zinc-100 text-zinc-950 font-bold disabled:bg-zinc-800 disabled:text-zinc-600 active:scale-[0.98] transition-transform"
          >
            {status === 'sending' ? 'Sending…' : 'Send magic link'}
          </button>
          {errorMsg && <div className="text-rose-400 text-sm mt-2">{errorMsg}</div>}
        </form>
      ) : (
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
          <div className="text-2xl mb-2">✉️</div>
          <div className="font-medium text-zinc-100 mb-1">Check your email</div>
          <div className="text-sm text-zinc-500">
            We sent a sign-in link to <span className="text-zinc-300">{email}</span>. Tap the link
            from your phone and you'll be in.
          </div>
        </div>
      )}
    </div>
  );
}
