// Supabase конфигурация
export const SUPABASE_URL = "https://tuskcdlcbasehlrsrsoe.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1c2tjZGxjYmFzZWhscnNyc29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4MDk1MzEsImV4cCI6MjA1MDM4NTUzMX0.placeholder";

// Нужно заменить SUPABASE_ANON_KEY на реальный ключ из Supabase Dashboard
// Project Settings → API → anon public key

export interface ScoreEntry {
  id: string;
  player_id: string;
  name: string;
  score: number;
  game_score: number;
  time_bonus: number;
  remaining_time: number;
  created_at: string;
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
