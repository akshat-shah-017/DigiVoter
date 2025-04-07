import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { digivoter_backend } from "../../../declarations/digivoter_backend";

function CreateElection() {
  const navigate = useNavigate();
  const { identity } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index) => {
    if (options.length <= 2) return;
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    
    if (options.some(option => !option.trim())) {
      setError('All options must be filled');
      return;
    }
    
    if (!startDate || !endDate) {
      setError('Start and end dates are required');
      return;
    }
    
    const startTime = new Date(startDate).getTime() * 1000000;
    const endTime = new Date(endDate).getTime() * 1000000;
    
    if (startTime >= endTime) {
      setError('End date must be after start date');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      console.log("Initializing actor for election creation");
      console.log("Actor initialized, creating election");
      const electionId = await digivoter_backend.create_election(
        title,
        description,
        options.filter(opt => opt.trim()),
        BigInt(startTime),
        BigInt(endTime)
      );
      console.log("Election created successfully, ID:", electionId);
      
      // Add a try-catch specifically for navigation
      try {
        navigate('/elections');
      } catch (navError) {
        console.error("Navigation error:", navError);
        setError('Election created but navigation failed. Please go to Elections page manually.');
      }
    } catch (err) {
      console.error("Failed to create election:", err);
      if (err instanceof Error) {
        console.error("Error name:", err.name);
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
      }
      setError('Failed to create election. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-election-container">
      <h1>Create New Election</h1>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="election-form">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter election title"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the purpose of this election"
            rows="3"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Options</label>
          {options.map((option, index) => (
            <div key={index} className="option-input">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                required
              />
              {options.length > 2 && (
                <button 
                  type="button" 
                  className="remove-option"
                  onClick={() => removeOption(index)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button 
            type="button" 
            className="btn btn-outline add-option"
            onClick={addOption}
          >
            + Add Option
          </button>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="datetime-local"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input
              type="datetime-local"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Election'}
        </button>
      </form>
    </div>
  );
}

export default CreateElection;
