import React from 'react';

const MatchList = ({ matches, deleteMatch }) => {
  return (
    <div>
      <h2>Matches</h2>
      <ul>
        {matches.map(match => (
          <li key={match.id}>
            {match.team1} vs {match.team2} on {match.date}
            <button onClick={() => deleteMatch(match.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MatchList;
