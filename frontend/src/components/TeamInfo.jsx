import React from 'react';
import '../styles/Modal.css';

const TeamInfo = ({ team, handleDeleteTeam, value }) => {
  return (
    <div>
      <h1>{team.name}</h1>
      <p>Total Points: {team.total_points}</p>
      <p>Team Value: £{value.toFixed(1)}m</p>
      <button className='close' onClick={handleDeleteTeam}>Delete Team</button>
    </div>
  );
};

export default TeamInfo;
