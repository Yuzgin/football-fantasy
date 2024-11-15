import React from 'react';
import '../styles/Table.css';

const StatTable = ({ players, stat, title }) => {
    const statLow = stat.toLowerCase();
    
    // Sort players and slice to get the top 5
    const top5Players = [...players]
        .sort((a, b) => b[statLow] - a[statLow])
        .slice(0, 5);

    return (
        <table className="team-table">
            <thead>
                <tr>
                    <th>{title}</th>
                    <th>{stat}</th>
                </tr>
            </thead>
            <tbody>
                {top5Players.map((player) => (
                    <tr key={player.id}>
                        <td>{player.name}</td>
                        <td>{player[statLow]}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default StatTable;
