import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Modal.css';

const TransfersButton = () => {
  const buttonStyle = {
    padding: '10px 20px',
    margin: '10px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  };

  return (
    <Link to="/teamtransfers">
      <button className='close' style={buttonStyle}>Transfers</button>
    </Link>
  );
};

export default TransfersButton;