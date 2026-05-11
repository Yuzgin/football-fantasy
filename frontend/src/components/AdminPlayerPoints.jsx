import { useMemo, useState } from 'react';
import { playerMatchesNameSearch } from '../utils/playerNameSearch';

const STAT_FIELDS = [
  { key: 'goals', label: 'Goals', short: 'G' },
  { key: 'assists', label: 'Assists', short: 'A' },
  { key: 'clean_sheets', label: 'Clean sheets', short: 'CS' },
  { key: 'yellow_cards', label: 'Yellow cards', short: 'YC' },
  { key: 'red_cards', label: 'Red cards', short: 'RC' },
  { key: 'MOTM', label: 'MOTM', short: 'MOTM' },
  { key: 'Pen_Saves', label: 'Penalty saves', short: 'PS' },
];

function playerLabel(player) {
  if (!player) return '';
  return player.team ? `${player.name} (${player.team})` : player.name;
}

function getMatchId(stat) {
  return typeof stat?.match === 'object' ? stat.match?.id : stat?.match;
}

function getMatch(stat, matches) {
  if (typeof stat?.match === 'object' && stat.match) return stat.match;
  const matchId = getMatchId(stat);
  return matches.find((match) => String(match.id) === String(matchId));
}

function getStatValue(stat, key) {
  return Number(stat?.[key]) || 0;
}

