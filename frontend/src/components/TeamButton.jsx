import React from 'react';
import { Link } from 'react-router-dom';

const TeamButton = () => {
  const buttonStyle = {
    padding: '10px 20px',
    margin: '10px',
    backgroundColor: '#28a745',
    color: '#FFF',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  };

  return (
    <Link to="/team">
      <button style={buttonStyle}>Go to Team Page</button>
    </Link>
  );
};

export default TeamButton;
