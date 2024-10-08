import React from 'react';
import selectedImage from '../assets/SelectedPlayer.png'; // Image when a player is selected
import '../styles/TeamPlayer.css'; // Import the CSS file

const PlayerView = ({
  selectedPlayer,
  openPlayerStats,
}) => {
  const handleClick = () => {
    openPlayerStats(selectedPlayer)
  };

  return (
    <div className="team-player">
      <img
        src={selectedImage}
        onClick={handleClick}
        style={{ 
          cursor: 'pointer',
          maxWidth: '50px',  // Limit the width to 50px, scaling the image proportionally
          height: 'auto',     // Maintain the aspect ratio
        }} 
      />
      <div className="player-name-or-position">
        {selectedPlayer.name}
      </div>
    </div>
  );
};

export default PlayerView;
