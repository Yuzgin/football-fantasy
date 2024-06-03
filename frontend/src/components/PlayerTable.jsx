import React from 'react';

const PlayerTable = ({ players }) => {
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
            <td>{player.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default PlayerTable;
