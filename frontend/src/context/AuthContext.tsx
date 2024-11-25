import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/api';
import { GoogleOAuthProvider, CredentialResponse } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
if (!GOOGLE_CLIENT_ID) {
  throw new Error('REACT_APP_GOOGLE_CLIENT_ID environment variable is not set');
}

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (credentialResponse: CredentialResponse) => Promise<void>;
  logout: () => void;
  token: string | null;
  user: {
    username: string;
    email: string;
    profile_photo: string | null;
  } | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  const [user, setUser] = useState<AuthContextType['user']>(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const response = await auth.login(email, password);
      setToken(response.token);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const googleLogin = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error('No credentials received from Google');
      }
      const response = await auth.googleLogin(credentialResponse.credential);
      setToken(response.token);
      setUser(response.user);
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthContext.Provider value={{ isAuthenticated, login, googleLogin, logout, token, user }}>
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
};
