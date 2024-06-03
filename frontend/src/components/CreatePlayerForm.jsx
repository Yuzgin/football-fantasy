import React from 'react';

const CreatePlayerForm = ({ name, setName, position, setPosition, team, setTeam, price, setPrice, createPlayer }) => {
  return (
    <div>
      <h2>Create Player</h2>
      <form onSubmit={createPlayer}>
        <label htmlFor="name">Name:</label>
        <br />
        <textarea
          id="name"
          name="name"
          required
          onChange={(e) => setName(e.target.value)}
          value={name}
        ></textarea>
        <br />
        <label htmlFor="position">Position:</label>
        <br />
        <select
          id="position"
          name="position"
          required
          value={position}
          onChange={(e) => setPosition(e.target.value)}
        >
          <option value="">Select a position</option>
          <option value="Goalkeeper">Goalkeeper</option>
          <option value="Defender">Defender</option>
          <option value="Midfielder">Midfielder</option>
          <option value="Attacker">Attacker</option>
        </select>
        <br />
        <label htmlFor="team">Team:</label>
        <br />
        <textarea
          id="team"
          name="team"
          required
          value={team}
          onChange={(e) => setTeam(e.target.value)}
        ></textarea>
        <br />
        <label htmlFor="price">Price:</label>
        <br />
        <textarea
          id="price"
          name="price"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        ></textarea>
        <br />
        <input type="submit" value="Submit" />
      </form>
    </div>
  );
};

export default CreatePlayerForm;
