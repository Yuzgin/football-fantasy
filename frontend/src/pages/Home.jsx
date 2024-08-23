import React, { useState, useEffect } from 'react';
import api from '../api';
import Header from '../components/Header';
import TeamTable from '../components/TeamTable';

const Home = () => {

  const [teams, setTeams] = useState([]);

  useEffect(() => {
    getTeams();
  }, []);

  const getTeams = () => {
    api.get('/api/teams/')
      .then((res) => res.data)
      .then((data) => {
        setTeams(data);
      })
      .catch((err) => alert(`Error fetching teams: ${err.message}`));
    };
  

  return (
    <div>
      <Header />
      <TeamTable
        teams={teams}
      />
    </div>
  );
};

export default Home;