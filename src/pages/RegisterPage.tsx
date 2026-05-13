import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../api/services';
import { decodeJwt } from '../api/client';
import { useAuthStore } from '../store';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pwStrength = (() => {
    const p = form.password;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  })();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.username || form.username.length < 3) e.username = 'Username must be at least 3 characters';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email is required';
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      // Step 1: Register → returns tokens
      const authRes = await authApi.register(form);
      const { accessToken, refreshToken } = authRes.data;

      if (!accessToken) {
        toast.error('No token received from server');
        return;
      }

      // Step 2: Persist tokens immediately
      sessionStorage.setItem('accessToken', accessToken);
      sessionStorage.setItem('refreshToken', refreshToken || '');

      // Step 3: Decode JWT for user ID
      const payload = decodeJwt(accessToken);
      const userId = payload?.sub || payload?.userId || payload?.id;

      // Step 4: Fetch full profile (with JWT-fallback)
      let profile;
      try {
        const profileRes = await authApi.me();
        profile = profileRes.data;
      } catch (profileErr: any) {
        console.warn('Profile fetch failed, using form data + JWT:', profileErr?.response?.status);
        profile = {
          id: Number(payload?.sub) || 0,
          username: form.username,                              // we have it from the form
          email: payload?.email || form.email,
          fullName: form.fullName,                             // we have it from the form
          role: payload?.roles?.replace('ROLE_', '') || 'USER',
        };
      }

      // Step 5: Commit to Zustand store
      setAuth(profile, accessToken, refreshToken || '');

      toast.success('Account created! Welcome to CodeSync! 🚀');
      navigate('/dashboard');
    } catch (err: any) {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');

      const status = err.response?.status;
      const serverMsg = err.response?.data?.message || err.response?.data?.error;

      if (status === 409) {
        toast.error('Email or username already taken');
      } else if (status === 400) {
        toast.error(serverMsg || 'Invalid registration data');
      } else if (!err.response) {
        toast.error('Cannot connect to server. Is the backend running?');
      } else {
        toast.error(serverMsg || 'Registration failed. Please try again.');
      }

      console.error('Register error:', { status, serverMsg, full: err });
    } finally {
      setLoading(false);
    }
  };

  const strengthColors = ['', '#f87171', '#fbbf24', '#22d3a5', '#6366f1'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-grid" />
        <div className="auth-glow auth-glow-1" />
        <div className="auth-glow auth-glow-2" />
      </div>

      <div className="auth-card animate-fadeIn" style={{ maxWidth: 440 }}>
        <div className="auth-brand">
          <div className="auth-logo">
            <Code2 size={28} />
          </div>
          <div>
            <h1 className="auth-title">CodeSync</h1>
            <p className="auth-subtitle">Collaborative Cloud IDE</p>
          </div>
        </div>

        <h2 className="auth-heading">Create your account</h2>
        <p className="auth-desc">Start coding collaboratively for free. No credit card required.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input id="fullName" type="text" className={`input ${errors.fullName ? 'input-error' : ''}`}
                placeholder="John Doe" value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              {errors.fullName && <p className="form-error">{errors.fullName}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input id="username" type="text" className={`input ${errors.username ? 'input-error' : ''}`}
                placeholder="johndoe" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })} />
              {errors.username && <p className="form-error">{errors.username}</p>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input id="reg-email" type="email" className={`input ${errors.email ? 'input-error' : ''}`}
              placeholder="you@example.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-right">
              <input id="reg-password" type={showPw ? 'text' : 'password'}
                className={`input ${errors.password ? 'input-error' : ''}`}
                placeholder="Min. 8 characters" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button type="button" className="input-icon-btn" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.password && (
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{
                    flex: 1, height: 3, borderRadius: 99,
                    background: i <= pwStrength ? strengthColors[pwStrength] : 'var(--border-subtle)',
                    transition: 'background 0.2s'
                  }} />
                ))}
                <span style={{ fontSize: 11, color: strengthColors[pwStrength], marginLeft: 4, minWidth: 36 }}>
                  {strengthLabels[pwStrength]}
                </span>
              </div>
            )}
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--accent-light)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
            <Check size={14} style={{ color: 'var(--green)', marginTop: 1, flexShrink: 0 }} />
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </div>

          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading} id="register-btn">
            {loading ? <><div className="spinner spinner-sm" /> Creating account...</> : <>Create Account <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" id="login-link">Sign in</Link>
        </p>
      </div>

      <style>{`
        .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; padding: 24px; }
        .auth-bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; }
        .auth-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px); background-size: 40px 40px; }
        .auth-glow { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.3; }
        .auth-glow-1 { width: 600px; height: 600px; background: radial-gradient(circle, #6366f1, transparent 70%); top: -200px; left: -200px; }
        .auth-glow-2 { width: 500px; height: 500px; background: radial-gradient(circle, #a78bfa, transparent 70%); bottom: -150px; right: -150px; }
        .auth-card { position: relative; z-index: 1; background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-xl); padding: 40px; width: 100%; max-width: 420px; box-shadow: var(--shadow-lg), 0 0 60px rgba(99,102,241,0.1); }
        .auth-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
        .auth-logo { width: 48px; height: 48px; background: linear-gradient(135deg, var(--accent), var(--purple)); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 0 20px var(--accent-glow); }
        .auth-title { font-size: 1.5rem; font-weight: 800; }
        .auth-subtitle { font-size: 0.75rem; color: var(--text-muted); }
        .auth-heading { font-size: 1.25rem; font-weight: 700; margin-bottom: 6px; }
        .auth-desc { color: var(--text-muted); font-size: 0.875rem; margin-bottom: 24px; }
        .auth-form { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }
        .input-icon-right { position: relative; }
        .input-icon-right .input { padding-right: 40px; }
        .input-icon-btn { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; }
        .input-error { border-color: var(--red) !important; }
        .auth-footer { text-align: center; margin-top: 20px; font-size: 0.875rem; color: var(--text-muted); }
      `}</style>
    </div>
  );
}
