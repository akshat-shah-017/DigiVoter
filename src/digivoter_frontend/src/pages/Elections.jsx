import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { digivoter_backend } from "../../../declarations/digivoter_backend";

function Elections() {
  const [elections, setElections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { identity } = useAuth();

  useEffect(() => {
    async function fetchElections() {
      try {
        console.log("Fetching all elections");
        const result = await digivoter_backend.get_elections();
        console.log("Elections fetched:", result);
        
        if (Array.isArray(result)) {
          setElections(result);
        } else {
          console.error("Expected array of elections but got:", result);
          setElections([]);
        }
      } catch (err) {
        console.error("Failed to fetch elections:", err);
        setError("Failed to load elections. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchElections();
  }, [identity]);

  if (isLoading) {
    return <div className="loading">Loading elections...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="elections-container">
      <h1>Available Elections</h1>
      
      {elections.length === 0 ? (
        <div className="no-elections">
          <p>No elections are currently available.</p>
        </div>
      ) : (
        <div className="elections-grid">
          {elections.map((election) => (
            <div key={election.id} className="election-card">
              <div className="election-status" data-status={election.status}>
                {election.status}
              </div>
              <h2>{election.title}</h2>
              <p>{election.description}</p>
              <div className="election-dates">
                <div>
                  <span>Start:</span>
                  <time>{new Date(Number(election.start_time) / 1000000).toLocaleString()}</time>
                </div>
                <div>
                  <span>End:</span>
                  <time>{new Date(Number(election.end_time) / 1000000).toLocaleString()}</time>
                </div>
              </div>
              <div className="election-actions">
                {election.status === "active" ? (
                  <Link to={`/elections/${election.id}`} className="btn btn-primary">Vote Now</Link>
                ) : (
                  <Link to={`/results/${election.id}`} className="btn btn-outline">View Results</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      
    </div>
  );
}

export default Elections;
