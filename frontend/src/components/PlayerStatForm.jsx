import { useState, useEffect, useRef } from 'react';
import { playerMatchesNameSearch } from '../utils/playerNameSearch';
import '../styles/Form.css';
import '../styles/PlayerStatForm.css';

function playerLabel(player) {
  return player.team ? `${player.name} (${player.team})` : player.name;
}

const PlayerStatForm = ({
  stat,
  index,
  players,
  handlePlayerStatChange,
  onRemove,
  canRemove,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = `player-listbox-${index}`;
  const inputId = `player-search-${index}`;

  const filteredPlayers = players.filter((player) =>
    playerMatchesNameSearch(player, searchQuery)
  );

  /** Keep search text aligned when parent resets the row or sets player id. */
  const prevPlayerRef = useRef(stat.player);
  useEffect(() => {
    if (stat.player === prevPlayerRef.current) return;
    prevPlayerRef.current = stat.player;
    if (!stat.player) {
      setSearchQuery('');
      return;
    }
    const p = players.find((x) => String(x.id) === String(stat.player));
    if (p) setSearchQuery(playerLabel(p));
  }, [stat.player, players]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocMouseDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const openMenu = () => setMenuOpen(true);

  const pickPlayer = (player) => {
    handlePlayerStatChange(index, 'player', String(player.id));
    setSearchQuery(playerLabel(player));
    setMenuOpen(false);
  };

  const clearPlayer = () => {
    handlePlayerStatChange(index, 'player', '');
    setSearchQuery('');
    setMenuOpen(false);
  };

  return (
    <div className="player-stat-form">
      <div className="player-stat-form__player">
        <label className="player-stat-form__label" htmlFor={inputId}>
          Player
        </label>
        <div className="player-stat-form__combobox" ref={rootRef}>
          <input
            id={inputId}
            className="form-input player-stat-form__search"
            type="text"
            placeholder="Click or type to find a player…"
            autoComplete="off"
            role="combobox"
            aria-expanded={menuOpen}
            aria-controls={listId}
            aria-autocomplete="list"
            value={searchQuery}
            onChange={(e) => {
              const v = e.target.value;
              setSearchQuery(v);
              openMenu();
              const sel = players.find((x) => String(x.id) === String(stat.player));
              if (sel && v !== playerLabel(sel)) {
                handlePlayerStatChange(index, 'player', '');
              }
            }}
            onFocus={openMenu}
            onClick={openMenu}
          />
          {menuOpen && (
            <ul
              id={listId}
              className="player-stat-form__dropdown"
              role="listbox"
              aria-label="Players"
            >
              {stat.player ? (
                <li className="player-stat-form__dropdown-item player-stat-form__dropdown-item--action">
                  <button
                    type="button"
                    className="player-stat-form__dropdown-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={clearPlayer}
                  >
                    Clear selection
                  </button>
                </li>
              ) : null}
              {filteredPlayers.length === 0 ? (
                <li className="player-stat-form__dropdown-empty" role="presentation">
                  No players match
                </li>
              ) : (
                filteredPlayers.map((player) => (
                  <li
                    key={player.id}
                    className="player-stat-form__dropdown-item"
                    role="option"
                    aria-selected={String(stat.player) === String(player.id)}
                  >
                    <button
                      type="button"
                      className="player-stat-form__dropdown-btn"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickPlayer(player)}
                    >
                      {playerLabel(player)}
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>

      <div className="player-stat-form__nums" role="group" aria-label="Match stats">
        <label className="player-stat-form__mini" title="Goals">
          <span className="player-stat-form__mini-key">G</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            className="form-input player-stat-form__num"
            value={stat.goals}
            onChange={(e) => handlePlayerStatChange(index, 'goals', e.target.value)}
          />
        </label>
        <label className="player-stat-form__mini" title="Assists">
          <span className="player-stat-form__mini-key">A</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            className="form-input player-stat-form__num"
            value={stat.assists}
            onChange={(e) => handlePlayerStatChange(index, 'assists', e.target.value)}
          />
        </label>
        <label className="player-stat-form__mini" title="Yellow cards">
          <span className="player-stat-form__mini-key">Y</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            className="form-input player-stat-form__num"
            value={stat.yellow_cards}
            onChange={(e) => handlePlayerStatChange(index, 'yellow_cards', e.target.value)}
          />
        </label>
        <label className="player-stat-form__mini" title="Red cards">
          <span className="player-stat-form__mini-key">R</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            className="form-input player-stat-form__num"
            value={stat.red_cards}
            onChange={(e) => handlePlayerStatChange(index, 'red_cards', e.target.value)}
          />
        </label>
        <label className="player-stat-form__mini" title="Clean sheets">
          <span className="player-stat-form__mini-key">CS</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            className="form-input player-stat-form__num"
            value={stat.clean_sheets}
            onChange={(e) => handlePlayerStatChange(index, 'clean_sheets', e.target.value)}
          />
        </label>
        <label className="player-stat-form__mini" title="Man of the match">
          <span className="player-stat-form__mini-key">M</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            className="form-input player-stat-form__num"
            value={stat.MOTM}
            onChange={(e) => handlePlayerStatChange(index, 'MOTM', e.target.value)}
          />
        </label>
        <label className="player-stat-form__mini" title="Penalty saves">
          <span className="player-stat-form__mini-key">PS</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            className="form-input player-stat-form__num"
            value={stat.Pen_Saves}
            onChange={(e) => handlePlayerStatChange(index, 'Pen_Saves', e.target.value)}
          />
        </label>
      </div>

      {onRemove && (
        <button
          type="button"
          className="player-stat-form__remove form-button form-button-secondary"
          disabled={!canRemove}
          onClick={onRemove}
          title={canRemove ? 'Remove this row' : 'Keep at least one row'}
        >
          Remove
        </button>
      )}
    </div>
  );
};

export default PlayerStatForm;
