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
  const [user, setUser] = useState<AuthContextType['user']>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
      // Fetch user data if we have a token but no user data
      if (!user) {
        auth.getCurrentUser()
          .then(userData => {
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          })
          .catch(error => {
            console.error('Failed to fetch user data:', error);
            // If we can't fetch user data, the token might be invalid
            logout();
          });
      }
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

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
      console.log('Attempting Google login with credential:', credentialResponse);
      const response = await auth.googleLogin(credentialResponse.credential || '');
      console.log('Google login response:', response);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (error) {
      console.error('Error in Google login:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      throw error; // Re-throw to be handled by the component
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthContext.Provider value={{ isAuthenticated, login, googleLogin, logout, token, user }}>
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
};
