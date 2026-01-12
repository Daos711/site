// Supabase конфигурация
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
  // Используем origin + путь, без query params
  const baseRedirect = typeof window !== 'undefined'
    ? window.location.origin + window.location.pathname
    : undefined;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo || baseRedirect,
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

// ==================== SCORES 2048 ====================

export interface Score2048Entry {
  id: string;
  player_id: string;
  name: string;
  score: number;
  max_tile: number;
  created_at: string;
  updated_at?: string;
}

export async function getScores2048(limit = 50): Promise<Score2048Entry[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/scores_2048?select=*&order=score.desc&limit=${limit}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!res.ok) {
    console.error("Failed to fetch 2048 scores:", res.statusText);
    return [];
  }

  return res.json();
}

// Сохранить или обновить результат игрока
export async function submitScore2048(
  playerId: string,
  name: string,
  score: number,
  maxTile: number
): Promise<{ success: boolean; isNewRecord: boolean }> {
  // Сначала проверяем, есть ли уже запись для этого игрока
  const existingRes = await fetch(
    `${SUPABASE_URL}/rest/v1/scores_2048?player_id=eq.${playerId}&select=id,score,max_tile`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!existingRes.ok) {
    console.error("Failed to check existing score:", existingRes.statusText);
    return { success: false, isNewRecord: false };
  }

  const existing = await existingRes.json();

  if (existing.length > 0) {
    // Игрок уже есть - обновляем только если новый результат лучше
    const currentBest = existing[0].score;
    const currentMaxTile = existing[0].max_tile;
    if (score > currentBest || maxTile > currentMaxTile) {
      const updateRes = await fetch(
        `${SUPABASE_URL}/rest/v1/scores_2048?id=eq.${existing[0].id}`,
        {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            name,
            score: Math.max(score, currentBest),
            max_tile: Math.max(maxTile, currentMaxTile),
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!updateRes.ok) {
        console.error("Failed to update score:", updateRes.statusText);
        return { success: false, isNewRecord: false };
      }

      return { success: true, isNewRecord: score > currentBest };
    } else {
      // Результат не лучше текущего рекорда
      return { success: true, isNewRecord: false };
    }
  } else {
    // Новый игрок - создаём запись
    const insertRes = await fetch(
      `${SUPABASE_URL}/rest/v1/scores_2048`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          player_id: playerId,
          name,
          score,
          max_tile: maxTile,
        }),
      }
    );

    if (!insertRes.ok) {
      const errorBody = await insertRes.text();
      console.error("Failed to insert score:", insertRes.status, insertRes.statusText, errorBody);
      return { success: false, isNewRecord: false };
    }

    return { success: true, isNewRecord: true };
  }
}

// Сохранение/получение имени игрока для 2048
export function getPlayer2048Name(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem("player2048Name") || "";
}

export function setPlayer2048Name(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem("player2048Name", name);
}

// ==================== PENDING RESULT для 2048 (OAuth flow) ====================

export interface Pending2048Result {
  score: number;
  maxTile: number;
  name: string;
  timestamp: number;
}

const PENDING_2048_KEY = 'pending_2048_result';
const PENDING_2048_MAX_AGE = 5 * 60 * 1000; // 5 минут

export function savePending2048Result(score: number, maxTile: number, name: string): void {
  if (typeof window === 'undefined') return;
  const data: Pending2048Result = {
    score,
    maxTile,
    name,
    timestamp: Date.now(),
  };
  localStorage.setItem(PENDING_2048_KEY, JSON.stringify(data));
}

export function getPending2048Result(): Pending2048Result | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(PENDING_2048_KEY);
  if (!raw) return null;

  try {
    const data: Pending2048Result = JSON.parse(raw);
    if (Date.now() - data.timestamp > PENDING_2048_MAX_AGE) {
      clearPending2048Result();
      return null;
    }
    return data;
  } catch {
    clearPending2048Result();
    return null;
  }
}

export function clearPending2048Result(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PENDING_2048_KEY);
}
