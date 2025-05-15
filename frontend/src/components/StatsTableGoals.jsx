import React from 'react';
import '../styles/Table.css';

const StatsTableGoals = ({ players, goal, title }) => {
    const goalLow = goal.toLowerCase();

    // Debugging the props passed to the component
    console.log('Players Data:', players);
    console.log('Goal Field:', goalLow);
    
    // Sort players and slice to get the top 5
    const top5Players = [...players]
        .sort((a, b) => b[goalLow] - a[goalLow])
        .slice(0, 5);

    return (
        <table className="team-table">
            <thead>
                <tr>
                    <th>{title}</th>
                    <th>{goal}</th>
                </tr>
            </thead>
            <tbody>
                {top5Players.map((player) => (
                    <tr key={player.id}>
                        <td>{player.name}</td>
                        <td>{player[goalLow]}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default StatsTableGoals;
