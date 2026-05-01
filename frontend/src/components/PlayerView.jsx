import selectedImage from '../assets/SelectedPlayer.png'; // Image when a player is selected
import '../styles/TeamPlayer.css'; // Import the CSS file

const PlayerView = ({
  selectedPlayer,
  openPlayerStats,
  isCaptain = false,
}) => {
  const handleClick = () => {
    if (selectedPlayer && openPlayerStats) {
      openPlayerStats(selectedPlayer);
    }
  };

  return (
    <div className="team-player">
      <div className="player-card">
        {isCaptain && selectedPlayer ? (
          <span className="player-card-captain-badge" title="Captain" aria-label="Captain">
            C
          </span>
        ) : null}
        <img
          className="player-card-image"
          src={selectedImage}
          onClick={handleClick}
        />
        <div className="player-card-info">
          <div className="player-card-name">
            {selectedPlayer?.name ?? ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerView;
