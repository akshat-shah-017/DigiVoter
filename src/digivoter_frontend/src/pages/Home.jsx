import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="home-container">
      <div className="hero">
        <h1>Welcome to DigiVoter</h1>
        <p>A secure, transparent, and decentralized voting system built on the Internet Computer</p>
        <div className="hero-buttons">
          <Link to="/elections" className="btn btn-primary">View Elections</Link>
          <Link to="/verify" className="btn btn-outline">Verify Your Vote</Link>
        </div>
      </div>
      
      <div className="features">
        <div className="feature-card">
          <h2>Secure</h2>
          <p>End-to-end encryption ensures your vote remains private and tamper-proof</p>
        </div>
        <div className="feature-card">
          <h2>Transparent</h2>
          <p>All votes are recorded on the blockchain, allowing for complete transparency</p>
        </div>
        <div className="feature-card">
          <h2>Verifiable</h2>
          <p>Verify that your vote was counted correctly without compromising anonymity</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
