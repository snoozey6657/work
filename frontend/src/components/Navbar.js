import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="topnav">
      <div className="container topnav__inner">

        {/* Brand */}
        <Link to="/" className="topnav__brand">
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" className="topnav__logo-icon">
            <rect width="34" height="34" rx="9" fill="rgba(255,255,255,0.15)"/>
            <path d="M7 26L13 13L19 21L23 16L27 26H7Z" fill="#90cdf4" opacity="0.95"/>
            <circle cx="23" cy="11" r="3.5" fill="#3b82f6"/>
          </svg>
          <span className="topnav__brand-text">WinCo<strong>Leads</strong></span>
        </Link>

        {/* Center nav */}
        <div className="topnav__links">
          <NavLink to="/" className="topnav__link" end>Home</NavLink>
          {user && <NavLink to="/projects" className="topnav__link">Browse Leads</NavLink>}
          {user && <NavLink to="/saved"    className="topnav__link">My Leads</NavLink>}
        </div>

        {/* Right: auth */}
        <div className="topnav__auth">
          {user ? (
            <>
              <span className="topnav__user-name">👋 {user.name.split(' ')[0]}</span>
              <NavLink to="/profile" className="topnav__link topnav__link--sm">Profile</NavLink>
              <button className="btn btn--nav-outline" onClick={logout}>Sign Out</button>
            </>
          ) : (
            <>
              <NavLink to="/login"    className="topnav__link">Sign In</NavLink>
              <NavLink to="/register" className="btn btn--nav-cta">Get Started</NavLink>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
