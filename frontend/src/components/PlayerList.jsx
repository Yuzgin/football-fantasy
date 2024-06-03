import React from 'react';

const PlayerList = ({
  players,
  selectedPlayers,
  isPlayerSelected,
  handlePlayerSelect,
  handlePlayerDeselect,
}) => {
  return (
    <div id="players">
      {players.map((player) => (
        <div key={player.id}>
          <input
            type="checkbox"
            id={`player-${player.id}`}
            value={player.id}
            checked={isPlayerSelected(player.id)}
            onChange={() =>
              isPlayerSelected(player.id)
                ? handlePlayerDeselect(player.id)
                : handlePlayerSelect(player.id)
            }
            disabled={!isPlayerSelected(player.id) && selectedPlayers.length >= 11}
          />
          <label htmlFor={`player-${player.id}`}>
            {player.name} - {player.position}
          </label>
        </div>
      ))}
    </div>
  );
};

export default PlayerList;
