import React from 'react';
import selectedImage from '../assets/SelectedPlayer.png'; // Image when a player is selected
import '../styles/TeamPlayer.css'; // Import the CSS file

const PlayerViewPoints = ({
  selectedPlayer,
  openPlayerStats,
  gameWeekId, // We now pass the gameWeekId instead of start and end dates
}) => {
  const handleClick = () => {
    openPlayerStats(selectedPlayer)
  };

  const calculateGameWeekPoints = (player) => {

    return player.game_stats.filter((stat) => {
      // Filter stats for matches that belong to the same game week as the snapshot
      const isSameGameWeek = stat.match.game_week === gameWeekId;
      return isSameGameWeek;
    }).reduce((total, stat) => {
      return total + stat.points;
    }, 0);
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
        {selectedPlayer.name} - {calculateGameWeekPoints(selectedPlayer)}
      </div>
    </div>
  );
};

export default PlayerViewPoints;
