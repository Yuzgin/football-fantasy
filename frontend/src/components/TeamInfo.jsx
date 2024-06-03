import React from 'react';

const TeamInfo = ({ team, handleDeleteTeam }) => {
  return (
    <div>
      <h1>{team.name}</h1>
      <p>Total Points: {team.total_points}</p>
      <button onClick={handleDeleteTeam}>Delete Team</button>
    </div>
  );
};

export default TeamInfo;
