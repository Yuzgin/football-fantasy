import React from 'react';
import PlayerStatForm from './PlayerStatForm';
import '../styles/CreateMatchForm.css';

const CreateMatchForm = ({
  team1,
  setTeam1,
  team2,
  setTeam2,
  team1_score,
  setTeam1_score,
  team2_score,
  setTeam2_score,
  date,
  setDate,
  playersStats,
  setPlayersStats,
  players,
  handlePlayerStatChange,
  addPlayerStat,
  createMatch,
}) => {
  return (
    <div>
      <h2>Create Match</h2>
      <form onSubmit={createMatch}>
        <input type="text" placeholder="Team 1" value={team1} onChange={(e) => setTeam1(e.target.value)} />
        <input type="text" placeholder="Team 2" value={team2} onChange={(e) => setTeam2(e.target.value)} />
        <input type="number" placeholder="Team 1 score" value={team1_score} onChange={(e) => setTeam1_score(e.target.value)} />
        <input type="number" placeholder="Team 2 score" value={team2_score} onChange={(e) => setTeam2_score(e.target.value)} />
        <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
        <h3>Player Stats</h3>
        {playersStats.map((stat, index) => (
          <PlayerStatForm
            key={index}
            index={index}
            stat={stat}
            players={players}
            handlePlayerStatChange={handlePlayerStatChange}
          />
        ))}
        <button type="button" onClick={addPlayerStat}>Add Player Stat</button>
        <button type="submit">Create Match</button>
      </form>
    </div>
  );
};

export default CreateMatchForm;