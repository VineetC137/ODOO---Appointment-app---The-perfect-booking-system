import React, { useState, useEffect, useCallback } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, addWeeks, subWeeks,
  isSameMonth, isSameDay, isToday, parseISO, getHours, getMinutes,
} from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';

// ─── types ───────────────────────────────────────────────────────────────────
interface Booking {
  id: string;
  slotTime: string;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  service: { name: string; duration: number; price: number };
  resource: { name: string };
}

type ViewMode = 'month' | 'week' | 'day';

// ─── helpers ─────────────────────────────────────────────────────────────────
const rupee = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const STATUS_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  REQUEST:   { bg: 'bg-amber-100',  text: 'text-amber-800',  dot: 'bg-amber-400'  },
  BOOKED:    { bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500'  },
  CANCELLED: { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-400'    },
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

// ─── component ───────────────────────────────────────────────────────────────
const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings]       = useState<Booking[]>([]);
  const [loading, setLoading]         = useState(true);
  const [view, setView]               = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const navLinks = user?.role === 'ORGANISER'
    ? [{ label: 'Dashboard', to: '/organiser/dashboard' }, { label: '📅 Calendar', to: '/calendar' }]
    : [{ label: 'My Bookings', to: '/my-bookings' }, { label: 'Browse Services', to: '/services' }, { label: '📅 Calendar', to: '/calendar' }];

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getBookings();
      setBookings(data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  // ── booking helpers ────────────────────────────────────────────────────────
  const bookingsOnDay = (day: Date) =>
    bookings.filter(b => isSameDay(parseISO(b.slotTime), day));

  const bookingsInWeek = (weekStart: Date) => {
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    return days.map(d => ({ day: d, bookings: bookingsOnDay(d) }));
  };

  // ── navigation ─────────────────────────────────────────────────────────────
  const prev = () => {
    if (view === 'month') setCurrentDate(d => subMonths(d, 1));
    else if (view === 'week') setCurrentDate(d => subWeeks(d, 1));
    else setCurrentDate(d => addDays(d, -1));
  };
  const next = () => {
    if (view === 'month') setCurrentDate(d => addMonths(d, 1));
    else if (view === 'week') setCurrentDate(d => addWeeks(d, 1));
    else setCurrentDate(d => addDays(d, 1));
  };
  const goToday = () => { setCurrentDate(new Date()); setSelectedDay(new Date()); };

  // ── title ──────────────────────────────────────────────────────────────────
  const title = () => {
    if (view === 'month') return format(currentDate, 'MMMM yyyy');
    if (view === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      const we = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'EEEE, MMMM d, yyyy');
  };

  // ── month grid ─────────────────────────────────────────────────────────────
  const MonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd   = endOfMonth(currentDate);
    const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd    = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let d = gridStart;
    while (d <= gridEnd) { days.push(d); d = addDays(d, 1); }

    return (
      <div className="flex-1 overflow-auto">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b theme-divider">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => (
            <div key={day} className="py-2 text-center text-xs font-semibold theme-text-muted uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 flex-1">
          {days.map((day, idx) => {
            const dayBookings = bookingsOnDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const isTodayDate = isToday(day);

            return (
              <div key={idx}
                onClick={() => { setSelectedDay(day); if (view !== 'month') return; }}
                className={`min-h-[100px] p-2 border-b border-r theme-divider cursor-pointer transition-all
                  ${!isCurrentMonth ? 'opacity-40' : ''}
                  ${isSelected ? 'bg-primary-500/10' : 'hover:bg-primary-500/5'}`}>
                {/* Date number */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold mb-1 transition-all
                  ${isTodayDate ? 'bg-primary-500 text-white' : isSelected ? 'bg-primary-100 text-primary-700' : 'theme-text'}`}>
                  {format(day, 'd')}
                </div>

                {/* Booking pills */}
                <div className="space-y-0.5">
                  {dayBookings.slice(0, 3).map(b => {
                    const sc = STATUS_COLOR[b.status] || STATUS_COLOR.REQUEST;
                    return (
                      <div key={b.id}
                        onClick={e => { e.stopPropagation(); setSelectedBooking(b); setSelectedDay(day); }}
                        className={`${sc.bg} ${sc.text} text-xs px-1.5 py-0.5 rounded-md truncate cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sc.dot}`}/>
                        <span className="truncate">{format(parseISO(b.slotTime), 'h:mm a')} {b.service.name}</span>
                      </div>
                    );
                  })}
                  {dayBookings.length > 3 && (
                    <div className="text-xs theme-text-muted px-1">+{dayBookings.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── week view ──────────────────────────────────────────────────────────────
  const WeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="flex-1 overflow-auto">
        {/* Header row */}
        <div className="grid grid-cols-8 border-b theme-divider sticky top-0 theme-bg-card z-10">
          <div className="py-3 px-2 text-xs theme-text-faint text-right">GMT+5:30</div>
          {weekDays.map(day => (
            <div key={day.toISOString()} className="py-3 text-center border-l theme-divider">
              <div className="text-xs theme-text-muted uppercase">{format(day, 'EEE')}</div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mt-1 text-sm font-bold
                ${isToday(day) ? 'bg-primary-500 text-white' : 'theme-text'}`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="grid grid-cols-8">
          {/* Hour labels */}
          <div>
            {HOURS.map(h => (
              <div key={h} className="h-14 flex items-start justify-end pr-2 pt-1">
                <span className="text-xs theme-text-faint">{h === 0 ? '' : `${h}:00`}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map(day => {
            const dayBookings = bookingsOnDay(day);
            return (
              <div key={day.toISOString()} className="border-l theme-divider relative">
                {HOURS.map(h => (
                  <div key={h} className={`h-14 border-b theme-divider ${h % 2 === 0 ? '' : 'border-dashed opacity-50'}`}/>
                ))}
                {/* Booking blocks */}
                {dayBookings.map(b => {
                  const dt = parseISO(b.slotTime);
                  const topPct = ((getHours(dt) * 60 + getMinutes(dt)) / (24 * 60)) * 100;
                  const heightPct = (b.service.duration / (24 * 60)) * 100;
                  const sc = STATUS_COLOR[b.status] || STATUS_COLOR.REQUEST;
                  return (
                    <div key={b.id}
                      onClick={() => { setSelectedBooking(b); setSelectedDay(day); }}
                      style={{ top: `${topPct}%`, height: `${Math.max(heightPct, 2.5)}%` }}
                      className={`absolute left-0.5 right-0.5 ${sc.bg} ${sc.text} rounded-lg px-1.5 py-1 text-xs cursor-pointer hover:opacity-90 transition-opacity overflow-hidden z-10 border-l-2 border-primary-500`}>
                      <div className="font-semibold truncate">{format(dt, 'h:mm a')}</div>
                      <div className="truncate opacity-80">{b.service.name}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── day view ───────────────────────────────────────────────────────────────
  const DayView = () => {
    const dayBookings = bookingsOnDay(currentDate).sort(
      (a, b) => parseISO(a.slotTime).getTime() - parseISO(b.slotTime).getTime()
    );

    return (
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-[80px_1fr]">
          {/* Time column */}
          <div>
            {HOURS.map(h => (
              <div key={h} className="h-16 flex items-start justify-end pr-3 pt-1">
                <span className="text-xs theme-text-faint">{h === 0 ? '' : `${h}:00`}</span>
              </div>
            ))}
          </div>

          {/* Events column */}
          <div className="border-l theme-divider relative">
            {HOURS.map(h => (
              <div key={h} className={`h-16 border-b theme-divider ${h % 2 !== 0 ? 'border-dashed opacity-50' : ''}`}/>
            ))}
            {/* Current time indicator */}
            {isToday(currentDate) && (() => {
              const now = new Date();
              const pct = ((getHours(now) * 60 + getMinutes(now)) / (24 * 60)) * 100;
              return (
                <div style={{ top: `${pct}%` }} className="absolute left-0 right-0 z-20 flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 flex-shrink-0"/>
                  <div className="flex-1 h-0.5 bg-red-500"/>
                </div>
              );
            })()}
            {/* Booking blocks */}
            {dayBookings.map(b => {
              const dt = parseISO(b.slotTime);
              const topPct = ((getHours(dt) * 60 + getMinutes(dt)) / (24 * 60)) * 100;
              const heightPct = (b.service.duration / (24 * 60)) * 100;
              const sc = STATUS_COLOR[b.status] || STATUS_COLOR.REQUEST;
              return (
                <div key={b.id}
                  onClick={() => setSelectedBooking(b)}
                  style={{ top: `${topPct}%`, height: `${Math.max(heightPct, 3)}%` }}
                  className={`absolute left-2 right-2 ${sc.bg} ${sc.text} rounded-xl px-3 py-2 text-sm cursor-pointer hover:opacity-90 transition-all z-10 border-l-4 border-primary-500 shadow-sm`}>
                  <div className="font-bold">{format(dt, 'h:mm a')} — {b.service.name}</div>
                  <div className="text-xs opacity-75 mt-0.5">{b.customerName} · {b.service.duration} min · {rupee(b.service.price)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* No bookings */}
        {dayBookings.length === 0 && (
          <div className="text-center py-16 theme-text-muted">
            <div className="text-5xl mb-3">📅</div>
            <p className="font-medium">No bookings on {format(currentDate, 'MMMM d')}</p>
          </div>
        )}
      </div>
    );
  };

  // ── booking detail panel ───────────────────────────────────────────────────
  const BookingPanel = () => {
    if (!selectedBooking) return null;
    const sc = STATUS_COLOR[selectedBooking.status] || STATUS_COLOR.REQUEST;
    const dt = parseISO(selectedBooking.slotTime);

    const handleStatusChange = async (status: string) => {
      try {
        await api.updateBookingStatus(selectedBooking.id, status);
        setSelectedBooking(null);
        loadBookings();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed');
      }
    };

    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        onClick={() => setSelectedBooking(null)}>
        <div className="theme-card rounded-2xl shadow-2xl w-full max-w-md animate-scale-in"
          onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b theme-divider">
            <div>
              <h3 className="font-bold theme-text text-lg">{selectedBooking.service.name}</h3>
              <p className="text-sm theme-text-muted">{format(dt, 'EEEE, MMMM d, yyyy')}</p>
            </div>
            <button onClick={() => setSelectedBooking(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors theme-text-muted">
              ✕
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${sc.bg} ${sc.text}`}>
                <span className={`w-2 h-2 rounded-full ${sc.dot}`}/>
                {selectedBooking.status === 'REQUEST' ? 'Pending' : selectedBooking.status === 'BOOKED' ? 'Confirmed' : 'Cancelled'}
              </span>
            </div>

            {/* Details */}
            <div className="space-y-2.5">
              {[
                { icon: '🕐', label: 'Time', value: `${format(dt, 'h:mm a')} (${selectedBooking.service.duration} min)` },
                { icon: '💰', label: 'Price', value: rupee(selectedBooking.service.price) },
                { icon: '🏥', label: 'Resource', value: selectedBooking.resource.name },
                { icon: '👤', label: 'Customer', value: selectedBooking.customerName },
                { icon: '📧', label: 'Email', value: selectedBooking.customerEmail },
                { icon: '📞', label: 'Phone', value: selectedBooking.customerPhone },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="text-lg w-6 flex-shrink-0">{icon}</span>
                  <div>
                    <p className="text-xs theme-text-faint">{label}</p>
                    <p className="text-sm font-medium theme-text">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions for organiser */}
            {user?.role === 'ORGANISER' && selectedBooking.status === 'REQUEST' && (
              <div className="flex gap-3 pt-2">
                <button onClick={() => handleStatusChange('BOOKED')}
                  className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors">
                  ✓ Confirm
                </button>
                <button onClick={() => handleStatusChange('CANCELLED')}
                  className="flex-1 py-2.5 bg-red-100 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-200 transition-colors">
                  ✕ Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── selected day sidebar (month view) ─────────────────────────────────────
  const DaySidebar = () => {
    if (!selectedDay || view !== 'month') return null;
    const dayBookings = bookingsOnDay(selectedDay).sort(
      (a, b) => parseISO(a.slotTime).getTime() - parseISO(b.slotTime).getTime()
    );

    return (
      <div className="w-72 flex-shrink-0 border-l theme-divider overflow-y-auto">
        <div className="p-4 border-b theme-divider">
          <p className="text-xs theme-text-faint uppercase tracking-wide">Selected</p>
          <p className="font-bold theme-text text-lg">{format(selectedDay, 'EEEE, MMMM d')}</p>
          <p className="text-sm theme-text-muted">{dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="p-3 space-y-2">
          {dayBookings.length === 0 ? (
            <div className="text-center py-8 theme-text-muted">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-sm">No bookings</p>
            </div>
          ) : dayBookings.map(b => {
            const sc = STATUS_COLOR[b.status] || STATUS_COLOR.REQUEST;
            return (
              <div key={b.id} onClick={() => setSelectedBooking(b)}
                className={`${sc.bg} rounded-xl p-3 cursor-pointer hover:opacity-90 transition-opacity`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`}/>
                  <span className={`text-xs font-bold ${sc.text}`}>{format(parseISO(b.slotTime), 'h:mm a')}</span>
                </div>
                <p className={`text-sm font-semibold ${sc.text}`}>{b.service.name}</p>
                <p className={`text-xs ${sc.text} opacity-75`}>{b.customerName}</p>
                <p className={`text-xs ${sc.text} opacity-75`}>{rupee(b.service.price)}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen theme-bg-page flex flex-col">
      <Navbar links={navLinks} />

      {/* Booking detail modal */}
      <BookingPanel />

      <div className="flex-1 flex flex-col max-w-screen-xl mx-auto w-full px-8 py-6">
        {/* ── Toolbar ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5 animate-fade-slide-up">
          <div className="flex items-center gap-3">
            <button onClick={goToday}
              className="px-4 py-2 theme-card rounded-xl text-sm font-semibold theme-text hover:bg-primary-500/10 transition-all">
              Today
            </button>
            <div className="flex items-center gap-1">
              <button onClick={prev}
                className="w-9 h-9 theme-card rounded-xl flex items-center justify-center theme-text-muted hover:text-primary-500 hover:bg-primary-500/10 transition-all">
                ‹
              </button>
              <button onClick={next}
                className="w-9 h-9 theme-card rounded-xl flex items-center justify-center theme-text-muted hover:text-primary-500 hover:bg-primary-500/10 transition-all">
                ›
              </button>
            </div>
            <h2 className="text-xl font-bold theme-text">{title()}</h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Stats */}
            {!loading && (
              <div className="hidden md:flex items-center gap-4 mr-2">
                {Object.entries(STATUS_COLOR).map(([status, sc]) => {
                  const count = bookings.filter(b => b.status === status).length;
                  return (
                    <div key={status} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${sc.dot}`}/>
                      <span className="text-xs theme-text-muted">{count} {status.toLowerCase()}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* View switcher */}
            <div className="flex gap-1 theme-bg-tab p-1 rounded-xl">
              {(['month', 'week', 'day'] as ViewMode[]).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize
                    ${view === v ? 'bg-white theme-text shadow-sm' : 'theme-text-muted hover:theme-text'}`}>
                  {v}
                </button>
              ))}
            </div>

            <button onClick={loadBookings}
              className="w-9 h-9 theme-card rounded-xl flex items-center justify-center theme-text-muted hover:text-primary-500 transition-all text-lg"
              title="Refresh">
              ↻
            </button>
          </div>
        </div>

        {/* ── Calendar body ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex-1 theme-card rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
              <p className="theme-text-muted text-sm">Loading bookings...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 theme-card rounded-2xl overflow-hidden flex animate-fade-slide-up delay-75">
            {view === 'month' && <MonthView />}
            {view === 'week'  && <WeekView />}
            {view === 'day'   && <DayView />}
            {view === 'month' && <DaySidebar />}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;
