import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';

// ─── helpers ────────────────────────────────────────────────────────────────
const rupee = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const ROLE_PILL: Record<string, string> = {
  ADMIN:     'bg-purple-100 text-purple-700 border border-purple-200',
  ORGANISER: 'bg-blue-100 text-blue-700 border border-blue-200',
  CUSTOMER:  'bg-gray-100 text-gray-600 border border-gray-200',
};

// ─── mock chart data ─────────────────────────────────────────────────────────
const MONTHLY_BOOKINGS = [
  { month: 'Jan', bookings: 12 },
  { month: 'Feb', bookings: 19 },
  { month: 'Mar', bookings: 8  },
  { month: 'Apr', bookings: 25 },
  { month: 'May', bookings: 22 },
  { month: 'Jun', bookings: 30 },
];

const REVENUE_TREND = [
  { month: 'Jan', revenue: 4200  },
  { month: 'Feb', revenue: 6800  },
  { month: 'Mar', revenue: 3100  },
  { month: 'Apr', revenue: 9500  },
  { month: 'May', revenue: 8200  },
  { month: 'Jun', revenue: 12400 },
];

const MONTHLY_GROWTH = [
  { month: 'Jan', users: 8,  bookings: 12 },
  { month: 'Feb', users: 14, bookings: 19 },
  { month: 'Mar', users: 6,  bookings: 8  },
  { month: 'Apr', users: 18, bookings: 25 },
  { month: 'May', users: 15, bookings: 22 },
  { month: 'Jun', users: 22, bookings: 30 },
];

const PIE_COLORS = ['#00685f', '#6366f1', '#f97316'];

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  color: 'var(--text-primary)',
};

