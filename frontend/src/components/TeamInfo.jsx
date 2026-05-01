import '../styles/TeamInfo.css'; // Import new CSS file

const TeamInfo = ({ team, value }) => {
  return (
    <div className="team-info">
      <h1>{team.name}</h1>
      <p>Total Points: {team.total_points}</p>
      <p>Team Value: £{Number(value).toFixed(1)}m</p>
      {team.captain ? (
        <p className="team-info-captain">
          Captain: {team.captain.name}
        </p>
      ) : null}
    </div>
  );
};

export default TeamInfo;
