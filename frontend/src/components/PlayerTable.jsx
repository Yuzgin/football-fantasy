import React from 'react';

const PlayerTable = ({ players, gameWeekStartDate, gameWeekEndDate }) => {

  // Helper function to calculate points within the game week dates
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
    <table>
      <thead>
        <tr>
          <th>Player Name</th>
          <th>Position</th>
          <th>Points</th>
        </tr>
      </thead>
      <tbody>
        {players.map((player) => (
          <tr key={player.id}>
            <td>{player.name}</td>
            <td>{player.position}</td>
            <td>{calculateGameWeekPoints(player)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default PlayerTable;
