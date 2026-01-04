// Supabase конфигурация
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = "https://tuskcdlcbasehlrsrsoe.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1c2tjZGxjYmFzZWhscnNyc29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyOTM4NzcsImV4cCI6MjA4MTg2OTg3N30.VdfhknWL4SgbMUOxFZKsnAsjI3SUbcyoYXDiONjOjao";

// Supabase клиент (singleton)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== АВТОРИЗАЦИЯ ====================

export interface AuthUser {
  id: string;
  email: string | undefined;
  name: string | undefined;
  avatar: string | undefined;
}

// Вход через Google
export async function signInWithGoogle(redirectTo?: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo || (typeof window !== 'undefined' ? window.location.href : undefined),
    },
  });
  if (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
}

// Выход
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

// Получить текущего пользователя
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name || user.user_metadata?.name,
    avatar: user.user_metadata?.avatar_url,
  };
}

// Подписка на изменения авторизации
export function onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      callback({
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
        avatar: session.user.user_metadata?.avatar_url,
      });
    } else {
      callback(null);
    }
  });

  return () => subscription.unsubscribe();
}

// Генерация/получение анонимного ID игрока
export function getAnonymousPlayerId(): string {
  const key = "sitePlayerId";
  let playerId = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  if (!playerId) {
    playerId = crypto.randomUUID();
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, playerId);
    }
  }
  return playerId;
}

// Получить ID игрока (auth user ID если залогинен, иначе анонимный)
export function getPlayerId(authUser: AuthUser | null): string {
  if (authUser) {
    return authUser.id;
  }
  return getAnonymousPlayerId();
}

// ==================== SCORES (для digits и других игр) ====================

export interface ScoreEntry {
  id: string;
  player_id: string;
  name: string;
  score: number;
  game_score: number;
  time_bonus: number;
  remaining_time: number;
  created_at: string;
  updated_at?: string;
}

export async function getScores(limit = 50): Promise<ScoreEntry[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/scores?select=*&order=score.desc&limit=${limit}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!res.ok) {
    console.error("Failed to fetch scores:", res.statusText);
    return [];
  }

  return res.json();
}
