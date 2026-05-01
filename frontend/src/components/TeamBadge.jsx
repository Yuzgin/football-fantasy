import { getTeamBadgeUrl } from "../utils/teamBadge";

export default function TeamBadge({ teamName, side = "home", layout = "card" }) {
  const src = getTeamBadgeUrl(teamName);
  const initial = teamName?.trim()?.charAt(0)?.toUpperCase() || "?";

  const face = src ? (
    <img src={src} alt="" className="team-badge-block__img" decoding="async" />
  ) : (
    <div className="team-badge-block__fallback" aria-hidden>
      {initial}
    </div>
  );

  const label = <span className="team-badge-block__name">{teamName}</span>;

  if (layout === "schedule") {
    return (
      <div className={`team-badge-block team-badge-block--schedule team-badge-block--schedule-${side}`}>
        {side === "home" ? (
          <>
            {label}
            {face}
          </>
        ) : (
          <>
            {face}
            {label}
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`team-badge-block team-badge-block--${side}`}>
      {side === "home" ? (
        <>
          {face}
          {label}
        </>
      ) : (
        <>
          {label}
          {face}
        </>
      )}
    </div>
  );
}
