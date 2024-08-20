import React from 'react';

const TeamTransferForm = ({
  selectedPlayers,
  players,
  handlePlayerDeselect,
  handleUpdateTeam,
  formations,
  selectedFormation,
  setSelectedFormation,
  budget,
  openPlayerModal,
}) => {
  return (
    <form onSubmit={handleUpdateTeam}>

      <label htmlFor="formation">Formation:</label>
      <select
        id="formation"
        value={selectedFormation}
        onChange={(e) => setSelectedFormation(e.target.value)}
      >
        {Object.keys(formations).map((formation) => (
          <option key={formation} value={formation}>
            {formation}
          </option>
        ))}
      </select>

      <label htmlFor="players">Select Players:</label>
      <div>
        {formations[selectedFormation].map((position, index) => {
          const basePosition = position.split('-')[0];  // Extract the base position
          return (
            <div key={index}>
              <label>{basePosition}: </label>
              <button
                type="button"
                onClick={() => openPlayerModal(position)}
                disabled={!!selectedPlayers[position]}
              >
                {selectedPlayers[position]
                  ? players.find((p) => p.id === selectedPlayers[position]).name
                  : "Select Player"}
              </button>
              {selectedPlayers[position] && (
                <button type="button" onClick={() => handlePlayerDeselect(position)}>
                  Remove
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div>Budget: £{budget.toFixed(1)}m</div>

      <button type="submit" disabled={Object.keys(selectedPlayers).length !== 11}>
        Confirm Transfers
      </button>
    </form>
  );
};

export default TeamTransferForm;
