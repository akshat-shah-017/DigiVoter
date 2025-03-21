import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Actor, HttpAgent } from '@dfinity/agent';
import { digivoter_backend } from "../../../declarations/digivoter_backend";

function ElectionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { identity } = useAuth();
  
  const [election, setElection] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    async function fetchElection() {
      try {
        const agent = new HttpAgent({ identity });
        if (process.env.NODE_ENV !== 'production') {
          agent.fetchRootKey();
        }
        
        const actor = Actor.createActor(idlFactory, {
          agent,
          canisterId: process.env.DIGIVOTER_BACKEND_CANISTER_ID,
        });
        
        const result = await actor.get_election(id);
        
        if (!result.length) {
          setError('Election not found');
          return;
        }
        
        setElection(result[0]);
        
        // Redirect if election is not active
        if (result[0].status !== 'active') {
          navigate(`/results/${id}`);
        }
      } catch (err) {
        console.error("Failed to fetch election:", err);
        setError('Failed to load election details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchElection();
  }, [id, identity, navigate]);

  const handleVote = async () => {
    if (selectedOption === null) {
      setError('Please select an option to vote');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      const agent = new HttpAgent({ identity });
      if (process.env.NODE_ENV !== 'production') {
        agent.fetchRootKey();
      }
      
      const actor = digivoter_backend.get_elections(idlFactory, {
        agent,
        canisterId: process.env.DIGIVOTER_BACKEND_CANISTER_ID,
      });
      
      const result = await digivoter_backend.cast_vote(id, selectedOption);
      setReceipt(result);
    } catch (err) {
      console.error("Failed to cast vote:", err);
      setError(err.message || 'Failed to cast vote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading election details...</div>;
  }

  if (error && !election) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button 
          onClick={() => navigate('/elections')}
          className="btn btn-primary"
        >
          Back to Elections
        </button>
      </div>
    );
  }

  if (receipt) {
    return (
      <div className="receipt-container">
        <div className="success-message">
          Your vote has been successfully cast!
        </div>
        
        <div className="receipt-card">
          <h2>Vote Receipt</h2>
          <p>
            <span className="receipt-label">Verification Hash:</span> 
            <span className="receipt-hash">{receipt.verification_hash}</span>
          </p>
          <p>
            <span className="receipt-label">Timestamp:</span> 
            <span>{new Date(Number(receipt.timestamp) / 1000000).toLocaleString()}</span>
          </p>
          
          <div className="receipt-warning">
            <p>
              <strong>Important:</strong> Save your verification hash. You will need it to verify your vote later.
            </p>
          </div>
          
          <div className="receipt-actions">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(receipt.verification_hash);
                alert('Verification hash copied to clipboard!');
              }}
              className="btn btn-outline"
            >
              Copy Hash
            </button>
            
            <button 
              onClick={() => navigate('/elections')}
              className="btn btn-primary"
            >
              Back to Elections
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="election-details-container">
      <h1>{election.title}</h1>
      <p className="election-description">{election.description}</p>
      
      {error && (
        <div className="error-message">{error}</div>
      )}
      
      <div className="voting-card">
        <h2>Cast Your Vote</h2>
        
        <div className="voting-options">
          {election.options.map((option, index) => (
            <div key={index} className="option-item">
              <label className="option-label">
                <input
                  type="radio"
                  name="vote-option"
                  value={index}
                  checked={selectedOption === index}
                  onChange={() => setSelectedOption(index)}
                />
                <span>{option}</span>
              </label>
            </div>
          ))}
        </div>
        
        <button
          onClick={handleVote}
          disabled={isSubmitting || selectedOption === null}
          className="btn btn-primary vote-button"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Vote'}
        </button>
      </div>
      
      <div className="voting-info">
        <h3>Important Information</h3>
        <ul>
          <li>Your vote is anonymous and cannot be traced back to you.</li>
          <li>You can only vote once per election.</li>
          <li>After voting, you will receive a verification hash to confirm your vote was counted.</li>
          <li>The election ends on {new Date(Number(election.end_time) / 1000000).toLocaleString()}.</li>
        </ul>
      </div>
    </div>
  );
}

export default ElectionDetails;