// ─── component ───────────────────────────────────────────────────────────────
const AdminDashboardPage: React.FC = () => {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<'users' | 'organisers'>('users');
  const [liveTime, setLiveTime] = useState(new Date());
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // live clock
  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const d = await api.getAdminDashboard();
      setData(d);
    } catch {}
    setLoading(false);
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await api.deactivateUser(id);
      loadData();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Failed to deactivate user');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen theme-bg-page flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#00685f] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="theme-text-muted text-sm">Loading admin dashboard…</p>
        </div>
      </div>
    );
  }

  const metrics   = data?.metrics   ?? {};
  const users     = data?.users     ?? [];
  const organisers = data?.organisers ?? [];

  // pie data derived from real metrics
  const customerCount  = (metrics.totalUsers ?? 0) - (metrics.totalOrganisers ?? 0) - 1; // subtract admins (approx 1)
  const pieData = [
    { name: 'Customers',  value: Math.max(customerCount, 0) },
    { name: 'Organisers', value: metrics.totalOrganisers ?? 0 },
    { name: 'Admins',     value: 1 },
  ];

  const metricCards = [
    { label: 'Total Users',            value: metrics.totalUsers ?? 0,          icon: '👥', color: 'bg-blue-50 text-blue-600',    delay: 0   },
    { label: 'Organisers',             value: metrics.totalOrganisers ?? 0,      icon: '🏢', color: 'bg-purple-50 text-purple-600', delay: 80  },
    { label: 'Total Bookings',         value: metrics.totalBookings ?? 0,        icon: '📋', color: 'bg-green-50 text-green-600',   delay: 160 },
    { label: 'New Users This Month',   value: metrics.monthlyNewUsers ?? 0,      icon: '🆕', color: 'bg-cyan-50 text-cyan-600',     delay: 240 },
    { label: 'New Bookings This Month',value: metrics.monthlyNewBookings ?? 0,   icon: '📅', color: 'bg-indigo-50 text-indigo-600', delay: 320 },
    { label: 'Monthly Revenue',        value: rupee(metrics.monthlyRevenue ?? 0),icon: '💰', color: 'bg-[#e6f2f1] text-[#00685f]', delay: 400 },
  ];

  return (
    <div className="min-h-screen theme-bg-page">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="theme-header sticky top-0 z-50 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#00685f] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <div>
              <span className="font-bold theme-text">BookFlow</span>
              <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono theme-text-muted hidden md:block">
              {liveTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-700 font-semibold text-sm">{user?.firstName?.[0]}</span>
            </div>
            <span className="text-sm theme-text hidden md:block">{user?.firstName} {user?.lastName}</span>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="text-sm theme-text-muted hover:text-gray-700 dark:hover:text-gray-200 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-8 py-8 space-y-8">

        {/* ── Welcome banner ─────────────────────────────────────────────── */}
        <div className="animate-fade-slide-up bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white flex items-center justify-between overflow-hidden relative">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute right-16 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
          <div className="relative z-10">
            <p className="text-orange-100 text-sm font-medium mb-1">Welcome back, {user?.firstName}</p>
            <h2 className="text-2xl font-bold">Admin Dashboard</h2>
            <p className="text-orange-200 text-sm mt-1">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="relative z-10 text-right hidden md:block">
            <p className="text-orange-100 text-xs mb-1">Live time</p>
            <p className="text-white font-bold text-xl font-mono">
              {liveTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <button
              onClick={loadData}
              className="mt-1 text-orange-200 text-xs underline hover:no-underline"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* ── Metric cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {metricCards.map((m) => (
            <div
              key={m.label}
              style={{ animationDelay: `${m.delay}ms` }}
              className="animate-fade-slide-up theme-card rounded-2xl p-5 flex items-center gap-4 card-hover"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${m.color}`}>
                {m.icon}
              </div>
              <div>
                <p className="text-xs theme-text-muted leading-tight">{m.label}</p>
                <p className="text-2xl font-bold theme-text mt-0.5">{m.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Charts row 1 ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Bar chart – Bookings Overview */}
          <div className="theme-card rounded-2xl p-6">
            <h3 className="font-bold theme-text mb-1">Bookings Overview</h3>
            <p className="text-xs theme-text-muted mb-4">Monthly bookings for the last 6 months</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={MONTHLY_BOOKINGS} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--bg-muted)' }} />
                <Bar dataKey="bookings" fill="#00685f" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart – User Distribution */}
          <div className="theme-card rounded-2xl p-6">
            <h3 className="font-bold theme-text mb-1">User Distribution</h3>
            <p className="text-xs theme-text-muted mb-4">Breakdown by role</p>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  formatter={(value) => (
                    <span style={{ color: 'var(--text-primary)', fontSize: 12 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Charts row 2 ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Area chart – Revenue Trend */}
          <div className="theme-card rounded-2xl p-6">
            <h3 className="font-bold theme-text mb-1">Revenue Trend</h3>
            <p className="text-xs theme-text-muted mb-4">Monthly revenue over the last 6 months</p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={REVENUE_TREND} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00685f" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00685f" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [rupee(v), 'Revenue']} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#00685f"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Bar chart – Monthly Growth */}
          <div className="theme-card rounded-2xl p-6">
            <h3 className="font-bold theme-text mb-1">Monthly Growth</h3>
            <p className="text-xs theme-text-muted mb-4">Users vs bookings side by side</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={MONTHLY_GROWTH} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--bg-muted)' }} />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  formatter={(value) => (
                    <span style={{ color: 'var(--text-primary)', fontSize: 12 }}>{value}</span>
                  )}
                />
                <Bar dataKey="users"    name="Users"    fill="#00685f" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bookings" name="Bookings" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Tabs section ───────────────────────────────────────────────── */}
        <div>
          {/* Tab switcher */}
          <div className="flex gap-1 theme-bg-tab p-1 rounded-xl mb-6 w-fit">
            {(['users', 'organisers'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize
                  ${tab === t
                    ? 'bg-white dark:bg-gray-600 theme-text shadow-sm'
                    : 'theme-text-muted hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
              >
                {t === 'users' ? `Users (${users.length})` : `Organisers (${organisers.length})`}
              </button>
            ))}
          </div>

          {/* Users table */}
          {tab === 'users' && (
            <div className="theme-card rounded-2xl overflow-hidden">
              <div className="p-5 border-b theme-divider">
                <h3 className="font-bold theme-text">All Users</h3>
                <p className="text-xs theme-text-muted mt-0.5">Manage registered users</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="theme-bg-table-head">
                    <tr>
                      {['Name', 'Email', 'Role', 'Registered', 'Status', 'Actions'].map((h) => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y theme-divider">
                    {users.map((u: any, idx: number) => (
                      <tr
                        key={u.id}
                        style={{ animationDelay: `${idx * 40}ms` }}
                        className="animate-fade-slide-up theme-bg-row-hover transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                              {u.firstName?.[0]}
                            </div>
                            <span className="text-sm font-medium theme-text">{u.firstName} {u.lastName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm theme-text-muted">{u.email}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_PILL[u.role] ?? ROLE_PILL.CUSTOMER}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm theme-text-muted">
                          {u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '—'}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            u.isActive === false
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : 'bg-green-50 text-green-700 border border-green-200'
                          }`}>
                            {u.isActive === false ? 'Inactive' : 'Active'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {u.role !== 'ADMIN' && u.isActive !== false && (
                            <button
                              onClick={() => handleDeactivate(u.id)}
                              className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors font-medium"
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center theme-text-muted text-sm">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Organisers table */}
          {tab === 'organisers' && (
            <div className="theme-card rounded-2xl overflow-hidden">
              <div className="p-5 border-b theme-divider">
                <h3 className="font-bold theme-text">All Organisers</h3>
                <p className="text-xs theme-text-muted mt-0.5">Overview of organiser accounts</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="theme-bg-table-head">
                    <tr>
                      {['Name', 'Email', 'Services', 'Bookings'].map((h) => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y theme-divider">
                    {organisers.map((o: any, idx: number) => (
                      <tr
                        key={o.id}
                        style={{ animationDelay: `${idx * 40}ms` }}
                        className="animate-fade-slide-up theme-bg-row-hover transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-300">
                              {o.firstName?.[0]}
                            </div>
                            <span className="text-sm font-medium theme-text">{o.firstName} {o.lastName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm theme-text-muted">{o.email}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 text-sm font-semibold theme-text">
                            <span className="w-6 h-6 bg-[#e6f2f1] text-[#00685f] rounded-full flex items-center justify-center text-xs font-bold">
                              {o.servicesCount ?? 0}
                            </span>
                            <span className="theme-text-muted font-normal text-xs">services</span>
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 text-sm font-semibold theme-text">
                            <span className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                              {o.bookingsCount ?? 0}
                            </span>
                            <span className="theme-text-muted font-normal text-xs">bookings</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                    {organisers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-12 text-center theme-text-muted text-sm">
                          No organisers found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboardPage;
