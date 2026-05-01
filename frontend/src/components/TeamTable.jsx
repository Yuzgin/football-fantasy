import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Table.css';

const TeamTable = ({ teams }) => {
    const navigate = useNavigate();

    const handleRowClick = (teamId) => {
        navigate(`/team/${teamId}`);
    };

    return (
        <table className="team-table team-table--interactive">
            <thead>
                <tr>
                    <th style={{ width: '200px' }}>Fantasy League Table</th>
                    <th>Points</th>
                </tr>
            </thead>
            <tbody>
                {teams.map((team, index) => (
                    <tr
                        key={team.id}
                        onClick={() => handleRowClick(team.id)}
                        style={{
                            ...(index === 0 && { fontWeight: 700, fontSize: '1.05rem' }),
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
