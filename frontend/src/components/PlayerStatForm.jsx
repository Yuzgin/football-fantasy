import React, { useState } from 'react';
import '../styles/PlayerStatForm.css';

const PlayerStatForm = ({ stat, index, players, handlePlayerStatChange }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter players based on the search query
  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="player-stat-form">
      <label>
        Player:
        {/* Add Search Input Field */}
        <input
          type="text"
          placeholder="Search for a player"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Player Select Dropdown */}
        <select value={stat.player} onChange={(e) => handlePlayerStatChange(index, 'player', e.target.value)}>
          <option value="">Select Player</option>
          {filteredPlayers.map(player => (
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

      <label>
        MOTM:
        <input type="number" placeholder="MOTM" value={stat.MOTM} onChange={(e) => handlePlayerStatChange(index, 'MOTM', e.target.value)} />
      </label>

      <label>
        Pen_Saves:
        <input type="number" placeholder="Pen_Saves" value={stat.Pen_Saves} onChange={(e) => handlePlayerStatChange(index, 'Pen_Saves', e.target.value)} />
      </label>
    </div>
  );
};

export default PlayerStatForm;