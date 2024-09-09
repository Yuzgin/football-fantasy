import React, { useState, useEffect } from 'react';
import api from '../api';
import MatchList from '../components/MatchList';
import CreateMatchForm from '../components/CreateMatchForm';
import '../styles/Match.css';

const MatchPage = () => {
  const [matches, setMatches] = useState([]);
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [date, setDate] = useState('');
  const [playersStats, setPlayersStats] = useState([
    { player: '', goals: 0, assists: 0, yellow_cards: 0, red_cards: 0, clean_sheets: 0, points: 0 }
  ]);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    getMatches();
    getPlayers();
  }, []);

  const getMatches = () => {
    api.get('/api/matches/')
      .then((res) => setMatches(res.data))
      .catch((err) => alert(`Error fetching matches: ${err.message}`));
  };

  const getPlayers = () => {
    api.get('/api/players/')
      .then((res) => setPlayers(res.data))
      .catch((err) => alert(`Error fetching players: ${err.message}`));
  };

  const handlePlayerStatChange = (index, field, value) => {
    const updatedStats = [...playersStats];
    updatedStats[index][field] = value;
    setPlayersStats(updatedStats);
  };

  const addPlayerStat = () => {
    setPlayersStats([...playersStats, { player: '', goals: 0, assists: 0, yellow_cards: 0, red_cards: 0, clean_sheets: 0, points: 0 }]);
  };

  const createMatch = (e) => {
    e.preventDefault();
  
    const matchData = { team1, team2, date };
    const formattedPlayerStats = playersStats.map(stat => ({
      ...stat,
      goals: parseInt(stat.goals),
      assists: parseInt(stat.assists),
      yellow_cards: parseInt(stat.yellow_cards),
      red_cards: parseInt(stat.red_cards),
      clean_sheets: parseInt(stat.clean_sheets),
      points: parseInt(stat.points),
      player: parseInt(stat.player)
    }));
  
    // Log the data before sending the request
    console.log('Match data being sent:', { ...matchData, players_stats: formattedPlayerStats });
  
    api.post('/api/matches/', { ...matchData, players_stats: formattedPlayerStats })
      .then(() => {
        alert('Match and player stats created!');
        getMatches();
      })
      .catch((err) => {
        alert(`Error creating match or player stats: ${err.message}`);
        console.error('Error response:', err.response);  // Log the full error response for more details
      });
  };
  

  const deleteMatch = (id) => {
    api.delete(`/api/matches/delete/${id}/`)
      .then((res) => {
        if (res.status === 204) {
          alert('Match deleted!');
          setMatches(matches.filter(match => match.id !== id));
        } else {
          alert('Failed to delete match.');
        }
      })
      .catch((err) => alert(`Error deleting match: ${err.message}`));
  };

  return (
    <div>
      <MatchList matches={matches} deleteMatch={deleteMatch} />
      <CreateMatchForm
        team1={team1}
        setTeam1={setTeam1}
        team2={team2}
        setTeam2={setTeam2}
        date={date}
        setDate={setDate}
        playersStats={playersStats}
        setPlayersStats={setPlayersStats}
        players={players}
        handlePlayerStatChange={handlePlayerStatChange}
        addPlayerStat={addPlayerStat}
        createMatch={createMatch}
      />
    </div>
  );
};

export default MatchPage;