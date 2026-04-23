import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      // Sync user to backend database (non-blocking)
      import('../services/api').then(({ apiService }) => {
        apiService.get('/user/me').catch(() => {});
      });
    } catch (error) {
      console.debug('Not authenticated yet');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut();
    } catch {
      // ignore
    }
    setUser(null);
  };

  const value = {
    user,
    isLoading,
    signOutUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};