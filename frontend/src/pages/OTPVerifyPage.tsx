import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const OTP_EXPIRY_SECONDS = 10 * 60;

const OTPVerifyPage: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [manualUserId, setManualUserId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(OTP_EXPIRY_SECONDS);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggle } = useTheme();
  const stateUserId = (location.state as any)?.userId as string | undefined;
  const userId = stateUserId || manualUserId;

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) { setError('Please enter your User ID'); return; }
    setError(''); setLoading(true);
    try {
      await api.verifyOTP(userId, otp);
      navigate('/login', { state: { message: 'Account verified! Please log in.' } });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Verification failed');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (!userId) { setError('Please enter your User ID first'); return; }
    setError('');
    try {
      await api.resendOTP(userId);
      setSecondsLeft(OTP_EXPIRY_SECONDS);
      setSuccess('OTP resent — check the server console.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to resend OTP');
    }
  };

  // Timer ring progress
  const progress = (secondsLeft / OTP_EXPIRY_SECONDS) * 100;
  const timerColor = secondsLeft > 120 ? '#16a34a' : secondsLeft > 30 ? '#d97706' : '#dc2626';
  const circumference = 2 * Math.PI * 28;

  return (
    <div className="min-h-screen theme-bg-page">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-slide-up">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-500 rounded-2xl shadow-lg mb-4 animate-float">
            <span className="text-white font-bold text-2xl">B</span>
          </div>
          <h1 className="text-3xl font-bold theme-text">BookFlow</h1>
          <p className="theme-text-muted mt-1">Verify your account</p>
        </div>

        <div className="theme-card rounded-2xl shadow-sm p-8 animate-fade-slide-up delay-150">
          {/* Animated timer ring */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-20 h-20 mb-3">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="4"/>
                <circle cx="32" cy="32" r="28" fill="none" stroke={timerColor}
                  strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress / 100)}
                  style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono font-bold text-sm" style={{ color: timerColor }}>
                  {secondsLeft > 0 ? formatTime(secondsLeft) : '0:00'}
                </span>
              </div>
            </div>
            <h2 className="text-xl font-bold theme-text">Enter OTP</h2>
            <p className="text-sm theme-text-muted mt-1 text-center">
              {secondsLeft > 0
                ? 'Check the server console for your 6-digit OTP'
                : <span className="text-red-600 font-medium">OTP expired — please resend</span>}
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            {!stateUserId && (
              <div className="animate-fade-slide-up">
                <label className="block text-sm font-medium theme-text-secondary mb-1.5">User ID</label>
                <input value={manualUserId} onChange={e => setManualUserId(e.target.value)}
                  placeholder="Paste your user ID here"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400" required />
                <p className="text-xs text-gray-400 mt-1">Your user ID was shown after registration</p>
              </div>
            )}

            {/* OTP boxes */}
            <div className="animate-fade-slide-up delay-75">
              <label className="block text-sm font-medium text-gray-700 mb-3">6-digit OTP</label>
              <div className="flex gap-2 justify-center">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}
                    className={`w-11 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-bold font-mono transition-all
                      ${otp[i] ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}>
                    {otp[i] || '·'}
                  </div>
                ))}
              </div>
              <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6} className="sr-only" aria-label="OTP input" />
              {/* Hidden but functional input — clicking the boxes focuses this */}
              <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6} placeholder="Type your OTP here"
                className="w-full mt-3 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400 font-mono tracking-widest text-center"
                required />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 animate-scale-in">⚠ {error}</div>
            )}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 animate-scale-in">✓ {success}</div>
            )}

            <button type="submit" disabled={loading || otp.length !== 6}
              className="w-full py-3 bg-primary-500 text-white rounded-xl font-semibold text-sm hover:bg-primary-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed animate-fade-slide-up delay-225">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Verifying...
                </span>
              ) : 'Verify Account'}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <button onClick={handleResend}
              className="text-primary-500 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium hover:underline transition-colors">
              Resend OTP
            </button>
            <Link to="/login" className="theme-text-muted hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default OTPVerifyPage;
