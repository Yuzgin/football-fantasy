import "../styles/CreateTeam.css";

function Stat({ label, value }) {
  return (
    <div className="player-detail-stat-row">
      <span className="player-detail-stat-label">{label}</span>
      <span className="player-detail-stat-value">{value}</span>
    </div>
  );
}

export default function SelectedPlayerDetailModal({
  player,
  formationPosition,
  onClose,
  onRemove,
  isCaptain = false,
  onSetCaptain,
}) {
  if (!player) return null;

  const price = Number(player.price);
  const priceLabel = Number.isFinite(price) ? `£${price.toFixed(1)}m` : "—";
  const canSetCaptain = typeof onSetCaptain === "function";

  return (
    <div
      className="create-team-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="create-team-player-detail"
        role="dialog"
        aria-labelledby="player-detail-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="player-detail-title">{player.name}</h2>
        <p className="player-detail-meta">
          <span>{formationPosition}</span>
          <span className="player-detail-meta-sep">·</span>
          <span>{player.position}</span>
          {isCaptain ? (
            <>
              <span className="player-detail-meta-sep">·</span>
              <span className="player-detail-captain-label">Captain</span>
            </>
          ) : null}
        </p>

        <div className="player-detail-stats">
          <Stat label="Price" value={priceLabel} />
          <Stat label="Club" value={player.team || "—"} />
          <Stat label="Points" value={player.points ?? 0} />
          <Stat label="Games played" value={player.games_played ?? 0} />
          <Stat label="Goals" value={player.goals ?? 0} />
          <Stat label="Assists" value={player.assists ?? 0} />
          <Stat label="Clean sheets" value={player.clean_sheets ?? 0} />
          <Stat label="Yellow cards" value={player.yellow_cards ?? 0} />
          <Stat label="Red cards" value={player.red_cards ?? 0} />
          <Stat label="MOTM" value={player.MOTM ?? 0} />
          <Stat label="Pen. saves" value={player.Pen_Saves ?? 0} />
        </div>

        <div className="player-detail-actions">
          <button type="button" className="player-detail-btn player-detail-btn-close" onClick={onClose}>
            Close
          </button>
          {canSetCaptain && !isCaptain ? (
            <button
              type="button"
              className="player-detail-btn player-detail-btn-captain"
              onClick={() => {
                onSetCaptain();
                onClose();
              }}
            >
              Set as captain
            </button>
          ) : null}
          <button type="button" className="player-detail-btn player-detail-btn-remove" onClick={onRemove}>
            Remove player
          </button>
        </div>
      </div>
    </div>
  );
}
