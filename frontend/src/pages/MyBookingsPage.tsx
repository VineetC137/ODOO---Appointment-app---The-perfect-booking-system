import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingAPI } from '../services/api';
import { Booking } from '../types';

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

const fmtTime = (s: string) =>
  new Date(s).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const statusStyle: Record<string, string> = {
  confirmed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
  completed: 'bg-slate-100 text-slate-600',
};

const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = () => {
    bookingAPI.getMyBookings()
      .then(setBookings)
      .catch(() => setError('Failed to load bookings'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const cancel = async (id: string) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await bookingAPI.cancel(id);
      load();
    } catch {
      alert('Could not cancel booking');
    }
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-semibold text-slate-900">My Bookings</span>
          <button onClick={() => navigate('/services')} className="btn-outline text-xs px-3 py-1.5">
            + New Booking
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {loading && <p className="text-sm text-slate-500">Loading…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && bookings.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-slate-500 text-sm">No bookings yet</p>
            <button onClick={() => navigate('/services')} className="btn-primary mt-4">
              Browse Services
            </button>
          </div>
        )}

        {!loading && bookings.length > 0 && (
          <div className="space-y-3">
            {bookings.map(b => (
              <div key={b.id} className="card flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900">{b.service.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[b.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {b.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {fmtDate(b.slotTime)} at {fmtTime(b.slotTime)}
                  </p>
                  <p className="text-sm text-slate-400">
                    {b.resource.name} · {b.service.duration} min · ${b.service.price.toFixed(2)}
                  </p>
                </div>

                {b.status === 'confirmed' && (
                  <button
                    onClick={() => cancel(b.id)}
                    className="text-xs text-red-500 hover:text-red-700 shrink-0 mt-0.5"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyBookingsPage;
