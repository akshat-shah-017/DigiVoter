import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { digivoter_backend } from "../../../declarations/digivoter_backend";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [authClient, setAuthClient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);  // Moved inside the component

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    async function checkAdminStatus() {
      if (isAuthenticated && principal) {
        try {
          const result = await digivoter_backend.is_admin(principal);
          setIsAdmin(result);
        } catch (error) {
          console.error("Error checking admin status:", error);
        }
      }
    }
    
    checkAdminStatus();
  }, [isAuthenticated, principal]);  // Moved inside the component

  async function initAuth() {
    try {
      const client = await AuthClient.create({
        idleOptions: {
          disableIdle: true,
        }
      });
      setAuthClient(client);

      const isAuthenticated = await client.isAuthenticated();
      setIsAuthenticated(isAuthenticated);

      if (isAuthenticated) {
        const identity = client.getIdentity();
        setIdentity(identity);
        setPrincipal(identity.getPrincipal());
        console.log("Authenticated with principal:", identity.getPrincipal().toString());
      } else {
        console.log("Not authenticated");
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login() {
    return new Promise((resolve) => {
      const isLocalDevelopment = window.location.hostname === 'localhost' || 
                               window.location.hostname.includes('127.0.0.1');
      
      const identityProvider = isLocalDevelopment 
        ? `http://${window.location.hostname}:4943?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai` 
        : process.env.II_URL || 'https://identity.ic0.app';
      
      console.log("Using identity provider:", identityProvider);
      
      authClient.login({
        identityProvider,
        maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 7 days in nanoseconds
        onSuccess: async () => {
          const identity = authClient.getIdentity();
          setIsAuthenticated(true);
          setIdentity(identity);
          setPrincipal(identity.getPrincipal());
          console.log("Login successful, principal:", identity.getPrincipal().toString());
          resolve(true);
        },
        onError: (error) => {
          console.error('Login failed:', error);
          resolve(false);
        }
      });
    });
  }

  async function logout() {
    try {
      await authClient.logout();
      setIsAuthenticated(false);
      setIdentity(null);
      setPrincipal(null);
      setIsAdmin(false);
      console.log("Logout successful");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }

  const value = {
    isAuthenticated,
    identity,
    principal,
    isLoading,
    isAdmin,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
