// Supabase конфигурация для Ball Merge (из общих env)
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export interface BallMergeScore {
  id: string;
  player_id: string;
  name: string;
  score: number;
  created_at: string;
  updated_at?: string;
}

// Получить таблицу лидеров (только лучший результат для каждого игрока)
export async function getBallMergeScores(limit = 50): Promise<BallMergeScore[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/ball_merge_scores?select=*&order=score.desc`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!res.ok) {
    console.error("Failed to fetch ball merge scores:", res.statusText);
    return [];
  }

  const allScores: BallMergeScore[] = await res.json();

  // Оставляем только лучший результат для каждого имени
  const bestByName = new Map<string, BallMergeScore>();
  for (const score of allScores) {
    const existing = bestByName.get(score.name);
    if (!existing || score.score > existing.score) {
      bestByName.set(score.name, score);
    }
  }

  // Сортируем по убыванию и ограничиваем
  return Array.from(bestByName.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// Сохранить или обновить результат игрока
export async function submitBallMergeScore(
  playerId: string,
  name: string,
  score: number
): Promise<{ success: boolean; isNewRecord: boolean }> {
  // Сначала проверяем, есть ли уже запись для этого игрока
  const existingRes = await fetch(
    `${SUPABASE_URL}/rest/v1/ball_merge_scores?player_id=eq.${playerId}&select=id,score`,
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
    if (score > currentBest) {
      const updateRes = await fetch(
        `${SUPABASE_URL}/rest/v1/ball_merge_scores?id=eq.${existing[0].id}`,
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
            score,
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!updateRes.ok) {
        console.error("Failed to update score:", updateRes.statusText);
        return { success: false, isNewRecord: false };
      }

      return { success: true, isNewRecord: true };
    } else {
      // Результат не лучше текущего рекорда
      return { success: true, isNewRecord: false };
    }
  } else {
    // Новый игрок - создаём запись
    const insertRes = await fetch(
      `${SUPABASE_URL}/rest/v1/ball_merge_scores`,
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
        }),
      }
    );

    if (!insertRes.ok) {
      console.error("Failed to insert score:", insertRes.statusText);
      return { success: false, isNewRecord: false };
    }

    return { success: true, isNewRecord: true };
  }
}

// Генерация уникального ID игрока
export function getOrCreatePlayerId(): string {
  if (typeof window === 'undefined') return '';
  const key = "ballMergePlayerId";
  let playerId = localStorage.getItem(key);
  if (!playerId) {
    playerId = crypto.randomUUID();
    localStorage.setItem(key, playerId);
  }
  return playerId;
}

// Сохранение/получение имени игрока
export function getPlayerName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem("ballMergePlayerName") || "";
}

export function setPlayerName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem("ballMergePlayerName", name);
}

// ==================== PENDING RESULT (для OAuth) ====================

export interface PendingBallMergeResult {
  score: number;
  name: string;
  timestamp: number; // для проверки актуальности
}

const PENDING_RESULT_KEY = 'ballmerge_pending_result';
const PENDING_RESULT_MAX_AGE = 5 * 60 * 1000; // 5 минут

export function savePendingResult(score: number, name: string): void {
  if (typeof window === 'undefined') return;
  const data: PendingBallMergeResult = {
    score,
    name,
    timestamp: Date.now(),
  };
  localStorage.setItem(PENDING_RESULT_KEY, JSON.stringify(data));
}

export function getPendingResult(): PendingBallMergeResult | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(PENDING_RESULT_KEY);
  if (!raw) return null;

  try {
    const data: PendingBallMergeResult = JSON.parse(raw);
    // Проверяем актуальность (не старше 5 минут)
    if (Date.now() - data.timestamp > PENDING_RESULT_MAX_AGE) {
      clearPendingResult();
      return null;
    }
    return data;
  } catch {
    clearPendingResult();
    return null;
  }
}

export function clearPendingResult(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PENDING_RESULT_KEY);
}
