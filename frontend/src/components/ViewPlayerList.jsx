import React from 'react';
import PlayerItem from './PlayerItem';

const ViewPLayerList = ({ players, playerGameStats, getTotalStats, deletePlayer }) => {
  return (
    <div>
      <h2>Players</h2>
      <ul>
        {players.map(player => (
          <PlayerItem
            key={player.id}
            player={player}
            playerGameStats={playerGameStats}
            getTotalStats={getTotalStats}
            deletePlayer={deletePlayer}
          />
        ))}
      </ul>
    </div>
  );
};

export default ViewPLayerList;
