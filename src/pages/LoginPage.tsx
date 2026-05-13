import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../api/services';
import { decodeJwt } from '../api/client';
import { useAuthStore } from '../store';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      // Step 1: Login → get tokens
      const authRes = await authApi.login(form);
      const { accessToken, refreshToken } = authRes.data;

      if (!accessToken) {
        toast.error('No token received from server');
        return;
      }

      // Step 2: Persist tokens immediately so interceptor can attach them
      sessionStorage.setItem('accessToken', accessToken);
      sessionStorage.setItem('refreshToken', refreshToken || '');

      // Step 3: Decode JWT to get user ID for the /me call
      const payload = decodeJwt(accessToken);
      const userId = payload?.sub || payload?.userId || payload?.id;

      // Step 4: Fetch user profile using the new token
      let profile;
      try {
        const profileRes = await authApi.me();
        profile = profileRes.data;
      } catch (profileErr: any) {
        // If /me fails, build user object from JWT claims
        // JWT contains: sub=userId, email, username, fullName, roles
        console.warn('Profile fetch failed, using JWT payload:', profileErr?.response?.status);
        profile = {
          id: Number(payload?.sub) || 0,
          username: payload?.username || form.email.split('@')[0],
          email: payload?.email || form.email,
          fullName: payload?.fullName || '',
          role: payload?.roles?.replace('ROLE_', '') || 'USER',
        };
      }

      // Step 5: Commit to Zustand store
      setAuth(profile, accessToken, refreshToken || '');

      toast.success(`Welcome back, ${profile.fullName || profile.username}! 🎉`);
      navigate('/dashboard');
    } catch (err: any) {
      // Clear any partial tokens on failure
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');

      const status = err.response?.status;
      const serverMsg = err.response?.data?.message || err.response?.data?.error;

      if (status === 401 || status === 403) {
        toast.error('Invalid email or password');
      } else if (status === 404) {
        toast.error('Account not found. Please register first.');
      } else if (!err.response) {
        toast.error('Cannot connect to server. Is the backend running?');
      } else {
        toast.error(serverMsg || 'Login failed. Please try again.');
      }

      console.error('Login error:', { status, serverMsg, full: err });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-grid" />
        <div className="auth-glow auth-glow-1" />
        <div className="auth-glow auth-glow-2" />
      </div>

      <div className="auth-card animate-fadeIn">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-logo">
            <Code2 size={28} />
          </div>
          <div>
            <h1 className="auth-title">CodeSync</h1>
            <p className="auth-subtitle">Collaborative Cloud IDE</p>
          </div>
        </div>

        <h2 className="auth-heading">Sign in to your account</h2>
        <p className="auth-desc">Welcome back! Enter your credentials to continue.</p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className={`input ${errors.email ? 'input-error' : ''}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
              disabled={loading}
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-icon-right">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                className={`input ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowPw(!showPw)}
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full btn-lg"
            disabled={loading}
            id="login-btn"
          >
            {loading
              ? <><div className="spinner spinner-sm" /> Signing in...</>
              : <>Sign In <ArrowRight size={16} /></>
            }
          </button>
        </form>

        <div className="auth-divider"><span>or continue with</span></div>

        <a
          
          href="http://localhost:8081/oauth2/authorization/google?prompt=select_account"


          className="btn btn-secondary w-full"
          id="google-login-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </a>

        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register" id="register-link">Create one free</Link>
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
        .input-icon-btn { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; transition: color var(--transition-fast); }
        .input-icon-btn:hover { color: var(--text-secondary); }
        .input-error { border-color: var(--red) !important; }
        .auth-divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; color: var(--text-muted); font-size: 0.75rem; }
        .auth-divider::before, .auth-divider::after { content: ''; flex: 1; height: 1px; background: var(--border-subtle); }
        .auth-footer { text-align: center; margin-top: 20px; font-size: 0.875rem; color: var(--text-muted); }
      `}</style>
    </div>
  );
}
