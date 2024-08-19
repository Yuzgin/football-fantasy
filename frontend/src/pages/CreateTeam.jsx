import React, { useEffect, useState } from 'react';
import api from '../api';
import { Navigate } from 'react-router-dom';
import TeamForm from '../components/TeamForm';
import SelectedPlayers from '../components/SelectedPlayers';
import HomeButton from '../components/HomeButton';
import LogoutButton from '../components/LogoutButton';
import PlayerModal from '../components/PlayerModal';

const formations = {
  "4-4-2": ["Goalkeeper", "Defender-1", "Defender-2", "Defender-3", "Defender-4", "Midfielder-1", "Midfielder-2", "Midfielder-3", "Midfielder-4", "Attacker-1", "Attacker-2"],
  "4-3-3": ["Goalkeeper", "Defender", "Defender", "Defender", "Defender", "Midfielder", "Midfielder", "Midfielder", "Attacker", "Attacker", "Attacker"],
  "3-5-2": ["Goalkeeper", "Defender", "Defender", "Defender", "Midfielder", "Midfielder", "Midfielder", "Midfielder", "Midfielder", "Attacker", "Attacker"],
  // Add more formations if needed
};

const CreateTeam = () => {
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState({});
  const [hasTeam, setHasTeam] = useState(false);
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState(100);
  const [selectedFormation, setSelectedFormation] = useState("4-4-2");
  const [currentPosition, setCurrentPosition] = useState(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);

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
      const teamData = { name, players: Object.values(selectedPlayers) };
      await api.post('/api/team/', teamData);
      // Redirect to the team page
      window.location.href = '/team';
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const handlePlayerSelect = (playerId) => {
    const player = players.find((p) => p.id === playerId);
    if (budget - player.price >= 0) {
      setSelectedPlayers((prevSelectedPlayers) => ({
        ...prevSelectedPlayers,
        [currentPosition]: playerId,
      }));
      setBudget((prevBudget) => prevBudget - player.price);
      setShowPlayerModal(false);
      setCurrentPosition(null);
    }
  };

  const handlePlayerDeselect = (position) => {
    const playerId = selectedPlayers[position];
    const player = players.find((p) => p.id === playerId);
    setSelectedPlayers((prevSelectedPlayers) => {
      const updatedPlayers = { ...prevSelectedPlayers };
      delete updatedPlayers[position];
      return updatedPlayers;
    });
    setBudget((prevBudget) => prevBudget + player.price);
  };

  const isPlayerSelected = (playerId) => Object.values(selectedPlayers).includes(playerId);

  const openPlayerModal = (position) => {
    setCurrentPosition(position);
    setShowPlayerModal(true);
  };

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
        formations={formations}
        selectedFormation={selectedFormation}
        setSelectedFormation={setSelectedFormation}
        budget={budget}
        openPlayerModal={openPlayerModal}
      />
      <SelectedPlayers selectedPlayers={selectedPlayers} players={players} />
      <HomeButton />
      <LogoutButton />

      {showPlayerModal && (
        <PlayerModal
          players={players}
          isPlayerSelected={isPlayerSelected}
          handlePlayerSelect={handlePlayerSelect}
          closeModal={() => setShowPlayerModal(false)}
          position={currentPosition}
        />
      )}
    </div>
  );
};

export default CreateTeam;
