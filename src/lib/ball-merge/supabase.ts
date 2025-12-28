// Supabase конфигурация для Ball Merge
export const SUPABASE_URL = "https://tuskcdlcbasehlrsrsoe.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1c2tjZGxjYmFzZWhscnNyc29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyOTM4NzcsImV4cCI6MjA4MTg2OTg3N30.VdfhknWL4SgbMUOxFZKsnAsjI3SUbcyoYXDiONjOjao";

export interface BallMergeScore {
  id: string;
  player_id: string;
  name: string;
  score: number;
  created_at: string;
  updated_at?: string;
}

// Получить таблицу лидеров
export async function getBallMergeScores(limit = 50): Promise<BallMergeScore[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/ball_merge_scores?select=*&order=score.desc&limit=${limit}`,
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

  return res.json();
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
  return localStorage.getItem("ballMergePlayerName") || "";
}

export function setPlayerName(name: string): void {
  localStorage.setItem("ballMergePlayerName", name);
}
