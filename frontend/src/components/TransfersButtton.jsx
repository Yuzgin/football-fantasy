import React from 'react';
import { Link } from 'react-router-dom';

const TransfersButton = () => {
  const buttonStyle = {
    padding: '10px 20px',
    margin: '10px',
    backgroundColor: '#007BFF',
    color: '#FFF',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  };

  return (
    <Link to="/teamtransfers">
      <button style={buttonStyle}>Transfers</button>
    </Link>
  );
};

export default TransfersButton;