import React from 'react';
import '../styles/MatchList.css';

const MatchList = ({ matches, deleteMatch }) => {
  return (
    <div className="match-list-container">
      <h2>Matches</h2>
      <ul className="match-list">
        {matches.map((match) => (
          <li key={match.id} className="match-item">
            <div className="match-info">
              <span className="teams">{match.team1} vs {match.team2}</span>
              <span className="match-date">{new Date(match.date).toLocaleDateString()} {new Date(match.date).toLocaleTimeString()}</span>
            </div>
            <button className="delete-button" onClick={() => deleteMatch(match.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MatchList;
