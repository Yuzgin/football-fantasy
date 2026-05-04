import { useId } from 'react';
import PlayerStatForm from './PlayerStatForm';
import { toDatetimeLocalValue } from '../utils/datetimeLocal';
import '../styles/Form.css';
import '../styles/CreateMatchForm.css';

const SCORE_PRESETS = [
  { label: '0–0', a: '0', b: '0' },
  { label: '1–0', a: '1', b: '0' },
  { label: '0–1', a: '0', b: '1' },
  { label: '1–1', a: '1', b: '1' },
  { label: '2–1', a: '2', b: '1' },
  { label: '1–2', a: '1', b: '2' },
];

const CreateMatchForm = ({
  team1,
  setTeam1,
  team2,
  setTeam2,
  team1_score,
  setTeam1_score,
  team2_score,
  setTeam2_score,
  date,
  setDate,
  playersStats,
  players,
  handlePlayerStatChange,
  addPlayerStat,
  removePlayerStat,
  createMatch,
  recentTeamNames = [],
  formBanner = null,
}) => {
  const datalistId = useId();

  const applyScorePreset = (a, b) => {
    setTeam1_score(a);
    setTeam2_score(b);
  };

  return (
    <div className="create-match-card">
      <h2 className="create-match-card__title">Create match</h2>

      {formBanner?.type === 'success' && (
        <p className="form-success create-match-card__banner" role="status">
          {formBanner.text}
        </p>
      )}
      {formBanner?.type === 'error' && (
        <p className="form-error create-match-card__banner" role="alert">
          {formBanner.text}
        </p>
      )}

      <form className="create-match-form" onSubmit={createMatch}>
        <datalist id={datalistId}>
          {recentTeamNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

        <div className="create-match-form__grid create-match-form__grid--teams">
          <div className="auth-field">
            <label htmlFor="match-team1">Home / team 1</label>
            <input
              id="match-team1"
              className="form-input"
              type="text"
              autoComplete="off"
              list={recentTeamNames.length ? datalistId : undefined}
              placeholder="e.g. Langwith"
              value={team1}
              onChange={(e) => setTeam1(e.target.value)}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="match-team2">Away / team 2</label>
            <input
              id="match-team2"
              className="form-input"
              type="text"
              autoComplete="off"
              list={recentTeamNames.length ? datalistId : undefined}
              placeholder="e.g. Derwent"
              value={team2}
              onChange={(e) => setTeam2(e.target.value)}
            />
          </div>
        </div>

        <div className="create-match-form__scores-block">
          <div className="create-match-form__grid create-match-form__grid--scores">
            <div className="auth-field">
              <label htmlFor="match-score1">{team1 ? `${team1} goals` : 'Team 1 score'}</label>
              <input
                id="match-score1"
                className="form-input"
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="0"
                value={team1_score}
                onChange={(e) => setTeam1_score(e.target.value)}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="match-score2">{team2 ? `${team2} goals` : 'Team 2 score'}</label>
              <input
                id="match-score2"
                className="form-input"
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="0"
                value={team2_score}
                onChange={(e) => setTeam2_score(e.target.value)}
              />
            </div>
          </div>
          <div className="create-match-form__presets" role="group" aria-label="Quick score presets">
            {SCORE_PRESETS.map(({ label, a, b }) => (
              <button
                key={label}
                type="button"
                className="create-match-form__chip"
                onClick={() => applyScorePreset(a, b)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="create-match-form__datetime-row">
          <div className="auth-field create-match-form__datetime-field">
            <label htmlFor="match-datetime">Kickoff (local time)</label>
            <input
              id="match-datetime"
              className="form-input"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="form-button form-button-secondary create-match-form__now-btn"
            onClick={() => setDate(toDatetimeLocalValue(new Date()))}
          >
            Now
          </button>
        </div>

        <div className="create-match-form__stats-head">
          <h3 className="create-match-form__stats-title">Player stats</h3>
          <p className="create-match-form__stats-hint">
            {`Click the player field to open the list; type to filter. Player goals must add up to Langwith's score; set MOTM to 1 on exactly one player.`}
          </p>
        </div>

        <div className="create-match-form__stat-rows">
          {playersStats.map((stat, index) => (
            <PlayerStatForm
              key={index}
              index={index}
              stat={stat}
              players={players}
              handlePlayerStatChange={handlePlayerStatChange}
              onRemove={() => removePlayerStat(index)}
              canRemove={playersStats.length > 1}
            />
          ))}
        </div>

        <div className="create-match-form__actions">
          <button type="button" className="form-button form-button-secondary" onClick={addPlayerStat}>
            Add player row
          </button>
          <button type="submit" className="form-button">
            Save match
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateMatchForm;
