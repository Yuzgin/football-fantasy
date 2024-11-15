import React from 'react';
import '../styles/Modal.css';

const PlayerStats = ({selectedPlayer, closeStats}) => {

    return (
        <div className="modal">
            <div className="modal-content">
                <h3>{selectedPlayer.name}</h3>
                <div>{selectedPlayer.position}</div>
                <div>Matches: {selectedPlayer.games_played}</div>
                <div>Goals: {selectedPlayer.goals}</div>
                <div>Assists: {selectedPlayer.assists}</div>
                <div>Clean sheets: {selectedPlayer.clean_sheets}</div>
                <div>Price: £{selectedPlayer.price}m</div>
                <button className="close" onClick={closeStats}>Close</button>
            </div>
        </div>
    )
}

export default PlayerStats;