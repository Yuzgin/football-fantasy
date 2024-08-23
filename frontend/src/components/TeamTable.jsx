import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TeamTable.css';

const TeamTable = ({ teams }) => {
    const navigate = useNavigate(); // Hook to programmatically navigate

    const handleRowClick = (teamId) => {
        navigate(`/team/${teamId}`); // Navigate to the team detail page
    };

    return (
        <table className="team-table">
            <thead>
                <tr>
                    <th>Team</th>
                    <th>Points</th>
                </tr>
            </thead>
            <tbody>
                {teams.map((team) => (
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
