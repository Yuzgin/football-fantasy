import React from 'react';
import '../styles/TeamTable.css';

const TeamTable =({
    teams
}) => {

    return (
        <table>
            <thead>
                <tr>
                    <th>Team</th>
                    <th>Points</th>
                </tr>
            </thead>
            <tbody>
                {teams.map((team) =>(
                    <tr key={team.id}>
                        <td>{team.name}</td>
                        <td>{team.total_points}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default TeamTable