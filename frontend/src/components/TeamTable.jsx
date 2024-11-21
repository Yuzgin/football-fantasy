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
                    <th style={{ width: '200px' }}>Fantasy League Table</th> {/* Adjust header cell width */}
                    <th>Points</th>
                </tr>
            </thead>
            <tbody>
                {sortedTeams.map((team, index) => (
                    <tr
                        key={team.id}
                        onClick={() => handleRowClick(team.id)}
                        style={{
                            cursor: 'pointer',
                            ...(index === 0 && { fontWeight: 'bold', fontSize: '18px' }), // Highlight the first row
                        }}
                    >
                        <td style={index === 0 ? { width: '200px' } : {}}>{team.name}</td>
                        <td>{team.total_points}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default TeamTable;
