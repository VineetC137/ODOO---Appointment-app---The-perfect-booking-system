import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const rupee = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const STATUS_PILL: Record<string, string> = {
  REQUEST:   'bg-amber-50 text-amber-700 border border-amber-200',
  BOOKED:    'bg-green-50 text-green-700 border border-green-200',
  CANCELLED: 'bg-red-50 text-red-600 border border-red-200',
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface ScheduleManagerProps {
  resourceId: string;
}

const ScheduleManager: React.FC<ScheduleManagerProps> = ({ resourceId }) => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [showSchedForm, setShowSchedForm] = useState(false);
  const [showExcForm, setShowExcForm] = useState(false);
  const [schedForm, setSchedForm] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDuration: 30 });
  const [excForm, setExcForm] = useState({ date: '', reason: '' });
  const [schedError, setSchedError] = useState('');
  const [excError, setExcError] = useState('');

  useEffect(() => { loadData(); }, [resourceId]);

  const loadData = async () => {
    setLoadingSchedules(true);
    try {
      const [s, e] = await Promise.all([api.getSchedules(resourceId), api.getExceptions(resourceId)]);
      setSchedules(s || []);
      setExceptions(e || []);
    } catch {}
    setLoadingSchedules(false);
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchedError('');
    try {
      await api.createSchedule(resourceId, schedForm);
      setShowSchedForm(false);
      setSchedForm({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDuration: 30 });
      loadData();
    } catch (err: any) { setSchedError(err.response?.data?.error || 'Failed to create schedule'); }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Delete this schedule?')) return;
    try { await api.deleteSchedule(id); loadData(); }
    catch (err: any) { alert(err.response?.data?.error || 'Failed to delete'); }
  };

  const handleCreateException = async (e: React.FormEvent) => {
    e.preventDefault();
    setExcError('');
    try {
      await api.createException(resourceId, excForm);
      setShowExcForm(false);
      setExcForm({ date: '', reason: '' });
      loadData();
    } catch (err: any) { setExcError(err.response?.data?.error || 'Failed to create exception'); }
  };

  const handleDeleteException = async (id: string) => {
    if (!confirm('Delete this exception?')) return;
    try { await api.deleteException(id); loadData(); }
    catch (err: any) { alert(err.response?.data?.error || 'Failed to delete'); }
  };

  if (loadingSchedules) return <div className="py-4 text-center text-sm text-gray-400">Loading...</div>;

  return (
    <div className="mt-4 space-y-6">
      {/* Schedules section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-semibold text-gray-700">Weekly Schedules</h5>
          <button onClick={() => setShowSchedForm(f => !f)}
            className="text-xs px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold">
            + Add Schedule
          </button>
        </div>

        {showSchedForm && (
          <form onSubmit={handleCreateSchedule} className="bg-[#f0f5f2] rounded-xl p-4 mb-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Day of Week</label>
                <select value={schedForm.dayOfWeek} onChange={e => setSchedForm(f => ({ ...f, dayOfWeek: +e.target.value }))}
                  className="w-full theme-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400">
                  {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Slot Duration (min)</label>
                <input type="number" min="5" max="480" value={schedForm.slotDuration}
                  onChange={e => setSchedForm(f => ({ ...f, slotDuration: +e.target.value }))}
                  className="w-full theme-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" required />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Start Time</label>
                <input type="time" value={schedForm.startTime}
                  onChange={e => setSchedForm(f => ({ ...f, startTime: e.target.value }))}
                  className="w-full theme-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" required />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">End Time</label>
                <input type="time" value={schedForm.endTime}
                  onChange={e => setSchedForm(f => ({ ...f, endTime: e.target.value }))}
                  className="w-full theme-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" required />
              </div>
            </div>
            {schedError && <p className="text-xs text-red-500">{schedError}</p>}
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-1.5 bg-primary-500 text-white text-xs font-semibold rounded-lg hover:bg-primary-600 transition-colors">Save</button>
              <button type="button" onClick={() => setShowSchedForm(false)} className="px-4 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg theme-bg-row-hover transition-colors">Cancel</button>
            </div>
          </form>
        )}

        {schedules.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">No schedules yet. Add one to enable bookings.</p>
        ) : (
          <div className="space-y-2">
            {schedules.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between theme-card rounded-xl px-4 py-3">
                <div>
                  <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{DAY_NAMES[s.dayOfWeek]}</span>
                  <span className="text-sm theme-text-muted ml-3">{s.startTime} – {s.endTime}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">· {s.slotDuration} min slots</span>
                </div>
                <button onClick={() => handleDeleteSchedule(s.id)}
                  className="text-xs text-red-500 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded-lg transition-colors">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exceptions section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-semibold text-gray-700">Exceptions (Blocked Dates)</h5>
          <button onClick={() => setShowExcForm(f => !f)}
            className="text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-semibold">
            + Add Exception
          </button>
        </div>

        {showExcForm && (
          <form onSubmit={handleCreateException} className="bg-[#f0f5f2] rounded-xl p-4 mb-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Date</label>
                <input type="date" value={excForm.date}
                  onChange={e => setExcForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full theme-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" required />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Reason (optional)</label>
                <input type="text" value={excForm.reason} placeholder="e.g. Holiday"
                  onChange={e => setExcForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full theme-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
            </div>
            {excError && <p className="text-xs text-red-500">{excError}</p>}
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition-colors">Save</button>
              <button type="button" onClick={() => setShowExcForm(false)} className="px-4 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg theme-bg-row-hover transition-colors">Cancel</button>
            </div>
          </form>
        )}

        {exceptions.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">No exceptions. Add dates when this resource is unavailable.</p>
        ) : (
          <div className="space-y-2">
            {exceptions.map((ex: any) => (
              <div key={ex.id} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <div>
                  <span className="font-semibold text-sm text-amber-800">
                    {format(new Date(ex.date), 'EEEE, MMMM d, yyyy')}
                  </span>
                  {ex.reason && <span className="text-xs text-amber-600 ml-2">· {ex.reason}</span>}
                </div>
                <button onClick={() => handleDeleteException(ex.id)}
                  className="text-xs text-red-500 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded-lg transition-colors">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const OrganiserDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'bookings' | 'services' | 'resources'>('bookings');
  const [showSvcForm, setShowSvcForm] = useState(false);
  const [showResForm, setShowResForm] = useState(false);
  const [svcForm, setSvcForm] = useState({ name: '', description: '', duration: 30, price: 0, resourceIds: [] as string[] });
  const [resForm, setResForm] = useState({ name: '', type: 'STAFF', capacity: 1 });
  const [expandedResource, setExpandedResource] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [liveTime, setLiveTime] = useState(new Date());
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { loadAll(); }, []);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [d, s, r] = await Promise.all([api.getOrganiserDashboard(), api.getOrganiserServices(), api.getResources()]);
      setData(d); setServices(s); setResources(r);
      setLastUpdated(new Date());
    } catch {}
    setLoading(false);
  };

  const handleStatus = async (id: string, status: string) => {
    try { await api.updateBookingStatus(id, status); loadAll(); }
    catch (e: any) { alert(e.response?.data?.error || 'Failed'); }
  };

  const handleCreateSvc = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.createService(svcForm); setShowSvcForm(false); setSvcForm({ name: '', description: '', duration: 30, price: 0, resourceIds: [] }); loadAll(); }
    catch (e: any) { alert(e.response?.data?.error || 'Failed'); }
  };

  const handleCreateRes = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.createResource(resForm); setShowResForm(false); setResForm({ name: '', type: 'STAFF', capacity: 1 }); loadAll(); }
    catch (e: any) { alert(e.response?.data?.error || 'Failed'); }
  };

  if (loading) return (
    <div className="min-h-screen theme-bg-page">
      <div className="text-center"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/><p className="theme-text-muted text-sm">Loading dashboard...</p></div>
    </div>
  );

  const metrics = data?.metrics ?? {};

  return (
    <div className="min-h-screen theme-bg-page">
      {/* Header */}
      <header className="theme-header sticky top-0 z-50 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <div>
              <span className="font-bold theme-text">BookFlow</span>
              <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Organiser</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <span className="text-primary-700 dark:text-primary-300 font-semibold text-sm">{user?.firstName?.[0]}</span>
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-200 hidden md:block">{user?.firstName} {user?.lastName}</span>
            <button onClick={() => { logout(); navigate('/login'); }}
              className="text-sm theme-text-muted hover:text-gray-700 dark:hover:text-gray-200 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors">Sign out</button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-8 py-8">
        {/* Welcome banner */}
        <div className="animate-fade-slide-up mb-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white flex items-center justify-between overflow-hidden relative">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4"/>
          <div className="absolute right-16 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2"/>
          <div className="relative z-10">
            <p className="text-primary-100 text-sm font-medium mb-1">Welcome back</p>
            <h2 className="text-2xl font-bold">{user?.firstName} {user?.lastName}</h2>
            <p className="text-primary-200 text-sm mt-1">Manage your bookings and services</p>
          </div>
          <div className="relative z-10 text-right hidden md:block">
            <p className="text-primary-100 text-xs">Live time</p>
            <p className="text-white font-bold text-lg font-mono">
              {liveTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-primary-200 text-xs mt-0.5">
              Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              <button onClick={loadAll} className="ml-2 underline hover:no-underline">↻ Refresh</button>
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-5 mb-8">
          {[
            { label: 'Total Bookings', value: metrics.totalBookings ?? 0, icon: '📋', color: 'bg-blue-50 text-blue-600' },
            { label: 'Upcoming', value: metrics.upcomingBookings ?? 0, icon: '📅', color: 'bg-green-50 text-green-600' },
            { label: 'Monthly Revenue', value: rupee(metrics.monthlyRevenue ?? 0), icon: '💰', color: 'bg-primary-50 text-primary-600' },
          ].map((m, i) => (
            <div key={m.label} style={{ animationDelay: `${i * 100}ms` }}
              className="animate-fade-slide-up theme-card rounded-2xl p-5 flex items-center gap-4 card-hover">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${m.color}`}>{m.icon}</div>
              <div>
                <p className="text-sm theme-text-muted">{m.label}</p>
                <p className="text-2xl font-bold theme-text">{m.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 theme-bg-tab p-1 rounded-xl mb-6 w-fit animate-fade-slide-up delay-300">
          {(['bookings', 'services', 'resources'] as const).map(t => {
            const pendingCount = t === 'bookings' ? (data?.recentBookings ?? []).filter((b: any) => b.status === 'REQUEST').length : 0;
            return (
              <button key={t} onClick={() => setTab(t)}
                className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize
                  ${tab === t ? 'bg-white dark:bg-gray-600 theme-text shadow-sm' : 'theme-text-muted hover:text-gray-700 dark:hover:text-gray-200'}`}>
                {t}
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bookings */}
        {tab === 'bookings' && (
          <div className="theme-card rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-700/30 dark:border-gray-700">
              <h3 className="font-bold theme-text">Recent Bookings</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="theme-bg-table-head">
                  <tr>
                    {['Customer', 'Service', 'Date & Time', 'Amount', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y theme-divider">
                  {(data?.recentBookings ?? []).map((b: any, idx: number) => (
                    <tr key={b.id} style={{ animationDelay: `${idx * 50}ms` }}
                      className="animate-fade-slide-up theme-bg-row-hover transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600">
                            {b.customer?.firstName?.[0]}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{b.customer?.firstName} {b.customer?.lastName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{b.service?.name}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{format(new Date(b.slotTime), 'MMM d, h:mm a')}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-primary-600">{rupee(b.service?.price ?? 0)}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_PILL[b.status]}`}>
                          {b.status === 'REQUEST' ? 'Pending' : b.status === 'BOOKED' ? 'Confirmed' : 'Cancelled'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {b.status === 'REQUEST' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleStatus(b.id, 'BOOKED')}
                              className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600 transition-colors">Confirm</button>
                            <button onClick={() => handleStatus(b.id, 'CANCELLED')}
                              className="px-3 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-200 transition-colors">Cancel</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!(data?.recentBookings?.length) && (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500 text-sm">No bookings yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Services */}
        {tab === 'services' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold theme-text">My Services</h3>
              <button onClick={() => setShowSvcForm(true)}
                className="px-4 py-2 bg-primary-500 text-white text-sm font-semibold rounded-xl hover:bg-primary-600 transition-colors shadow-sm">
                + New Service
              </button>
            </div>
            {showSvcForm && (
              <div className="theme-card rounded-2xl p-6 mb-5">
                <h4 className="font-bold theme-text mb-4">Create Service</h4>
                <form onSubmit={handleCreateSvc} className="space-y-3">
                  <input className="w-full theme-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" placeholder="Service name *" value={svcForm.name} onChange={e => setSvcForm(f => ({ ...f, name: e.target.value }))} required />
                  <input className="w-full theme-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" placeholder="Description" value={svcForm.description} onChange={e => setSvcForm(f => ({ ...f, description: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Duration (minutes)</label>
                      <input type="number" className="w-full theme-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" value={svcForm.duration} onChange={e => setSvcForm(f => ({ ...f, duration: +e.target.value }))} required />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Price (₹)</label>
                      <input type="number" step="0.01" className="w-full theme-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" value={svcForm.price} onChange={e => setSvcForm(f => ({ ...f, price: +e.target.value }))} required />
                    </div>
                  </div>
                  {resources.length > 0 && (
                    <div>
                      <label className="text-xs text-gray-500 mb-2 block">Assign Resources</label>
                      <div className="flex flex-wrap gap-2">
                        {resources.map((r: any) => (
                          <label key={r.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors
                            ${svcForm.resourceIds.includes(r.id) ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-200 hover:border-gray-300'}`}>
                            <input type="checkbox" className="hidden" checked={svcForm.resourceIds.includes(r.id)}
                              onChange={e => setSvcForm(f => ({ ...f, resourceIds: e.target.checked ? [...f.resourceIds, r.id] : f.resourceIds.filter(id => id !== r.id) }))} />
                            {svcForm.resourceIds.includes(r.id) ? '✓ ' : ''}{r.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="px-5 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-xl hover:bg-primary-600 transition-colors">Create</button>
                    <button type="button" onClick={() => setShowSvcForm(false)} className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl theme-bg-row-hover transition-colors">Cancel</button>
                  </div>
                </form>
              </div>
            )}
            <div className="space-y-3">
              {services.map((s: any) => (
                <div key={s.id} className="theme-card rounded-2xl p-5 flex items-center justify-between hover:shadow-sm transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-lg">📋</div>
                    <div>
                      <p className="font-semibold theme-text">{s.name}</p>
                      <p className="text-sm theme-text-muted">{s.duration} min · {rupee(s.price)}</p>
                    </div>
                  </div>
                  <button onClick={() => { if(confirm('Delete this service?')) api.deleteService(s.id).then(loadAll); }}
                    className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors">Delete</button>
                </div>
              ))}
              {services.length === 0 && <div className="text-center py-12 text-gray-400 dark:text-gray-500 theme-card rounded-2xl">No services yet. Create your first service!</div>}
            </div>
          </div>
        )}

        {/* Resources */}
        {tab === 'resources' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold theme-text">My Resources</h3>
              <button onClick={() => setShowResForm(true)}
                className="px-4 py-2 bg-primary-500 text-white text-sm font-semibold rounded-xl hover:bg-primary-600 transition-colors shadow-sm">
                + New Resource
              </button>
            </div>
            {showResForm && (
              <div className="theme-card rounded-2xl p-6 mb-5">
                <h4 className="font-bold theme-text mb-4">Create Resource</h4>
                <form onSubmit={handleCreateRes} className="space-y-3">
                  <input className="w-full theme-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" placeholder="Resource name *" value={resForm.name} onChange={e => setResForm(f => ({ ...f, name: e.target.value }))} required />
                  <select className="w-full theme-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" value={resForm.type} onChange={e => setResForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="STAFF">👨‍⚕️ Staff</option>
                    <option value="ROOM">🏥 Room</option>
                    <option value="EQUIPMENT">🔧 Equipment</option>
                  </select>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Capacity (max concurrent bookings)</label>
                    <input type="number" min="1" className="w-full theme-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" value={resForm.capacity} onChange={e => setResForm(f => ({ ...f, capacity: +e.target.value }))} required />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="px-5 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-xl hover:bg-primary-600 transition-colors">Create</button>
                    <button type="button" onClick={() => setShowResForm(false)} className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl theme-bg-row-hover transition-colors">Cancel</button>
                  </div>
                </form>
              </div>
            )}
            <div className="space-y-3">
              {resources.map((r: any) => {
                const icons: Record<string, string> = { STAFF: '👨‍⚕️', ROOM: '🏥', EQUIPMENT: '🔧' };
                const isExpanded = expandedResource === r.id;
                return (
                  <div key={r.id} className="theme-card rounded-2xl overflow-hidden hover:shadow-sm transition-all">
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 theme-bg-muted rounded-xl flex items-center justify-center text-xl">{icons[r.type] || '📦'}</div>
                        <div>
                          <p className="font-semibold theme-text">{r.name}</p>
                          <p className="text-sm theme-text-muted">{r.type} · Capacity: {r.capacity}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedResource(isExpanded ? null : r.id)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors
                            ${isExpanded ? 'bg-primary-50 border-primary-200 text-primary-600' : 'border-gray-200 text-gray-600 hover:border-primary-200 hover:text-primary-600'}`}
                        >
                          {isExpanded ? '▲ Hide Schedule' : '▼ Manage Schedule'}
                        </button>
                        <button onClick={() => { if(confirm('Delete this resource?')) api.deleteResource(r.id).then(loadAll); }}
                          className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors">Delete</button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-gray-100 px-5 pb-5">
                        <ScheduleManager resourceId={r.id} />
                      </div>
                    )}
                  </div>
                );
              })}
              {resources.length === 0 && <div className="text-center py-12 text-gray-400 dark:text-gray-500 theme-card rounded-2xl">No resources yet.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default OrganiserDashboardPage;
