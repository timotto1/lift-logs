import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function SignIn() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [status, setStatus] = useState<'idle' | 'sending' | 'verifying' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'sending') return;
    setStatus('sending');
    setErrorMsg(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
    } else {
      setStatus('idle');
      setStep('otp');
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || status === 'verifying') return;
    setStatus('verifying');
    setErrorMsg(null);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

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
        {step === 'email' ? 'Enter your email to get a sign-in code.' : `Enter the 6-digit code sent to ${email}.`}
      </p>

      {step === 'email' ? (
        <form onSubmit={sendOtp} className="space-y-3">
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
            {status === 'sending' ? 'Sending…' : 'Send code'}
          </button>
          {errorMsg && <div className="text-rose-400 text-sm mt-2">{errorMsg}</div>}
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="space-y-3">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            required
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            autoComplete="one-time-code"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-base tracking-widest focus:outline-none focus:border-zinc-600 placeholder:text-zinc-700"
          />
          <button
            type="submit"
            disabled={status === 'verifying' || token.length < 6}
            className="w-full py-4 rounded-xl bg-zinc-100 text-zinc-950 font-bold disabled:bg-zinc-800 disabled:text-zinc-600 active:scale-[0.98] transition-transform"
          >
            {status === 'verifying' ? 'Verifying…' : 'Sign in'}
          </button>
          {errorMsg && <div className="text-rose-400 text-sm mt-2">{errorMsg}</div>}
          <button
            type="button"
            onClick={() => { setStep('email'); setToken(''); setStatus('idle'); setErrorMsg(null); }}
            className="w-full text-sm text-zinc-500 py-2"
          >
            Use a different email
          </button>
        </form>
      )}
    </div>
  );
}
