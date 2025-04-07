import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Elections from './pages/Elections';
import ElectionDetails from './pages/ElectionDetails';
import CreateElection from './pages/CreateElection';
import Results from './pages/Results';
import VerifyVote from './pages/VerifyVote';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import AdminControls from './pages/AdminControls';


function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div className="app">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/elections" element={<Elections />} />
          <Route path="/elections/:id" element={<ElectionDetails />} />
          <Route path="/results/:id" element={<Results />} />
          <Route path="/verify" element={<VerifyVote />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/create-election" 
            element={
              <ProtectedRoute>
                <CreateElection />
              </ProtectedRoute>
            } 
          />
          {/* Add the admin route */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute isAdmin={true}>
                <AdminControls />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
      <footer className="footer">
        <p>© {new Date().getFullYear()} DigiVoter - Secure Decentralized Voting on the Internet Computer</p>
      </footer>
    </div>
  );
}

export default App;
