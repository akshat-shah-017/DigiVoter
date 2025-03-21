import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const success = await login();
      if (success) {
        navigate('/elections');
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during authentication. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Login to DigiVoter</h1>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <p className="login-description">
          To participate in elections, please authenticate using Internet Identity.
          This secure authentication method protects your privacy while ensuring vote integrity.
        </p>
        
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="btn btn-primary login-button"
        >
          {isLoading ? 'Authenticating...' : 'Login with Internet Identity'}
        </button>
        
        <div className="login-info">
          <p>
            Internet Identity is a secure, non-custodial authentication system that protects your privacy.
            No personal information is shared with DigiVoter.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
