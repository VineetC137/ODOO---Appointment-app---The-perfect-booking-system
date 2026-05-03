import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, startOfToday } from 'date-fns';
import type { Booking, AvailabilitySlot } from '../types';
import { BookingStatus } from '../types';
import api from '../services/api';
import Navbar from '../components/common/Navbar';

const rupee = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  REQUEST:   { label: 'Pending',   color: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-400' },
  BOOKED:    { label: 'Confirmed', color: 'bg-green-50 text-green-700 border-green-200',   dot: 'bg-green-400' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-50 text-red-600 border-red-200',         dot: 'bg-red-400' },
};

interface RescheduleModalProps {
  booking: Booking;
  onClose: () => void;
  onSuccess: () => void;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({ booking, onClose, onSuccess }) => {
  const today = startOfToday();
  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => { fetchSlots(); }, [selectedDate]);

  const fetchSlots = async () => {
    setSlotsLoading(true);
    try {
      setSlots(await api.getAvailableSlots(booking.resourceId, format(selectedDate, 'yyyy-MM-dd')));
    } catch { setSlots([]); }
    finally { setSlotsLoading(false); }
  };

  const handleReschedule = async () => {
    if (!selectedSlot) return;
    setSubmitting(true); setError('');
    try {
      await api.rescheduleBooking(booking.id, selectedSlot);
      setSuccess(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to reschedule');
    } finally { setSubmitting(false); }
  };

  const availableSlots = slots.filter(s => s.available);
  const unavailableSlots = slots.filter(s => !s.available);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="flex items-center justify-between p-5 border-b theme-divider">
          <div>
            <h3 className="font-bold text-gray-900">Reschedule Appointment</h3>
            <p className="text-sm text-gray-500 mt-0.5">{booking.service.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {/* Current booking info */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Current Appointment</p>
            <p className="font-semibold text-amber-900">{format(new Date(booking.slotTime), 'EEEE, MMMM d, yyyy')}</p>
            <p className="text-sm text-amber-700">{format(new Date(booking.slotTime), 'h:mm a')} · {booking.service.duration} min</p>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-bold text-gray-900">Rescheduled successfully!</p>
            </div>
          ) : (
            <>
              {/* Date picker */}
              <div className="mb-5">
                <p className="text-sm font-medium text-gray-700 mb-3">Select new date</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {dates.map(date => {
                    const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                    const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                    return (
                      <button key={date.toISOString()} onClick={() => { setSelectedDate(date); setSelectedSlot(''); }}
                        className={`flex-shrink-0 w-14 py-2.5 rounded-xl text-center transition-all border
                          ${isSelected ? 'bg-primary-500 text-white border-primary-500 shadow-md' : 'bg-white border-gray-200 hover:border-primary-300 hover:bg-primary-50'}`}>
                        <div className={`text-xs font-medium ${isSelected ? 'text-primary-100' : 'text-gray-400'}`}>{format(date, 'EEE')}</div>
                        <div className={`text-base font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>{format(date, 'd')}</div>
                        <div className={`text-xs ${isSelected ? 'text-primary-100' : 'text-gray-400'}`}>{format(date, 'MMM')}</div>
                        {isToday && !isSelected && <div className="w-1 h-1 bg-primary-400 rounded-full mx-auto mt-0.5"/>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              <div className="mb-5">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Available times — {format(selectedDate, 'EEEE, MMMM d')}
                </p>
                {slotsLoading ? (
                  <div className="grid grid-cols-3 gap-2">
                    {[1,2,3,4,5,6].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"/>)}
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">
                    <div className="text-3xl mb-2">📅</div>
                    <p className="text-sm font-medium">No slots available on this day</p>
                  </div>
                ) : (
                  <>
                    {availableSlots.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {availableSlots.map(slot => (
                          <button key={slot.time}
                            onClick={() => setSelectedSlot(slot.time)}
                            className={`py-2.5 px-2 rounded-xl border-2 text-center transition-all
                              ${selectedSlot === slot.time
                                ? 'bg-primary-500 text-white border-primary-500 shadow-md'
                                : 'border-primary-200 bg-primary-50 hover:bg-primary-500 hover:text-white hover:border-primary-500'}`}>
                            <div className={`font-bold text-sm ${selectedSlot === slot.time ? 'text-white' : 'text-primary-700'}`}>
                              {format(new Date(slot.time), 'h:mm a')}
                            </div>
                            <div className={`text-xs mt-0.5 ${selectedSlot === slot.time ? 'text-primary-100' : 'text-primary-400'}`}>
                              {slot.remainingCapacity} left
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {unavailableSlots.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 mb-2">Fully booked</p>
                        <div className="grid grid-cols-3 gap-2">
                          {unavailableSlots.map(slot => (
                            <div key={slot.time} className="py-2.5 px-2 rounded-xl border border-gray-100 bg-gray-50 text-center opacity-50">
                              <div className="font-medium text-sm text-gray-400">{format(new Date(slot.time), 'h:mm a')}</div>
                              <div className="text-xs text-gray-300 mt-0.5">Full</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {selectedSlot && (
                <div className="mb-4 p-3 bg-primary-50 border border-primary-100 rounded-xl text-sm">
                  <span className="text-primary-700 font-medium">New time: </span>
                  <span className="text-primary-900 font-bold">
                    {format(new Date(selectedSlot), 'EEEE, MMMM d')} at {format(new Date(selectedSlot), 'h:mm a')}
                  </span>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">⚠ {error}</div>
              )}

              <div className="flex gap-3">
                <button onClick={onClose}
                  className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm theme-bg-row-hover transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleReschedule}
                  disabled={!selectedSlot || submitting}
                  className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl font-semibold text-sm hover:bg-primary-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Rescheduling...' : 'Confirm Reschedule'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const navigate = useNavigate();

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setBookings(await api.getBookings());
    } catch { /* handled */ }
    finally { setLoading(false); }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this booking?')) return;
    try { await api.cancelBooking(id); fetchBookings(); }
    catch (err: any) { alert(err.response?.data?.error || 'Failed to cancel'); }
  };

  const now = new Date();
  const upcoming = bookings.filter(b => new Date(b.slotTime) > now && b.status !== BookingStatus.CANCELLED);
  const past = bookings.filter(b => new Date(b.slotTime) <= now || b.status === BookingStatus.CANCELLED);
  const shown = activeTab === 'upcoming' ? upcoming : past;

  return (
    <div className="min-h-screen theme-bg-page">
      <Navbar links={[{ label: 'Browse Services', to: '/services' }, { label: '📅 Calendar', to: '/calendar' }]} />

      {rescheduleBooking && (
        <RescheduleModal
          booking={rescheduleBooking}
          onClose={() => setRescheduleBooking(null)}
          onSuccess={fetchBookings}
        />
      )}

      <div className="max-w-screen-xl mx-auto px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your bookings</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 theme-bg-tab p-1 rounded-xl mb-6 w-fit">
          {(['upcoming', 'past'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize
                ${activeTab === tab ? 'theme-bg-tab-active theme-text shadow-sm' : 'theme-text-muted hover:theme-text'}`}>
              {tab} {tab === 'upcoming' ? `(${upcoming.length})` : `(${past.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2].map(i => <div key={i} className="theme-card rounded-2xl p-6 animate-pulse h-32"/>)}
          </div>
        ) : shown.length === 0 ? (
          <div className="theme-card rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">{activeTab === 'upcoming' ? '📅' : '📋'}</div>
            <p className="font-semibold theme-text-secondary mb-1">No {activeTab} appointments</p>
            {activeTab === 'upcoming' && (
              <button onClick={() => navigate('/services')}
                className="mt-4 px-5 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors">
                Browse Services
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {shown.map((booking, idx) => {
              const cfg = statusConfig[booking.status] || statusConfig.REQUEST;
              const isPast = new Date(booking.slotTime) <= now;
              const canReschedule = !isPast && (booking.status === BookingStatus.REQUEST || booking.status === BookingStatus.BOOKED);
              return (
                <div key={booking.id} style={{ animationDelay: `${idx * 80}ms` }}
                  className={`animate-fade-slide-up theme-card rounded-2xl p-5 transition-all ${isPast ? 'opacity-70' : 'card-hover'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-gray-900">{booking.service.name}</h4>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>
                          {cfg.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {format(new Date(booking.slotTime), 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {format(new Date(booking.slotTime), 'h:mm a')} · {booking.service.duration} min
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {booking.resource.name}
                        </div>
                        <div className="flex items-center gap-1.5 font-semibold text-primary-600">
                          {rupee(booking.service.price)}
                        </div>
                      </div>
                    </div>

                    {!isPast && booking.status !== BookingStatus.CANCELLED && (
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {canReschedule && (
                          <button
                            onClick={() => setRescheduleBooking(booking)}
                            className="px-3 py-1.5 text-xs font-semibold text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
                          >
                            Reschedule
                          </button>
                        )}
                        <button onClick={() => handleCancel(booking.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
export default MyBookingsPage;
