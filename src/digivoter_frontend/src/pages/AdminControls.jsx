import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { digivoter_backend } from "../../../declarations/digivoter_backend";

function AdminControls() {
  const [elections, setElections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionStatus, setActionStatus] = useState({});
  const { identity, principal } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchElections();
  }, [identity]);

  async function fetchElections() {
    try {
      const result = await digivoter_backend.get_elections();
      console.log("Elections fetched:", result);
      setElections(result);
    } catch (err) {
      console.error("Failed to fetch elections:", err);
      setError("Failed to load elections. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  async function activateElection(id) {
    try {
      setActionStatus(prev => ({ ...prev, [id]: 'processing' }));
      await digivoter_backend.activate_election(id);
      setActionStatus(prev => ({ ...prev, [id]: 'success' }));
      fetchElections(); // Refresh the list
    } catch (err) {
      console.error("Failed to activate election:", err);
      setActionStatus(prev => ({ ...prev, [id]: 'error' }));
    }
  }

  async function endElection(id) {
    try {
      setActionStatus(prev => ({ ...prev, [id]: 'processing' }));
      await digivoter_backend.end_election(id);
      setActionStatus(prev => ({ ...prev, [id]: 'success' }));
      fetchElections(); // Refresh the list
    } catch (err) {
      console.error("Failed to end election:", err);
      setActionStatus(prev => ({ ...prev, [id]: 'error' }));
    }
  }

  async function deleteElection(id) {
    if (window.confirm("Are you sure you want to delete this election? This action cannot be undone.")) {
      try {
        setActionStatus(prev => ({ ...prev, [id]: 'processing' }));
        await digivoter_backend.delete_election(id);
        setActionStatus(prev => ({ ...prev, [id]: 'success' }));
        fetchElections(); // Refresh the list
      } catch (err) {
        console.error("Failed to delete election:", err);
        setActionStatus(prev => ({ ...prev, [id]: 'error' }));
      }
    }
  }

  if (isLoading) {
    return <div className="loading">Loading elections...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="admin-controls-container">
      <h1>Election Administration</h1>
      
      <div className="admin-elections-list">
        {elections.length === 0 ? (
          <div className="no-elections">
            <p>No elections available.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {elections.map((election) => (
                <tr key={election.id}>
                  <td>{election.title}</td>
                  <td>
                    <span className={`status-badge ${election.status}`}>
                      {election.status}
                    </span>
                  </td>
                  <td>{new Date(Number(election.start_time) / 1000000).toLocaleString()}</td>
                  <td>{new Date(Number(election.end_time) / 1000000).toLocaleString()}</td>
                  <td className="action-buttons">
                    {election.status === 'pending' && (
                      <button 
                        onClick={() => activateElection(election.id)}
                        disabled={actionStatus[election.id] === 'processing'}
                        className="btn btn-success"
                      >
                        {actionStatus[election.id] === 'processing' ? 'Activating...' : 'Activate'}
                      </button>
                    )}
                    
                    {election.status === 'active' && (
                      <button 
                        onClick={() => endElection(election.id)}
                        disabled={actionStatus[election.id] === 'processing'}
                        className="btn btn-warning"
                      >
                        {actionStatus[election.id] === 'processing' ? 'Ending...' : 'End Election'}
                      </button>
                    )}
                    
                    <button 
                      onClick={() => deleteElection(election.id)}
                      disabled={actionStatus[election.id] === 'processing'}
                      className="btn btn-danger"
                    >
                      {actionStatus[election.id] === 'processing' ? 'Deleting...' : 'Delete'}
                    </button>
                    
                    <button 
                      onClick={() => navigate(`/results/${election.id}`)}
                      className="btn btn-info"
                    >
                      View Results
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminControls;
