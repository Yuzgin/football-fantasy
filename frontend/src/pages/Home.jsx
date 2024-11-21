import React, { useState, useEffect } from 'react';
import api from '../api';
import Header from '../components/Header';
import TeamTable from '../components/TeamTable';
import StatTable from '../components/StatsTable';
import '../styles/Home.css'; // Import the CSS for the home layout

const Home = () => {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    getTeams();
    getPlayers();
  }, []);

  const getTeams = () => {
    api.get('/api/teams/')
      .then((res) => res.data)
      .then((data) => setTeams(data))
      .catch((err) => alert(`Error fetching teams: ${err.message}`));
  };

  const getPlayers = () => {
    api.get('/api/players/')
      .then((res) => res.data)
      .then((data) => setPlayers(data))
      .catch((err) => alert(`Error fetching players: ${err.message}`));
  };

  return (
    <div className="page-container">
      <Header />
      <div className="table-container">
        {/* Wrapping each table in a flex child container */}
        <div className="table-wrapper">
          <TeamTable teams={teams} />
        </div>
        <div className="table-wrapper">
          <StatTable
            players={players}
            stat="Goals"
            title="Top Scorers"
          />
        </div>
        <div className="table-wrapper">
          <StatTable
            players={players}
            stat="Points"
            title="Top Points"
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
