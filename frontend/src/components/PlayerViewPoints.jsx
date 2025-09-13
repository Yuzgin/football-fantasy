import React from 'react';
import selectedImage from '../assets/SelectedPlayer.png'; // Image when a player is selected
import '../styles/TeamPlayer.css'; // Import the CSS file

const PlayerViewPoints = ({
  selectedPlayer,
  openPlayerStats,
  gameWeekId, // We now pass the gameWeekId instead of start and end dates
}) => {
  const handleClick = () => {
    openPlayerStats(selectedPlayer);
  };

  // Use pre-calculated points from backend instead of recalculating
  const getPlayerPoints = (player) => {
    // The backend now provides pre-calculated points for the specific game week
    return player?.points || 0;
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
        {selectedPlayer.name} - {getPlayerPoints(selectedPlayer)}
      </div>
    </div>
  );
};

export default PlayerViewPoints;
