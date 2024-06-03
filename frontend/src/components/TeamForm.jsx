import React from 'react';
import PlayerList from './PlayerList';

const TeamForm = ({
  name,
  setName,
  selectedPlayers,
  players,
  isPlayerSelected,
  handlePlayerSelect,
  handlePlayerDeselect,
  handleCreateTeam,
}) => {
  return (
    <form onSubmit={handleCreateTeam}>
      <label htmlFor="name">Team Name:</label>
      <input
        type="text"
        id="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <label htmlFor="players">Select Players:</label>
      <PlayerList
        players={players}
        selectedPlayers={selectedPlayers}
        isPlayerSelected={isPlayerSelected}
        handlePlayerSelect={handlePlayerSelect}
        handlePlayerDeselect={handlePlayerDeselect}
      />
      <button type="submit" disabled={selectedPlayers.length !== 11}>
        Create Team
      </button>
    </form>
  );
};

export default TeamForm;
