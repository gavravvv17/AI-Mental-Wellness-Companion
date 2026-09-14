import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sprout, Lock, User, AlertCircle, Sparkles, Shield, HeartPulse, Zap, RefreshCw, Info, HelpCircle } from 'lucide-react';

const Login = ({ setAuthView }) => {
  const { login, sessionExpired } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(username, password);
    setLoading(false);
    if (!res.success) setError(res.error);
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #f5f0ff 0%, #fafaf7 40%, #f0faf0 100%)' }}>
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
        <div className="absolute top-[-60px] left-[-60px] w-[280px] h-[280px] rounded-full opacity-40 animate-float"
          style={{ background: 'radial-gradient(circle, #dccef9, transparent)' }} />
        <div className="absolute bottom-[10%] right-[-40px] w-[220px] h-[220px] rounded-full opacity-30 animate-float"
          style={{ background: 'radial-gradient(circle, #cdeccf, transparent)', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/3 w-[160px] h-[160px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #d8ecff, transparent)' }} />

        <div className="relative">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #a855f7)' }}>
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink-800">Serenity</h1>
              <p className="text-xs text-ink-400">Wellness Companion</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-ink-800 leading-tight">
            Your daily<br />
            <span style={{ color: '#8b5cf6' }}>mental wellness</span><br />
            sanctuary 🌿
          </h2>
          <p className="text-ink-400 mt-4 text-sm leading-relaxed max-w-sm">
            A peaceful space to track emotions, journal your thoughts, and build healthy habits — one mindful day at a time.
          </p>
        </div>

        <div className="relative space-y-4">
          {[
            { emoji: '😌', text: 'Mood & emotion check-ins', color: '#ffe5d4' },
            { emoji: '✍️', text: 'AI-powered journal reflections', color: '#dccef9' },
            { emoji: '🧘', text: 'Guided breathing & mindfulness', color: '#d8ecff' },
            { emoji: '📊', text: 'Wellness insights & analytics', color: '#cdeccf' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: f.color }}>
                {f.emoji}
              </div>
              <span className="text-sm text-ink-600 font-medium">{f.text}</span>
            </div>
          ))}
          <div className="flex gap-2 mt-4">
            {[{icon: Shield, t:'Private'},{icon: Zap, t:'AI-Powered'},{icon: HeartPulse, t:'Supportive'}].map(({icon: Icon, t}) => (
              <span key={t} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-semibold text-ink-500"
                style={{ background: '#ffffff', border: '1px solid #EEF0F5' }}>
                <Icon className="w-3 h-3 text-lavender-500" /> {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="card p-8 animate-fade-up" style={{ borderRadius: '28px' }}>
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #a855f7)' }}>
                <Sprout className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-ink-800">Serenity</span>
            </div>

            <h3 className="text-2xl font-bold text-ink-800 mb-1">Welcome back 👋</h3>
            <p className="text-sm text-ink-400 mb-6">Sign in to your wellness space</p>

            {sessionExpired && (
              <div className="mb-4 p-3.5 rounded-2xl flex items-start gap-2.5 animate-scale-in"
                style={{ background: '#fff9f0', border: '1px solid #ffaa78', color: '#f97316' }}>
                <RefreshCw className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">Session expired</p>
                  <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: '#92400e' }}>
                    The backend was restarted. Please sign in again — your account is still registered.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3.5 rounded-2xl border flex flex-col gap-2"
                style={{ background: '#fff5f5', border: '1px solid #fecaca', color: '#dc2626' }}>
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs">{error}</span>
                </div>
                {error.toLowerCase().includes('verify your email') && (
                  <button
                    type="button"
                    onClick={() => setAuthView('signup')}
                    className="self-start text-xs font-semibold underline text-purple-700 hover:text-purple-900 mt-1"
                  >
                    Complete Email Verification →
                  </button>
                )}
              </div>
            )}

            <div className="mb-4 p-3 rounded-2xl flex items-start gap-2"
              style={{ background: '#f0f8ff', border: '1px solid #d8ecff' }}>
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-sky-400" />
              <p className="text-[10px] text-sky-700 leading-relaxed">
                <strong>Example account:</strong> username <code className="bg-white/70 px-1 rounded">johnsmith</code> · password <code className="bg-white/70 px-1 rounded">password123</code><br />
                Or sign up to create your own account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">Username or Email</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                  <input type="text" required value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="Enter your username or email"
                    className="w-full pl-10 pr-4 py-3 field text-ink-800 text-sm" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-ink-600">Password</label>
                  <button
                    type="button"
                    onClick={() => setAuthView('forgot-password')}
                    className="text-xs font-medium hover:underline flex items-center gap-1"
                    style={{ color: '#8b5cf6' }}
                  >
                    <HelpCircle className="w-3 h-3" /> Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-3 field text-ink-800 text-sm" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <><Sparkles className="w-4 h-4" /> Sign In</>}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-ink-400">
              New here?{' '}
              <button onClick={() => setAuthView('signup')}
                className="font-semibold underline" style={{ color: '#8b5cf6' }}>
                Create your account →
              </button>
            </p>
            <p className="mt-4 text-center text-[10px] text-ink-300">
              Your data is encrypted and never shared.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
