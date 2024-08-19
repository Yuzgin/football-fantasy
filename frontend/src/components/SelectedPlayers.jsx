import React from 'react';

const SelectedPlayers = ({ selectedPlayers, players }) => {
  return (
    selectedPlayers.length > 0 && (
      <div>
        <h2>Selected Players:</h2>
        <ul>
          {Object.keys(selectedPlayers).map((position) => {
            const playerId = selectedPlayers[position];
            const player = players.find((p) => p.id === playerId);
            return (
              <li key={player.id}>
                {player.name} - {player.position}
              </li>
            );
          })}
        </ul>
      </div>
    )
  );
};

export default SelectedPlayers;
