import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Actor, HttpAgent } from '@dfinity/agent';
import { digivoter_backend } from "../../../declarations/digivoter_backend";

function Results() {
  const { id } = useParams();
  const { identity } = useAuth();
  
  const [electionResults, setElectionResults] = useState(null);
  const [election, setElection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchResults() {
      try {
        const agent = new HttpAgent({ identity });
        if (process.env.NODE_ENV !== 'production') {
          agent.fetchRootKey();
        }
        
        const actor = digivoter_backend.get_election_results(idlFactory, {
          agent,
          canisterId: process.env.DIGIVOTER_BACKEND_CANISTER_ID,
        });
        
        const electionResult = await actor.get_election(id);
        if (!electionResult.length) {
          setError('Election not found');
          setIsLoading(false);
          return;
        }
        
        setElection(electionResult[0]);
        
        // Then get the results if the election is completed
        if (electionResult[0].status === 'completed') {
          const results = await digivoter_backend.get_election_results(id);
          if (results.length) {
            setElectionResults(results[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch results:", err);
        setError('Failed to load election results. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchResults();
  }, [id, identity]);

  if (isLoading) {
    return <div className="loading">Loading results...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <Link 
          to="/elections"
          className="btn btn-primary"
        >
          Back to Elections
        </Link>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="error-container">
        <div className="warning-message">Election not found</div>
        <Link 
          to="/elections"
          className="btn btn-primary"
        >
          Back to Elections
        </Link>
      </div>
    );
  }

  return (
    <div className="results-container">
      <h1>{election.title}</h1>
      <p className="election-description">{election.description}</p>
      
      {election.status !== 'completed' ? (
        <div className="pending-results">
          <div className="warning-message">
            Results will be available once the election is completed.
          </div>
          <p className="status-info">
            Current status: <span className="status-label">{election.status}</span>
          </p>
          <p className="end-time">
            End time: {new Date(Number(election.end_time) / 1000000).toLocaleString()}
          </p>
        </div>
      ) : !electionResults ? (
        <div className="pending-results">
          <div className="warning-message">
            No results available yet. Please check back later.
          </div>
        </div>
      ) : (
        <div className="results-card">
          <h2>Election Results</h2>
          
          <div className="total-votes">
            Total Votes: <span className="vote-count">{electionResults.total_votes.toString()}</span>
          </div>
          
          <div className="results-list">
            {electionResults.options.map((option, index) => {
              const voteCount = electionResults.vote_counts[index] || 0;
              const percentage = electionResults.total_votes > 0 
                ? (voteCount / electionResults.total_votes * 100).toFixed(2) 
                : 0;
              
              return (
                <div key={index} className="result-item">
                  <div className="result-header">
                    <span className="option-name">{option}</span>
                    <span className="vote-stats">{voteCount.toString()} votes ({percentage}%)</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="back-link">
        <Link 
          to="/elections"
          className="btn btn-primary"
        >
          Back to Elections
        </Link>
      </div>
    </div>
  );
}

export default Results;
