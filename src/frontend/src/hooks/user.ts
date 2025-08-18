"use client";

import { useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  role: string;
}

export const useUser = () => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar usuario desde localStorage al inicializar
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUserState(parsedUser);
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        localStorage.removeItem('user'); // Limpiar datos corruptos
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const setUser = (userData: string | User | null) => {
    try {
      if (userData === null) {
        setUserState(null);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        return;
      }

      let parsedUser: User;
      if (typeof userData === 'string') {
        parsedUser = JSON.parse(userData);
      } else {
        parsedUser = userData;
      }

      setUserState(parsedUser);
      localStorage.setItem('user', JSON.stringify(parsedUser));
    } catch (error) {
      console.error('Error setting user:', error);
    }
  };

  const clearUser = () => {
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
    }
  };

  const isAuthenticated = () => {
    return user !== null && localStorage.getItem('authToken') !== null;
  };

  return {
    user,
    setUser,
    clearUser,
    updateUser,
    isAuthenticated,
    isLoading
  };
};
