import React, { useState, useEffect } from "react";
import api from "../api"; // Use the custom API instance
import Header from "../components/Header"; // Assuming you have a Header component for consistency
import "../styles/Mens.css";
import "../styles/Table.css";

const Mens = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetchMatches();
    fetchResults();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await api.get("/api/fixtures/", {
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

  const fetchResults = async () => {
    try {
      const response = await api.get("/api/results/");
      console.log("API Results Response:", response.data); // Debugging API results response
      setResults(Array.isArray(response.data) ? response.data : []); // Ensure results is an array
    } catch (error) {
      console.error("Error fetching results:", error);
    }
  };

  return (
    <div className="mens-page">
      <Header />
      <div className="content-container">
        <h1>Upcoming mens fixtures</h1>

        {loading ? (
          <p>Loading matches...</p>
        ) : matches.length > 0 ? (
          <div className="match-table">
            <table className="team-table">
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
                    <td>{new Date(match.date).toLocaleDateString('en-GB')}</td>
                    <td>{match.time.slice(0, 5)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No fixtures left for this semester.</div>
        )}
      </div>

      {/* <div className="content-container">
        <h1>Mens Results</h1>

        {loading ? (
          <p>Loading matches...</p>
        ) : results.length > 0 ? (
          <div className="match-table">
            <table>
              <thead>
                <tr>
                  <th>Home</th>
                  <th>Away</th>
                  <th>Score</th>
                  <th>Date</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.id}>
                    <td>{result.team1}</td>
                    <td>{result.team2}</td>
                    <td>{result.team1_score} - {result.team2_score}</td>
                    <td>{new Date(result.date).toLocaleDateString('en-GB')}</td>
                    <td>{new Date(result.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No Matches Played Yet.</p>
        )}
      </div> */}
    </div>
  );
};

export default Mens;
