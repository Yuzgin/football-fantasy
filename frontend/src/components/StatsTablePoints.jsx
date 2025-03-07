import React from 'react';
import '../styles/Table.css';

const StatsTablePoints = ({ players, point, title }) => {
    const pointLow = point.toLowerCase();

    // Debugging the props passed to the component
    console.log('Players Data:', players);
    console.log('Point Field:', pointLow);
    
    // Sort players and slice to get the top 5
    const top5Players = [...players]
        .sort((a, b) => b[pointLow] - a[pointLow])
        .slice(0, 5);

    return (
        <table className="team-table">
            <thead>
                <tr>
                    <th>{title}</th>
                    <th>{point}</th>
                </tr>
            </thead>
            <tbody>
                {top5Players.map((player) => (
                    <tr key={player.id}>
                        <td>{player.name}</td>
                        <td>{player[pointLow]}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default StatsTablePoints;
