import React, { useState, useEffect } from 'react';
import api from '../api';
import Header from '../components/Header';
import TeamTable from '../components/TeamTable';
import StatsTableGoals from '../components/StatsTableGoals';
import StatsTablePoints from '../components/StatsTablePoints';
import '../styles/Home.css'; // Import the CSS for the home layout

const Home = () => {
  const [teams, setTeams] = useState([]);
  const [playersGoals, setPlayersGoals] = useState([]);
  const [playersPoints, setPlayersPoints] = useState([]);

  useEffect(() => {
    getTeams();
    getPlayersGoals();
    getPlayersPoints();
  }, []);

  const getTeams = () => {
    api.get('/api/teams/')
      .then((res) => res.data)
      .then((data) => setTeams(data))
      .catch((err) => alert(`Error fetching teams: ${err.message}`));
  };

  const getPlayersGoals = () => {
    api.get('/api/player-goals/')
      .then((res) => {
        console.log("Full players response:", res.data); // Log the entire response
        return res.data;
      })
      .then((data) => setPlayersGoals(data))
      .catch((err) => alert(`Error fetching players: ${err.message}`));
  };

  const getPlayersPoints = () => {
    api.get('/api/player-points/')
      .then((res) => {
        console.log("Full players response:", res.data); // Log the entire response
        return res.data;
      })
      .then((data) => setPlayersPoints(data))
      .catch((err) => alert(`Error fetching players: ${err.message}`));
  }

  return (
    <div className="page-container">
      <Header />
      <div className="table-container">
        {/* Wrapping each table in a flex child container */}
        <div className="table-wrapper">
          <TeamTable teams={teams} />
        </div>
        <div className="table-wrapper">
          <StatsTableGoals
            players={playersGoals}
            goal="Goals"
            title="Top Scorers"
          />
        </div>
        <div className="table-wrapper">
          <StatsTablePoints
            players={playersPoints}
            point="Points"
            title="Top Points"
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
