import React, { useEffect, useState } from 'react';
import api from '../api';
import { Navigate } from 'react-router-dom';
import TeamForm from '../components/TeamForm';
import SelectedPlayers from '../components/SelectedPlayers';
import HomeButton from '../components/HomeButton';
import LogoutButton from '../components/LogoutButton';

const CreateTeam = () => {
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [hasTeam, setHasTeam] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayers();
    checkIfUserHasTeam();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await api.get('/api/players/');
      setPlayers(response.data);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const checkIfUserHasTeam = async () => {
    try {
      const response = await api.get('/api/team/');
      if (response.data) {
        setHasTeam(true);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setHasTeam(false);
      } else {
        console.error('Error checking team:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (event) => {
    event.preventDefault();
    try {
      const teamData = { name, players: selectedPlayers };
      const response = await api.post('/api/team/', teamData);
      // Redirect to the team page
      window.location.href = '/team';
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const handlePlayerSelect = (playerId) => {
    if (selectedPlayers.length < 11) {
      setSelectedPlayers((prevSelectedPlayers) => [...prevSelectedPlayers, playerId]);
    }
  };

  const handlePlayerDeselect = (playerId) => {
    setSelectedPlayers((prevSelectedPlayers) =>
      prevSelectedPlayers.filter((id) => id !== playerId)
    );
  };

  const isPlayerSelected = (playerId) => selectedPlayers.includes(playerId);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (hasTeam) {
    return <Navigate to="/team" replace />;
  }

  return (
    <div>
      <p>You do not have a team. Please create one.</p>
      <TeamForm
        name={name}
        setName={setName}
        selectedPlayers={selectedPlayers}
        players={players}
        isPlayerSelected={isPlayerSelected}
        handlePlayerSelect={handlePlayerSelect}
        handlePlayerDeselect={handlePlayerDeselect}
        handleCreateTeam={handleCreateTeam}
      />
      <SelectedPlayers selectedPlayers={selectedPlayers} players={players} />
      <HomeButton />
      <LogoutButton />
    </div>
  );
};

export default CreateTeam;
