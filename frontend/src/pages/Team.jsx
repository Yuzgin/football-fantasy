import React, { useEffect, useState } from 'react';
import api from '../api';
import { Navigate } from 'react-router-dom';
import TeamInfo from '../components/TeamInfo';
import TransfersButton from '../components/TransfersButtton';
import Header from '../components/Header';
import PlayerView from '../components/PlayerView';
import PlayerStats from '../components/PlayerStats';

const formations = {
  "4-4-2": ["Defender-1", "Defender-2", "Defender-3", "Defender-4", "Midfielder-1", "Midfielder-2", "Midfielder-3", "Midfielder-4", "Attacker-1", "Attacker-2"],
};

const TeamPage = () => {
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState({});
  const [budget, setBudget] = useState(100);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [teamValue, setTeamValue] = useState(100);
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const[team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const selectedFormation = "4-4-2";

  useEffect(() => {
      fetchTeamAndPlayers();
  }, []);

  const handleDeleteTeam = async () => {
    try {
      await api.delete('/api/team/delete/');
      setTeam(null);
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  const fetchTeamAndPlayers = async () => {
      try {
          const [playersResponse, teamResponse] = await Promise.all([
              api.get('/api/players/'),
              api.get('/api/team/')
          ]);

          setPlayers(playersResponse.data);

          const teamData = teamResponse.data;
          const initialSelectedPlayers = {};

          setTeam(teamData);

          const totalValue = teamData.players.reduce((total, player) => {
            return total + player.price}, 0);
            setTeamValue(totalValue);

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
              teamValue += player.price;
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
              remainingPositions.forEach((playerId, index) => {
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
      } catch (error) {
          if (error.response && error.response.status === 404) {
            setTeam(null);
          }
      } finally {
          setLoading(false);
      }
  };

  const openPlayerStats = (selectedPlayer) => {
    setSelectedPlayer(selectedPlayer);
    setShowPlayerStats(true);
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
              <PlayerView
                key={position}
                selectedPlayer={players.find((p) => p.id === playerAssigned)}
                openPlayerStats={openPlayerStats}
              />
          );
      }
      return null;
  };

  if (loading) {
      return <div>Loading...</div>;
  }

  if (team === null) {
    return <Navigate to='/createteam' replace />
  }

  return (
      <div>
          <Header />
          <div className="content-wrapper">
          <div className="team-and-controls">
              <div className="team-container">
                  <div className="team-formation">
                      <div className="position-group">
                          <PlayerView
                              position="Goalkeeper"
                              selectedPlayer={players.find((p) => p.id === selectedPlayers["Goalkeeper"])}
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

              <div className="teamdetail-container">
                <TeamInfo team={team} handleDeleteTeam={handleDeleteTeam} value={teamValue} />
                <TransfersButton />
              </div>
          </div>
          {showPlayerStats && (
            <PlayerStats
                selectedPlayer={selectedPlayer}
                closeStats={() => setShowPlayerStats(false)}
            />
            )}
      </div>
      </div>
  );
};

export default TeamPage;


// const TeamPage = () => {
//   const [team, setTeam] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [teamValue, setTeamValue] = useState(0);

//   useEffect(() => {
//     fetchTeam();
//   }, []);

//   const fetchTeam = async () => {
//     try {
//       const response = await api.get('/api/team/');
//       console.log('Fetched team:', response.data);
//       setTeam(response.data);
//       const totalValue = response.data.players.reduce((total, player) => {
//         return total + player.price;
//       }, 0);
//       setTeamValue(totalValue);
//     } catch (error) {
//       if (error.response && error.response.status === 404) {
//         setTeam(null);
//       } else {
//         console.error('Error fetching team:', error);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDeleteTeam = async () => {
//     try {
//       await api.delete('/api/team/delete/');
//       setTeam(null);
//     } catch (error) {
//       console.error('Error deleting team:', error);
//     }
//   };

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   if (team === null) {
//     return <Navigate to="/createteam" replace />;
//   }

//   return (
//     <div>
//       <Header />
//       <TeamInfo team={team} handleDeleteTeam={handleDeleteTeam} value={teamValue} />
//       <PlayerTable players={team.players} />
//       <TransfersButton />
//     </div>
//   );
// };

// export default TeamPage;
