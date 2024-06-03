import React from 'react';

const PlayerStatForm = ({ stat, index, players, handlePlayerStatChange }) => {
  return (
    <div>
      <select value={stat.player} onChange={(e) => handlePlayerStatChange(index, 'player', e.target.value)}>
        <option value="">Select Player</option>
        {players.map(player => (
          <option key={player.id} value={player.id}>{player.name}</option>
        ))}
      </select>
      <input type="number" placeholder="Goals" value={stat.goals} onChange={(e) => handlePlayerStatChange(index, 'goals', e.target.value)} />
      <input type="number" placeholder="Assists" value={stat.assists} onChange={(e) => handlePlayerStatChange(index, 'assists', e.target.value)} />
      <input type="number" placeholder="Yellow Cards" value={stat.yellow_cards} onChange={(e) => handlePlayerStatChange(index, 'yellow_cards', e.target.value)} />
      <input type="number" placeholder="Red Cards" value={stat.red_cards} onChange={(e) => handlePlayerStatChange(index, 'red_cards', e.target.value)} />
      <input type="number" placeholder="Clean Sheets" value={stat.clean_sheets} onChange={(e) => handlePlayerStatChange(index, 'clean_sheets', e.target.value)} />
      <input type="number" placeholder="Points" value={stat.points} onChange={(e) => handlePlayerStatChange(index, 'points', e.target.value)} />
    </div>
  );
};

export default PlayerStatForm;
