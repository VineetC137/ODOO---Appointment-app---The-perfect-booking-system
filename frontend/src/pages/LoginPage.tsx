import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole } from '../types';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const successMsg = (location.state as any)?.message;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login({ email, password });
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role === UserRole.ORGANISER) navigate('/organiser/dashboard');
      else if (user.role === UserRole.ADMIN) navigate('/admin/dashboard');
      else navigate('/services');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  const fillCredentials = (role: string) => {
    const creds: Record<string, string> = {
      customer: 'customer@bookflow.com',
      organiser: 'organiser@bookflow.com',
      admin: 'admin@bookflow.com',
    };
    setEmail(creds[role]);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen theme-bg-page flex items-center justify-center p-4">
      {/* Dark mode toggle */}
      <button onClick={toggle} aria-label="Toggle dark mode"
        className="fixed top-4 right-4 w-10 h-10 rounded-full theme-card flex items-center justify-center text-lg hover:scale-110 transition-transform z-50 shadow-md">
        {isDark ? '☀️' : '🌙'}
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl shadow-lg mb-4 animate-float">
            <span className="text-white font-bold text-2xl">B</span>
          </div>
          <h1 className="text-3xl font-bold theme-text">BookFlow</h1>
          <p className="theme-text-muted mt-1">Appointment Booking System</p>
        </div>

        <div className="theme-card rounded-2xl shadow-xl p-8 animate-fade-slide-up delay-150">
          <h2 className="text-xl font-bold theme-text mb-6">Welcome back</h2>

          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
              ✓ {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium theme-text-secondary mb-1.5">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@example.com"
                className="theme-input w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium theme-text-secondary mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="theme-input w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all" />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 animate-scale-in">⚠ {error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-primary-500 text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm theme-text-muted mt-4">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-500 font-semibold hover:underline">Sign up</Link>
          </p>

          <div className="mt-6 pt-6 theme-divider border-t">
            <p className="text-xs font-semibold theme-text-faint uppercase tracking-wide mb-3">Quick Login (Demo)</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { role: 'customer', label: 'Customer', bg: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
                { role: 'organiser', label: 'Organiser', bg: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
                { role: 'admin', label: 'Admin', bg: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' },
              ].map(({ role, label, bg }) => (
                <button key={role} onClick={() => fillCredentials(role)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors ${bg}`}>
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs theme-text-faint mt-2 text-center">Click a role to fill credentials, then Sign In</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
