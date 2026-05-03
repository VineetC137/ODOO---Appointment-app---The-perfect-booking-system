import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Service, Booking } from '../types';
import api from '../services/api';
import Navbar from '../components/common/Navbar';

const rupee = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const statusColors: Record<string, string> = {
  REQUEST: 'bg-amber-100 text-amber-700 border border-amber-200',
  BOOKED: 'bg-green-100 text-green-700 border border-green-200',
  CANCELLED: 'bg-red-100 text-red-700 border border-red-200',
};

const typeIcons: Record<string, string> = { STAFF: '👨‍⚕️', ROOM: '🏥', EQUIPMENT: '🔧' };

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const SkeletonCard: React.FC = () => (
  <div className="theme-card rounded-2xl p-5">
    <div className="skeleton h-10 w-10 rounded-xl mb-3" />
    <div className="skeleton h-4 w-2/3 mb-2" />
    <div className="skeleton h-3 w-full mb-1" />
    <div className="skeleton h-3 w-1/2" />
  </div>
);

const EmptyState: React.FC<{ query: string }> = ({ query }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-20 animate-fade-slide-up">
    <div className="text-7xl mb-4 animate-float">🔍</div>
    <h3 className="text-xl font-bold theme-text mb-2">No results for "{query}"</h3>
    <p className="theme-text-muted text-sm">Try a different keyword or browse all services</p>
  </div>
);

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const navigate = useNavigate();

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setServices([]);
      setBookings([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const [svcResult, bkgResult] = await Promise.all([
        api.getServices({ search: q }),
        api.getBookings(),
      ]);
      setServices(svcResult || []);
      const lower = q.toLowerCase();
      setBookings(
        (bkgResult || []).filter(
          (b: Booking) =>
            b.service?.name?.toLowerCase().includes(lower) ||
            b.customerName?.toLowerCase().includes(lower)
        )
      );
    } catch {
      setServices([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    doSearch(debouncedQuery);
  }, [debouncedQuery, doSearch]);

  const hasResults = services.length > 0 || bookings.length > 0;

  return (
    <div className="min-h-screen theme-bg-page">
      <Navbar
        links={[
          { label: 'Services', to: '/services' },
          { label: 'My Bookings', to: '/my-bookings' },
          { label: '💳 Payments', to: '/payments' },
          { label: '📅 Calendar', to: '/calendar' },
        ]}
      />

      <div className="max-w-screen-xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-8 animate-fade-slide-up">
          <h1 className="text-3xl font-bold theme-text mb-1">Search</h1>
          <p className="theme-text-muted text-sm">Find services and bookings instantly</p>
        </div>

        {/* Search input */}
        <div className="relative max-w-2xl mb-10 animate-fade-slide-up delay-75">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search services, bookings, customers…"
            className="theme-input w-full pl-12 pr-12 py-4 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-primary-400 shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full theme-bg-muted flex items-center justify-center theme-text-muted hover:text-red-500 transition-colors text-sm"
            >
              ✕
            </button>
          )}
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-8">
            <div>
              <div className="skeleton h-5 w-32 mb-4 rounded-lg" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
              </div>
            </div>
            <div>
              <div className="skeleton h-5 w-28 mb-4 rounded-lg" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2].map(i => <SkeletonCard key={i} />)}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && searched && (
          <>
            {!hasResults ? (
              <div className="grid">
                <EmptyState query={debouncedQuery} />
              </div>
            ) : (
              <div className="space-y-10">
                {/* Services section */}
                <section>
                  <div className="flex items-center gap-3 mb-5">
                    <h2 className="text-lg font-bold theme-text">Services</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-500/10 text-primary-600">
                      {services.length}
                    </span>
                  </div>
                  {services.length === 0 ? (
                    <p className="theme-text-muted text-sm py-4">No services found.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {services.map((svc, idx) => (
                        <div
                          key={svc.id}
                          onClick={() => navigate(`/booking/${svc.id}`)}
                          style={{ animationDelay: `${idx * 60}ms` }}
                          className="animate-fade-slide-up theme-card rounded-2xl p-5 cursor-pointer card-hover hover:border-primary-300 group"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center text-xl">
                              {typeIcons[svc.serviceResources?.[0]?.resource?.type || 'STAFF'] || '📋'}
                            </div>
                            <span className="text-lg font-bold text-primary-600">{rupee(svc.price)}</span>
                          </div>
                          <h3 className="font-bold theme-text mb-1 group-hover:text-primary-600 transition-colors">
                            {svc.name}
                          </h3>
                          <p className="text-xs theme-text-muted line-clamp-2 mb-3">
                            {svc.description || 'Professional service available for booking'}
                          </p>
                          <div className="flex items-center justify-between pt-3 border-t theme-divider">
                            <span className="text-xs theme-text-muted flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {svc.duration} min
                            </span>
                            <span className="text-xs font-semibold text-primary-500 group-hover:underline">
                              Book →
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Bookings section */}
                <section>
                  <div className="flex items-center gap-3 mb-5">
                    <h2 className="text-lg font-bold theme-text">Bookings</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-500/10 text-primary-600">
                      {bookings.length}
                    </span>
                  </div>
                  {bookings.length === 0 ? (
                    <p className="theme-text-muted text-sm py-4">No bookings found.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {bookings.map((bkg, idx) => (
                        <div
                          key={bkg.id}
                          style={{ animationDelay: `${idx * 60}ms` }}
                          className="animate-fade-slide-up theme-card rounded-2xl p-5 card-hover"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-bold theme-text">{bkg.service?.name}</h3>
                              <p className="text-xs theme-text-muted mt-0.5">{bkg.customerName}</p>
                            </div>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[bkg.status]}`}>
                              {bkg.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs theme-text-muted pt-3 border-t theme-divider">
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
                            <span className="ml-auto font-semibold text-primary-600">
                              {rupee(bkg.service?.price ?? 0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </>
        )}

        {/* Idle state */}
        {!loading && !searched && (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-slide-up delay-150">
            <div className="text-7xl mb-5 animate-float">✨</div>
            <h3 className="text-xl font-bold theme-text mb-2">Start searching</h3>
            <p className="theme-text-muted text-sm">Type above to search across services and bookings</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
