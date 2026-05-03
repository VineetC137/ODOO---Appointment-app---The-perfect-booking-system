import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { serviceAPI } from '../services/api';
import { Service } from '../types';

const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    serviceAPI.getAll()
      .then(setServices)
      .catch(() => setError('Failed to load services'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-semibold text-slate-900">BookEasy</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{user?.name}</span>
            <button onClick={() => navigate('/bookings')} className="btn-outline text-xs px-3 py-1.5">
              My Bookings
            </button>
            <button onClick={handleLogout} className="btn-ghost text-xs px-3 py-1.5">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Services</h2>
          <p className="text-sm text-slate-500 mt-0.5">Pick a service to get started</p>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map(service => (
              <div key={service.id} className="card flex flex-col gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{service.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{service.description}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span>{service.duration} min</span>
                  <span className="font-medium text-slate-800">Rs.{service.price.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => navigate(`/book/${service.id}`)}
                  className="btn-primary mt-auto"
                >
                  Book
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ServicesPage;
