'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiRequest, setApiToken, getApiToken } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = getApiToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const userData = await apiRequest('/auth/me');
        setUser(userData);
      } catch (err) {
        setApiToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = (token: string, userData: User) => {
    setApiToken(token);
    setUser(userData);
  };

  const logout = () => {
    apiRequest('/auth/logout', { method: 'POST' }).catch(() => {});
    setApiToken(null);
    setUser(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ user, isLoading, login, logout }}>
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}
