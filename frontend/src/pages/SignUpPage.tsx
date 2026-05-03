import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const SignUpPage: React.FC = () => {
  const [form, setForm] = useState({ email: '', password: '', role: 'CUSTOMER', firstName: '', lastName: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.register(form);
      navigate('/verify-otp', { state: { userId: res.data.id } });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent hover:border-gray-300 dark:hover:border-gray-500 transition-all";

  return (
    <div className="min-h-screen theme-bg-page">
      {/* Dark mode toggle */}
      <button onClick={toggle} aria-label="Toggle dark mode"
        className="fixed top-4 right-4 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm flex items-center justify-center text-lg hover:scale-110 transition-transform z-50">
        {isDark ? '☀️' : '🌙'}
      </button>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl shadow-lg mb-4 animate-float">
            <span className="text-white font-bold text-2xl">B</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">BookFlow</h1>
          <p className="text-gray-500 mt-1">Create your account</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 animate-fade-slide-up delay-150">
          <h2 className="text-xl font-bold theme-text mb-6">Get started</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="animate-fade-slide-up delay-150">
                <label className="block text-sm font-medium theme-text-secondary mb-1.5">First Name *</label>
                <input className={inputClass} value={form.firstName} onChange={set('firstName')} required />
              </div>
              <div className="animate-fade-slide-up delay-225">
                <label className="block text-sm font-medium theme-text-secondary mb-1.5">Last Name *</label>
                <input className={inputClass} value={form.lastName} onChange={set('lastName')} required />
              </div>
            </div>
            <div className="animate-fade-slide-up delay-225">
              <label className="block text-sm font-medium theme-text-secondary mb-1.5">Email *</label>
              <input type="email" className={inputClass} value={form.email} onChange={set('email')} required />
            </div>
            <div className="animate-fade-slide-up delay-300">
              <label className="block text-sm font-medium theme-text-secondary mb-1.5">Password *</label>
              <input type="password" className={inputClass} value={form.password} onChange={set('password')} required />
            </div>
            <div className="animate-fade-slide-up delay-300">
              <label className="block text-sm font-medium theme-text-secondary mb-1.5">Phone</label>
              <input className={inputClass} value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
            </div>
            <div className="animate-fade-slide-up delay-375">
              <label className="block text-sm font-medium theme-text-secondary mb-1.5">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'CUSTOMER', label: 'Customer', icon: '👤', desc: 'Book appointments' },
                  { value: 'ORGANISER', label: 'Organiser', icon: '🏢', desc: 'Offer services' },
                ].map(opt => (
                  <button key={opt.value} type="button" onClick={() => setForm(f => ({ ...f, role: opt.value }))}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${form.role === opt.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'}`}>
                    <div className="text-xl mb-1">{opt.icon}</div>
                    <div className="text-sm font-semibold theme-text">{opt.label}</div>
                    <div className="text-xs theme-text-muted">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 animate-scale-in">
                ⚠ {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-primary-500 text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed animate-fade-slide-up delay-450">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm theme-text-muted mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default SignUpPage;
