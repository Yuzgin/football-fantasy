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

  console.log(selectedPlayer.name);

  const calculateGameWeekPoints = (player) => {
    // Log the entire player object to ensure it contains the expected data
    console.log('Player object:', player);
    if (!player || !player.game_stats) {
      console.log('Player or player.game_stats is missing');
      return 0;
    }

    // Log the gameWeekId to ensure it's correctly passed
    console.log('gameWeekId:', gameWeekId);

    // Log each game stat for debugging purposes
    player.game_stats.forEach(stat => {
      console.log('Stat object:', stat);
      if (stat.match) {
        console.log('Stat match ID:', stat.match);
        console.log('Stat match game week ID:', stat.match.game_week);
      }
    });

    // Filter the game_stats to include only those for the selected game week
    const filteredStats = player.game_stats.filter((stat) => {
      // Ensure that stat.match exists and has a valid game_week
      return stat.match && stat.match.game_week === gameWeekId;
    });

    // Log the filtered stats to see if the filtering works as expected
    console.log('Filtered Stats:', filteredStats);

    // Sum up the points
    const totalPoints = filteredStats.reduce((total, stat) => total + stat.points, 0);

    // Log the total points to ensure the calculation is correct
    console.log('Total Points for player:', player.name, totalPoints);

    return totalPoints;
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
