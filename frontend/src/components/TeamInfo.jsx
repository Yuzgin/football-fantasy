import React from 'react';
import '../styles/TeamInfo.css'; // Import new CSS file

const TeamInfo = ({ team, handleDeleteTeam, value }) => {
  const confirmDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${team.name}?`)) {
      handleDeleteTeam();
    }
  };

  return (
    <div className="team-info">
      <h1>{team.name}</h1>
      <p>Total Points: {team.total_points}</p>
      <p>Team Value: £{Number(value).toFixed(1)}m</p>
      <button className='close' onClick={confirmDelete}>Delete Team</button>
    </div>
  );
};

export default TeamInfo;
