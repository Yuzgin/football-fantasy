import { useState, useEffect, useMemo } from 'react';
import api from '../api';
import MatchList from '../components/MatchList';
import CreateMatchForm from '../components/CreateMatchForm';
import { toDatetimeLocalValue } from '../utils/datetimeLocal';
import { validateMatchBeforeCreate } from '../utils/matchLangwithValidation';
import '../styles/Match.css';

const emptyPlayerStat = () => ({
  player: '',
  goals: 0,
  assists: 0,
  yellow_cards: 0,
  red_cards: 0,
  clean_sheets: 0,
  points: 0,
  MOTM: 0,
  Pen_Saves: 0,
});

const MatchPage = () => {
  const [matches, setMatches] = useState([]);
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [team1_score, setTeam1_score] = useState('');
  const [team2_score, setTeam2_score] = useState('');
  const [date, setDate] = useState(() => toDatetimeLocalValue(new Date()));
  const [playersStats, setPlayersStats] = useState([emptyPlayerStat()]);
  const [players, setPlayers] = useState([]);
  const [formBanner, setFormBanner] = useState(null);

  useEffect(() => {
    getMatches();
    getPlayers();
  }, []);

  const recentTeamNames = useMemo(() => {
    const names = new Set();
    for (const m of matches.slice(0, 40)) {
      if (m.team1) names.add(m.team1);
      if (m.team2) names.add(m.team2);
    }
    return [...names];
  }, [matches]);

  const getMatches = () => {
    api.get('/api/matches/')
      .then((res) => setMatches(res.data))
      .catch((err) => alert(`Error fetching matches: ${err.message}`));
  };

  const getPlayers = () => {
    api.get('/api/players/')
      .then((res) => setPlayers(res.data))
      .catch((err) => alert(`Error fetching players: ${err.message}`));
  };

  const handlePlayerStatChange = (index, field, value) => {
    const updatedStats = [...playersStats];
    updatedStats[index][field] = value;
    setPlayersStats(updatedStats);
  };

  const addPlayerStat = () => {
    setPlayersStats([...playersStats, emptyPlayerStat()]);
  };

  const removePlayerStat = (index) => {
    if (playersStats.length <= 1) return;
    setPlayersStats(playersStats.filter((_, i) => i !== index));
  };

  const createMatch = (e) => {
    e.preventDefault();
    setFormBanner(null);

    const matchData = { team1, team2, team1_score, team2_score, date };
    const preCheck = validateMatchBeforeCreate({
      team1,
      team2,
      team1_score,
      team2_score,
      playersStats,
    });
    if (!preCheck.ok) {
      setFormBanner({ type: 'error', text: preCheck.error });
      return;
    }

    const formattedPlayerStats = playersStats
      .filter((stat) => stat.player !== '' && stat.player != null)
      .map((stat) => ({
        ...stat,
        goals: parseInt(stat.goals, 10) || 0,
        assists: parseInt(stat.assists, 10) || 0,
        yellow_cards: parseInt(stat.yellow_cards, 10) || 0,
        red_cards: parseInt(stat.red_cards, 10) || 0,
        clean_sheets: parseInt(stat.clean_sheets, 10) || 0,
        MOTM: parseInt(stat.MOTM, 10) || 0,
        Pen_Saves: parseInt(stat.Pen_Saves, 10) || 0,
        points: parseInt(stat.points, 10) || 0,
        player: parseInt(stat.player, 10),
      }));

    api.post('/api/matches/', { ...matchData, players_stats: formattedPlayerStats })
      .then(() => {
        setFormBanner({ type: 'success', text: 'Match and player stats saved.' });
        setTeam1('');
        setTeam2('');
        setTeam1_score('');
        setTeam2_score('');
        setDate(toDatetimeLocalValue(new Date()));
        setPlayersStats([emptyPlayerStat()]);
        getMatches();
      })
      .catch((err) => {
        const data = err.response?.data;
        let text = err.message;
        if (data) {
          if (typeof data === 'string') text = data;
          else if (data.error) text = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
          else if (data.detail != null) text = String(data.detail);
          else if (typeof data === 'object') {
            const parts = Object.entries(data).map(([k, v]) =>
              `${k}: ${Array.isArray(v) ? v.join(', ') : v}`
            );
            if (parts.length) text = parts.join('; ');
          }
        }
        setFormBanner({ type: 'error', text });
      });
  };

  const deleteMatch = (id) => {
    if (!window.confirm('Delete this match and all player stats for it?')) return;
    api.delete(`/api/matches/delete/${id}/`)
      .then((res) => {
        if (res.status === 204) {
          setMatches(matches.filter((match) => match.id !== id));
        } else {
          alert('Failed to delete match.');
        }
      })
      .catch((err) => alert(`Error deleting match: ${err.message}`));
  };

  return (
    <div className="match-page">
      <div className="match-page__inner">
        <header className="match-page__header">
          <h1 className="match-page__title">Record a match</h1>
          <p className="match-page__subtitle">
            {`One side must be named Langwith (e.g. Langwith 6s). Player goals must match Langwith's score, and exactly one MOTM (M = 1 on one player). Blank rows are ignored; points are calculated when you save.`}
          </p>
        </header>

        <CreateMatchForm
          team1={team1}
          setTeam1={setTeam1}
          team2={team2}
          setTeam2={setTeam2}
          team1_score={team1_score}
          setTeam1_score={setTeam1_score}
          team2_score={team2_score}
          setTeam2_score={setTeam2_score}
          date={date}
          setDate={setDate}
          playersStats={playersStats}
          setPlayersStats={setPlayersStats}
          players={players}
          handlePlayerStatChange={handlePlayerStatChange}
          addPlayerStat={addPlayerStat}
          removePlayerStat={removePlayerStat}
          createMatch={createMatch}
          recentTeamNames={recentTeamNames}
          formBanner={formBanner}
        />

        <section className="match-page__list" aria-labelledby="match-list-heading">
          <h2 id="match-list-heading" className="match-page__list-title">
            Recent matches
          </h2>
          <MatchList matches={matches} deleteMatch={deleteMatch} showHeading={false} />
        </section>
      </div>
    </div>
  );
};

export default MatchPage;