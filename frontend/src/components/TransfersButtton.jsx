import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Modal.css';

const TransfersButton = () => {
  const buttonStyle = {
    cursor: 'pointer',
  };

  return (
    <Link to="/teamtransfers">
      <button className='close' style={buttonStyle}>Transfers</button>
    </Link>
  );
};

export default TransfersButton;