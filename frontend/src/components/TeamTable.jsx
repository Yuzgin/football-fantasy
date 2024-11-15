import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Table.css';

const TeamTable = ({ teams }) => {
    const navigate = useNavigate(); // Hook to programmatically navigate

    // Sort teams by total points in descending order
    const sortedTeams = [...teams].sort((a, b) => b.total_points - a.total_points);

    const handleRowClick = (teamId) => {
        navigate(`/team/${teamId}`); // Navigate to the team detail page
    };

    return (
        <table className="team-table">
            <thead>
                <tr>
                    <th>Fantasy League Table</th>
                    <th>Points</th>
                </tr>
            </thead>
            <tbody>
                {sortedTeams.map((team) => (
                    <tr key={team.id} onClick={() => handleRowClick(team.id)} style={{ cursor: 'pointer' }}>
                        <td>{team.name}</td>
                        <td>{team.total_points}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default TeamTable;
