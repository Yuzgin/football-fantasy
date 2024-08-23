import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import api from '../api';
import PlayerTable from '../components/PlayerTable';
import Header from '../components/Header';

const OtherTeam = () => {
  const { teamId } = useParams(); // Extract the teamId from the URL parameters
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamValue, setTeamValue] = useState(0);

  useEffect(() => {
    fetchTeam();
  }, [teamId]);

  const fetchTeam = async () => {
    try {
      const response = await api.get(`/api/team/${teamId}/`);
      console.log('Fetched team:', response.data);
      setTeam(response.data);
      const totalValue = response.data.players.reduce((total, player) => {
        return total + player.price;
      }, 0);
      setTeamValue(totalValue);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setTeam(null);
      } else {
        console.error('Error fetching team:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (team === null) {
    return <div>Team not found or does not exist.</div>;
  }

  return (
    <div>
      <Header />
      <h1>{team.name}</h1>
      <PlayerTable players={team.players} />
    </div>
  );
};

export default OtherTeam;
