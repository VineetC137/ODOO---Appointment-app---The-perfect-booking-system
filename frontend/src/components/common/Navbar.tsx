import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  links?: { label: string; to: string }[];
}

const Navbar: React.FC<NavbarProps> = ({ links = [] }) => {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="theme-header sticky top-0 z-50 shadow-sm">
      <div className="max-w-screen-xl mx-auto px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="text-xl font-bold theme-text">BookFlow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {links.map(l => {
              const isActive = location.pathname === l.to;
              return (
                <Link key={l.to} to={l.to}
                  className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-all
                    ${isActive ? 'text-primary-500 bg-primary-500/10' : 'theme-text-muted hover:text-primary-500 hover:bg-primary-500/10'}`}>
                  {l.label}
                  {isActive && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full"/>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Dark mode toggle */}
          <button onClick={toggle} aria-label="Toggle dark mode"
            className="relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
            style={{ backgroundColor: isDark ? '#00685f' : '#d1d5db' }}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 flex items-center justify-center text-xs
              ${isDark ? 'translate-x-6' : 'translate-x-0'}`}>
              {isDark ? '🌙' : '☀️'}
            </span>
          </button>

          {/* Search icon */}
          <button
            onClick={() => navigate('/search')}
            aria-label="Search"
            className="w-8 h-8 rounded-lg flex items-center justify-center theme-text-muted hover:text-primary-500 hover:bg-primary-500/10 transition-all"
            title="Search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {user && (
            <div className="flex items-center gap-2 mr-1">
              <button onClick={() => navigate('/profile')}
                className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center ring-2 ring-primary-500/30 hover:ring-primary-500 transition-all"
                title="View Profile">
                <span className="text-primary-500 font-semibold text-sm">{user.firstName[0]}</span>
              </button>
              <button onClick={() => navigate('/profile')}
                className="text-sm font-medium theme-text hidden md:block hover:text-primary-500 transition-colors">
                {user.firstName}
              </button>
            </div>
          )}
          <button onClick={() => { logout(); navigate('/login'); }}
            className="text-sm theme-text-muted hover:text-red-500 px-3 py-1.5 hover:bg-red-500/10 rounded-lg font-medium border theme-border transition-all">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
