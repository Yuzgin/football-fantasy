import React from 'react';

const TeamPlayer = ({
  position,
  selectedPlayer,
  openPlayerModal,
  handlePlayerDeselect,
}) => {
  return (
    <div className="team-player">
      <label>{position.split('-')[0]}: </label>
      <button
        type="button"
        onClick={() => openPlayerModal(position)}
        disabled={!!selectedPlayer}
      >
        {selectedPlayer ? selectedPlayer.name : "Select Player"}
      </button>
      {selectedPlayer && (
        <button type="button" onClick={() => handlePlayerDeselect(position)}>
          Remove
        </button>
      )}
    </div>
  );
};

export default TeamPlayer;
