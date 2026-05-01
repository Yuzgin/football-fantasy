import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import Header from '../components/Header';
import PlayerViewPoints from '../components/PlayerViewPoints';
import PlayerStats from '../components/PlayerStats';
import '../styles/Modal.css';
import '../styles/OtherTeam.css';
import '../styles/TeamInfo.css';

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
  const [cupNotStarted, setCupNotStarted] = useState(false);

  useEffect(() => {
    fetchMostRecentTeamSnapshot();
  }, [teamId]);

  const fetchMostRecentTeamSnapshot = async () => {
    try {
      setCupNotStarted(false);
      // Only fetch team snapshot - no need for separate players call
      const response = await api.get(`/api/team-snapshots/most_recent/?team_id=${teamId}`);
      const data = response.data;

      if (data.cup_not_started) {
        setCupNotStarted(true);
        setTeamSnapshot(null);
        setPlayers([]);
        setSelectedPlayers({});
        setTeamValue(0);
        setCurrentWeek(null);
        setMaxWeek(null);
        return;
      }

      const teamSnapshotData = data;

      setTeamSnapshot(teamSnapshotData);
      // Use players from team snapshot instead of separate API call
      setPlayers(teamSnapshotData.players);

      setCurrentWeek(teamSnapshotData.game_week.week);
      setMaxWeek(teamSnapshotData.game_week.week);

      const selectedPlayers = mapPlayersToPositions(teamSnapshotData.players);
      setSelectedPlayers(selectedPlayers);
      setTeamValue(teamSnapshotData.players.reduce((total, player) => total + Number(player.price), 0));
    } catch (error) {
      console.error('Error fetching team snapshot:', error);
      setCupNotStarted(false);
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
      // Use players from team snapshot instead of separate API call
      setPlayers(teamSnapshotData.players);
      setCurrentWeek(week);

      const selectedPlayers = mapPlayersToPositions(teamSnapshotData.players);
      setSelectedPlayers(selectedPlayers);
      setTeamValue(teamSnapshotData.players.reduce((total, player) => total + Number(player.price), 0));
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

  const getPositionCount = (positionType) => {
    if (!selectedPlayers || !selectedPlayers[positionType]) {
      return 0;
    }
    return selectedPlayers[positionType].length;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (cupNotStarted) {
    return (
      <div>
        <Header />
        <div className="content-wrapper other-team--cup-not-started">
          <p className="other-team-cup-message">Check back once the cup has started</p>
        </div>
      </div>
    );
  }

  if (!teamSnapshot) {
    return <div>Team snapshot not found for the most recent game week.</div>;
  }

  return (
    <div>
      <Header />
      <div className="content-wrapper">
      <div className="team-and-controls">
        <div className="team-container">
          <div className="team-formation">
            {/* Render goalkeepers */}
            {selectedPlayers.Goalkeeper.length > 0 && (
              <div className="position-group">
                <PlayerViewPoints
                  position="Goalkeeper"
                  selectedPlayer={teamSnapshot.players.find((p) => p.id === selectedPlayers.Goalkeeper[0])}
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
                    selectedPlayer={teamSnapshot.players.find(p => p.id === defenderId)}
                    gameWeekId={teamSnapshot.game_week.id}
                    openPlayerStats={openPlayerStats}
                  />
                ))}
              </div>
            )}

            {/* Render midfielders */}
            {selectedPlayers.Midfielder.length > 0 && (
              <div className={`position-group ${getPositionCount('Midfielder') === 5 ? 'position-group-5' : ''}`}>
                {selectedPlayers.Midfielder.map((midfielderId) => (
                  <PlayerViewPoints
                    key={midfielderId}
                    selectedPlayer={teamSnapshot.players.find(p => p.id === midfielderId)}
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
                    selectedPlayer={teamSnapshot.players.find(p => p.id === attackerId)}
                    gameWeekId={teamSnapshot.game_week.id}
                    openPlayerStats={openPlayerStats}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="teamdetail-container">
          <div className="team-info">
            <h2>{teamSnapshot.team.name}</h2>
            <p>Gameweek {teamSnapshot.game_week.week}</p>
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

export default OtherTeam;
