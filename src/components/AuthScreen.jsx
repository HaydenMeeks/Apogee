import { useState } from 'react';
import { signIn, signUp } from '../supabase.js';

const S = {
  bg: '#0A0A0A', card: '#1C1C1C', border: 'rgba(255,255,255,0.08)',
  text: '#F4F4F2', muted: 'rgba(244,244,242,0.4)',
  green: '#00C46A', error: '#EF4444',
};

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('signin'); // signin | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handle = async () => {
    if (!email || !password) { setError('Enter email and password'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      if (mode === 'signup') {
        const { data, error: e } = await signUp(email, password);
        if (e) throw e;
        if (data.user && !data.session) {
          setSuccess('Check your email to confirm your account, then sign in.');
          setMode('signin');
        } else if (data.session) {
          onAuth(data.session.user);
        }
      } else {
        const { data, error: e } = await signIn(email, password);
        if (e) throw e;
        if (data.user) onAuth(data.user);
      }
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Logo */}
      <div style={{ marginBottom: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <svg width="56" height="58" viewBox="0 0 120 124" fill="none">
          <path d="M 60 4 L 112 26 L 112 76 Q 112 96 60 118 Q 8 96 8 76 L 8 26 Z" stroke="#F4F4F2" strokeWidth="5" strokeLinejoin="miter" fill="none"/>
          <path d="M 60 16 L 100 34 L 100 74 Q 100 88 60 104 Q 20 88 20 74 L 20 34 Z" fill="#00C46A"/>
          <path d="M 32 78 L 60 38 L 88 78" stroke="#0A0A0A" strokeWidth="6" strokeLinejoin="miter" strokeLinecap="square" fill="none"/>
          <path d="M 60 38 L 88 78 L 60 78 Z" fill="#0A0A0A"/>
        </svg>
        <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 28, letterSpacing: 6, color: S.text }}>APOGEE</div>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: S.muted, letterSpacing: 3 }}>TRAINING OS</div>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 380, background: S.card, border: `1px solid ${S.border}`, borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: S.error, marginBottom: 14 }}>{error}</div>}
        {success && <div style={{ background: 'rgba(0,196,106,.12)', border: `1px solid rgba(0,196,106,.3)`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: S.green, marginBottom: 14 }}>{success}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com"/>
          <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handle()}/>
        </div>

        <button onClick={handle} disabled={loading} style={{ width: '100%', background: S.green, color: '#0A0A0A', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, letterSpacing: .3 }}>
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>

        <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess(''); }} style={{ width: '100%', background: 'transparent', border: 'none', color: S.muted, fontSize: 13, marginTop: 14, cursor: 'pointer', padding: 4 }}>
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, placeholder, onKeyDown }) {
  return (
    <div>
      <label style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'rgba(244,244,242,0.4)', letterSpacing: 2, display: 'block', marginBottom: 5 }}>{label.toUpperCase()}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} onKeyDown={onKeyDown}
        style={{ width: '100%', background: '#141414', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#F4F4F2', fontSize: 15, padding: '10px 12px', outline: 'none', fontFamily: 'inherit' }}
        onFocus={e => e.target.style.borderColor = '#00C46A'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
      />
    </div>
  );
}
