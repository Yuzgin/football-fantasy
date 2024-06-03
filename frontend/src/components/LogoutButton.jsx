import React from 'react';
import { Link } from 'react-router-dom';

const LogoutButton = () => {
  const buttonStyle = {
    padding: '10px 20px',
    margin: '10px',
    backgroundColor: '#DC3545',
    color: '#FFF',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  };

  return (
    <Link to="/logout">
      <button style={buttonStyle}>Logout</button>
    </Link>
  );
};

export default LogoutButton;
