import React, { useState, useMemo, useEffect } from 'react';
import '../styles/Modal.css';

function teamNumericPrefix(team) {
  const m = (team || '').trim().match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function compareTeams(aTeam, bTeam) {
  const na = teamNumericPrefix(aTeam);
  const nb = teamNumericPrefix(bTeam);
  if (na != null && nb != null && na !== nb) return na - nb;
  if (na != null && nb == null) return -1;
  if (na == null && nb != null) return 1;
  return (aTeam || '').localeCompare(bTeam || '', undefined, { sensitivity: 'base' });
}

function sortPlayersForModal(list) {
  return [...list].sort((a, b) => {
    const pa = Number(a.price ?? 0);
    const pb = Number(b.price ?? 0);
    if (pa !== pb) return pb - pa;

    const tc = compareTeams(a.team, b.team);
    if (tc !== 0) return tc;

    return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
  });
}

const PlayerModal = ({ players, isPlayerSelected, handlePlayerSelect, closeModal, position }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const role = position.split('-')[0];

  useEffect(() => {
    setSearchQuery('');
  }, [position]);

  const filteredPlayers = useMemo(() => {
    const byPosition = players.filter((player) => player.position === role);
    const q = searchQuery.trim().toLowerCase();
    const matched = !q
      ? byPosition
      : byPosition.filter((player) => {
          const name = (player.name || '').toLowerCase();
          const fullName = (player.full_name || '').toLowerCase();
          return name.includes(q) || fullName.includes(q);
        });

    return sortPlayersForModal(matched);
  }, [players, role, searchQuery]);

  return (
    <div className="modal">
      <div className="modal-content player-modal">
        <h2>Select a {role}</h2>
        <button type="button" onClick={closeModal}>Close</button>

        <div className="modal-divider" />

        <label className="player-modal-search-label" htmlFor="player-modal-search">
          Search players
        </label>
        <input
          id="player-modal-search"
          type="search"
          className="player-modal-search-input"
          placeholder="Type to filter by display or full name…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoComplete="off"
        />

        <div className="player-modal-table-wrap">
          <div className="player-modal-row player-modal-header">
            <span className="player-modal-col-name">Name</span>
            <span className="player-modal-col-team">Team</span>
            <span className="player-modal-col-price">Price</span>
          </div>
          <div className="player-modal-body">
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map((player) => (
                <div
                  key={player.id}
                  role="button"
                  tabIndex={0}
                  className={`player-modal-row player-modal-data-row ${isPlayerSelected(player.id) ? 'faded' : ''}`}
                  onClick={() => !isPlayerSelected(player.id) && handlePlayerSelect(player.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (!isPlayerSelected(player.id)) handlePlayerSelect(player.id);
                    }
                  }}
                >
                  <span className="player-modal-col-name">{player.name || '—'}</span>
                  <span className="player-modal-col-team">{player.team || '—'}</span>
                  <span className="player-modal-col-price">£{Number(player.price ?? 0).toFixed(1)}m</span>
                </div>
              ))
            ) : (
              <p className="player-modal-empty">No players match this position and search.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerModal;
