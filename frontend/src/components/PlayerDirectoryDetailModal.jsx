import { useMemo } from 'react';
import '../styles/CreateTeam.css';
import '../styles/Players.css';

function Stat({ label, value }) {
  return (
    <div className="player-detail-stat-row">
      <span className="player-detail-stat-label">{label}</span>
      <span className="player-detail-stat-value">{value}</span>
    </div>
  );
}

function formatMatchDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export default function PlayerDirectoryDetailModal({ player, onClose }) {
  const price = Number(player?.price);
  const priceLabel = Number.isFinite(price) ? `£${price.toFixed(1)}m` : '—';

  const seasonPointsFromGames = useMemo(() => {
    const stats = player?.game_stats;
    if (!Array.isArray(stats) || stats.length === 0) return null;
    return stats.reduce((sum, s) => sum + (Number(s.points) || 0), 0);
  }, [player]);

  const pointsDisplay =
    seasonPointsFromGames != null ? seasonPointsFromGames : (player?.points ?? 0);

  const sortedGameStats = useMemo(() => {
    const stats = player?.game_stats;
    if (!Array.isArray(stats)) return [];
    return [...stats].sort((a, b) => {
      const da = new Date(a.match?.date || 0).getTime();
      const db = new Date(b.match?.date || 0).getTime();
      return db - da;
    });
  }, [player]);

  if (!player) return null;

  const showFullName =
    player.full_name && player.full_name.trim() && player.full_name.trim() !== (player.name || '').trim();

  return (
    <div
      className="create-team-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="create-team-player-detail player-directory-detail"
        role="dialog"
        aria-labelledby="player-directory-detail-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="player-directory-detail-title">{player.name}</h2>
        {showFullName ? (
          <p className="player-directory-full-name">{player.full_name}</p>
        ) : null}
        <p className="player-detail-meta">
          <span>{player.position}</span>
          <span className="player-detail-meta-sep">·</span>
          <span>{player.team || '—'}</span>
        </p>

        <h3 className="player-directory-section-title">Season totals</h3>
        <div className="player-detail-stats">
          <Stat label="Price" value={priceLabel} />
          <Stat label="Points (from fixtures)" value={pointsDisplay} />
          <Stat label="Games played" value={player.games_played ?? 0} />
          <Stat label="Goals" value={player.goals ?? 0} />
          <Stat label="Assists" value={player.assists ?? 0} />
          <Stat label="Clean sheets" value={player.clean_sheets ?? 0} />
          <Stat label="Yellow cards" value={player.yellow_cards ?? 0} />
          <Stat label="Red cards" value={player.red_cards ?? 0} />
          <Stat label="MOTM" value={player.MOTM ?? 0} />
          <Stat label="Pen. saves" value={player.Pen_Saves ?? 0} />
        </div>

        <h3 className="player-directory-section-title">Match-by-match</h3>
        {sortedGameStats.length > 0 ? (
          <div className="player-directory-match-table-wrap">
            <table className="player-directory-match-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Fixture</th>
                  <th>G</th>
                  <th>A</th>
                  <th>CS</th>
                  <th>YC</th>
                  <th>RC</th>
                  <th>MOTM</th>
                  <th>Pen</th>
                  <th>Pts</th>
                </tr>
              </thead>
              <tbody>
                {sortedGameStats.map((row) => {
                  const m = row.match;
                  const fixtureLabel = m
                    ? `${m.team1 ?? ''} ${m.team1_score ?? 0}–${m.team2_score ?? 0} ${m.team2 ?? ''}`
                    : '—';
                  return (
                    <tr key={row.id}>
                      <td>{formatMatchDate(m?.date)}</td>
                      <td className="player-directory-fixture-cell">{fixtureLabel}</td>
                      <td>{row.goals ?? 0}</td>
                      <td>{row.assists ?? 0}</td>
                      <td>{row.clean_sheets ?? 0}</td>
                      <td>{row.yellow_cards ?? 0}</td>
                      <td>{row.red_cards ?? 0}</td>
                      <td>{row.MOTM ?? 0}</td>
                      <td>{row.Pen_Saves ?? 0}</td>
                      <td>{row.points ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="player-directory-no-matches">No recorded fixtures for this player yet.</p>
        )}

        <div className="player-detail-actions player-directory-detail-actions">
          <button type="button" className="player-detail-btn player-detail-btn-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