function formatMatchDate(iso) {
  if (!iso) return 'Unknown date';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function fixtureLabel(match) {
  if (!match) return 'Unknown match';
  const team1Score = match.team1_score ?? 0;
  const team2Score = match.team2_score ?? 0;
  return `${match.team1} ${team1Score}-${team2Score} ${match.team2}`;
}

function makeEditForm(stat) {
  return STAT_FIELDS.reduce((acc, field) => {
    acc[field.key] = String(getStatValue(stat, field.key));
    return acc;
  }, {});
}

function makeBlankStatForm() {
  return STAT_FIELDS.reduce((acc, field) => {
    acc[field.key] = '0';
    return acc;
  }, { match: '' });
}

function toNonNegativeInt(value) {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

export default function AdminPlayerPoints({
  players,
  matches,
  playerGameStats,
  onCreateStat,
  onUpdateStat,
  onDeleteStat,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [selectedStatId, setSelectedStatId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [addForm, setAddForm] = useState(makeBlankStatForm);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filteredPlayers = useMemo(() => {
    const results = players.filter((player) => playerMatchesNameSearch(player, searchQuery));
    return results.slice(0, searchQuery.trim() ? 50 : 25);
  }, [players, searchQuery]);

  const selectedPlayer = useMemo(
    () => players.find((player) => String(player.id) === String(selectedPlayerId)),
    [players, selectedPlayerId]
  );

  const selectedPlayerStats = useMemo(() => {
    if (!selectedPlayer) return [];
    return playerGameStats
      .filter((stat) => String(stat.player) === String(selectedPlayer.id))
      .sort((a, b) => {
        const matchA = getMatch(a, matches);
        const matchB = getMatch(b, matches);
        return new Date(matchB?.date || 0).getTime() - new Date(matchA?.date || 0).getTime();
      });
  }, [matches, playerGameStats, selectedPlayer]);

  const selectedStat = useMemo(
    () => selectedPlayerStats.find((stat) => String(stat.id) === String(selectedStatId)),
    [selectedPlayerStats, selectedStatId]
  );

  const totals = useMemo(() => {
    const base = STAT_FIELDS.reduce((acc, field) => {
      acc[field.key] = 0;
      return acc;
    }, { points: 0 });

    selectedPlayerStats.forEach((stat) => {
      STAT_FIELDS.forEach((field) => {
        base[field.key] += getStatValue(stat, field.key);
      });
      base.points += getStatValue(stat, 'points');
    });

    return base;
  }, [selectedPlayerStats]);

  const availableMatches = useMemo(() => {
    const usedMatchIds = new Set(selectedPlayerStats.map((stat) => String(getMatchId(stat))));
    return [...matches]
      .filter((match) => !usedMatchIds.has(String(match.id)))
      .sort((a, b) => new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime());
  }, [matches, selectedPlayerStats]);

  const selectPlayer = (player) => {
    setSelectedPlayerId(player.id);
    setSelectedStatId(null);
    setIsEditing(false);
    setEditForm({});
    setAddForm(makeBlankStatForm());
    setSearchQuery(playerLabel(player));
  };

  const selectStat = (stat) => {
    setSelectedStatId(stat.id);
    setIsEditing(false);
    setEditForm({});
  };

  const startEditing = () => {
    setEditForm(makeEditForm(selectedStat));
    setIsEditing(true);
  };

  const updateEditField = (key, value) => {
    setEditForm((current) => ({ ...current, [key]: value }));
  };

  const updateAddField = (key, value) => {
    setAddForm((current) => ({ ...current, [key]: value }));
  };

  const statFormPayload = (form, playerId, matchId) => {
    const payload = {
      player: playerId,
      match: matchId,
    };

    STAT_FIELDS.forEach((field) => {
      payload[field.key] = toNonNegativeInt(form[field.key]);
    });

    return payload;
  };

  const submitAdd = async (event) => {
    event.preventDefault();
    if (!selectedPlayer || !addForm.match) {
      window.alert('Choose a match before adding player stats.');
      return;
    }

    setAdding(true);
    try {
      await onCreateStat(statFormPayload(addForm, selectedPlayer.id, addForm.match));
      setAddForm(makeBlankStatForm());
    } catch {
      // The parent shows the API error; keep the form open so the admin can adjust it.
    } finally {
      setAdding(false);
    }
  };

  const submitEdit = async (event) => {
    event.preventDefault();
    if (!selectedStat) return;

    setSaving(true);
    try {
      await onUpdateStat(
        selectedStat.id,
        statFormPayload(editForm, selectedStat.player, getMatchId(selectedStat))
      );
      setIsEditing(false);
    } catch {
      // The parent shows the API error; keep the form open so the admin can adjust it.
    } finally {
      setSaving(false);
    }
  };

  const deleteSelectedStat = async () => {
    if (!selectedStat) return;

    setDeleting(true);
    try {
      const deleted = await onDeleteStat(selectedStat.id);
      if (deleted) {
        setSelectedStatId(null);
        setIsEditing(false);
        setEditForm({});
      }
    } catch {
      // The parent shows the API error; keep the selected row visible.
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="admin-player-points">
      <div className="admin-panel admin-player-points__lookup">
        <div className="admin-panel__body">
          <h2 className="admin-section-title">Player points</h2>
          <label className="admin-player-points__label" htmlFor="admin-player-points-search">
            Look up player
          </label>
          <input
            id="admin-player-points-search"
            className="admin-player-points__search"
            type="text"
            value={searchQuery}
            placeholder="Search by name..."
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setSelectedPlayerId(null);
              setSelectedStatId(null);
              setIsEditing(false);
            }}
          />

          <div className="admin-player-points__results" aria-label="Player search results">
            {filteredPlayers.length === 0 ? (
              <p className="admin-player-points__empty">No matching players.</p>
            ) : (
              filteredPlayers.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  className={`admin-player-points__result ${
                    String(selectedPlayerId) === String(player.id)
                      ? 'admin-player-points__result--active'
                      : ''
                  }`}
                  onClick={() => selectPlayer(player)}
                >
                  <span>{player.name}</span>
                  <small>{player.team || 'No team'} - {player.position || 'No position'}</small>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="admin-player-points__main">
        {!selectedPlayer ? (
          <div className="admin-panel">
            <div className="admin-panel__body">
              <p className="admin-player-points__empty">
                Select a player to view their full stats and game-by-game points.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="admin-panel">
              <div className="admin-panel__body">
                <div className="admin-player-points__player-head">
                  <div>
                    <h3>{selectedPlayer.name}</h3>
                    <p>{selectedPlayer.team || 'No team'} - {selectedPlayer.position || 'No position'}</p>
                  </div>
                  <strong>{totals.points} pts</strong>
                </div>

                <div className="admin-player-points__totals" aria-label="Player season totals">
                  <div>
                    <span>Games</span>
                    <strong>{selectedPlayerStats.length}</strong>
                  </div>
                  {STAT_FIELDS.map((field) => (
                    <div key={field.key}>
                      <span>{field.short}</span>
                      <strong>{totals[field.key]}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="admin-panel">
              <div className="admin-panel__body">
                <h3 className="admin-section-title">Add game stats</h3>
                {matches.length === 0 ? (
                  <p className="admin-player-points__empty">Create a match before adding player stats.</p>
                ) : availableMatches.length === 0 ? (
                  <p className="admin-player-points__empty">
                    This player already has stats for every recorded match.
                  </p>
                ) : (
                  <form className="admin-player-points__edit" onSubmit={submitAdd}>
                    <label className="admin-player-points__match-field">
                      <span>Game</span>
                      <select
                        value={addForm.match}
                        onChange={(event) => updateAddField('match', event.target.value)}
                      >
                        <option value="">Choose a game...</option>
                        {availableMatches.map((match) => (
                          <option key={match.id} value={match.id}>
                            {fixtureLabel(match)} - {formatMatchDate(match.date)} - GW{' '}
                            {match.game_week ?? '-'}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="admin-player-points__edit-grid">
                      {STAT_FIELDS.map((field) => (
                        <label key={field.key}>
                          <span>{field.label}</span>
                          <input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            value={addForm[field.key] ?? '0'}
                            onChange={(event) => updateAddField(field.key, event.target.value)}
                          />
                        </label>
                      ))}
                    </div>

                    <p className="admin-player-points__hint">
                      This creates stats for the selected player and game, then recalculates the relevant
                      gameweek snapshots and team totals.
                    </p>

                    <div className="admin-player-points__actions">
                      <button type="submit" className="admin-primary-button" disabled={adding}>
                        {adding ? 'Adding...' : 'Add stats'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <div className="admin-player-points__game-grid">
              <div className="admin-panel">
                <div className="admin-panel__body">
                  <h3 className="admin-section-title">Games</h3>
                  {selectedPlayerStats.length === 0 ? (
                    <p className="admin-player-points__empty">No recorded games for this player.</p>
                  ) : (
                    <div className="admin-player-points__games">
                      {selectedPlayerStats.map((stat) => {
                        const match = getMatch(stat, matches);
                        return (
                          <button
                            key={stat.id}
                            type="button"
                            className={`admin-player-points__game ${
                              String(selectedStatId) === String(stat.id)
                                ? 'admin-player-points__game--active'
                                : ''
                            }`}
                            onClick={() => selectStat(stat)}
                          >
                            <span>{fixtureLabel(match)}</span>
                            <small>
                              {formatMatchDate(match?.date)} - GW {stat.game_week ?? match?.game_week ?? '-'} -{' '}
                              {stat.points ?? 0} pts
                            </small>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-panel">
                <div className="admin-panel__body">
                  <h3 className="admin-section-title">Selected game</h3>
                  {!selectedStat ? (
                    <p className="admin-player-points__empty">Click a game to view and edit it.</p>
                  ) : (
                    <div className="admin-player-points__selected-game">
                      <p className="admin-player-points__fixture">
                        {fixtureLabel(getMatch(selectedStat, matches))}
                      </p>
                      <p className="admin-player-points__meta">
                        {formatMatchDate(getMatch(selectedStat, matches)?.date)} -{' '}
                        {selectedStat.points ?? 0} points
                      </p>

                      {!isEditing ? (
                        <>
                          <div className="admin-player-points__totals admin-player-points__totals--compact">
                            {STAT_FIELDS.map((field) => (
                              <div key={field.key}>
                                <span>{field.short}</span>
                                <strong>{getStatValue(selectedStat, field.key)}</strong>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            className="admin-primary-button"
                            onClick={startEditing}
                          >
                            Edit stats
                          </button>
                          <button
                            type="button"
                            className="admin-danger-button"
                            disabled={deleting}
                            onClick={deleteSelectedStat}
                          >
                            {deleting ? 'Deleting...' : 'Delete stats'}
                          </button>
                        </>
                      ) : (
                        <form className="admin-player-points__edit" onSubmit={submitEdit}>
                          <div className="admin-player-points__edit-grid">
                            {STAT_FIELDS.map((field) => (
                              <label key={field.key}>
                                <span>{field.label}</span>
                                <input
                                  type="number"
                                  min="0"
                                  inputMode="numeric"
                                  value={editForm[field.key] ?? '0'}
                                  onChange={(event) => updateEditField(field.key, event.target.value)}
                                />
                              </label>
                            ))}
                          </div>
                          <p className="admin-player-points__hint">
                            Points are recalculated from these stats, then applied to the affected gameweek
                            snapshots and team totals.
                          </p>
                          <div className="admin-player-points__actions">
                            <button type="submit" className="admin-primary-button" disabled={saving}>
                              {saving ? 'Updating...' : 'Update'}
                            </button>
                            <button
                              type="button"
                              className="admin-secondary-button"
                              disabled={saving}
                              onClick={() => setIsEditing(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
