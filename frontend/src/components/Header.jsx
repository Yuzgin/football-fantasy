import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/YellowBadge.png';
import { jwtDecode } from 'jwt-decode';
import { ACCESS_TOKEN } from '../constants';
import { checkIsStaff } from '../utils/auth';
import '../styles/Header.css';

const NAV_ROUTES = [
  { to: '/', label: 'Home' },
  { to: '/team', label: 'Fantasy' },
  { to: '/mens', label: "Men's" },
  { to: '/results', label: 'Results' },
  { to: '/players', label: 'Players' },
];

const Header = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!showDropdown) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowDropdown(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showDropdown]);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;
      const loggedIn = now < decoded.exp;
      setIsLoggedIn(loggedIn);

      if (loggedIn) {
        const staffStatus = await checkIsStaff();
        setIsStaff(staffStatus);
      } else {
        setIsStaff(false);
      }
    } else {
      setIsLoggedIn(false);
      setIsStaff(false);
    }
  };

  const handleResize = () => {
    setIsMobileView(window.innerWidth < 768);
    if (window.innerWidth >= 768) {
      setShowDropdown(false);
    }
  };

  const closeDropdown = () => {
    setShowDropdown(false);
  };

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    closeDropdown();
    navigate('/login');
  };

  const desktopAuth = isLoggedIn ? (
    <button type="button" className="app-header__nav-item" onClick={handleLogout}>
      Logout
    </button>
  ) : (
    <Link to="/login" className="app-header__link">
      <span className="app-header__nav-item">Login</span>
    </Link>
  );

  const mobileAuth = isLoggedIn ? (
    <button type="button" className="app-header__mobile-row" onClick={handleLogout}>
      Logout
    </button>
  ) : (
    <Link to="/login" className="app-header__mobile-link" onClick={closeDropdown}>
      <div className="app-header__mobile-row">Login</div>
    </Link>
  );

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link to="/" className="app-header__logo-link">
          <img src={logo} alt="Home" className="app-header__logo" width={120} height={60} />
        </Link>

        <nav className="app-header__nav-desktop" aria-label="Main navigation">
          {NAV_ROUTES.map(({ to, label }) => (
            <Link key={to} to={to} className="app-header__link">
              <span className="app-header__nav-item">{label}</span>
            </Link>
          ))}
          {isStaff ? (
            <Link to="/admin" className="app-header__link">
              <span className="app-header__nav-item">Admin</span>
            </Link>
          ) : null}
          {desktopAuth}
        </nav>

        <button
          type="button"
          className="app-header__menu-toggle"
          onClick={() => setShowDropdown((v) => !v)}
          aria-expanded={showDropdown}
          aria-controls="app-header-mobile-menu"
          aria-label={showDropdown ? 'Close menu' : 'Open menu'}
        >
          {showDropdown ? '×' : '☰'}
        </button>
      </div>

      {showDropdown && isMobileView ? (
        <div
          className="app-header__mobile-root app-header__mobile-root--open"
          id="app-header-mobile-menu"
        >
          <button
            type="button"
            className="app-header__scrim"
            onClick={closeDropdown}
            aria-label="Close menu"
          />
          <div className="app-header__sheet" role="dialog" aria-modal="true" aria-label="Site menu">
            <nav className="app-header__nav-mobile" aria-label="Main navigation">
              {NAV_ROUTES.map(({ to, label }) => (
                <Link key={to} to={to} className="app-header__mobile-link" onClick={closeDropdown}>
                  <div className="app-header__mobile-row">{label}</div>
                </Link>
              ))}
              {isStaff ? (
                <Link to="/admin" className="app-header__mobile-link" onClick={closeDropdown}>
                  <div className="app-header__mobile-row">Admin</div>
                </Link>
              ) : null}
              {mobileAuth}
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
};

export default Header;
