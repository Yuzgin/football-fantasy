import { useCallback, useEffect, useState } from 'react';
import api from '../api';
import { Navigate } from 'react-router-dom';
import TeamPlayer from '../components/TeamForm';
import PlayerModal from '../components/PlayerModal';
import SelectedPlayerDetailModal from '../components/SelectedPlayerDetailModal';
import BeastGifOverlay from '../components/BeastGifOverlay';
import Header from '../components/Header';
import { isBeastPlayer } from '../utils/beastPlayer';
import '../styles/CreateTeam.css'; // Import the CSS file

const formations = {
  "4-4-2": [
    "Defender-1", "Defender-2", "Defender-3", "Defender-4",
    "Midfielder-1", "Midfielder-2", "Midfielder-3", "Midfielder-4",
    "Attacker-1", "Attacker-2"
  ],
};

const CreateTeam = () => {
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState({});
  const [hasTeam, setHasTeam] = useState(false);
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState(100);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [playerDetailPosition, setPlayerDetailPosition] = useState(null);
  const [selectedFormation] = useState("4-4-2");
  const [captainPlayerId, setCaptainPlayerId] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [showBeastGif, setShowBeastGif] = useState(false);
  const [beastGifKey, setBeastGifKey] = useState(0);

  const closeBeastGif = useCallback(() => {
    setShowBeastGif(false);
  }, []);

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
      if (response.data) setHasTeam(true);
    } catch (error) {
      if (error.response?.status === 404) {
        setHasTeam(false);
      } else {
        console.error('Error checking team:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const squadPlayerIds = () =>
    Object.values(selectedPlayers).filter((id) => id != null);

  const isSquadComplete = () =>
    getSelectedPlayerCount() === 10 && Boolean(selectedPlayers.Goalkeeper);

  const handleCreateTeam = async (event) => {
    event.preventDefault();
    setSubmitError('');
    if (!captainPlayerId || !squadPlayerIds().includes(captainPlayerId)) {
      setSubmitError('Pick a Captain');
      return;
    }
    try {
      const teamData = {
        name,
        players: squadPlayerIds(),
        captain: captainPlayerId,
      };
      await api.post('/api/team/', teamData);
      window.location.href = '/team';
    } catch (error) {
      console.error('Error creating team:', error);
      const msg = error.response?.data?.error;
      setSubmitError(typeof msg === 'string' ? msg : 'Could not create team. Try again.');
    }
  };

  const handlePlayerSelect = (playerId) => {
    const player = players.find((p) => p.id === playerId);
    const playerPrice = Number(player.price); // Ensure it's a number
    const oldId = selectedPlayers[currentPosition];

    if (budget - playerPrice >= 0) {
      setCaptainPlayerId((c) => (c === oldId ? null : c));
      setSelectedPlayers((prev) => ({
        ...prev,
        [currentPosition]: playerId,
      }));
      setBudget((prev) => prev - playerPrice);
      setShowPlayerModal(false);
      setCurrentPosition(null);
      if (isBeastPlayer(player)) {
        setBeastGifKey((k) => k + 1);
        setShowBeastGif(true);
      }
    }
  };

  const handlePlayerDeselect = (position) => {
    const playerId = selectedPlayers[position];
    const player = players.find((p) => p.id === playerId);
    const playerPrice = Number(player.price);

    setCaptainPlayerId((c) => (c === playerId ? null : c));
    setSelectedPlayers((prev) => {
      const updated = { ...prev };
      delete updated[position];
      return updated;
    });
    setBudget((prev) => prev + playerPrice);
  };

  const isPlayerSelected = (playerId) =>
    Object.values(selectedPlayers).includes(playerId);

  const openPlayerModal = (position) => {
    setCurrentPosition(position);
    setShowPlayerModal(true);
  };

  const openOccupiedPlayerDetail = (position) => {
    setPlayerDetailPosition(position);
  };

  const closePlayerDetail = () => setPlayerDetailPosition(null);

  const handleRemoveFromDetail = () => {
    if (playerDetailPosition) {
      handlePlayerDeselect(playerDetailPosition);
    }
    closePlayerDetail();
  };

  const getSelectedPlayerCount = () =>
    Object.keys(selectedPlayers).filter((pos) => pos !== "Goalkeeper").length;

  const getPositionCount = (type) =>
    Object.keys(selectedPlayers).filter((pos) => pos.startsWith(type)).length;

  const additionalDefenderAllowed =
    getPositionCount('Defender') === 4 &&
    getPositionCount('Midfielder') < 5 &&
    getPositionCount('Attacker') < 3 &&
    getSelectedPlayerCount() <= 9;

  const additionalMidfielderAllowed =
    getPositionCount('Midfielder') === 4 &&
    getPositionCount('Defender') < 5 &&
    getPositionCount('Attacker') < 3 &&
    getSelectedPlayerCount() <= 9;

  const additionalAttackerAllowed =
    getPositionCount('Attacker') === 2 &&
    getPositionCount('Midfielder') < 5 &&
    getPositionCount('Defender') < 5 &&
    getSelectedPlayerCount() <= 9;

  const onlyOneAttackerAllowed =
    (getPositionCount('Defender') === 4 && getPositionCount('Midfielder') === 5) ||
    (getPositionCount('Defender') === 5 && getPositionCount('Midfielder') === 4);

  const renderTeamPlayer = (position) => {
    const total = getSelectedPlayerCount();
    const assigned = selectedPlayers[position];

    if (total < 10 || assigned) {
      return (
        <TeamPlayer
          key={position}
          position={position}
          selectedPlayer={players.find((p) => p.id === assigned)}
          openPlayerModal={openPlayerModal}
          openOccupiedPlayerDetail={openOccupiedPlayerDetail}
          isCaptain={assigned != null && captainPlayerId === assigned}
        />
      );
    }
    return null;
  };

  const renderSelectedPlayers = () => {
    const types = ["Goalkeeper", "Defender", "Midfielder", "Attacker"];
    return types.map((type) => {
      const items = Object.keys(selectedPlayers)
        .filter((pos) => pos.startsWith(type))
        .map((pos) => {
          const player = players.find((p) => p.id === selectedPlayers[pos]);
          return player ? <div key={pos}>{player.name} - £{player.price}m</div> : null;
        });
      return items.length > 0 ? (
        <div key={type}>
          <strong>{type}s:</strong>
          {items}
        </div>
      ) : null;
    });
  };

  if (loading) return <div>Loading...</div>;
  if (hasTeam) return <Navigate to="/team" replace />;

  const detailPlayer =
    playerDetailPosition != null
      ? players.find((p) => p.id === selectedPlayers[playerDetailPosition])
      : null;

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
                  openOccupiedPlayerDetail={openOccupiedPlayerDetail}
                  isCaptain={
                    selectedPlayers.Goalkeeper != null &&
                    captainPlayerId === selectedPlayers.Goalkeeper
                  }
                />
              </div>

              <div className="position-group">
                {formations[selectedFormation]
                  .filter((pos) => pos.startsWith("Defender"))
                  .map((pos) => renderTeamPlayer(pos))}
                {(additionalDefenderAllowed || selectedPlayers["Defender-5"]) && renderTeamPlayer("Defender-5")}
              </div>

              <div className="position-group">
                {formations[selectedFormation]
                  .filter((pos) => pos.startsWith("Midfielder"))
                  .map((pos) => renderTeamPlayer(pos))}
                {(additionalMidfielderAllowed || selectedPlayers["Midfielder-5"]) && renderTeamPlayer("Midfielder-5")}
              </div>

              <div className="position-group">
                {formations[selectedFormation]
                  .filter((pos) => pos.startsWith("Attacker"))
                  .map((pos) => {
                    if (pos === "Attacker-2" && onlyOneAttackerAllowed && !selectedPlayers["Attacker-2"]) {
                      return null;
                    }
                    return renderTeamPlayer(pos);
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

              {isSquadComplete() && captainPlayerId == null ? (
                <p className="captain-hint">
                  <strong>Pick a Captain</strong>
                </p>
              ) : null}

              {submitError ? (
                <p className="create-team-error" role="alert">
                  <strong>{submitError}</strong>
                </p>
              ) : null}

              <button
                type="submit"
                disabled={
                  !isSquadComplete() ||
                  captainPlayerId == null ||
                  !squadPlayerIds().includes(captainPlayerId)
                }
              >
                Create Team
              </button>

              <div className="selected-players">
                {renderSelectedPlayers()}
              </div>
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

        {detailPlayer && playerDetailPosition && (
          <SelectedPlayerDetailModal
            player={detailPlayer}
            formationPosition={playerDetailPosition}
            onClose={closePlayerDetail}
            onRemove={handleRemoveFromDetail}
            isCaptain={captainPlayerId === detailPlayer.id}
            onSetCaptain={() => setCaptainPlayerId(detailPlayer.id)}
          />
        )}

        <BeastGifOverlay open={showBeastGif} gifKey={beastGifKey} onClose={closeBeastGif} />
      </div>
    </div>
  );
};

export default CreateTeam;
