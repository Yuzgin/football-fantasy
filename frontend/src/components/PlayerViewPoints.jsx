import React from 'react';
import selectedImage from '../assets/SelectedPlayer.png'; // Image when a player is selected
import '../styles/TeamPlayer.css'; // Import the CSS file

const PlayerViewPoints = ({
  selectedPlayer,
  openPlayerStats,
  gameWeekStartDate,
  gameWeekEndDate,
}) => {
  const handleClick = () => {
    openPlayerStats(selectedPlayer)
  };

  const calculateGameWeekPoints = (player) => {
    return player.game_stats.filter((stat) => {
        console.log(stat.match.date);
        const matchDate = new Date(stat.match.date);
        // Include points only for matches strictly between the start and end dates
        return matchDate >= new Date(gameWeekStartDate) && matchDate < new Date(gameWeekEndDate);
      })
      .reduce((total, stat) => total + stat.points, 0);
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
