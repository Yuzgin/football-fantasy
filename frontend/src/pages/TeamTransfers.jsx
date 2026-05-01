import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import TeamPlayer from '../components/TeamForm';
import PlayerModal from '../components/PlayerModal';
import SelectedPlayerDetailModal from '../components/SelectedPlayerDetailModal';
import '../styles/CreateTeam.css'; // Reuse the CSS file from CreateTeam
import Header from '../components/Header';

const formations = {
    "4-4-2": ["Defender-1", "Defender-2", "Defender-3", "Defender-4", "Midfielder-1", "Midfielder-2", "Midfielder-3", "Midfielder-4", "Attacker-1", "Attacker-2"],
};

const TeamTransfers = () => {
    const [players, setPlayers] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState({});
    const [budget, setBudget] = useState(100);
    const selectedFormation = "4-4-2";
    const [currentPosition, setCurrentPosition] = useState(null);
    const [showPlayerModal, setShowPlayerModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [teamName, setTeamName] = useState('');
    const [captainPlayerId, setCaptainPlayerId] = useState(null);
    const [playerDetailPosition, setPlayerDetailPosition] = useState(null);
    const [submitError, setSubmitError] = useState('');

    const fetchTeamAndPlayers = useCallback(async () => {
        try {
            const [playersResponse, teamResponse] = await Promise.all([
                api.get('/api/players/'),
                api.get('/api/team/')
            ]);

            setPlayers(playersResponse.data);

            const teamData = teamResponse.data;
            setTeamName(teamData.name ?? '');
            const initialSelectedPlayers = {};

            let teamValue = 0;
            const positionMapping = {
                Goalkeeper: [],
                Defender: [],
                Midfielder: [],
                Attacker: []
            };

            teamData.players.forEach(player => {
                if (positionMapping[player.position]) {
                    positionMapping[player.position].push(player.id);
                }
                teamValue += Number(player.price);
            });

            // Ensure a goalkeeper is assigned if available
            if (positionMapping.Goalkeeper.length > 0) {
                initialSelectedPlayers["Goalkeeper"] = positionMapping.Goalkeeper.shift();
            }

            // Populate the positions based on the selected formation
            formations[selectedFormation].forEach((position) => {
                const basePosition = position.split('-')[0]; // e.g., "Defender"
                if (positionMapping[basePosition] && positionMapping[basePosition].length > 0) {
                    initialSelectedPlayers[position] = positionMapping[basePosition].shift(); // Assign the first available player
                }
            });

            // Populate any remaining players that don't fit the selected formation
            Object.keys(positionMapping).forEach(positionType => {
                const remainingPositions = positionMapping[positionType];
                remainingPositions.forEach((playerId) => {
                    // Find the next available position slot that hasn't been filled
                    const availablePosition = Object.keys(formations[selectedFormation])
                        .find(key => !initialSelectedPlayers[key] && key.startsWith(positionType));

                    if (availablePosition) {
                        initialSelectedPlayers[availablePosition] = playerId;
                    } else {
                        // Create an additional position if needed
                        const extraPosition = `${positionType}-${Object.keys(initialSelectedPlayers).filter(pos => pos.startsWith(positionType)).length + 1}`;
                        initialSelectedPlayers[extraPosition] = playerId;
                    }
                });
            });

            setSelectedPlayers(initialSelectedPlayers);
            setBudget(100 - teamValue);

            const capId = teamData.captain?.id ?? null;
            const squadIds = Object.values(initialSelectedPlayers).filter((id) => id != null);
            setCaptainPlayerId(capId != null && squadIds.includes(capId) ? capId : null);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTeamAndPlayers();
    }, [fetchTeamAndPlayers]);

    const squadPlayerIds = () =>
        Object.values(selectedPlayers).filter((id) => id != null);

    const isSquadComplete = () =>
        getSelectedPlayerCount() === 10 && Boolean(selectedPlayers.Goalkeeper);

    const handleUpdateTeam = async (event) => {
        event.preventDefault();
        setSubmitError('');
        if (!captainPlayerId || !squadPlayerIds().includes(captainPlayerId)) {
            setSubmitError('Pick a Captain');
            return;
        }
        try {
            const payload = {
                name: teamName,
                players: squadPlayerIds(),
                captain: captainPlayerId,
            };
            await api.put('/api/team/', payload);
            window.location.href = '/team';
        } catch (error) {
            console.error('Error updating team:', error);
            const msg = error.response?.data?.error;
            setSubmitError(typeof msg === 'string' ? msg : 'Could not save team. Try again.');
        }
    };

    const handlePlayerSelect = (playerId) => {
        const player = players.find((p) => p.id === playerId);
        const oldId = selectedPlayers[currentPosition];
        if (budget - Number(player.price) >= 0) {
            setCaptainPlayerId((c) => (c === oldId ? null : c));
            setSelectedPlayers((prevSelectedPlayers) => ({
                ...prevSelectedPlayers,
                [currentPosition]: playerId,
            }));
            setBudget((prevBudget) => prevBudget - Number(player.price));
            setShowPlayerModal(false);
            setCurrentPosition(null);
        }
    };

    const handlePlayerDeselect = (position) => {
        const playerId = selectedPlayers[position];
        const player = players.find((p) => p.id === playerId);
        setCaptainPlayerId((c) => (c === playerId ? null : c));
        setSelectedPlayers((prevSelectedPlayers) => {
            const updatedPlayers = { ...prevSelectedPlayers };
            delete updatedPlayers[position];
            return updatedPlayers;
        });
        setBudget((prevBudget) => prevBudget + Number(player.price));
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
                    openOccupiedPlayerDetail={openOccupiedPlayerDetail}
                    isCaptain={playerAssigned != null && captainPlayerId === playerAssigned}
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
                            {player.name} - £{Number(player.price)}m
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
                    <form onSubmit={handleUpdateTeam}>
                    <div className="budget-display">Budget: £{Number(budget).toFixed(1)}m</div>

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

                        <div className="selected-players">
                            {renderSelectedPlayers()}
                        </div>

                        <button
                            type="submit"
                            disabled={
                                !isSquadComplete() ||
                                captainPlayerId == null ||
                                !squadPlayerIds().includes(captainPlayerId)
                            }
                        >
                            Update Team
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
        </div>
        </div>
    );
};

export default TeamTransfers;
