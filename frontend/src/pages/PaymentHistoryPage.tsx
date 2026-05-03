import React, { useState, useEffect } from 'react';
import type { Booking } from '../types';
import api from '../services/api';
import Navbar from '../components/common/Navbar';

const rupee = (n: number) => `₹${n.toLocaleString('en-IN')}`;

type PaymentStatus = 'completed' | 'pending' | 'failed';
type FilterTab = 'all' | PaymentStatus;

// Derive a mock payment status from booking status
function paymentStatus(b: Booking): PaymentStatus {
  if (b.status === 'BOOKED') return 'completed';
  if (b.status === 'CANCELLED') return 'failed';
  return 'pending';
}

const statusStyles: Record<PaymentStatus, string> = {
  completed: 'bg-green-100 text-green-700 border border-green-200',
  pending: 'bg-amber-100 text-amber-700 border border-amber-200',
  failed: 'bg-red-100 text-red-700 border border-red-200',
};

const statusLabels: Record<PaymentStatus, string> = {
  completed: '✓ Completed',
  pending: '⏳ Pending',
  failed: '✕ Failed',
};

function formatCard(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'pending', label: 'Pending' },
  { key: 'failed', label: 'Failed' },
];

const PaymentHistoryPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  // Demo payment form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [payAmount, setPayAmount] = useState('500');
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  useEffect(() => {
    api.getBookings()
      .then(data => setBookings(data || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = bookings.filter(b =>
    activeTab === 'all' ? true : paymentStatus(b) === activeTab
  );

  const totalSpent = bookings
    .filter(b => paymentStatus(b) === 'completed')
    .reduce((sum, b) => sum + (b.service?.price ?? 0), 0);

  const successCount = bookings.filter(b => paymentStatus(b) === 'completed').length;
  const pendingCount = bookings.filter(b => paymentStatus(b) === 'pending').length;

  const handleDemoPay = async () => {
    setPaying(true);
    setPaySuccess(false);
    await new Promise(r => setTimeout(r, 2000));
    setPaying(false);
    setPaySuccess(true);
    setTimeout(() => setPaySuccess(false), 3000);
  };

  return (
    <div className="min-h-screen theme-bg-page">
      <Navbar
        links={[
          { label: 'Services', to: '/services' },
          { label: 'My Bookings', to: '/my-bookings' },
          { label: '🔍 Search', to: '/search' },
          { label: '📅 Calendar', to: '/calendar' },
        ]}
      />

      <div className="max-w-screen-xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-8 animate-fade-slide-up">
          <h1 className="text-3xl font-bold theme-text mb-1">Payment History</h1>
          <p className="theme-text-muted text-sm">Track all your transactions and payments</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8 animate-fade-slide-up delay-75">
          <div className="theme-card rounded-2xl p-5">
            <p className="text-xs theme-text-muted mb-1 font-medium uppercase tracking-wide">Total Spent</p>
            <p className="text-2xl font-bold text-primary-600">{rupee(totalSpent)}</p>
          </div>
          <div className="theme-card rounded-2xl p-5">
            <p className="text-xs theme-text-muted mb-1 font-medium uppercase tracking-wide">Successful</p>
            <p className="text-2xl font-bold text-green-600">{successCount}</p>
          </div>
          <div className="theme-card rounded-2xl p-5">
            <p className="text-xs theme-text-muted mb-1 font-medium uppercase tracking-wide">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 animate-fade-slide-up delay-150">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all
                ${activeTab === tab.key
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'theme-bg-tab theme-text-muted hover:text-primary-500'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Payment list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="theme-card rounded-2xl p-5">
                <div className="skeleton h-4 w-1/3 mb-3" />
                <div className="skeleton h-3 w-1/2 mb-2" />
                <div className="skeleton h-3 w-1/4" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-slide-up">
            <div className="text-6xl mb-4 animate-float">💳</div>
            <h3 className="text-lg font-bold theme-text mb-2">No payments found</h3>
            <p className="theme-text-muted text-sm">
              {activeTab === 'all' ? 'You have no payment history yet.' : `No ${activeTab} payments.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((bkg, idx) => {
              const ps = paymentStatus(bkg);
              const txnId = `TXN-${bkg.id.slice(-4).toUpperCase()}`;
              return (
                <div
                  key={bkg.id}
                  style={{ animationDelay: `${idx * 50}ms` }}
                  className="animate-fade-slide-up theme-card rounded-2xl p-5 card-hover"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold theme-text truncate">{bkg.service?.name}</h3>
                        <span className={`shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusStyles[ps]}`}>
                          {statusLabels[ps]}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs theme-text-muted">
                        <span>
                          {new Date(bkg.slotTime).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                        <span>
                          {new Date(bkg.slotTime).toLocaleTimeString('en-IN', {
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                        <span className="font-mono theme-text-faint">{txnId}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-lg font-bold text-primary-600">
                        {rupee(bkg.service?.price ?? 0)}
                      </span>
                      <button
                        onClick={() => alert('Receipt downloaded!')}
                        className="text-xs px-3 py-1.5 rounded-lg border theme-border theme-text-muted hover:text-primary-500 hover:border-primary-300 transition-all font-medium"
                      >
                        ⬇ Download Receipt
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Demo Payment Section */}
        <div className="mt-14 animate-fade-slide-up delay-300">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-xl font-bold theme-text">Demo Payment</h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 font-semibold">
              Sandbox
            </span>
          </div>

          {/* Info banner */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 text-sm mb-6">
            <span className="text-lg">ℹ️</span>
            <span>This is a demo — no real payment is processed. Use any test card details.</span>
          </div>

          <div className="theme-card rounded-2xl p-6 max-w-md">
            <div className="space-y-4">
              {/* Card number */}
              <div>
                <label className="block text-xs font-semibold theme-text-muted mb-1.5 uppercase tracking-wide">
                  Card Number
                </label>
                <input
                  value={cardNumber}
                  onChange={e => setCardNumber(formatCard(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="theme-input px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 font-mono"
                />
              </div>

              {/* Expiry + CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold theme-text-muted mb-1.5 uppercase tracking-wide">
                    Expiry (MM/YY)
                  </label>
                  <input
                    value={expiry}
                    onChange={e => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="theme-input px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold theme-text-muted mb-1.5 uppercase tracking-wide">
                    CVV
                  </label>
                  <input
                    value={cvv}
                    onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    placeholder="•••"
                    maxLength={3}
                    type="password"
                    className="theme-input px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 font-mono"
                  />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold theme-text-muted mb-1.5 uppercase tracking-wide">
                  Amount (₹)
                </label>
                <input
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value.replace(/\D/g, ''))}
                  placeholder="500"
                  className="theme-input px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>

              {/* Pay button */}
              <button
                onClick={handleDemoPay}
                disabled={paying || paySuccess}
                className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
                  ${paySuccess
                    ? 'bg-green-500 text-white'
                    : 'bg-primary-500 hover:bg-primary-600 text-white shadow-sm'
                  } disabled:opacity-70`}
              >
                {paying ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing…
                  </>
                ) : paySuccess ? (
                  <>✓ Payment Successful!</>
                ) : (
                  <>Pay {payAmount ? rupee(parseInt(payAmount, 10) || 0) : '₹0'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryPage;
