import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, addDays, startOfToday } from 'date-fns';
import type { Service, AvailabilitySlot, CreateBookingRequest } from '../types';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const rupee = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

const STEPS = ['Select Time', 'Details', 'Payment', 'Confirmed'];

const BookingFlowPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [customerName, setCustomerName] = useState(`${user?.firstName || ''} ${user?.lastName || ''}`.trim());
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState('');

  // Payment state
  const [bookingId, setBookingId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => { if (serviceId) fetchService(); }, [serviceId]);
  useEffect(() => { if (service?.serviceResources?.length) fetchSlots(); }, [selectedDate, service]);

  const fetchService = async () => {
    try { setService(await api.getServiceById(serviceId!)); }
    catch { setError('Failed to load service'); }
  };

  const fetchSlots = async () => {
    if (!service?.serviceResources?.length) return;
    setSlotsLoading(true);
    try {
      const resourceId = service.serviceResources[0].resourceId;
      setSlots(await api.getAvailableSlots(resourceId, format(selectedDate, 'yyyy-MM-dd')));
    } catch { setSlots([]); }
    finally { setSlotsLoading(false); }
  };

  const handleBooking = async () => {
    if (!service?.serviceResources?.length) return;
    setLoading(true); setError('');
    try {
      const data: CreateBookingRequest = {
        serviceId: service.id,
        resourceId: service.serviceResources[0].resourceId,
        slotTime: selectedSlot, customerName, customerEmail, customerPhone, notes,
      };
      const booking = await api.createBooking(data);
      setBookingId(booking.id);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create booking');
    } finally { setLoading(false); }
  };

  const handlePayment = async () => {
    if (!service) return;
    setPaymentLoading(true); setPaymentError('');
    try {
      await api.processPayment(bookingId, service.price);
      setStep(4);
    } catch (err: any) {
      setPaymentError(err.response?.data?.error || err.message || 'Payment failed. Please try again.');
    } finally { setPaymentLoading(false); }
  };

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const today = startOfToday();
  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i));
  const availableSlots = slots.filter(s => s.available);
  const unavailableSlots = slots.filter(s => !s.available);

  if (!service) return (
    <div className="min-h-screen theme-bg-page">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
        <p className="theme-text-muted">Loading service...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen theme-bg-page">
      {/* Header */}
      <header className="theme-header sticky top-0 z-50 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/services')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">B</span>
              </div>
              <span className="font-bold theme-text">BookFlow</span>
            </div>
          </div>
          {/* Steps */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((label, i) => (
              <React.Fragment key={i}>
                <div className={`flex items-center gap-1 text-xs font-medium ${step > i + 1 ? 'text-primary-600' : step === i + 1 ? 'text-primary-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${step > i + 1 ? 'bg-primary-500 text-white' : step === i + 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {step > i + 1 ? '✓' : i + 1}
                  </div>
                  <span className="hidden sm:block">{label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`w-6 h-0.5 ${step > i + 1 ? 'bg-primary-400' : 'bg-gray-200'}`}/>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div className="h-full bg-primary-500 transition-all duration-500 ease-out"
          style={{ width: `${(step / STEPS.length) * 100}%` }}/>
      </div>

      <div className="max-w-screen-xl mx-auto px-8 py-8">
        <div className={`${step < 4 ? 'grid grid-cols-1 lg:grid-cols-3 gap-8' : ''}`}>

        {/* LEFT SIDEBAR — Service info (hidden on step 4) */}
        {step < 4 && (
          <div className="lg:col-span-1">
            <div className="theme-card rounded-2xl p-6 sticky top-24">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-3xl mb-4">📋</div>
              <h2 className="font-bold text-gray-900 text-xl mb-1">{service.name}</h2>
              <p className="text-sm text-gray-500 mb-5">{service.description}</p>
              <div className="space-y-3 pt-4 border-t theme-divider">
                <div className="flex justify-between text-sm">
                  <span className="theme-text-muted">Duration</span>
                  <span className="font-semibold text-gray-900">{service.duration} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="theme-text-muted">Price</span>
                  <span className="font-bold text-primary-600 text-lg">{rupee(service.price)}</span>
                </div>
                {selectedSlot && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="theme-text-muted">Date</span>
                      <span className="font-semibold text-gray-900">{format(new Date(selectedSlot), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="theme-text-muted">Time</span>
                      <span className="font-semibold text-gray-900">{format(new Date(selectedSlot), 'h:mm a')}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RIGHT COLUMN — Steps */}
        <div className={step < 4 ? 'lg:col-span-2' : 'col-span-full max-w-2xl mx-auto w-full'}>

        {/* Step 1 — Select Time */}
        {step === 1 && (
          <div className="theme-card rounded-2xl p-6 animate-slide-right">
            <h3 className="text-lg font-bold theme-text mb-5">Choose Date & Time</h3>

            {/* Date picker */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-600 mb-3">Select a date</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dates.map(date => {
                  const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                  const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                  return (
                    <button key={date.toISOString()} onClick={() => { setSelectedDate(date); setSelectedSlot(''); }}
                      className={`flex-shrink-0 w-16 py-3 rounded-xl text-center transition-all border
                        ${isSelected ? 'bg-primary-500 text-white border-primary-500 shadow-md' : 'bg-white border-gray-200 hover:border-primary-300 hover:bg-primary-50'}`}>
                      <div className={`text-xs font-medium ${isSelected ? 'text-primary-100' : 'text-gray-400'}`}>{format(date, 'EEE')}</div>
                      <div className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>{format(date, 'd')}</div>
                      <div className={`text-xs ${isSelected ? 'text-primary-100' : 'text-gray-400'}`}>{format(date, 'MMM')}</div>
                      {isToday && !isSelected && <div className="w-1 h-1 bg-primary-400 rounded-full mx-auto mt-1"/>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slots */}
            <div>
              <p className="text-sm font-medium text-gray-600 mb-3">
                Available times — {format(selectedDate, 'EEEE, MMMM d')}
              </p>
              {slotsLoading ? (
                <div className="grid grid-cols-4 gap-2">
                  {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse"/>)}
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <div className="text-4xl mb-2">📅</div>
                  <p className="font-medium">No slots available on this day</p>
                  <p className="text-sm">Try selecting a different date</p>
                </div>
              ) : (
                <>
                  {availableSlots.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                      {availableSlots.map(slot => (
                        <button key={slot.time} onClick={() => { setSelectedSlot(slot.time); setStep(2); }}
                          className="py-3 px-2 rounded-xl border-2 border-primary-200 bg-primary-50 hover:bg-primary-500 hover:text-white hover:border-primary-500 transition-all text-center group">
                          <div className="font-bold text-sm text-primary-700 group-hover:text-white">{format(new Date(slot.time), 'h:mm a')}</div>
                          <div className="text-xs text-primary-400 group-hover:text-primary-100 mt-0.5">{slot.remainingCapacity} left</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {unavailableSlots.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Fully booked</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {unavailableSlots.map(slot => (
                          <div key={slot.time} className="py-3 px-2 rounded-xl border border-gray-100 bg-gray-50 text-center opacity-50">
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
          </div>
        )}

        {/* Step 2 — Details */}
        {step === 2 && (
          <div className="theme-card rounded-2xl p-6 animate-slide-right">
            <h3 className="text-lg font-bold theme-text mb-5">Your Details</h3>

            {/* Selected slot banner */}
            <div className="mb-6 p-4 bg-primary-50 border border-primary-100 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-primary-800">{format(new Date(selectedSlot), 'EEEE, MMMM d, yyyy')}</p>
                <p className="text-sm text-primary-600">{format(new Date(selectedSlot), 'h:mm a')} · {service.duration} min · {rupee(service.price)}</p>
              </div>
              <button onClick={() => setStep(1)} className="ml-auto text-xs text-primary-500 hover:underline">Change</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1.5">Full Name *</label>
                <input value={customerName} onChange={e => setCustomerName(e.target.value)} required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1.5">Email *</label>
                <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1.5">Phone Number *</label>
                <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1.5">Notes (Optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                  placeholder="Any special requests..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none" />
              </div>
            </div>

            {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">⚠ {error}</div>}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm theme-bg-row-hover transition-colors">
                ← Back
              </button>
              <button onClick={handleBooking} disabled={loading || !customerName || !customerEmail || !customerPhone}
                className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-semibold text-sm hover:bg-primary-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Processing...' : 'Continue to Payment →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Payment */}
        {step === 3 && (
          <div className="theme-card rounded-2xl p-6 animate-slide-right">
            <h3 className="text-lg font-bold theme-text mb-5">Payment</h3>

            {/* Booking summary */}
            <div className="theme-bg-muted rounded-2xl p-5 mb-6 space-y-3">
              <h4 className="font-semibold text-gray-800 text-sm mb-3">Booking Summary</h4>
              {[
                { label: 'Service', value: service.name },
                { label: 'Date', value: format(new Date(selectedSlot), 'EEEE, MMMM d, yyyy') },
                { label: 'Time', value: format(new Date(selectedSlot), 'h:mm a') },
                { label: 'Duration', value: `${service.duration} minutes` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="theme-text-muted">{label}</span>
                  <span className="font-medium text-gray-900">{value}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-bold theme-text">Total</span>
                <span className="font-bold text-primary-600 text-lg">{rupee(service.price)}</span>
              </div>
            </div>

            {/* Mock payment form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-1.5">Card Number</label>
                <input
                  value={cardNumber}
                  onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 font-mono tracking-wider"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium theme-text-secondary mb-1.5">Expiry Date</label>
                  <input
                    value={cardExpiry}
                    onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium theme-text-secondary mb-1.5">CVV</label>
                  <input
                    value={cardCvv}
                    onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    placeholder="123"
                    maxLength={3}
                    type="password"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              This is a demo — no real payment is processed. Use any card details.
            </div>

            {paymentError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                ⚠ {paymentError}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setStep(2); setPaymentError(''); }}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm theme-bg-row-hover transition-colors">
                ← Back
              </button>
              <button
                onClick={handlePayment}
                disabled={paymentLoading}
                className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-semibold text-sm hover:bg-primary-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {paymentLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                    Processing...
                  </>
                ) : (
                  `Pay ${rupee(service.price)}`
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Confirmed */}
        {step === 4 && (
          <div className="theme-card rounded-2xl p-8 text-center animate-scale-in">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 animate-float">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold theme-text mb-2 animate-fade-slide-up">Booking Confirmed! 🎉</h3>
            <p className="text-gray-500 mb-8 animate-fade-slide-up delay-75">Your appointment has been successfully booked and payment processed.</p>

            <div className="theme-bg-muted rounded-2xl p-5 text-left mb-8 space-y-3">
              {[
                { label: 'Service', value: service.name },
                { label: 'Date', value: format(new Date(selectedSlot), 'EEEE, MMMM d, yyyy') },
                { label: 'Time', value: format(new Date(selectedSlot), 'h:mm a') },
                { label: 'Duration', value: `${service.duration} minutes` },
                { label: 'Amount Paid', value: rupee(service.price) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="theme-text-muted">{label}</span>
                  <span className="font-semibold text-gray-900">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => navigate('/my-bookings')}
                className="flex-1 py-3 border-2 border-primary-500 text-primary-600 rounded-xl font-semibold text-sm hover:bg-primary-50 transition-colors">
                View My Bookings
              </button>
              <button onClick={() => navigate('/services')}
                className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-semibold text-sm hover:bg-primary-600 transition-colors shadow-sm">
                Book Another
              </button>
            </div>
          </div>
        )}
        </div>{/* end right column */}
        </div>{/* end grid */}
      </div>
    </div>
  );
};
export default BookingFlowPage;
