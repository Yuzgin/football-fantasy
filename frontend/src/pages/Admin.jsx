import React, { useState, useEffect } from 'react';
import api from '../api';
import ViewPlayerList from '../components/ViewPlayerList';
import CreatePlayerForm from '../components/CreatePlayerForm';
import MatchList from '../components/MatchList';
import CreateMatchForm from '../components/CreateMatchForm';
import PlayerStatForm from '../components/PlayerStatForm';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('players');
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [playerGameStats, setPlayerGameStats] = useState([]);
  
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

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = () => {
    getPlayers();
    getMatches();
    getPlayerGameStats();
  };

  const getPlayers = () => {
    api.get('/api/players/')
      .then((res) => setPlayers(res.data))
      .catch((err) => console.error('Error fetching players:', err));
  };

  const getMatches = () => {
    api.get('/api/matches/')
      .then((res) => setMatches(res.data))
      .catch((err) => console.error('Error fetching matches:', err));
  };

  const getPlayerGameStats = () => {
    api.get('/api/player-game-stats/')
      .then((res) => setPlayerGameStats(res.data))
      .catch((err) => console.error('Error fetching player game stats:', err));
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
    const formattedPlayerStats = playersStats.map(stat => ({
      ...stat,
      goals: parseInt(stat.goals),
      assists: parseInt(stat.assists),
      yellow_cards: parseInt(stat.yellow_cards),
      red_cards: parseInt(stat.red_cards),
      clean_sheets: parseInt(stat.clean_sheets),
      MOTM: parseInt(stat.MOTM),
      Pen_Saves: parseInt(stat.Pen_Saves),
      points: parseInt(stat.points),
      player: parseInt(stat.player)
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
  const updatePlayerGameStat = (statId, updatedData) => {
    api.put(`/api/player-game-stats/${statId}/`, updatedData)
      .then(() => {
        alert('Player game stat updated successfully!');
        getPlayerGameStats();
        getPlayers(); // Refresh players to update their totals
      })
      .catch((err) => alert(`Error updating player game stat: ${err.message}`));
  };

  const deletePlayerGameStat = (statId) => {
    if (window.confirm('Are you sure you want to delete this player game stat?')) {
      api.delete(`/api/player-game-stats/${statId}/`)
        .then(() => {
          alert('Player game stat deleted successfully!');
          getPlayerGameStats();
          getPlayers(); // Refresh players to update their totals
        })
        .catch((err) => alert(`Error deleting player game stat: ${err.message}`));
    }
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

  const tabStyle = (tabName) => ({
    padding: '10px 20px',
    margin: '0 5px',
    border: 'none',
    backgroundColor: activeTab === tabName ? '#007bff' : '#f8f9fa',
    color: activeTab === tabName ? 'white' : '#333',
    cursor: 'pointer',
    borderRadius: '5px 5px 0 0',
    fontSize: '16px',
    fontWeight: '500'
  });

  const contentStyle = {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '0 5px 5px 5px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    minHeight: '500px'
  };

  return (
    <div style={{ 
      padding: '100px 20px 20px 20px', 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
          <h1 style={{ 
            color: '#333', 
            marginBottom: '10px',
            fontSize: '2rem'
          }}>
            Admin Dashboard
          </h1>
          <p style={{ 
            color: '#666', 
            fontSize: '1rem',
            margin: 0
          }}>
            Manage players, matches, and player game stats
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
          <button 
            style={tabStyle('players')} 
            onClick={() => setActiveTab('players')}
          >
            Players Management
          </button>
          <button 
            style={tabStyle('matches')} 
            onClick={() => setActiveTab('matches')}
          >
            Matches Management
          </button>
          <button 
            style={tabStyle('stats')} 
            onClick={() => setActiveTab('stats')}
          >
            Player Game Stats
          </button>
        </div>

        {/* Tab Content */}
        <div style={contentStyle}>
          {activeTab === 'players' && (
            <div style={{ display: 'flex', gap: '20px', height: '500px', overflow: 'hidden' }}>
              <div style={{ flex: 2, overflowY: 'auto' }}>
                <ViewPlayerList
                  players={players}
                  playerGameStats={playerGameStats}
                  getTotalStats={getTotalStats}
                  deletePlayer={deletePlayer}
                />
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
                <CreatePlayerForm
                  name={playerForm.name}
                  setName={(value) => setPlayerForm({...playerForm, name: value})}
                  position={playerForm.position}
                  setPosition={(value) => setPlayerForm({...playerForm, position: value})}
                  team={playerForm.team}
                  setTeam={(value) => setPlayerForm({...playerForm, team: value})}
                  price={playerForm.price}
                  setPrice={(value) => setPlayerForm({...playerForm, price: value})}
                  createPlayer={createPlayer}
                />
              </div>
            </div>
          )}

          {activeTab === 'matches' && (
            <div>
              <div style={{ display: 'flex', gap: '20px', height: '500px', overflow: 'hidden' }}>
                <div style={{ flex: 2, overflowY: 'auto' }}>
                  <MatchList matches={matches} deleteMatch={deleteMatch} />
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
                  <CreateMatchForm
                    team1={matchForm.team1}
                    setTeam1={(value) => setMatchForm({...matchForm, team1: value})}
                    team2={matchForm.team2}
                    setTeam2={(value) => setMatchForm({...matchForm, team2: value})}
                    team1_score={matchForm.team1_score}
                    setTeam1_score={(value) => setMatchForm({...matchForm, team1_score: value})}
                    team2_score={matchForm.team2_score}
                    setTeam2_score={(value) => setMatchForm({...matchForm, team2_score: value})}
                    date={matchForm.date}
                    setDate={(value) => setMatchForm({...matchForm, date: value})}
                    playersStats={playersStats}
                    setPlayersStats={setPlayersStats}
                    players={players}
                    handlePlayerStatChange={handlePlayerStatChange}
                    addPlayerStat={addPlayerStat}
                    createMatch={createMatch}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              <h2>Player Game Stats Management</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {playerGameStats.map((stat) => (
                  <div key={stat.id} style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '15px',
                    backgroundColor: '#f9f9f9'
                  }}>
                    <h4>{players.find(p => p.id === stat.player)?.name || 'Unknown Player'}</h4>
                    <p><strong>Match:</strong> {matches.find(m => m.id === stat.match)?.team1} vs {matches.find(m => m.id === stat.match)?.team2}</p>
                    <p><strong>Goals:</strong> {stat.goals} | <strong>Assists:</strong> {stat.assists}</p>
                    <p><strong>Cards:</strong> {stat.yellow_cards}Y {stat.red_cards}R | <strong>Clean Sheets:</strong> {stat.clean_sheets}</p>
                    <p><strong>MOTM:</strong> {stat.MOTM} | <strong>Pen Saves:</strong> {stat.Pen_Saves}</p>
                    <p><strong>Points:</strong> {stat.points}</p>
                    <div style={{ marginTop: '10px' }}>
                      <button 
                        onClick={() => deletePlayerGameStat(stat.id)}
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginRight: '10px'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
