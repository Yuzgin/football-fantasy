import React from 'react';

const PlayerItem = ({ player, playerGameStats, getTotalStats, deletePlayer }) => {
  const totalStats = getTotalStats(player.id);
  return (
    <li>
      {player.name} - {player.position} - Langwith {player.team} - £{player.price}mil
      <div>
        Total Stats: {totalStats.goals} goals, {totalStats.assists} assists, {totalStats.clean_sheets} clean sheets,
        {totalStats.red_cards} red cards, {totalStats.yellow_cards} yellow cards, {totalStats.points} points
      </div>
      <button onClick={() => deletePlayer(player.id)}>Delete</button>
      <ul>
        {playerGameStats.filter(stat => stat.player === player.id).map(stat => (
          <li key={stat.id}>
            Match ID: {stat.match.id}, Goals: {stat.goals}, Assists: {stat.assists},
            Yellow Cards: {stat.yellow_cards}, Red Cards: {stat.red_cards},
            Clean Sheets: {stat.clean_sheets}, Points: {stat.points}
          </li>
        ))}
      </ul>
    </li>
  );
};

export default PlayerItem;
