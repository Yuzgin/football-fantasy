import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import Header from '../components/Header';
import PlayerViewPoints from '../components/PlayerViewPoints';
import PlayerStats from '../components/PlayerStats';

const formations = {
  "4-4-2": ["Defender-1", "Defender-2", "Defender-3", "Defender-4", "Midfielder-1", "Midfielder-2", "Midfielder-3", "Midfielder-4", "Attacker-1", "Attacker-2"],
};

const OtherTeam = () => {
  const [players, setPlayers] = useState([]);
  const { teamId } = useParams(); // Extract the teamId from the URL parameters
  const [teamSnapshot, setTeamSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamValue, setTeamValue] = useState(0);
  const [selectedPlayers, setSelectedPlayers] = useState({});
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const selectedFormation = "4-4-2";

  useEffect(() => {
    fetchMostRecentTeamSnapshot();
  }, [teamId]);

  const fetchMostRecentTeamSnapshot = async () => {
    try {
      // Call the backend to get the most recent snapshot for the team
      const [playersResponse, response] = await Promise.all([
        api.get('/api/players/'),
        api.get(`/api/team-snapshots/most_recent/?team_id=${teamId}`),
    ]);
      setTeamSnapshot(response.data);
      setPlayers(playersResponse.data)

      const teamSnapshotData = response.data;
      const initialSelectedPlayers = {};

      const positionMapping = {
        Goalkeeper: [],
        Defender: [],
        Midfielder: [],
        Attacker: []
    };

    teamSnapshotData.players.forEach(player => {
      if (positionMapping[player.position]) {
          positionMapping[player.position].push(player.id);
      }
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


      const totalValue = teamSnapshotData.players.reduce((total, player) => total + player.price, 0);
      setTeamValue(totalValue);
    } catch (error) {
      console.error('Error fetching team snapshot:', error);
      setTeamSnapshot(null);
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
            <PlayerViewPoints
              key={position}
              selectedPlayer={players.find((p) => p.id === playerAssigned)}
              openPlayerStats={openPlayerStats}
              gameWeekStartDate={teamSnapshot.game_week.start_date}
              gameWeekEndDate={teamSnapshot.game_week.end_date} 
            />
        );
    }
    return null;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!teamSnapshot) {
    return <div>Team snapshot not found for the most recent game week.</div>;
  }

  return (
    // <div>
    //   <Header />
    //   <h1>{teamSnapshot.team.name} - Latest GameWeek Snapshot</h1>
    //   <p>
    //     GameWeek: {teamSnapshot.game_week.start_date} to {teamSnapshot.game_week.end_date}
    //   </p>
    //   <p>Total Weekly Points: {teamSnapshot.weekly_points}</p>
    //   <p>Total Team Value: £{teamValue}m</p>
    //   <div className="team-container">
    //               <div className="team-formation">
    //                   <div className="position-group">
    //                       <PlayerViewPoints
    //                           position="Goalkeeper"
    //                           selectedPlayer={players.find((p) => p.id === selectedPlayers["Goalkeeper"])}
    //                       />
    //                   </div>

    //                   <div className="position-group">
    //                       {formations[selectedFormation]
    //                           .filter(position => position.startsWith("Defender"))
    //                           .map(position => renderTeamPlayer(position))}
    //                       {(additionalDefenderAllowed || selectedPlayers["Defender-5"]) && renderTeamPlayer("Defender-5")}
    //                   </div>

    //                   <div className="position-group">
    //                       {formations[selectedFormation]
    //                           .filter(position => position.startsWith("Midfielder"))
    //                           .map(position => renderTeamPlayer(position))}
    //                       {(additionalMidfielderAllowed || selectedPlayers["Midfielder-5"]) && renderTeamPlayer("Midfielder-5")}
    //                   </div>

    //                   <div className="position-group">
    //                       {formations[selectedFormation]
    //                           .filter(position => position.startsWith("Attacker"))
    //                           .map(position => {
    //                               if (position === "Attacker-2" && onlyOneAttackerAllowed && !selectedPlayers["Attacker-2"]) {
    //                                   return null;
    //                               }
    //                               return renderTeamPlayer(position);
    //                           })}
    //                       {(additionalAttackerAllowed || selectedPlayers["Attacker-3"]) && renderTeamPlayer("Attacker-3")}
    //                   </div>
    //               </div>
    //           </div>
    //           {showPlayerStats && (
    //         <PlayerStats
    //             selectedPlayer={selectedPlayer}
    //             closeStats={() => setShowPlayerStats(false)}
    //         />
    //         )}      
    // </div>

    <div>
    <Header />
    <div className="team-and-controls">
        <div className="team-container">
            <div className="team-formation">
                <div className="position-group">
                    <PlayerViewPoints
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

        <div className="controls-container">
        <h2>{teamSnapshot.team.name} - Gameweek {teamSnapshot.game_week.week}</h2>
        <p>
         Gameweek: {teamSnapshot.game_week.start_date} to {teamSnapshot.game_week.end_date}
        </p>
        <p>Total Weekly Points: {teamSnapshot.weekly_points}</p>
        <p>Total Team Value: £{teamValue}m</p>
        </div>
    </div>
    {showPlayerStats && (
      <PlayerStats
          selectedPlayer={selectedPlayer}
          closeStats={() => setShowPlayerStats(false)}
      />
      )}
    </div>
  );
};

export default OtherTeam;


{/* <PlayerTable 
      players={teamSnapshot.players} 
      gameWeekStartDate={teamSnapshot.game_week.start_date} 
      gameWeekEndDate={teamSnapshot.game_week.end_date} 
      /> */}