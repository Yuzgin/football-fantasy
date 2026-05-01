import { useState, useEffect, useMemo } from "react";
import api from "../api";
import Header from "../components/Header";
import TeamBadge from "../components/TeamBadge";
import { groupMatchesByDay, compareByResultDateDesc } from "../utils/scheduleDayGroups";
import "../styles/Mens.css";
import "../styles/MatchCards.css";

const Results = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await api.get("/api/results/");
        setMatches(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const dayGroups = useMemo(
    () => groupMatchesByDay(matches, { groupOrder: "desc", compareWithinGroup: compareByResultDateDesc }),
    [matches]
  );

  return (
    <div className="mens-page mens-page--schedule">
      <Header />
      <div className="content-container">
        <div className="schedule-panel">
          <h1>Results</h1>

          {loading ? (
            <p>Loading matches...</p>
          ) : dayGroups.length > 0 ? (
            <div className="schedule">
              {dayGroups.map((day) => (
                <section
                  key={day.dateKey}
                  className="schedule-day schedule-day--results"
                  aria-labelledby={`r-day-${day.dateKey}`}
                >
                  <h2 id={`r-day-${day.dateKey}`} className="schedule-day__label">
                    {day.label}
                  </h2>
                  <ul className="schedule-day__rows">
                    {day.matches.map((match) => (
                      <li key={match.id} className="schedule-row">
                        <div className="schedule-row__line schedule-row__line--result">
                          <div className="schedule-row__match">
                            <div className="schedule-row__match-core schedule-row__match-core--result">
                              <TeamBadge teamName={match.team1} side="home" layout="schedule" />
                              <p className="schedule-row__score">
                                {match.team1_score} — {match.team2_score}
                              </p>
                              <TeamBadge teamName={match.team2} side="away" layout="schedule" />
                            </div>
                          </div>
                          <time
                            className="schedule-row__kickoff"
                            dateTime={match.date}
                          >
                            {new Date(match.date).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </time>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <div className="empty-state">No results yet this semester.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Results;
