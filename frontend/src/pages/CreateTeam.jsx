import React, { useEffect, useState } from 'react';
import api from '../api';
import { Navigate } from 'react-router-dom';
import TeamPlayer from '../components/TeamForm';
import PlayerModal from '../components/PlayerModal';
import Header from '../components/Header';
import '../styles/CreateTeam.css'; // Import the CSS file

const formations = {
  "4-4-2": ["Defender-1", "Defender-2", "Defender-3", "Defender-4", "Midfielder-1", "Midfielder-2", "Midfielder-3", "Midfielder-4", "Attacker-1", "Attacker-2"],
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

  const getSelectedPlayerCount = () => 
    Object.keys(selectedPlayers).filter(position => position !== "Goalkeeper").length;

  const getPositionCount = (positionType) =>
    Object.keys(selectedPlayers).filter((pos) => pos.startsWith(positionType)).length;

  const additionalDefenderAllowed =
    getPositionCount('Defender') === 4 &&
    getPositionCount('Midfielder') < 5 &&
    getSelectedPlayerCount() <= 9;

  const additionalMidfielderAllowed =
    getPositionCount('Midfielder') === 4 &&
    getPositionCount('Defender') < 5 &&
    getSelectedPlayerCount() <= 9;

  const additionalAttackerAllowed =
    getPositionCount('Attacker') === 2 && getSelectedPlayerCount() <= 9;

  const onlyOneAttackerAllowed =
    (getPositionCount('Defender') === 4 && getPositionCount('Midfielder') === 5) ||
    (getPositionCount('Defender') === 5 && getPositionCount('Midfielder') === 4);

  const renderTeamPlayer = (position) => {
    const totalSelectedPlayers = getSelectedPlayerCount();
    const playerAssigned = selectedPlayers[position];

    if (totalSelectedPlayers < 10 || playerAssigned) {
      return (
        <TeamPlayer
          key={position}
          position={position}
          selectedPlayer={players.find((p) => p.id === playerAssigned)}
          openPlayerModal={openPlayerModal}
          handlePlayerDeselect={handlePlayerDeselect}
        />
      );
    }
    return null;
  };

  const renderSelectedPlayers = () => {
    const positions = ["Goalkeeper", "Defender", "Midfielder", "Attacker"];
    return positions.map((positionType) => {
      const selectedInPosition = Object.keys(selectedPlayers)
        .filter((pos) => pos.startsWith(positionType))
        .map((pos) => {
          const player = players.find((p) => p.id === selectedPlayers[pos]);
          return player ? (
            <div key={pos}>
              {player.name} - £{player.price}m
            </div>
          ) : null;
        });
      return selectedInPosition.length > 0 ? (
        <div key={positionType}>
          <strong>{positionType}s:</strong>
          {selectedInPosition}
        </div>
      ) : null;
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (hasTeam) {
    return <Navigate to="/team" replace />;
  }

  return (
    <div>
      <Header />
      <div className="content-wrapper">
        <div className="team-and-controls">
          <div className="team-container">
            <div className="team-formation">
              <div className="position-group">
                <TeamPlayer
                  position="Goalkeeper"
                  selectedPlayer={players.find((p) => p.id === selectedPlayers["Goalkeeper"])}
                  openPlayerModal={openPlayerModal}
                  handlePlayerDeselect={handlePlayerDeselect}
                />
              </div>

              <div className="position-group">
                {formations[selectedFormation]
                  .filter(position => position.startsWith("Defender"))
                  .map(position => renderTeamPlayer(position))}
                {(additionalDefenderAllowed || selectedPlayers["Defender-5"]) && renderTeamPlayer("Defender-5")}
              </div>

              <div className="position-group">
                {formations[selectedFormation]
                  .filter(position => position.startsWith("Midfielder"))
                  .map(position => renderTeamPlayer(position))}
                {(additionalMidfielderAllowed || selectedPlayers["Midfielder-5"]) && renderTeamPlayer("Midfielder-5")}
              </div>

              <div className="position-group">
                {formations[selectedFormation]
                  .filter(position => position.startsWith("Attacker"))
                  .map(position => {
                    if (position === "Attacker-2" && onlyOneAttackerAllowed && !selectedPlayers["Attacker-2"]) {
                      return null;
                    }
                    return renderTeamPlayer(position);
                  })}
                {(additionalAttackerAllowed || selectedPlayers["Attacker-3"]) && renderTeamPlayer("Attacker-3")}
              </div>
            </div>
          </div>

          <div className="controls-container">
            <form onSubmit={handleCreateTeam}>
              <label htmlFor="name">Team Name:</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div className="budget-display">Budget: £{budget.toFixed(1)}m</div>

              <div className="selected-players">
                {renderSelectedPlayers()}
              </div>

              <button type="submit" disabled={getSelectedPlayerCount() !== 10 || !selectedPlayers["Goalkeeper"]}>
                Create Team
              </button>
            </form>
          </div>
        </div>

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
    </div>
  );
};

export default CreateTeam;
