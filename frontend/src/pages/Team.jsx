import React, { useEffect, useState } from 'react';
import api from '../api';
import { Navigate } from 'react-router-dom';
import TeamInfo from '../components/TeamInfo';
import PlayerTable from '../components/PlayerTable';
import HomeButton from '../components/HomeButton';
import LogoutButton from '../components/LogoutButton';
import TransfersButton from '../components/TransfersButtton'

const TeamPage = () => {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamValue, setTeamValue] = useState(0);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const response = await api.get('/api/team/');
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

  const handleDeleteTeam = async () => {
    try {
      await api.delete('/api/team/delete/');
      setTeam(null);
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (team === null) {
    return <Navigate to="/createteam" replace />;
  }

  return (
    <div>
      <TeamInfo team={team} handleDeleteTeam={handleDeleteTeam} value={teamValue} />
      <PlayerTable players={team.players} />
      <HomeButton />
      <TransfersButton />
      <LogoutButton />
    </div>
  );
};

export default TeamPage;
