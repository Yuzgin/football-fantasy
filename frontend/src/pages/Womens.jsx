import { useState, useEffect, useMemo } from "react";
import api from "../api";
import Header from "../components/Header";
import TeamBadge from "../components/TeamBadge";
import { formatFixtureTime } from "../utils/formatFixtureTime";
import { groupMatchesByDay, compareByFixtureTime } from "../utils/scheduleDayGroups";
import "../styles/Mens.css";
import "../styles/MatchCards.css";

const Womens = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await api.get("/api/womensfixtures/", {
          params: { upcoming: "true" },
        });
        setMatches(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const dayGroups = useMemo(
    () => groupMatchesByDay(matches, { groupOrder: "asc", compareWithinGroup: compareByFixtureTime }),
    [matches]
  );

  return (
    <div className="mens-page mens-page--schedule">
      <Header />
      <div className="content-container">
        <div className="schedule-panel">
          <h1>Upcoming womens fixtures</h1>

          {loading ? (
            <p>Loading matches...</p>
          ) : dayGroups.length > 0 ? (
            <div className="schedule">
              {dayGroups.map((day) => (
                <section
                  key={day.dateKey}
                  className="schedule-day schedule-day--fixtures"
                  aria-labelledby={`w-day-${day.dateKey}`}
                >
                  <h2 id={`w-day-${day.dateKey}`} className="schedule-day__label">
                    {day.label}
                  </h2>
                  <ul className="schedule-day__rows">
                    {day.matches.map((match) => {
                      const kickoff = formatFixtureTime(match.time);
                      return (
                        <li key={match.id} className="schedule-row">
                          <div className="schedule-row__line schedule-row__line--fixture">
                            <div className="schedule-row__match">
                              <div className="schedule-row__match-core">
                                <TeamBadge teamName={match.team1} side="home" layout="schedule" />
                                <time
                                  className="schedule-row__time"
                                  dateTime={
                                    match.time && kickoff !== "—" ? `${match.date}T${kickoff}` : undefined
                                  }
                                >
                                  {kickoff}
                                </time>
                                <TeamBadge teamName={match.team2} side="away" layout="schedule" />
                              </div>
                            </div>
                            <span className="schedule-row__location">{match.location || ""}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <div className="empty-state">No fixtures left for this semester.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Womens;
