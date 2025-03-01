import React from 'react';
import '../styles/Modal.css';

const PlayerModal = ({ players, isPlayerSelected, handlePlayerSelect, closeModal, position }) => {
  // Debugging: Log players and position
  const role = position.split('-')[0];
  console.log("Players:", players);
  console.log("Position", role);

  // Filter players by the given position
  const filteredPlayers = players.filter(player => player.position === role);

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Select a {role}</h2>
        <button onClick={closeModal}>Close</button>
        
        {/* Divider line below the button */}
        <div className="modal-divider"></div>

        <div className="player-list">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map((player) => (
              <div
                key={player.id}
                className={`player-item ${isPlayerSelected(player.id) ? 'faded' : ''}`}
                onClick={() => !isPlayerSelected(player.id) && handlePlayerSelect(player.id)}
              >
                {player.name} - £{player.price.toFixed(1)}m
              </div>
            ))
          ) : (
            <p>No players available for this position</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerModal;
