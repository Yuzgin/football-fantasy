import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/YellowBadge.png';
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../constants";
import { checkIsStaff } from '../utils/auth';

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

  const checkAuthStatus = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;
      const loggedIn = now < decoded.exp;
      setIsLoggedIn(loggedIn);

      // Check if user is staff only if logged in
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
  };

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  const closeDropdown = () => {
    setShowDropdown(false);
  };

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    closeDropdown(); // Close dropdown when logging out
    navigate('/login');
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: isMobileView ? '8px 12px' : '10px 20px',
    backgroundColor: '#333',
    color: '#FFF',
    width: '100%',
    position: 'fixed',
    top: '0',
    left: '0',
    zIndex: '1000',
    boxSizing: 'border-box',
  };

  const leftSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const navStyle = {
    display: isMobileView ? 'none' : 'flex',
    alignItems: 'center',
    gap: '15px',
    marginLeft: '10px',
  };

  const logoStyle = {
    height: isMobileView ? '46px' : '70px',
    cursor: 'pointer',
  };

  const buttonStyle = {
    padding: isMobileView ? '8px 10px' : '10px 20px',
    backgroundColor: 'transparent',
    color: '#FFF',
    border: 'none',
    cursor: 'pointer',
    textTransform: 'uppercase',
    fontSize: isMobileView ? '0.85rem' : '1rem',
  };

  const linkStyle = {
    textDecoration: 'none',
    color: 'inherit',
  };

  const dropdownMenuStyle = {
    position: 'absolute',
    top: '100%',
    left: '1.5em',
    backgroundColor: '#444',
    borderRadius: '0.5em',
    padding: '1em',
    width: isMobileView ? '88vw' : '15%',
    minWidth: isMobileView ? 'auto' : '180px',
    maxWidth: isMobileView ? '420px' : '300px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
    fontSize: '1.1em',
  };

  const dropdownItemStyle = {
    padding: '0.8em 1em',
    textAlign: 'left',
    textDecoration: 'none',
    color: '#FFF',
    backgroundColor: '#333',
    borderBottom: '1px solid #555',
    cursor: 'pointer',
  };

  const mobileToggleStyle = {
    display: isMobileView ? 'block' : 'none',
    padding: '10px',
    backgroundColor: 'transparent',
    color: '#FFF',
    border: 'none',
    cursor: 'pointer',
  };

  return (
    <header style={headerStyle}>
      <div style={leftSectionStyle}>
        <Link to="/">
          <img src={logo} alt="Logo" style={logoStyle} />
        </Link>
        <button style={mobileToggleStyle} onClick={toggleDropdown}>
          ☰
        </button>
      </div>
      <nav style={navStyle}>
        <Link to="/" style={linkStyle}>
          <button style={buttonStyle}>Home</button>
        </Link>
        <Link to="/team" style={linkStyle}>
          <button style={buttonStyle}>Fantasy</button>
        </Link>
        <Link to="/mens" style={linkStyle}>
          <button style={buttonStyle}>Men&apos;s</button>
        </Link>
        <Link to="/results" style={linkStyle}>
          <button style={buttonStyle}>Results</button>
        </Link>
        <Link to="/players" style={linkStyle}>
          <button style={buttonStyle}>Players</button>
        </Link>
        {isStaff && (
          <Link to="/admin" style={linkStyle}>
            <button style={buttonStyle}>Admin</button>
          </Link>
        )}
        {isLoggedIn ? (
          <button style={buttonStyle} onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <Link to="/login" style={linkStyle}>
            <button style={buttonStyle}>Login</button>
          </Link>
        )}
      </nav>
      {showDropdown && (
        <div style={dropdownMenuStyle}>
          <Link to="/" style={linkStyle} onClick={closeDropdown}>
            <div style={dropdownItemStyle}>Home</div>
          </Link>
          {isLoggedIn ? (
            <div style={dropdownItemStyle} onClick={handleLogout}>
              Logout
            </div>
          ) : (
            <Link to="/login" style={linkStyle} onClick={closeDropdown}>
              <div style={dropdownItemStyle}>Login</div>
            </Link>
          )}
          <Link to="/team" style={linkStyle} onClick={closeDropdown}>
            <div style={dropdownItemStyle}>Fantasy</div>
          </Link>
          <Link to="/mens" style={linkStyle} onClick={closeDropdown}>
            <div style={dropdownItemStyle}>Men&apos;s</div>
          </Link>
          <Link to="/results" style={linkStyle} onClick={closeDropdown}>
            <div style={dropdownItemStyle}>Results</div>
          </Link>
          <Link to="/players" style={linkStyle} onClick={closeDropdown}>
            <div style={dropdownItemStyle}>Players</div>
          </Link>
          {isStaff && (
            <Link to="/admin" style={linkStyle} onClick={closeDropdown}>
              <div style={dropdownItemStyle}>Admin</div>
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
