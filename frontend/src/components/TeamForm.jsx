import unselectedImage from '../assets/UnselectedPlayer.png'; // Image when no player is selected
import selectedImage from '../assets/SelectedPlayer.png'; // Image when a player is selected
import '../styles/TeamPlayer.css'; // Import the CSS file

const positionAbbreviations = {
  Goalkeeper: 'GK',
  Defender: 'DEF',
  Midfielder: 'MID',
  Attacker: 'ATT',
};

const TeamPlayer = ({
  position,
  selectedPlayer,
  openPlayerModal,
  openOccupiedPlayerDetail,
  handlePlayerDeselect,
  isCaptain = false,
}) => {
  const handleClick = () => {
    if (selectedPlayer) {
      if (openOccupiedPlayerDetail) {
        openOccupiedPlayerDetail(position);
      } else if (handlePlayerDeselect) {
        handlePlayerDeselect(position);
      }
    } else {
      openPlayerModal(position);
    }
  };

  // Determine the position type based on the position string
  const positionType = position.includes('Goalkeeper')
    ? 'Goalkeeper'
    : position.includes('Defender')
    ? 'Defender'
    : position.includes('Midfielder')
    ? 'Midfielder'
    : 'Attacker';

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
          src={selectedPlayer ? selectedImage : unselectedImage}
          alt={selectedPlayer ? selectedPlayer.name : "Select Player"}
          onClick={handleClick}
        />
        <div className="player-card-info">
          <div className="player-card-name">
            {selectedPlayer ? selectedPlayer.name : positionAbbreviations[positionType]}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamPlayer;
