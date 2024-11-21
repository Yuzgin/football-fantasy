import React, { useState, useEffect } from "react";
import api from "../api"; // Use the custom API instance
import Header from "../components/Header"; // Assuming you have a Header component for consistency
import "../styles/Mens.css";

const Mens = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await api.get("/api/womensfixtures/", {
        params: { upcoming: "true" },
      });
      console.log("API Response:", response.data); // Debugging API response
      setMatches(Array.isArray(response.data) ? response.data : []); // Ensure matches is an array
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mens-page">
      <Header />
      <div className="content-container">
        <h1>Upcoming womens fixtures</h1>

        {loading ? (
          <p>Loading matches...</p>
        ) : matches.length > 0 ? (
          <div className="match-table">
            <table>
              <thead>
                <tr>
                  <th>Home</th>
                  <th>Away</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <tr key={match.id}>
                    <td>{match.team1}</td>
                    <td>{match.team2}</td>
                    <td>{match.location}</td>
                    <td>{new Date(match.date).toLocaleDateString()}</td>
                    <td>{match.time.slice(0, 5)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No fixtures left for semester.</p>
        )}
      </div>
    </div>
  );
};

export default Mens;
