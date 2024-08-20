import React, { useState, useEffect } from 'react';
import api from '../api';
import TeamTransferForm from '../components/TeamTransferForm';
import SelectedPlayers from '../components/SelectedPlayers';
import HomeButton from '../components/HomeButton';
import LogoutButton from '../components/LogoutButton';
import PlayerModal from '../components/PlayerModal';

const formations = {
    "4-4-2": ["Goalkeeper", "Defender-1", "Defender-2", "Defender-3", "Defender-4", "Midfielder-1", "Midfielder-2", "Midfielder-3", "Midfielder-4", "Attacker-1", "Attacker-2"],
    // Add more formations if needed
};

const TeamTransfers = () => {
    const [players, setPlayers] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState({});
    const [budget, setBudget] = useState(100);
    const [selectedFormation, setSelectedFormation] = useState("4-4-2");
    const [currentPosition, setCurrentPosition] = useState(null);
    const [showPlayerModal, setShowPlayerModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTeamAndPlayers();
    }, []);

    const fetchTeamAndPlayers = async () => {
        try {
            const [playersResponse, teamResponse] = await Promise.all([
                api.get('/api/players/'),
                api.get('/api/team/')
            ]);

            setPlayers(playersResponse.data);

            const teamData = teamResponse.data;
            const initialSelectedPlayers = {};

            // First, map the base positions to the players
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
            });

            teamData.players.forEach(player => {
                teamValue += player.price;
            });

            // Then, assign these players to specific positions in the selected formation
            formations[selectedFormation].forEach((position, index) => {
                const basePosition = position.split('-')[0]; // e.g., "Defender"
                if (positionMapping[basePosition] && positionMapping[basePosition].length > 0) {
                    initialSelectedPlayers[position] = positionMapping[basePosition].shift(); // Assign the first available player
                }
            });

            setSelectedPlayers(initialSelectedPlayers);
            setBudget(100 - teamValue);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTeam = async (event) => {
        event.preventDefault();
        try {
            const teamData = { players: Object.values(selectedPlayers), formation: selectedFormation };
            await api.put('/api/team/', teamData);
            window.location.href = '/team';
        } catch (error) {
            console.error('Error updating team:', error);
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

    return (
        <div>
            <p></p>
            <TeamTransferForm
                selectedPlayers={selectedPlayers}
                players={players}
                isPlayerSelected={isPlayerSelected}
                handlePlayerSelect={handlePlayerSelect}
                handlePlayerDeselect={handlePlayerDeselect}
                handleUpdateTeam={handleUpdateTeam}
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

export default TeamTransfers;
