import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import Header from '../components/Header';
import PlayerViewPoints from '../components/PlayerViewPoints';
import PlayerStats from '../components/PlayerStats';
import '../styles/Modal.css';
import '../styles/OtherTeam.css';

const OtherTeam = () => {
  const [players, setPlayers] = useState([]);
  const { teamId } = useParams();
  const [teamSnapshot, setTeamSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamValue, setTeamValue] = useState(0);
  const [selectedPlayers, setSelectedPlayers] = useState({});
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [maxWeek, setMaxWeek] = useState(null);

  useEffect(() => {
    fetchMostRecentTeamSnapshot();
  }, [teamId]);

  const fetchMostRecentTeamSnapshot = async () => {
    try {
      const [playersResponse, response] = await Promise.all([
        api.get('/api/players/'),
        api.get(`/api/team-snapshots/most_recent/?team_id=${teamId}`),
      ]);

      const teamSnapshotData = response.data;
      setTeamSnapshot(teamSnapshotData);
      setPlayers(playersResponse.data);

      setCurrentWeek(teamSnapshotData.game_week.week);
      setMaxWeek(teamSnapshotData.game_week.week);

      const selectedPlayers = mapPlayersToPositions(teamSnapshotData.players);
      setSelectedPlayers(selectedPlayers);
      setTeamValue(teamSnapshotData.players.reduce((total, player) => total + player.price, 0));
    } catch (error) {
      console.error('Error fetching team snapshot:', error);
      setTeamSnapshot(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamSnapshotForWeek = async (week) => {
    try {
      setLoading(true);
      const gameWeekResponse = await api.get(`/api/game-weeks/?week=${week}`);
      const gameWeekData = gameWeekResponse.data;

      if (!gameWeekData || gameWeekData.length === 0) {
        throw new Error("Game week not found for the provided week.");
      }

      const gameWeekId = gameWeekData[0].id;

      const snapshotResponse = await api.get(`/api/team-snapshots/?team_id=${teamId}&game_week_id=${gameWeekId}`);
      const teamSnapshotDataArray = snapshotResponse.data;

      if (!teamSnapshotDataArray || teamSnapshotDataArray.length === 0) {
        throw new Error("No team snapshot data found for this game week.");
      }

      const teamSnapshotData = teamSnapshotDataArray[0];
      setTeamSnapshot(teamSnapshotData);
      setCurrentWeek(week);

      const selectedPlayers = mapPlayersToPositions(teamSnapshotData.players);
      setSelectedPlayers(selectedPlayers);
      setTeamValue(teamSnapshotData.players.reduce((total, player) => total + player.price, 0));
    } catch (error) {
      console.error('Error fetching team snapshot for week:', error);
      setTeamSnapshot(null);
    } finally {
      setLoading(false);
    }
  };

  const mapPlayersToPositions = (players) => {
    const positionMapping = { Goalkeeper: [], Defender: [], Midfielder: [], Attacker: [] };

    players.forEach(player => {
      if (positionMapping[player.position]) {
        positionMapping[player.position].push(player.id);
      }
    });

    return positionMapping;
  };

  const handlePrevWeek = () => {
    if (currentWeek > 1) {
      fetchTeamSnapshotForWeek(currentWeek - 1);
    }
  };

  const handleNextWeek = () => {
    if (currentWeek < maxWeek) {
      fetchTeamSnapshotForWeek(currentWeek + 1);
    }
  };

  const openPlayerStats = (player) => {
    setSelectedPlayer(player);
    setShowPlayerStats(true);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!teamSnapshot) {
    return <div>Team snapshot not found for the most recent game week.</div>;
  }

  return (
    <div>
      <Header />
      <div className="team-and-controls">
        <div className="team-container">
          <div className="team-formation">
            {/* Render goalkeepers */}
            {selectedPlayers.Goalkeeper.length > 0 && (
              <div className="position-group">
                <PlayerViewPoints
                  position="Goalkeeper"
                  selectedPlayer={players.find((p) => p.id === selectedPlayers.Goalkeeper[0])}
                  gameWeekId={teamSnapshot.game_week.id}
                  openPlayerStats={openPlayerStats}
                />
              </div>
            )}

            {/* Render defenders */}
            {selectedPlayers.Defender.length > 0 && (
              <div className="position-group">
                {selectedPlayers.Defender.map((defenderId) => (
                  <PlayerViewPoints
                    key={defenderId}
                    selectedPlayer={players.find(p => p.id === defenderId)}
                    gameWeekId={teamSnapshot.game_week.id}
                    openPlayerStats={openPlayerStats}
                  />
                ))}
              </div>
            )}

            {/* Render midfielders */}
            {selectedPlayers.Midfielder.length > 0 && (
              <div className="position-group">
                {selectedPlayers.Midfielder.map((midfielderId) => (
                  <PlayerViewPoints
                    key={midfielderId}
                    selectedPlayer={players.find(p => p.id === midfielderId)}
                    gameWeekId={teamSnapshot.game_week.id}
                    openPlayerStats={openPlayerStats}
                  />
                ))}
              </div>
            )}

            {/* Render attackers */}
            {selectedPlayers.Attacker.length > 0 && (
              <div className="position-group">
                {selectedPlayers.Attacker.map((attackerId) => (
                  <PlayerViewPoints
                    key={attackerId}
                    selectedPlayer={players.find(p => p.id === attackerId)}
                    gameWeekId={teamSnapshot.game_week.id}
                    openPlayerStats={openPlayerStats}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="controls-container">
          <h2>{teamSnapshot.team.name}: Gameweek {teamSnapshot.game_week.week}</h2>
          <p>Points: {teamSnapshot.weekly_points}</p>
          <p>Team Value: £{teamValue}m</p>

          {/* Navigation buttons */}
          <button
            className="close"
            onClick={handlePrevWeek}
            disabled={currentWeek === 1}
          >
            Previous Week
          </button>

          <button
            className="close"
            onClick={handleNextWeek}
            disabled={currentWeek === maxWeek}
          >
            Next Week
          </button>
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
