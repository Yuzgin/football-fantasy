import React, { useState, useEffect } from 'react';
import api from '../api';
import '../styles/ComparePlayers.css';

const ComparePlayers = () => {
    const [players, setPlayers] = useState([]);
    const [player1Id, setPlayer1Id] = useState('');
    const [player2Id, setPlayer2Id] = useState('');
    const [player1Data, setPlayer1Data] = useState(null);
    const [player2Data, setPlayer2Data] = useState(null);

    useEffect(() => {
        fetchPlayers();
    }, []);

    useEffect(() => {
        if (player1Id) {
            const p1 = players.find(p => p.id === parseInt(player1Id));
            setPlayer1Data(p1);
        } else {
            setPlayer1Data(null);
        }
    }, [player1Id, players]);

    useEffect(() => {
        if (player2Id) {
            const p2 = players.find(p => p.id === parseInt(player2Id));
            setPlayer2Data(p2);
        } else {
            setPlayer2Data(null);
        }
    }, [player2Id, players]);

    const fetchPlayers = async () => {
        try {
            const response = await api.get('/api/players/');
            if (Array.isArray(response.data)) {
                setPlayers(response.data);
            } else {
                console.error('API response is not an array:', response.data);
                setPlayers([]);
            }
        } catch (error) {
            console.error('Error fetching players:', error);
            setPlayers([]);
        }
    };

    const statsToCompare = [
        { label: 'Goals', key: 'goals' },
        { label: 'Assists', key: 'assists' },
        { label: 'Clean Sheets', key: 'clean_sheets' },
        { label: 'Yellow Cards', key: 'yellow_cards', inverse: true },
        { label: 'Red Cards', key: 'red_cards', inverse: true },
        { label: 'MOTM', key: 'MOTM' },
        { label: 'Pen Saves', key: 'Pen_Saves' },
        { label: 'Points', key: 'points' },
        { label: 'Price', key: 'price' },
        { label: 'Games Played', key: 'games_played' },
    ];

    const getHighlightClass = (val1, val2, inverse = false) => {
        if (val1 === val2) return '';
        if (inverse) {
            return val1 < val2 ? 'winner' : 'loser';
        }
        return val1 > val2 ? 'winner' : 'loser';
    };

    return (
        <div className="compare-container">
            <h1>Compare Players</h1>
            <div className="selectors">
                <select value={player1Id} onChange={(e) => setPlayer1Id(e.target.value)}>
                    <option value="">Select Player 1</option>
                    {players.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
                <span className="vs">VS</span>
                <select value={player2Id} onChange={(e) => setPlayer2Id(e.target.value)}>
                    <option value="">Select Player 2</option>
                    {players.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            {player1Data && player2Data && (
                <div className="comparison-table">
                    <div className="header-row">
                        <div className="player-name">{player1Data.name}</div>
                        <div className="stat-label">Stat</div>
                        <div className="player-name">{player2Data.name}</div>
                    </div>
                    {statsToCompare.map(stat => {
                        const val1 = player1Data[stat.key] || 0;
                        const val2 = player2Data[stat.key] || 0;
                        const class1 = getHighlightClass(val1, val2, stat.inverse);
                        const class2 = getHighlightClass(val2, val1, stat.inverse);

                        return (
                            <div key={stat.key} className="stat-row">
                                <div className={`stat-value ${class1}`}>{val1}</div>
                                <div className="stat-label">{stat.label}</div>
                                <div className={`stat-value ${class2}`}>{val2}</div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ComparePlayers;
