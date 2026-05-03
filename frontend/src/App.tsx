import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { UserRole } from './types';

import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import OTPVerifyPage from './pages/OTPVerifyPage';
import ServiceBrowserPage from './pages/ServiceBrowserPage';
import BookingFlowPage from './pages/BookingFlowPage';
import MyBookingsPage from './pages/MyBookingsPage';
import OrganiserDashboardPage from './pages/OrganiserDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProfilePage from './pages/ProfilePage';
import CalendarPage from './pages/CalendarPage';
import SearchPage from './pages/SearchPage';
import PaymentHistoryPage from './pages/PaymentHistoryPage';

// ── Global floating theme toggle — visible on every page ──────────────────
const GlobalThemeToggle: React.FC = () => {
  const { isDark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="fixed bottom-6 right-6 z-[9999] w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-xl transition-all duration-300 hover:scale-110 active:scale-95"
      style={{
        backgroundColor: isDark ? '#1a2e2b' : '#ffffff',
        border: `2px solid ${isDark ? '#2a4a45' : '#e5e7eb'}`,
        boxShadow: isDark
          ? '0 4px 20px rgba(0,104,95,0.4)'
          : '0 4px 20px rgba(0,0,0,0.12)',
      }}
    >
      <span style={{ transition: 'transform 0.4s ease', display: 'inline-block', transform: isDark ? 'rotate(0deg)' : 'rotate(180deg)' }}>
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: UserRole[] }> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen theme-bg-page flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  const defaultRedirect = () => {
    if (!user) return '/login';
    if (user.role === UserRole.ORGANISER) return '/organiser/dashboard';
    if (user.role === UserRole.ADMIN) return '/admin/dashboard';
    return '/services';
  };

  return (
    <Routes>
      {/* Public */}
      <Route path="/login"      element={user ? <Navigate to={defaultRedirect()} replace /> : <LoginPage />} />
      <Route path="/signup"     element={user ? <Navigate to={defaultRedirect()} replace /> : <SignUpPage />} />
      <Route path="/verify-otp" element={<OTPVerifyPage />} />

      {/* Customer */}
      <Route path="/services"          element={<ProtectedRoute allowedRoles={[UserRole.CUSTOMER]}><ServiceBrowserPage /></ProtectedRoute>} />
      <Route path="/booking/:serviceId" element={<ProtectedRoute allowedRoles={[UserRole.CUSTOMER]}><BookingFlowPage /></ProtectedRoute>} />
      <Route path="/my-bookings"        element={<ProtectedRoute allowedRoles={[UserRole.CUSTOMER]}><MyBookingsPage /></ProtectedRoute>} />

      {/* Organiser */}
      <Route path="/organiser/dashboard" element={<ProtectedRoute allowedRoles={[UserRole.ORGANISER]}><OrganiserDashboardPage /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AdminDashboardPage /></ProtectedRoute>} />

      {/* All authenticated */}
      <Route path="/profile"  element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
      <Route path="/search"   element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute><PaymentHistoryPage /></ProtectedRoute>} />

      {/* Default */}
      <Route path="/"  element={<Navigate to={defaultRedirect()} replace />} />
      <Route path="*"  element={<Navigate to={defaultRedirect()} replace />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
      {/* Global floating theme toggle — always visible */}
      <GlobalThemeToggle />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
