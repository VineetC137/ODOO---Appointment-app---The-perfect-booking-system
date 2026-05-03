import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { serviceAPI, resourceAPI, availabilityAPI, bookingAPI } from '../services/api';
import { Service, TimeSlot } from '../types';

const next7Days = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return d.toISOString().split('T')[0];
});

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const BookingPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();

  const [service, setService] = useState<Service | null>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [resourceId, setResourceId] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slot, setSlot] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [pageLoading, setPageLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    Promise.all([serviceAPI.getById(serviceId!), resourceAPI.getAll()])
      .then(([svc, res]) => {
        setService(svc);
        setResources(res);
        if (res.length) setResourceId(res[0].id);
      })
      .catch(() => setError('Failed to load page'))
      .finally(() => setPageLoading(false));
  }, [serviceId]);

  useEffect(() => {
    if (!date || !resourceId) return;
    setSlotsLoading(true);
    setSlot('');
    availabilityAPI.getSlots(resourceId, date)
      .then(d => setSlots(d.slots))
      .catch(() => setError('Failed to load slots'))
      .finally(() => setSlotsLoading(false));
  }, [date, resourceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await bookingAPI.create({
        serviceId: serviceId!,
        resourceId,
        slotTime: new Date(`${date}T${slot}:00`).toISOString(),
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
      });
      setDone(true);
      setTimeout(() => navigate('/bookings'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading) return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading…</div>;

  if (done) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card text-center max-w-sm w-full">
        <div className="text-3xl mb-3">✓</div>
        <h2 className="font-semibold text-slate-900 text-lg">Booking confirmed!</h2>
        <p className="text-sm text-slate-500 mt-1">Redirecting to your bookings…</p>
      </div>
    </div>
  );

  const availableSlots = slots.filter(s => s.available);

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <button onClick={() => navigate('/services')} className="btn-ghost text-sm px-2">
            ← Back
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Service summary */}
        {service && (
          <div className="card">
            <h2 className="font-semibold text-slate-900">{service.name}</h2>
            <p className="text-sm text-slate-500 mt-1">{service.description}</p>
            <div className="flex gap-4 mt-3 text-sm text-slate-600">
              <span>{service.duration} min</span>
              <span className="font-medium text-slate-800">${service.price.toFixed(2)}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Date & time */}
          <div className="card space-y-4">
            <h3 className="font-medium text-slate-900">Date & Time</h3>

            {resources.length > 1 && (
              <div>
                <label className="label">Location</label>
                <select
                  className="input"
                  value={resourceId}
                  onChange={e => setResourceId(e.target.value)}
                >
                  {resources.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="label">Date</label>
              <div className="flex flex-wrap gap-2">
                {next7Days.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDate(d)}
                    className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                      date === d
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {fmtDate(d)}
                  </button>
                ))}
              </div>
            </div>

            {date && (
              <div>
                <label className="label">Time</label>
                {slotsLoading && <p className="text-sm text-slate-400">Loading slots…</p>}
                {!slotsLoading && availableSlots.length === 0 && (
                  <p className="text-sm text-slate-400">No slots available for this date</p>
                )}
                {!slotsLoading && availableSlots.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {availableSlots.map(s => (
                      <button
                        key={s.time}
                        type="button"
                        onClick={() => setSlot(s.time)}
                        className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                          slot === s.time
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Customer details */}
          <div className="card space-y-4">
            <h3 className="font-medium text-slate-900">Your Details</h3>
            <div>
              <label className="label">Full Name</label>
              <input className="input" type="text" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={!date || !slot || !resourceId || submitting}
            className="btn-primary w-full py-2.5"
          >
            {submitting ? 'Confirming…' : 'Confirm Booking'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default BookingPage;
