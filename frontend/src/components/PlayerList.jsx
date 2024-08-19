import React from 'react';

const PlayerList = ({
  players,
  selectedPlayers,
  isPlayerSelected,
  handlePlayerSelect,
  handlePlayerDeselect,
  positions,
}) => {
  const getPlayerPositionCount = (position) => {
    return selectedPlayers.filter((playerId) => {
      const player = players.find((p) => p.id === playerId);
      return player.position === position;
    }).length;
  };

  return (
    <div id="players">
      {positions.map((position, index) => (
        <div key={index}>
          <h3>{position}</h3>
          {players
            .filter((player) => player.position === position)
            .map((player) => (
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
                  disabled={
                    !isPlayerSelected(player.id) &&
                    getPlayerPositionCount(player.position) >=
                      positions.filter((pos) => pos === player.position).length
                  }
                />
                <label htmlFor={`player-${player.id}`}>
                  {player.name} - {player.position} - £{player.price.toFixed(1)}m
                </label>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
};

export default PlayerList;
