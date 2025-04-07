import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { digivoter_backend } from "../../../declarations/digivoter_backend";

function Navbar() {
  const { isAuthenticated, principal, login, logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!isAuthenticated || !principal) return;

      try {
        const result = await digivoter_backend.is_admin(principal);
        setIsAdmin(result);
      } catch (error) {
        console.error("Error checking admin status:", error);
      }
    }

    checkAdminStatus();
  }, [isAuthenticated, principal]);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">DigiVoter</Link>
      </div>
      <div className="navbar-menu">
        <Link to="/" className="navbar-item">Home</Link>
        <Link to="/elections" className="navbar-item">Elections</Link>
        {isAuthenticated && (
          <>
            <Link to="/create-election" className="navbar-item">Create Election</Link>
            {isAdmin && (
              <Link to="/admin" className="navbar-item admin-link">Admin</Link>
            )}
          </>
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
