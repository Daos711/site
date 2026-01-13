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

// 4x4 Classic
export async function getScores2048(limit = 50): Promise<Score2048Entry[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/scores_2048?select=*&order=score.desc&limit=${limit}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    console.error("Failed to fetch 2048 scores:", res.statusText);
    return [];
  }

  return res.json();
}

// 3x3 Mini
export async function getScores2048_3x3(limit = 50): Promise<Score2048Entry[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/scores_2048_3x3?select=*&order=score.desc&limit=${limit}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    console.error("Failed to fetch 2048 3x3 scores:", res.statusText);
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
  const encodedPlayerId = encodeURIComponent(playerId);
  const existingRes = await fetch(
    `${SUPABASE_URL}/rest/v1/scores_2048?player_id=eq.${encodedPlayerId}&select=id,score,max_tile`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: 'no-store',
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

// Сохранить или обновить результат игрока (3x3)
export async function submitScore2048_3x3(
  playerId: string,
  name: string,
  score: number,
  maxTile: number
): Promise<{ success: boolean; isNewRecord: boolean }> {
  const encodedPlayerId = encodeURIComponent(playerId);
  const existingRes = await fetch(
    `${SUPABASE_URL}/rest/v1/scores_2048_3x3?player_id=eq.${encodedPlayerId}&select=id,score,max_tile`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: 'no-store',
    }
  );

  if (!existingRes.ok) {
    console.error("Failed to check existing 3x3 score:", existingRes.statusText);
    return { success: false, isNewRecord: false };
  }

  const existing = await existingRes.json();

  if (existing.length > 0) {
    const currentBest = existing[0].score;
    const currentMaxTile = existing[0].max_tile;
    if (score > currentBest || maxTile > currentMaxTile) {
      const updateRes = await fetch(
        `${SUPABASE_URL}/rest/v1/scores_2048_3x3?id=eq.${existing[0].id}`,
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
        console.error("Failed to update 3x3 score:", updateRes.statusText);
        return { success: false, isNewRecord: false };
      }

      return { success: true, isNewRecord: score > currentBest };
    } else {
      return { success: true, isNewRecord: false };
    }
  } else {
    const insertRes = await fetch(
      `${SUPABASE_URL}/rest/v1/scores_2048_3x3`,
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
      console.error("Failed to insert 3x3 score:", insertRes.status, insertRes.statusText, errorBody);
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
  gridSize?: 3 | 4;
}

const PENDING_2048_KEY = 'pending_2048_result';
const PENDING_2048_MAX_AGE = 5 * 60 * 1000; // 5 минут

export function savePending2048Result(score: number, maxTile: number, name: string, gridSize: 3 | 4 = 4): void {
  if (typeof window === 'undefined') return;
  const data: Pending2048Result = {
    score,
    maxTile,
    name,
    timestamp: Date.now(),
    gridSize,
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

// ==================== SCORES SOKOBAN ====================

export interface SokobanScoreEntry {
  id: string;
  player_id: string;
  name: string;
  level: number;
  moves: number;
  pushes: number;
  created_at: string;
  updated_at?: string;
}

// Получить лидерборд для конкретного уровня
export async function getSokobanScores(level: number, limit = 10): Promise<SokobanScoreEntry[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/scores_sokoban?level=eq.${level}&select=*&order=moves.asc,pushes.asc&limit=${limit}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    console.error("Failed to fetch sokoban scores:", res.statusText);
    return [];
  }

  return res.json();
}

// Получить лучший результат игрока на уровне
export async function getPlayerSokobanScore(playerId: string, level: number): Promise<SokobanScoreEntry | null> {
  const encodedPlayerId = encodeURIComponent(playerId);
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/scores_sokoban?player_id=eq.${encodedPlayerId}&level=eq.${level}&select=*`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    console.error("Failed to fetch player sokoban score:", res.statusText);
    return null;
  }

  const data = await res.json();
  return data.length > 0 ? data[0] : null;
}

// Сохранить или обновить результат игрока на уровне
export async function submitSokobanScore(
  playerId: string,
  name: string,
  level: number,
  moves: number,
  pushes: number
): Promise<{ success: boolean; isNewRecord: boolean }> {
  const encodedPlayerId = encodeURIComponent(playerId);

  // Проверяем существующий результат
  const existingRes = await fetch(
    `${SUPABASE_URL}/rest/v1/scores_sokoban?player_id=eq.${encodedPlayerId}&level=eq.${level}&select=id,moves,pushes`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: 'no-store',
    }
  );

  if (!existingRes.ok) {
    console.error("Failed to check existing sokoban score:", existingRes.statusText);
    return { success: false, isNewRecord: false };
  }

  const existing = await existingRes.json();

  if (existing.length > 0) {
    // Обновляем только если результат лучше (меньше ходов, или при равных ходах меньше толчков)
    const currentMoves = existing[0].moves;
    const currentPushes = existing[0].pushes;
    const isBetter = moves < currentMoves || (moves === currentMoves && pushes < currentPushes);

    if (isBetter) {
      const updateRes = await fetch(
        `${SUPABASE_URL}/rest/v1/scores_sokoban?id=eq.${existing[0].id}`,
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
            moves,
            pushes,
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!updateRes.ok) {
        console.error("Failed to update sokoban score:", updateRes.statusText);
        return { success: false, isNewRecord: false };
      }

      return { success: true, isNewRecord: true };
    } else {
      return { success: true, isNewRecord: false };
    }
  } else {
    // Новая запись
    const insertRes = await fetch(
      `${SUPABASE_URL}/rest/v1/scores_sokoban`,
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
          level,
          moves,
          pushes,
        }),
      }
    );

    if (!insertRes.ok) {
      const errorBody = await insertRes.text();
      console.error("Failed to insert sokoban score:", insertRes.status, insertRes.statusText, errorBody);
      return { success: false, isNewRecord: false };
    }

    return { success: true, isNewRecord: true };
  }
}

// Имя игрока для Sokoban
export function getSokobanPlayerName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem("sokobanPlayerName") || "";
}

export function setSokobanPlayerName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem("sokobanPlayerName", name);
}

// ==================== SOKOBAN PROGRESS (облачное сохранение) ====================

export interface SokobanProgress {
  id: string;
  player_id: string;
  unlocked_levels: number;
  best_scores: Record<number, { moves: number; pushes: number }>;
  created_at: string;
  updated_at?: string;
}

// Получить прогресс игрока
export async function getSokobanProgress(playerId: string): Promise<SokobanProgress | null> {
  const encodedPlayerId = encodeURIComponent(playerId);
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/sokoban_progress?player_id=eq.${encodedPlayerId}&select=*`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    console.error("Failed to fetch sokoban progress:", res.statusText);
    return null;
  }

  const data = await res.json();
  return data.length > 0 ? data[0] : null;
}

// Сохранить или обновить прогресс игрока
export async function saveSokobanProgress(
  playerId: string,
  unlockedLevels: number,
  bestScores: Record<number, { moves: number; pushes: number }>
): Promise<boolean> {
  const encodedPlayerId = encodeURIComponent(playerId);

  // Проверяем существующий прогресс
  const existingRes = await fetch(
    `${SUPABASE_URL}/rest/v1/sokoban_progress?player_id=eq.${encodedPlayerId}&select=id`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: 'no-store',
    }
  );

  if (!existingRes.ok) {
    console.error("Failed to check existing progress:", existingRes.statusText);
    return false;
  }

  const existing = await existingRes.json();

  if (existing.length > 0) {
    // Обновляем существующий
    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/sokoban_progress?id=eq.${existing[0].id}`,
      {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          unlocked_levels: unlockedLevels,
          best_scores: bestScores,
          updated_at: new Date().toISOString(),
        }),
      }
    );

    if (!updateRes.ok) {
      console.error("Failed to update progress:", updateRes.statusText);
      return false;
    }
    return true;
  } else {
    // Создаём новый
    const insertRes = await fetch(
      `${SUPABASE_URL}/rest/v1/sokoban_progress`,
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
          unlocked_levels: unlockedLevels,
          best_scores: bestScores,
        }),
      }
    );

    if (!insertRes.ok) {
      const errorBody = await insertRes.text();
      console.error("Failed to insert progress:", insertRes.status, insertRes.statusText, errorBody);
      return false;
    }
    return true;
  }
}

// ==================== SCORES QUICK MATH ====================

export interface QuickMathScoreEntry {
  id: string;
  player_id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  date_seed: number;
  time_ms: number;
  created_at: string;
  updated_at?: string;
}

// Получить лидерборд для уровня сложности и дня
export async function getQuickMathScores(
  difficulty: 'easy' | 'medium' | 'hard',
  dateSeed: number,
  limit = 10
): Promise<QuickMathScoreEntry[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/scores_quickmath?difficulty=eq.${difficulty}&date_seed=eq.${dateSeed}&select=*&order=time_ms.asc&limit=${limit}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    console.error("Failed to fetch quickmath scores:", res.statusText);
    return [];
  }

  return res.json();
}

// Сохранить или обновить результат игрока
export async function submitQuickMathScore(
  playerId: string,
  name: string,
  difficulty: 'easy' | 'medium' | 'hard',
  dateSeed: number,
  timeMs: number
): Promise<{ success: boolean; isNewRecord: boolean }> {
  const encodedPlayerId = encodeURIComponent(playerId);

  // Проверяем существующий результат для этого игрока, сложности и дня
  const existingRes = await fetch(
    `${SUPABASE_URL}/rest/v1/scores_quickmath?player_id=eq.${encodedPlayerId}&difficulty=eq.${difficulty}&date_seed=eq.${dateSeed}&select=id,time_ms`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: 'no-store',
    }
  );

  if (!existingRes.ok) {
    console.error("Failed to check existing quickmath score:", existingRes.statusText);
    return { success: false, isNewRecord: false };
  }

  const existing = await existingRes.json();

  if (existing.length > 0) {
    // Обновляем только если результат лучше (меньше времени)
    const currentTime = existing[0].time_ms;
    if (timeMs < currentTime) {
      const updateRes = await fetch(
        `${SUPABASE_URL}/rest/v1/scores_quickmath?id=eq.${existing[0].id}`,
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
            time_ms: timeMs,
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!updateRes.ok) {
        console.error("Failed to update quickmath score:", updateRes.statusText);
        return { success: false, isNewRecord: false };
      }

      return { success: true, isNewRecord: true };
    } else {
      return { success: true, isNewRecord: false };
    }
  } else {
    // Новая запись
    const insertRes = await fetch(
      `${SUPABASE_URL}/rest/v1/scores_quickmath`,
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
          difficulty,
          date_seed: dateSeed,
          time_ms: timeMs,
        }),
      }
    );

    if (!insertRes.ok) {
      const errorBody = await insertRes.text();
      console.error("Failed to insert quickmath score:", insertRes.status, insertRes.statusText, errorBody);
      return { success: false, isNewRecord: false };
    }

    return { success: true, isNewRecord: true };
  }
}

// Имя игрока для Quick Math
export function getQuickMathPlayerName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem("quickmathPlayerName") || "";
}

export function setQuickMathPlayerName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem("quickmathPlayerName", name);
}
