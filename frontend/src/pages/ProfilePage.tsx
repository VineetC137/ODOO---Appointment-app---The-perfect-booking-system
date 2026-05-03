import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';

const rupee = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  CUSTOMER:  { label: 'Customer',  color: 'bg-blue-100 text-blue-700',   icon: '👤' },
  ORGANISER: { label: 'Organiser', color: 'bg-purple-100 text-purple-700', icon: '🏢' },
  ADMIN:     { label: 'Admin',     color: 'bg-orange-100 text-orange-700', icon: '🛡️' },
};

const navLinks: Record<string, { label: string; to: string }[]> = {
  CUSTOMER:  [{ label: 'Browse Services', to: '/services' }, { label: 'My Bookings', to: '/my-bookings' }],
  ORGANISER: [{ label: 'Dashboard', to: '/organiser/dashboard' }],
  ADMIN:     [{ label: 'Dashboard', to: '/admin/dashboard' }],
};

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile]       = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<'info' | 'security' | 'danger'>('info');
  const [saving, setSaving]         = useState(false);
  const [saveMsg, setSaveMsg]       = useState('');
  const [saveErr, setSaveErr]       = useState('');

  // Edit form
  const [firstName, setFirstName]   = useState('');
  const [lastName, setLastName]     = useState('');
  const [email, setEmail]           = useState('');
  const [phone, setPhone]           = useState('');

  // Password form
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd]         = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMsg, setPwdMsg]         = useState('');
  const [pwdErr, setPwdErr]         = useState('');

  // Delete form
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deletePwd, setDeletePwd]         = useState('');

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getProfile();
      setProfile(data);
      setFirstName(data.firstName || '');
      setLastName(data.lastName  || '');
      setEmail(data.email        || '');
      setPhone(data.phone        || '');
    } catch {}
    setLoading(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveMsg(''); setSaveErr('');
    try {
      const updated = await api.updateProfile({ firstName, lastName, email, phone });
      // Update localStorage
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, firstName: updated.firstName, lastName: updated.lastName, email: updated.email }));
      setProfile((p: any) => ({ ...p, ...updated }));
      setSaveMsg('Profile updated successfully!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err: any) {
      setSaveErr(err.response?.data?.error || err.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(''); setPwdErr('');
    if (newPwd !== confirmPwd) { setPwdErr('New passwords do not match'); return; }
    if (newPwd.length < 6) { setPwdErr('Password must be at least 6 characters'); return; }
    try {
      await api.changePassword({ currentPassword: currentPwd, newPassword: newPwd });
      setPwdMsg('Password changed successfully!');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setTimeout(() => setPwdMsg(''), 3000);
    } catch (err: any) {
      setPwdErr(err.response?.data?.error || err.message || 'Failed to change password');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') { alert('Type DELETE to confirm'); return; }
    try {
      await api.deleteAccount(deletePwd || undefined);
      logout();
      navigate('/login');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete account');
    }
  };

  const role = user?.role || 'CUSTOMER';
  const roleCfg = ROLE_CONFIG[role] || ROLE_CONFIG.CUSTOMER;
  const links = navLinks[role] || [];

  if (loading) return (
    <div className="min-h-screen theme-bg-page flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="theme-text-muted text-sm">Loading profile...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen theme-bg-page">
      <Navbar links={links} />

      <div className="max-w-screen-xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* ── Left sidebar ─────────────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-4">
            {/* Avatar card */}
            <div className="theme-card rounded-2xl p-6 text-center animate-fade-slide-up">
              <div className="w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-4xl font-bold shadow-lg">
                {profile?.firstName?.[0]?.toUpperCase()}
              </div>
              <h2 className="text-lg font-bold theme-text">{profile?.firstName} {profile?.lastName}</h2>
              <p className="text-sm theme-text-muted mt-0.5">{profile?.email}</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleCfg.color}`}>
                  {roleCfg.icon} {roleCfg.label}
                </span>
                {profile?.isVerified && (
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">✓ Verified</span>
                )}
              </div>
              {profile?.phone && (
                <p className="text-sm theme-text-muted mt-3">📞 {profile.phone}</p>
              )}
              <p className="text-xs theme-text-faint mt-2">
                Member since {profile?.createdAt ? format(new Date(profile.createdAt), 'MMMM yyyy') : '—'}
              </p>
            </div>

            {/* Stats card */}
            <div className="theme-card rounded-2xl p-5 animate-fade-slide-up delay-75">
              <h3 className="text-sm font-semibold theme-text mb-3">Activity</h3>
              <div className="space-y-3">
                {role === 'CUSTOMER' && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm theme-text-muted">Total Bookings</span>
                    <span className="font-bold theme-text">{profile?._count?.bookings ?? 0}</span>
                  </div>
                )}
                {role === 'ORGANISER' && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm theme-text-muted">Services</span>
                      <span className="font-bold theme-text">{profile?._count?.services ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm theme-text-muted">Resources</span>
                      <span className="font-bold theme-text">{profile?._count?.resources ?? 0}</span>
                    </div>
                  </>
                )}
                {role === 'ADMIN' && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm theme-text-muted">Role</span>
                    <span className="font-bold theme-text">Administrator</span>
                  </div>
                )}
              </div>
            </div>

            {/* Nav links */}
            <div className="theme-card rounded-2xl p-3 animate-fade-slide-up delay-150">
              {[
                ...links.map(l => ({ label: l.label, to: l.to, icon: '→' })),
              ].map(l => (
                <button key={l.to} onClick={() => navigate(l.to)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm theme-text-muted hover:text-primary-500 hover:bg-primary-500/10 transition-all flex items-center gap-2">
                  <span>{l.icon}</span> {l.label}
                </button>
              ))}
              <button onClick={() => { logout(); navigate('/login'); }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all flex items-center gap-2 mt-1">
                <span>🚪</span> Sign out
              </button>
            </div>
          </div>

          {/* ── Right content ─────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-6">
            {/* Tab switcher */}
            <div className="flex gap-1 theme-bg-tab p-1 rounded-xl w-fit animate-fade-slide-up">
              {[
                { key: 'info',     label: '👤 Profile Info' },
                { key: 'security', label: '🔒 Security' },
                { key: 'danger',   label: '⚠️ Account' },
              ].map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key as any)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all
                    ${activeTab === t.key ? 'bg-white theme-text shadow-sm' : 'theme-text-muted hover:theme-text'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Profile Info Tab ─────────────────────────────────── */}
            {activeTab === 'info' && (
              <div className="theme-card rounded-2xl p-6 animate-fade-slide-up">
                <h3 className="text-lg font-bold theme-text mb-1">Personal Information</h3>
                <p className="text-sm theme-text-muted mb-6">Update your name, email, and phone number</p>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium theme-text-secondary mb-1.5">First Name</label>
                      <input value={firstName} onChange={e => setFirstName(e.target.value)} required
                        className="theme-input w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium theme-text-secondary mb-1.5">Last Name</label>
                      <input value={lastName} onChange={e => setLastName(e.target.value)} required
                        className="theme-input w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium theme-text-secondary mb-1.5">Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      className="theme-input w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium theme-text-secondary mb-1.5">Phone Number</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="theme-input w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium theme-text-secondary mb-1.5">Role</label>
                    <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${roleCfg.color}`}>
                      {roleCfg.icon} {roleCfg.label} <span className="text-xs opacity-60">(cannot be changed)</span>
                    </div>
                  </div>

                  {saveMsg && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 animate-scale-in flex items-center gap-2">
                      ✓ {saveMsg}
                    </div>
                  )}
                  {saveErr && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 animate-scale-in">
                      ⚠ {saveErr}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={saving}
                      className="px-6 py-2.5 bg-primary-500 text-white rounded-xl font-semibold text-sm hover:bg-primary-600 transition-all shadow-sm disabled:opacity-50">
                      {saving ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                          Saving...
                        </span>
                      ) : 'Save Changes'}
                    </button>
                    <button type="button" onClick={loadProfile}
                      className="px-6 py-2.5 border theme-border theme-text-muted rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all">
                      Reset
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── Security Tab ─────────────────────────────────────── */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-fade-slide-up">
                {/* Change password */}
                <div className="theme-card rounded-2xl p-6">
                  <h3 className="text-lg font-bold theme-text mb-1">Change Password</h3>
                  <p className="text-sm theme-text-muted mb-6">Use a strong password with at least 6 characters</p>

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium theme-text-secondary mb-1.5">Current Password</label>
                      <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} required
                        placeholder="••••••••"
                        className="theme-input w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium theme-text-secondary mb-1.5">New Password</label>
                      <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required
                        placeholder="••••••••"
                        className="theme-input w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium theme-text-secondary mb-1.5">Confirm New Password</label>
                      <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required
                        placeholder="••••••••"
                        className="theme-input w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                      {newPwd && confirmPwd && newPwd !== confirmPwd && (
                        <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                      )}
                      {newPwd && confirmPwd && newPwd === confirmPwd && (
                        <p className="text-xs text-green-600 mt-1">✓ Passwords match</p>
                      )}
                    </div>

                    {pwdMsg && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 animate-scale-in">✓ {pwdMsg}</div>}
                    {pwdErr && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 animate-scale-in">⚠ {pwdErr}</div>}

                    <button type="submit"
                      className="px-6 py-2.5 bg-primary-500 text-white rounded-xl font-semibold text-sm hover:bg-primary-600 transition-all shadow-sm">
                      Update Password
                    </button>
                  </form>
                </div>

                {/* Account info */}
                <div className="theme-card rounded-2xl p-6">
                  <h3 className="text-lg font-bold theme-text mb-4">Account Details</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Account ID', value: profile?.id?.slice(0, 8) + '...' },
                      { label: 'Verification', value: profile?.isVerified ? '✓ Email verified' : '✗ Not verified' },
                      { label: 'Account Status', value: profile?.isActive !== false ? '✓ Active' : '✗ Deactivated' },
                      { label: 'Member Since', value: profile?.createdAt ? format(new Date(profile.createdAt), 'MMMM d, yyyy') : '—' },
                      { label: 'Last Updated', value: profile?.updatedAt ? format(new Date(profile.updatedAt), 'MMMM d, yyyy') : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center py-2 border-b theme-divider last:border-0">
                        <span className="text-sm theme-text-muted">{label}</span>
                        <span className="text-sm font-medium theme-text">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Danger Zone Tab ───────────────────────────────────── */}
            {activeTab === 'danger' && (
              <div className="space-y-6 animate-fade-slide-up">
                <div className="theme-card rounded-2xl p-6 border-2 border-red-200">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">⚠️</div>
                    <div>
                      <h3 className="text-lg font-bold text-red-600">Danger Zone</h3>
                      <p className="text-sm theme-text-muted mt-1">
                        Deactivating your account will prevent you from logging in. This action can be reversed by an admin.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium theme-text-secondary mb-1.5">
                        Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
                      </label>
                      <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                        placeholder="DELETE"
                        className="theme-input w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium theme-text-secondary mb-1.5">Your Password (optional)</label>
                      <input type="password" value={deletePwd} onChange={e => setDeletePwd(e.target.value)}
                        placeholder="Enter your password to confirm"
                        className="theme-input w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                    </div>

                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirm !== 'DELETE'}
                      className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                      Deactivate Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
