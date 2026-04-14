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
      <div className="player-card">
        <img
          className="player-card-image"
          src={selectedImage}
          onClick={handleClick}
        />
        <div className="player-card-info">
          <div className="player-card-name">
            {selectedPlayer.name} - {getPlayerPoints(selectedPlayer)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerViewPoints;
