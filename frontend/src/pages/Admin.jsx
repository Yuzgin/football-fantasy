import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api';
import ViewPlayerList from '../components/ViewPlayerList';
import CreatePlayerForm from '../components/CreatePlayerForm';
import MatchList from '../components/MatchList';
import CreateMatchForm from '../components/CreateMatchForm';
import AdminPlayerPoints from '../components/AdminPlayerPoints';
import { validateMatchBeforeCreate } from '../utils/matchLangwithValidation';
import '../styles/Admin.css';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('players');
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [playerGameStats, setPlayerGameStats] = useState([]);
  const [backfillBusy, setBackfillBusy] = useState(false);
  const [snapshotCommandBusy, setSnapshotCommandBusy] = useState(false);
  const [fetchFixturesCupBusy, setFetchFixturesCupBusy] = useState(false);
  
  // Player form states
  const [playerForm, setPlayerForm] = useState({
    name: '',
    position: '',
    team: '',
    price: ''
  });
  
  // Match form states
  const [matchForm, setMatchForm] = useState({
    team1: '',
    team2: '',
    team1_score: '',
    team2_score: '',
    date: ''
  });
  
  const [playersStats, setPlayersStats] = useState([
    { player: '', goals: 0, assists: 0, yellow_cards: 0, red_cards: 0, clean_sheets: 0, points: 0, MOTM: 0, Pen_Saves: 0 }
  ]);

  const recentTeamNames = useMemo(() => {
    const names = new Set();
    for (const m of matches.slice(0, 40)) {
      if (m.team1) names.add(m.team1);
      if (m.team2) names.add(m.team2);
    }
    return [...names];
  }, [matches]);

  const getPlayers = useCallback(() => {
    api.get('/api/players/')
      .then((res) => setPlayers(res.data))
      .catch((err) => console.error('Error fetching players:', err));
  }, []);

  const getMatches = useCallback(() => {
    api.get('/api/matches/')
      .then((res) => setMatches(res.data))
      .catch((err) => console.error('Error fetching matches:', err));
  }, []);

  const getPlayerGameStats = useCallback(() => {
    api.get('/api/player-game-stats/')
      .then((res) => setPlayerGameStats(res.data))
      .catch((err) => console.error('Error fetching player game stats:', err));
  }, []);

  const fetchAllData = useCallback(() => {
    getPlayers();
    getMatches();
    getPlayerGameStats();
  }, [getMatches, getPlayerGameStats, getPlayers]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const previewMissingSnapshots = async () => {
    const res = await api.get('/api/staff/missing-snapshots/preview/');
    return res.data;
  };

  const backfillMissingSnapshots = async () => {
    const res = await api.post('/api/staff/missing-snapshots/backfill/');
    return res.data;
  };

  const createOrUpdateTeamSnapshots = async () => {
    const res = await api.post('/api/staff/team-snapshots/create-or-update/');
    return res.data;
  };

  const fetchFixturesCup = async () => {
    const res = await api.post('/api/staff/fixtures/fetch-cup/');
    return res.data;
  };

  const runCreateOrUpdateTeamSnapshots = async () => {
    if (snapshotCommandBusy) return;

    const confirmMsg =
      'This will run the create_or_update_team_snapshots command for the current gameweek. ' +
      'It can create missing snapshots and update team overall totals from existing snapshots.\n\n' +
      'Proceed?';

    if (!window.confirm(confirmMsg)) return;

    setSnapshotCommandBusy(true);
    try {
      const result = await createOrUpdateTeamSnapshots();
      alert(result?.output || 'Team snapshots processed successfully.');
      fetchAllData();
    } catch (e) {
      alert(e?.response?.data?.detail || e?.message || 'Failed to run snapshot command.');
    } finally {
      setSnapshotCommandBusy(false);
    }
  };

  const runFetchFixturesCup = async () => {
    if (fetchFixturesCupBusy) return;

    if (!window.confirm('Fetch upcoming cup fixtures from the Google Sheet and update fixtures?')) {
      return;
    }

    setFetchFixturesCupBusy(true);
    try {
      const result = await fetchFixturesCup();
      alert(result?.output || 'Cup fixtures fetched successfully.');
      fetchAllData();
    } catch (e) {
      alert(e?.response?.data?.detail || e?.message || 'Failed to fetch cup fixtures.');
    } finally {
      setFetchFixturesCupBusy(false);
    }
  };

  const runSnapshotBackfillWithWarning = async () => {
    if (backfillBusy) return;
    setBackfillBusy(true);
    try {
      const preview = await previewMissingSnapshots();
      const affected = Array.isArray(preview?.affected_teams) ? preview.affected_teams : [];

      if (affected.length === 0) {
        alert(`No teams are missing a snapshot for gameweek ${preview?.game_week ?? ''}.`);
        return;
      }

      const labelList = affected
        .slice(0, 20)
        .map((t) => `- ${t.team_name || `Team #${t.team_id}`}${t.user_email ? ` (${t.user_email})` : ''}`)
        .join('\n');
      const moreCount = affected.length > 20 ? `\n… and ${affected.length - 20} more.` : '';

      const confirmMsg =
        `WARNING: This will create a TeamSnapshot for the CURRENT gameweek (${preview?.game_week}) ` +
        `for teams that do not currently have one, then recompute their weekly points from existing match stats.\n\n` +
        `Teams affected (${affected.length}):\n` +
        `${labelList}${moreCount}\n\n` +
        `Proceed?`;

      if (!window.confirm(confirmMsg)) return;

      const result = await backfillMissingSnapshots();
      alert(
        `Created ${result?.created_count ?? 0} snapshot(s) for gameweek ${result?.game_week ?? ''}.`
      );

      // Keep the page data fresh after a backfill.
      fetchAllData();
    } catch (e) {
      alert(e?.response?.data?.detail || e?.message || 'Failed to backfill snapshots.');
    } finally {
      setBackfillBusy(false);
    }
  };

  // Player CRUD operations
  const createPlayer = (e) => {
    e.preventDefault();
    api.post('/api/players/', playerForm)
      .then((res) => {
        if (res.status === 201) {
          alert('Player created successfully!');
          setPlayerForm({ name: '', position: '', team: '', price: '' });
          getPlayers();
        }
      })
      .catch((err) => alert(`Error creating player: ${err.message}`));
  };

  const deletePlayer = (id) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      api.delete(`/api/players/delete/${id}/`)
        .then((res) => {
          if (res.status === 204) {
            alert('Player deleted successfully!');
            getPlayers();
          }
        })
        .catch((err) => alert(`Error deleting player: ${err.message}`));
    }
  };

  // Match CRUD operations
  const createMatch = (e) => {
    e.preventDefault();
    const matchData = { ...matchForm };
    const preCheck = validateMatchBeforeCreate({
      team1: matchForm.team1,
      team2: matchForm.team2,
      team1_score: matchForm.team1_score,
      team2_score: matchForm.team2_score,
      playersStats,
    });
    if (!preCheck.ok) {
      alert(preCheck.error);
      return;
    }

    const formattedPlayerStats = playersStats
      .filter((stat) => stat.player !== '' && stat.player != null)
      .map((stat) => ({
        ...stat,
        goals: parseInt(stat.goals, 10) || 0,
        assists: parseInt(stat.assists, 10) || 0,
        yellow_cards: parseInt(stat.yellow_cards, 10) || 0,
        red_cards: parseInt(stat.red_cards, 10) || 0,
        clean_sheets: parseInt(stat.clean_sheets, 10) || 0,
        MOTM: parseInt(stat.MOTM, 10) || 0,
        Pen_Saves: parseInt(stat.Pen_Saves, 10) || 0,
        points: parseInt(stat.points, 10) || 0,
        player: parseInt(stat.player, 10),
      }));

    api.post('/api/matches/', { ...matchData, players_stats: formattedPlayerStats })
      .then(() => {
        alert('Match and player stats created successfully!');
        setMatchForm({ team1: '', team2: '', team1_score: '', team2_score: '', date: '' });
        setPlayersStats([{ player: '', goals: 0, assists: 0, yellow_cards: 0, red_cards: 0, clean_sheets: 0, points: 0, MOTM: 0, Pen_Saves: 0 }]);
        getMatches();
        getPlayerGameStats();
      })
      .catch((err) => alert(`Error creating match: ${err.message}`));
  };

  const deleteMatch = (id) => {
    if (window.confirm('Are you sure you want to delete this match and all its player stats?')) {
      api.delete(`/api/matches/delete/${id}/`)
        .then((res) => {
          if (res.status === 204) {
            alert('Match deleted successfully!');
            getMatches();
            getPlayerGameStats();
          }
        })
        .catch((err) => alert(`Error deleting match: ${err.message}`));
    }
  };

  // Player Game Stats operations
  const createPlayerGameStat = async (statData) => {
    try {
      await api.post('/api/player-game-stats/', statData);
      alert('Player game stat created successfully!');
      fetchAllData();
    } catch (err) {
      alert(`Error creating player game stat: ${err.message}`);
      throw err;
    }
  };

  const updatePlayerGameStat = async (statId, updatedData) => {
    try {
      await api.put(`/api/player-game-stats/${statId}/`, updatedData);
      alert('Player game stat updated successfully!');
      fetchAllData();
    } catch (err) {
      alert(`Error updating player game stat: ${err.message}`);
      throw err;
    }
  };

  const deletePlayerGameStat = async (statId) => {
    if (window.confirm('Are you sure you want to delete this player game stat?')) {
      try {
        await api.delete(`/api/player-game-stats/${statId}/`);
        alert('Player game stat deleted successfully!');
        fetchAllData();
        return true;
      } catch (err) {
        alert(`Error deleting player game stat: ${err.message}`);
        throw err;
      }
    }
    return false;
  };

  // Helper functions
  const getTotalStats = (playerId) => {
    const stats = playerGameStats.filter((stat) => stat.player === playerId);
    return stats.reduce(
      (acc, stat) => {
        acc.goals += stat.goals;
        acc.assists += stat.assists;
        acc.yellow_cards += stat.yellow_cards;
        acc.red_cards += stat.red_cards;
        acc.clean_sheets += stat.clean_sheets;
        acc.points += stat.points;
        return acc;
      },
      { goals: 0, assists: 0, yellow_cards: 0, red_cards: 0, clean_sheets: 0, points: 0 }
    );
  };

  const handlePlayerStatChange = (index, field, value) => {
    const updatedStats = [...playersStats];
    updatedStats[index][field] = value;
    setPlayersStats(updatedStats);
  };

  const addPlayerStat = () => {
    setPlayersStats([...playersStats, { 
      player: '', goals: 0, assists: 0, yellow_cards: 0, red_cards: 0, 
      clean_sheets: 0, points: 0, MOTM: 0, Pen_Saves: 0 
    }]);
  };

  const removePlayerStat = (index) => {
    if (playersStats.length > 1) {
      const updatedStats = playersStats.filter((_, i) => i !== index);
      setPlayersStats(updatedStats);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-shell">
        <header className="admin-header">
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-subtitle">Manage players, matches, and player game stats</p>
          <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="admin-tab admin-tab--active"
              onClick={runSnapshotBackfillWithWarning}
              disabled={backfillBusy}
              title="Create missing snapshots for current gameweek and recompute points"
            >
              {backfillBusy ? 'Backfilling…' : 'Backfill missing snapshots (current GW)'}
            </button>
            <button
              type="button"
              className="admin-tab admin-tab--active"
              onClick={runCreateOrUpdateTeamSnapshots}
              disabled={snapshotCommandBusy}
              title="Run create_or_update_team_snapshots for the current gameweek"
            >
              {snapshotCommandBusy ? 'Processing snapshots…' : 'Create/update team snapshots'}
            </button>
            <button
              type="button"
              className="admin-tab admin-tab--active"
              onClick={runFetchFixturesCup}
              disabled={fetchFixturesCupBusy}
              title="Run fetch_fixtures_cup to import upcoming cup fixtures"
            >
              {fetchFixturesCupBusy ? 'Fetching fixtures…' : 'Fetch cup fixtures'}
            </button>
          </div>
        </header>

        <nav className="admin-tabs" aria-label="Admin sections">
          <button
            type="button"
            className={`admin-tab ${activeTab === 'players' ? 'admin-tab--active' : ''}`}
            onClick={() => setActiveTab('players')}
          >
            Players
          </button>
          <button
            type="button"
            className={`admin-tab ${activeTab === 'matches' ? 'admin-tab--active' : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            Matches
          </button>
          <button
            type="button"
            className={`admin-tab ${activeTab === 'stats' ? 'admin-tab--active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Player stats
          </button>
          <button
            type="button"
            className={`admin-tab ${activeTab === 'playerPoints' ? 'admin-tab--active' : ''}`}
            onClick={() => setActiveTab('playerPoints')}
          >
            Player points
          </button>
        </nav>

        <div className="admin-content">
          {activeTab === 'players' && (
            <div className="admin-two-col">
              <section className="admin-panel">
                <div className="admin-panel__body">
                  <ViewPlayerList
                    players={players}
                    playerGameStats={playerGameStats}
                    getTotalStats={getTotalStats}
                    deletePlayer={deletePlayer}
                  />
                </div>
              </section>

              <aside className="admin-panel">
                <div className="admin-panel__body admin-panel__body--tight">
                  <CreatePlayerForm
                    name={playerForm.name}
                    setName={(value) => setPlayerForm({ ...playerForm, name: value })}
                    position={playerForm.position}
                    setPosition={(value) => setPlayerForm({ ...playerForm, position: value })}
                    team={playerForm.team}
                    setTeam={(value) => setPlayerForm({ ...playerForm, team: value })}
                    price={playerForm.price}
                    setPrice={(value) => setPlayerForm({ ...playerForm, price: value })}
                    createPlayer={createPlayer}
                  />
                </div>
              </aside>
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="admin-two-col">
              <section className="admin-panel">
                <div className="admin-panel__body">
                  <MatchList matches={matches} deleteMatch={deleteMatch} />
                </div>
              </section>

              <aside className="admin-panel">
                <div className="admin-panel__body admin-panel__body--tight">
                  <CreateMatchForm
                    team1={matchForm.team1}
                    setTeam1={(value) => setMatchForm({ ...matchForm, team1: value })}
                    team2={matchForm.team2}
                    setTeam2={(value) => setMatchForm({ ...matchForm, team2: value })}
                    team1_score={matchForm.team1_score}
                    setTeam1_score={(value) => setMatchForm({ ...matchForm, team1_score: value })}
                    team2_score={matchForm.team2_score}
                    setTeam2_score={(value) => setMatchForm({ ...matchForm, team2_score: value })}
                    date={matchForm.date}
                    setDate={(value) => setMatchForm({ ...matchForm, date: value })}
                    playersStats={playersStats}
                    setPlayersStats={setPlayersStats}
                    players={players}
                    handlePlayerStatChange={handlePlayerStatChange}
                    addPlayerStat={addPlayerStat}
                    removePlayerStat={removePlayerStat}
                    createMatch={createMatch}
                    recentTeamNames={recentTeamNames}
                  />
                </div>
              </aside>
            </div>
          )}

          {activeTab === 'stats' && (
            <section>
              <h2 className="admin-section-title">Player Game Stats</h2>
              <div className="admin-stats-grid">
                {playerGameStats.map((stat) => {
                  const playerName = players.find((p) => p.id === stat.player)?.name || 'Unknown Player';
                  const matchId = typeof stat.match === 'object' ? stat.match?.id : stat.match;
                  const match = typeof stat.match === 'object'
                    ? stat.match
                    : matches.find((m) => m.id === matchId);
                  const matchLabel = match ? `${match.team1} vs ${match.team2}` : 'Unknown match';

                  return (
                    <div key={stat.id} className="admin-stat-card">
                      <h4>{playerName}</h4>
                      <p>
                        <strong>Match:</strong> {matchLabel}
                      </p>
                      <p>
                        <strong>Goals:</strong> {stat.goals} | <strong>Assists:</strong> {stat.assists}
                      </p>
                      <p>
                        <strong>Cards:</strong> {stat.yellow_cards}Y {stat.red_cards}R |{' '}
                        <strong>Clean Sheets:</strong> {stat.clean_sheets}
                      </p>
                      <p>
                        <strong>MOTM:</strong> {stat.MOTM} | <strong>Pen Saves:</strong> {stat.Pen_Saves}
                      </p>
                      <p>
                        <strong>Points:</strong> {stat.points}
                      </p>
                      <div style={{ marginTop: 10 }}>
                        <button
                          type="button"
                          onClick={() => deletePlayerGameStat(stat.id)}
                          className="admin-danger-button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {activeTab === 'playerPoints' && (
            <AdminPlayerPoints
              players={players}
              matches={matches}
              playerGameStats={playerGameStats}
              onCreateStat={createPlayerGameStat}
              onUpdateStat={updatePlayerGameStat}
              onDeleteStat={deletePlayerGameStat}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
