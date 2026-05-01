import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api';
import PlayerDirectoryDetailModal from '../components/PlayerDirectoryDetailModal';
import { compareTeams } from '../utils/playerSort';
import '../styles/Players.css';

const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'];

const SORT_ALPHABETICAL = 'alphabetical';
const SORT_TEAM = 'team';
const SORT_PRICE = 'price';

function alphabeticalCompare(a, b) {
  const fullA = (a.full_name || '').trim();
  const fullB = (b.full_name || '').trim();
  const knownA = (a.name || '').trim();
  const knownB = (b.name || '').trim();
  const keyA = fullA || knownA;
  const keyB = fullB || knownB;
  const primary = keyA.localeCompare(keyB, undefined, { sensitivity: 'base' });
  if (primary !== 0) return primary;
  return knownA.localeCompare(knownB, undefined, { sensitivity: 'base' });
}

function matchesSearch(player, q) {
  const name = (player.name || '').toLowerCase();
  const fullName = (player.full_name || '').toLowerCase();
  return name.includes(q) || fullName.includes(q);
}

/** Label for team filter only; values stay as stored (e.g. "1s") so filtering still matches. */
function langwithTeamFilterLabel(team) {
  const t = (team || '').trim();
  if (!t) return '';
  if (/^langwith\s+/i.test(t)) return t;
  return `Langwith ${t}`;
}

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [sortBy, setSortBy] = useState(SORT_ALPHABETICAL);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/api/players/');
        if (cancelled) return;
        if (Array.isArray(response.data)) {
          setPlayers(response.data);
        } else {
          setPlayers([]);
          setError('Unexpected response from server.');
        }
      } catch (e) {
        if (!cancelled) {
          setPlayers([]);
          setError(e?.message || 'Failed to load players.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const teamOptions = useMemo(() => {
    const set = new Set();
    players.forEach((p) => {
      if (p.team && String(p.team).trim()) set.add(p.team.trim());
    });
    return [...set].sort((a, b) => compareTeams(a, b) || a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [players]);

  const filteredPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return players.filter((p) => {
      if (positionFilter && p.position !== positionFilter) return false;
      if (teamFilter && (p.team || '').trim() !== teamFilter) return false;
      if (q && !matchesSearch(p, q)) return false;
      return true;
    });
  }, [players, searchQuery, teamFilter, positionFilter]);

  const sortedRows = useMemo(() => {
    const list = [...filteredPlayers];
    if (sortBy === SORT_TEAM) {
      list.sort((a, b) => {
        const tc = compareTeams(a.team, b.team);
        if (tc !== 0) return tc;
        return alphabeticalCompare(a, b);
      });
    } else if (sortBy === SORT_PRICE) {
      list.sort((a, b) => {
        const pa = Number(a.price ?? 0);
        const pb = Number(b.price ?? 0);
        if (pb !== pa) return pb - pa;
        return alphabeticalCompare(a, b);
      });
    } else {
      list.sort(alphabeticalCompare);
    }
    return list;
  }, [filteredPlayers, sortBy]);

  const openDetail = useCallback((player) => {
    setSelectedPlayer(player);
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedPlayer(null);
  }, []);

  return (
    <div className="players-page">

      <div className="players-toolbar">
        <div className="players-field">
          <label htmlFor="players-search">Search</label>
          <input
            id="players-search"
            type="search"
            placeholder="Name or full name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="players-field">
          <label htmlFor="players-team">Team</label>
          <select
            id="players-team"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            <option value="">All teams</option>
            {teamOptions.map((t) => (
              <option key={t} value={t}>
                {langwithTeamFilterLabel(t)}
              </option>
            ))}
          </select>
        </div>
        <div className="players-field">
          <label htmlFor="players-position">Position</label>
          <select
            id="players-position"
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
          >
            <option value="">All positions</option>
            {POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>
        <div className="players-field">
          <label htmlFor="players-sort">Sort by</label>
          <select
            id="players-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value={SORT_ALPHABETICAL}>Alphabetical (full name)</option>
            <option value={SORT_TEAM}>Team</option>
            <option value={SORT_PRICE}>Price (high to low)</option>
          </select>
        </div>
      </div>

      {error ? <p className="players-error">{error}</p> : null}

      {loading ? (
        <p className="players-empty">Loading players…</p>
      ) : (
        <>
          <p className="players-count">
            Showing {sortedRows.length} of {players.length} players
          </p>
          {sortedRows.length === 0 ? (
            <p className="players-empty">No players match your filters.</p>
          ) : (
            <div className="players-table-wrap">
              <table className="players-table">
                <thead>
                  <tr>
                    <th className="players-col-full-name">Full name</th>
                    <th className="players-col-known-as">Known as</th>
                    <th>Team</th>
                    <th className="players-col-position">Position</th>
                    <th className="players-col-price">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((p) => (
                    <tr
                      key={p.id}
                      tabIndex={0}
                      onClick={() => openDetail(p)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openDetail(p);
                        }
                      }}
                    >
                      <td className="players-col-full-name">{p.full_name?.trim() || '—'}</td>
                      <td className="players-col-known-as">{p.name?.trim() || '—'}</td>
                      <td>{p.team || '—'}</td>
                      <td className="players-col-position">{p.position || '—'}</td>
                      <td className="players-col-price">£{Number(p.price ?? 0).toFixed(1)}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {selectedPlayer ? (
        <PlayerDirectoryDetailModal player={selectedPlayer} onClose={closeDetail} />
      ) : null}
    </div>
  );
}
