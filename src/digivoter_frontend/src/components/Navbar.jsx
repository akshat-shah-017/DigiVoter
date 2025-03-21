import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { isAuthenticated, login, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">DigiVoter</Link>
      </div>
      <div className="navbar-menu">
        <Link to="/" className="navbar-item">Home</Link>
        <Link to="/elections" className="navbar-item">Elections</Link>
        {isAuthenticated && (
          <Link to="/create-election" className="navbar-item">Create Election</Link>
        )}
        <Link to="/verify" className="navbar-item">Verify Vote</Link>
      </div>
      <div className="navbar-auth">
        {isAuthenticated ? (
          <button onClick={logout} className="btn btn-outline">Logout</button>
        ) : (
          <button onClick={login} className="btn btn-primary">Login</button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
