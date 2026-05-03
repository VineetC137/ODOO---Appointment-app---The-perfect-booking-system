import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Service } from '../types';
import api from '../services/api';
import Navbar from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';

const rupee = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

const DURATION_OPTIONS = [
  { label: 'Any duration', value: '' },
  { label: '30 min', value: '30' },
  { label: '45 min', value: '45' },
  { label: '60 min', value: '60' },
  { label: '90 min', value: '90' },
];

type SortKey = 'price-asc' | 'price-desc' | 'duration' | 'name';

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: 'Price (Low–High)', value: 'price-asc' },
  { label: 'Price (High–Low)', value: 'price-desc' },
  { label: 'Duration', value: 'duration' },
  { label: 'Name', value: 'name' },
];

type Category = 'All' | 'Consultation' | 'Therapy' | 'Specialist';
const CATEGORIES: Category[] = ['All', 'Consultation', 'Therapy', 'Specialist'];

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  All: [],
  Consultation: ['consult', 'consultation', 'advice', 'general'],
  Therapy: ['therapy', 'therapist', 'rehab', 'physio', 'massage'],
  Specialist: ['specialist', 'expert', 'senior', 'advanced', 'ortho', 'cardio', 'neuro'],
};

// Card top banner colors cycling by index
const BANNER_COLORS = [
  'from-teal-400 to-teal-600',
  'from-purple-400 to-purple-600',
  'from-blue-400 to-blue-600',
  'from-orange-400 to-orange-500',
];

const typeIcons: Record<string, string> = { STAFF: '👨‍⚕️', ROOM: '🏥', EQUIPMENT: '🔧' };

function sortServices(services: Service[], key: SortKey): Service[] {
  return [...services].sort((a, b) => {
    if (key === 'price-asc') return a.price - b.price;
    if (key === 'price-desc') return b.price - a.price;
    if (key === 'duration') return a.duration - b.duration;
    if (key === 'name') return a.name.localeCompare(b.name);
    return 0;
  });
}

const ServiceBrowserPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState<Category>('All');
  const [sortKey, setSortKey] = useState<SortKey>('name');

  // Filter state
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [duration, setDuration] = useState('');

  // Applied filters (only applied on button click)
  const [appliedMin, setAppliedMin] = useState('');
  const [appliedMax, setAppliedMax] = useState('');
  const [appliedDuration, setAppliedDuration] = useState('');

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { fetchServices(); }, [appliedMin, appliedMax, appliedDuration]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const filters: Record<string, string> = {};
      if (appliedMin) filters.minPrice = appliedMin;
      if (appliedMax) filters.maxPrice = appliedMax;
      if (appliedDuration) filters.duration = appliedDuration;
      setServices(await api.getServices(Object.keys(filters).length ? filters : undefined));
    } catch { setError('Failed to load services'); }
    finally { setLoading(false); }
  };

  const handleApplyFilters = () => {
    setAppliedMin(minPrice);
    setAppliedMax(maxPrice);
    setAppliedDuration(duration);
  };

  const handleClearFilters = () => {
    setMinPrice(''); setMaxPrice(''); setDuration('');
    setAppliedMin(''); setAppliedMax(''); setAppliedDuration('');
  };

  const activeFilterCount = [appliedMin, appliedMax, appliedDuration].filter(Boolean).length;

  const filtered = sortServices(
    services.filter(s => {
      const matchesSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        category === 'All' ||
        CATEGORY_KEYWORDS[category].some(kw =>
          s.name.toLowerCase().includes(kw) ||
          s.description?.toLowerCase().includes(kw)
        );
      return matchesSearch && matchesCategory;
    }),
    sortKey
  );

  const hasAvailableToday = (svc: Service) =>
    (svc.serviceResources?.length ?? 0) > 0;

  return (
    <div className="min-h-screen theme-bg-page">
      <Navbar links={[
        { label: 'My Bookings', to: '/my-bookings' },
        { label: '🔍 Search', to: '/search' },
        { label: '💳 Payments', to: '/payments' },
        { label: '📅 Calendar', to: '/calendar' },
      ]} />

      {/* Hero section */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-teal-400 text-white">
        <div className="max-w-screen-xl mx-auto px-8 py-14">
          <div className="max-w-2xl animate-fade-slide-up">
            <p className="text-sm font-semibold uppercase tracking-widest text-teal-100 mb-2">
              Welcome back, {user?.firstName} 👋
            </p>
            <h1 className="text-4xl font-extrabold mb-3 leading-tight">
              Find Your Perfect Service
            </h1>
            <p className="text-teal-100 text-base mb-8">
              Browse from our curated list of professional services and book your appointment in seconds.
            </p>
            {/* Hero search bar */}
            <div className="relative animate-fade-slide-up delay-75">
              <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search services by name or description…"
                className="w-full pl-14 pr-5 py-4 rounded-2xl text-gray-900 bg-white text-base focus:outline-none focus:ring-4 focus:ring-white/40 shadow-xl placeholder-gray-400"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-8 py-8">
        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mb-6 animate-fade-slide-up">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border
                ${category === cat
                  ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                  : 'theme-card theme-text-muted hover:border-primary-300 hover:text-primary-500'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-3 mb-6 animate-fade-slide-up delay-75">
          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold theme-text-muted uppercase tracking-wide">Sort by</label>
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value as SortKey)}
              className="theme-input px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 w-auto"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Filter button */}
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all
              ${showFilters ? 'bg-primary-500 text-white border-primary-500' : 'theme-card theme-text-muted hover:border-primary-300 hover:text-primary-500'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center
                ${showFilters ? 'bg-white text-primary-600' : 'bg-primary-500 text-white'}`}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Count + active filters summary */}
          <div className="ml-auto flex items-center gap-2">
            {!loading && (
              <p className="text-sm theme-text-muted">
                <span className="font-semibold theme-text">{filtered.length}</span> service{filtered.length !== 1 ? 's' : ''}
              </p>
            )}
            {activeFilterCount > 0 && (
              <span className="text-xs bg-primary-500/10 text-primary-600 border border-primary-200 px-2.5 py-1 rounded-full font-medium">
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
              </span>
            )}
            {category !== 'All' && (
              <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full font-medium">
                {category}
              </span>
            )}
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="theme-card rounded-2xl p-5 mb-6 max-w-2xl shadow-sm animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold theme-text text-sm">Filter Services</h3>
              {activeFilterCount > 0 && (
                <button onClick={handleClearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium">
                  Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium theme-text-muted mb-1.5">Min Price (₹)</label>
                <input type="number" min="0" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                  placeholder="0"
                  className="theme-input px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <div>
                <label className="block text-xs font-medium theme-text-muted mb-1.5">Max Price (₹)</label>
                <input type="number" min="0" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                  placeholder="Any"
                  className="theme-input px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <div>
                <label className="block text-xs font-medium theme-text-muted mb-1.5">Duration</label>
                <select value={duration} onChange={e => setDuration(e.target.value)}
                  className="theme-input px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400">
                  {DURATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleApplyFilters}
                className="px-5 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors shadow-sm">
                Apply Filters
              </button>
              <button onClick={() => setShowFilters(false)}
                className="px-5 py-2 border theme-border theme-text-muted rounded-xl text-sm font-semibold theme-bg-row-hover transition-colors">
                Close
              </button>
            </div>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="theme-card rounded-2xl overflow-hidden">
                <div className="skeleton h-24 w-full rounded-none" />
                <div className="p-5">
                  <div className="skeleton h-4 w-3/4 mb-3" />
                  <div className="skeleton h-3 w-full mb-2" />
                  <div className="skeleton h-3 w-2/3 mb-5" />
                  <div className="skeleton h-10 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">{error}</div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 animate-fade-slide-up">
                <div className="text-6xl mb-4 animate-float">🔍</div>
                <p className="font-semibold theme-text mb-1">No services match your search</p>
                <p className="text-sm theme-text-muted">Try a different keyword or category</p>
                {(activeFilterCount > 0 || category !== 'All') && (
                  <button
                    onClick={() => { handleClearFilters(); setCategory('All'); }}
                    className="mt-3 text-sm text-primary-500 hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : filtered.map((service, idx) => {
              const bannerColor = BANNER_COLORS[idx % BANNER_COLORS.length];
              const icon = typeIcons[service.serviceResources?.[0]?.resource?.type || 'STAFF'] || '📋';
              const availableToday = hasAvailableToday(service);

              return (
                <div
                  key={service.id}
                  onClick={() => navigate(`/booking/${service.id}`)}
                  style={{ animationDelay: `${idx * 60}ms` }}
                  className="animate-fade-slide-up theme-card rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_32px_rgba(0,104,95,0.18)]"
                >
                  {/* Colored top banner */}
                  <div className={`bg-gradient-to-r ${bannerColor} h-24 flex items-center justify-between px-5 relative`}>
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                      {icon}
                    </div>
                    <div className="text-right">
                      <p className="text-white/70 text-xs font-medium">Price</p>
                      <p className="text-white text-2xl font-extrabold">{rupee(service.price)}</p>
                    </div>
                    {availableToday && (
                      <span className="absolute top-3 left-1/2 -translate-x-1/2 text-xs font-semibold bg-white/20 text-white px-2.5 py-0.5 rounded-full backdrop-blur-sm border border-white/30">
                        ✓ Available today
                      </span>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-5">
                    <h3 className="text-base font-bold theme-text mb-1 group-hover:text-primary-600 transition-colors line-clamp-1">
                      {service.name}
                    </h3>
                    <p className="text-xs theme-text-muted mb-3 line-clamp-2">
                      {service.description || 'Professional service available for booking'}
                    </p>

                    {/* Star rating */}
                    <div className="mb-3">
                      <StarRating rating={4.5} />
                    </div>

                    {/* Footer meta */}
                    <div className="flex items-center justify-between pt-3 border-t theme-divider mb-4">
                      <div className="flex items-center gap-1.5 text-xs theme-text-muted">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {service.duration} min
                      </div>
                      {service.organiser && (
                        <span className="text-xs theme-text-faint">
                          by {service.organiser.firstName}
                        </span>
                      )}
                    </div>

                    <button className="w-full py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors group-hover:shadow-md">
                      Book Now →
                    </button>
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

function StarRating({ rating = 4.5 }: { rating?: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={`text-xs ${i < full ? 'text-amber-400' : i === full && half ? 'text-amber-300' : 'text-gray-300'}`}>
          ★
        </span>
      ))}
      <span className="text-xs theme-text-muted ml-1">{rating}</span>
    </div>
  );
}

export default ServiceBrowserPage;
