
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { AuthResponse } from '../types';

interface AuthContextType {
  acsToken: string | null;
  acsTokenExpire: string | null;
  utipToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [acsToken, setAcsToken] = useState<string | null>(null);
  const [acsTokenExpire, setAcsTokenExpire] = useState<string | null>(null);
  const [utipToken, setUtipToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('acsToken');
      const storedTokenExpire = localStorage.getItem('acsTokenExpire');
      const storedUtipToken = localStorage.getItem('utipToken');
      if (storedToken && storedTokenExpire) {
        setAcsToken(storedToken);
        setAcsTokenExpire(storedTokenExpire);
        if (storedUtipToken) {
            setUtipToken(storedUtipToken);
        }
      }
    } catch (e) {
      console.error("Failed to read from localStorage", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('https://dev-virt-point.utip.work/v3/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, wt: true }),
      });

      const data: AuthResponse = await response.json();

      if (response.ok && data.result === 'OK' && data.acsToken) {
        setAcsToken(data.acsToken);
        setAcsTokenExpire(data.acsTokenExpire);
        localStorage.setItem('acsToken', data.acsToken);
        localStorage.setItem('acsTokenExpire', data.acsTokenExpire);

        if (data.utipToken) {
            setUtipToken(data.utipToken);
            localStorage.setItem('utipToken', data.utipToken);
        }
      } else {
        throw new Error(data.result || 'Authentication failed');
      }
    } catch (err) {
        let errorMessage = 'An unknown error occurred.';
        if (err instanceof Error) {
            errorMessage = err.message;
        }
        setError(errorMessage);
        // Re-throw to be caught by the caller if needed
        throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setAcsToken(null);
    setAcsTokenExpire(null);
    setUtipToken(null);
    localStorage.removeItem('acsToken');
    localStorage.removeItem('acsTokenExpire');
    localStorage.removeItem('utipToken');
    localStorage.removeItem('symbols-list'); // Also clear symbols on logout
  }, []);

  const value = { acsToken, acsTokenExpire, utipToken, login, logout, isLoading, error };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
