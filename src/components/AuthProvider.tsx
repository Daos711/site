'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  AuthUser,
  getCurrentUser,
  onAuthStateChange,
  signInWithGoogle,
  signOut,
  getPlayerId,
  getAnonymousPlayerId,
} from '@/lib/supabase';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  playerId: string;
  signIn: (redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  // Инициализируем анонимным ID сразу, потом обновим если есть auth
  const [playerId, setPlayerId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return getAnonymousPlayerId();
    }
    return '';
  });

  useEffect(() => {
    // Проверяем авторизацию при загрузке
    getCurrentUser().then((authUser) => {
      setUser(authUser);
      setPlayerId(getPlayerId(authUser));
      setLoading(false);
    });

    // Подписываемся на изменения
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      setPlayerId(getPlayerId(authUser));
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = useCallback(async (redirectTo?: string) => {
    try {
      await signInWithGoogle(redirectTo);
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        playerId,
        signIn: handleSignIn,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
