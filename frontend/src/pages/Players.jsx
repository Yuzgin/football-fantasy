import React, { useState, useEffect } from 'react';
import api from '../api';
import ViewPlayerList from '../components/ViewPlayerList';
import CreatePlayerForm from '../components/CreatePlayerForm';

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [position, setPosition] = useState('');
  const [name, setName] = useState('');
  const [team, setTeam] = useState('');
  const [price, setPrice] = useState('');
  const [playerGameStats, setPlayerGameStats] = useState([]);

  useEffect(() => {
    getPlayers();
    getPlayerGameStats();
  }, []);

  const getPlayers = () => {
    api.get('/api/players/')
      .then((res) => res.data)
      .then((data) => {
        setPlayers(data);
      })
      .catch((err) => alert(`Error fetching players: ${err.message}`));
  };

  const getPlayerGameStats = () => {
    api.get('/api/player-game-stats/')
      .then((res) => res.data)
      .then((data) => {
        setPlayerGameStats(data);
      })
      .catch((err) => alert(`Error fetching player game stats: ${err.message}`));
  };

  const deletePlayer = (id) => {
    api.delete(`/api/players/delete/${id}/`)
      .then((res) => {
        if (res.status === 204) {
          alert('Player deleted!');
          getPlayers();
        } else {
          alert('Error deleting player');
        }
      })
      .catch((error) => alert(`Error deleting player: ${error.message}`));
  };

  const createPlayer = (e) => {
    e.preventDefault();
    api.post('/api/players/', { position, name, team, price })
      .then((res) => {
        if (res.status === 201) {
          alert('Player created!');
          getPlayers();
        } else {
          alert('Failed to create player.');
        }
      })
      .catch((err) => alert(`Error creating player: ${err.message}`));
  };

  const getTotalStats = (playerId) => {
    const stats = playerGameStats.filter((stat) => stat.player === playerId);
    const totalStats = stats.reduce(
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
    return totalStats;
  };

  return (
    <div>
      <ViewPlayerList
        players={players}
        playerGameStats={playerGameStats}
        getTotalStats={getTotalStats}
        deletePlayer={deletePlayer}
      />
      <CreatePlayerForm
        name={name}
        setName={setName}
        position={position}
        setPosition={setPosition}
        team={team}
        setTeam={setTeam}
        price={price}
        setPrice={setPrice}
        createPlayer={createPlayer}
      />
    </div>
  );
};

export default Players;
