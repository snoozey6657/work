// components/Navbar.js
import { Link, NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="topnav">
      <div className="container topnav__inner">
        {/* Brand */}
        <Link to="/" className="topnav__brand" style={{ textDecoration: 'none' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="4" fill="#90cdf4" opacity="0.2"/>
            <path d="M3 18L8 10l4 6 3-4 6 6" stroke="#90cdf4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          WinCo<span>Leads</span>
        </Link>

        {/* Navigation links */}
        <div className="topnav__links">
          <NavLink to="/"         className="topnav__link" end>Home</NavLink>
          <NavLink to="/projects" className="topnav__link">Browse Leads</NavLink>
        </div>
      </div>
    </nav>
  );
}
