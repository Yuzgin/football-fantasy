import React from 'react';
import '../styles/PlayerStatForm.css';

const PlayerStatForm = ({ stat, index, players, handlePlayerStatChange }) => {
  return (
    <div className="player-stat-form">
      <label>
        Player:
        <select value={stat.player} onChange={(e) => handlePlayerStatChange(index, 'player', e.target.value)}>
          <option value="">Select Player</option>
          {players.map(player => (
            <option key={player.id} value={player.id}>{player.name}</option>
          ))}
        </select>
      </label>

      <label>
        Goals:
        <input type="number" placeholder="Goals" value={stat.goals} onChange={(e) => handlePlayerStatChange(index, 'goals', e.target.value)} />
      </label>

      <label>
        Assists:
        <input type="number" placeholder="Assists" value={stat.assists} onChange={(e) => handlePlayerStatChange(index, 'assists', e.target.value)} />
      </label>

      <label>
        Yellow Cards:
        <input type="number" placeholder="Yellow Cards" value={stat.yellow_cards} onChange={(e) => handlePlayerStatChange(index, 'yellow_cards', e.target.value)} />
      </label>

      <label>
        Red Cards:
        <input type="number" placeholder="Red Cards" value={stat.red_cards} onChange={(e) => handlePlayerStatChange(index, 'red_cards', e.target.value)} />
      </label>

      <label>
        Clean Sheets:
        <input type="number" placeholder="Clean Sheets" value={stat.clean_sheets} onChange={(e) => handlePlayerStatChange(index, 'clean_sheets', e.target.value)} />
      </label>
    </div>
  );
};

export default PlayerStatForm;
