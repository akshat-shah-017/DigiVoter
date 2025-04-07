import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { digivoter_backend } from '../../../declarations/digivoter_backend';


function VerifyVote() {
  const [verificationHash, setVerificationHash] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');
  const { identity } = useAuth();

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!verificationHash.trim()) {
      setError('Please enter a verification hash');
      return;
    }
    
    setIsVerifying(true);
    setError('');
    setVerificationResult(null);
    
    try {
      // const actor = API.initializeActor(identity);
      const result = await digivoter_backend.verify_vote(verificationHash.trim());
      setVerificationResult(result);
    } catch (err) {
      setError('Failed to verify vote. Please check your hash and try again.');
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Verify Your Vote</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <p className="mb-4 text-gray-600">
          Enter the verification hash you received after casting your vote to verify that it was correctly recorded.
        </p>
        
        <form onSubmit={handleVerify}>
          <div className="mb-4">
            <label htmlFor="verification-hash" className="block text-sm font-medium text-gray-700 mb-1">
              Verification Hash
            </label>
            <input
              id="verification-hash"
              type="text"
              value={verificationHash}
              onChange={(e) => setVerificationHash(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your verification hash"
            />
          </div>
          
          <button
            type="submit"
            disabled={isVerifying || !verificationHash.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isVerifying ? 'Verifying...' : 'Verify Vote'}
          </button>
        </form>
      </div>
      
      {verificationResult !== null && (
        <div className={`p-4 rounded-lg ${verificationResult ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
          {verificationResult ? (
            <div>
              <h2 className="font-bold text-lg mb-2">Vote Verified Successfully!</h2>
              <p>Your vote has been properly recorded and will be counted in the final results.</p>
            </div>
          ) : (
            <div>
              <h2 className="font-bold text-lg mb-2">Verification Failed</h2>
              <p>We couldn't verify this hash. Please check that you entered it correctly.</p>
            </div>
          )}
        </div>
      )}
      
      <div className="bg-blue-50 p-4 rounded border border-blue-200 mt-6">
        <h3 className="font-semibold mb-2">About Vote Verification</h3>
        <p className="text-sm text-gray-700">
          Vote verification allows you to confirm that your vote was correctly recorded without revealing how you voted.
          This helps ensure the integrity of the election while maintaining your privacy.
        </p>
      </div>
    </div>
  );
}

export default VerifyVote;
