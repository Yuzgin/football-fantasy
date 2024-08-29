import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/YellowBadge.png';
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../constants";


const Header = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;
      if (now < decoded.exp) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    navigate('/login');
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#333',
    color: '#FFF',
    width: '100%',
    position: 'fixed',
    top: '0',
    left: '0',
    zIndex: '1000',
  };

  const navStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  };

  const logoStyle = {
    height: '70px',
    cursor: 'pointer',
  };

  const buttonStyle = {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: '#FFF',
    border: 'none',
    cursor: 'pointer',
    textTransform: 'uppercase',
  };

  const linkStyle = {
    textDecoration: 'none',
    color: 'inherit',
  };

  return (
    <header style={headerStyle}>
      <nav style={navStyle}>
        <Link to="/">
          <img src={logo} alt="Logo" style={logoStyle} />
        </Link>
        <Link to="/" style={linkStyle}>
          <button style={buttonStyle}>Home</button>
        </Link>
        <Link to="/team" style={linkStyle}>
          <button style={buttonStyle}>Team</button>
        </Link>
        {isLoggedIn ? (
          <button style={buttonStyle} onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <Link to="/login" style={linkStyle}>
            <button style={buttonStyle}>Login</button>
          </Link>
        )}
        <Link to="/mens" style={linkStyle}>
          <button style={buttonStyle}>Men's</button>
        </Link>
        <Link to="/womens" style={linkStyle}>
          <button style={buttonStyle}>Women's</button>
        </Link>
      </nav>
    </header>
  );
};

export default Header;
