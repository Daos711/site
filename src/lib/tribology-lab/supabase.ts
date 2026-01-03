// Supabase конфигурация для Tribology Lab
export const SUPABASE_URL = "https://tuskcdlcbasehlrsrsoe.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1c2tjZGxjYmFzZWhscnNyc29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyOTM4NzcsImV4cCI6MjA4MTg2OTg3N30.VdfhknWL4SgbMUOxFZKsnAsjI3SUbcyoYXDiONjOjao";

// Текущая версия баланса (инкремент при каждом патче)
export const BALANCE_VERSION = 1;

// ==================== ТИПЫ ====================

export interface TribolabProfile {
  player_id: string;
  nickname: string;
  created_at: string;
}

export interface TribolabRun {
  id: string;
  player_id: string;
  mode: 'daily' | 'random';
  daily_date: string | null;
  deck_modules: string[]; // ["laser", "cooler", ...]
  deck_key: string; // "analyzer|cooler|electrostatic|laser|lubricant"
  balance_version: number;
  wave_reached: number;
  kills: number;
  lives_left: number;
  run_time_ms: number;
  created_at: string;
}

export interface LeaderboardEntry extends TribolabRun {
  nickname: string;
}

// ==================== УТИЛИТЫ ====================

// Генерация канонического ключа колоды (для группировки одинаковых колод)
export function generateDeckKey(modules: string[]): string {
  return modules.slice().sort().join('|');
}

// Генерация/получение уникального ID игрока
export function getOrCreatePlayerId(): string {
  const key = "tribolabPlayerId";
  let playerId = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  if (!playerId) {
    playerId = crypto.randomUUID();
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, playerId);
    }
  }
  return playerId;
}

// Сохранение/получение никнейма
export function getPlayerNickname(): string {
  if (typeof window === 'undefined') return "";
  return localStorage.getItem("tribolabNickname") || "";
}

export function setPlayerNickname(nickname: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem("tribolabNickname", nickname);
  }
}

// Форматирование времени (мс -> MM:SS)
export function formatTimeMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// ==================== ВАЛИДАЦИЯ ====================

interface RunData {
  wave_reached: number;
  kills: number;
  lives_left: number;
  run_time_ms: number;
}

export function validateRun(data: RunData): { valid: boolean; reason?: string } {
  const { wave_reached, kills, lives_left, run_time_ms } = data;

  // Проверка диапазонов (мягкая валидация)
  if (wave_reached < 0 || wave_reached > 1000) {
    return { valid: false, reason: `wave_reached out of range: ${wave_reached}` };
  }
  if (lives_left < 0 || lives_left > 20) {
    return { valid: false, reason: `lives_left out of range: ${lives_left}` };
  }
  if (kills < 0) {
    return { valid: false, reason: `kills negative: ${kills}` };
  }

  // Проверка времени (минимум 0, максимум 4 часа)
  if (run_time_ms < 0 || run_time_ms > 14400000) {
    return { valid: false, reason: `run_time_ms out of range: ${run_time_ms}` };
  }

  return { valid: true };
}

// ==================== API ФУНКЦИИ ====================

// Получить или создать профиль игрока
export async function getOrCreateProfile(playerId: string, nickname: string): Promise<TribolabProfile | null> {
  // Проверяем существующий профиль
  const existingRes = await fetch(
    `${SUPABASE_URL}/rest/v1/tribolab_profiles?player_id=eq.${playerId}&select=*`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!existingRes.ok) {
    console.error("Failed to check profile:", existingRes.statusText);
    return null;
  }

  const existing = await existingRes.json();

  if (existing.length > 0) {
    // Обновляем никнейм если изменился
    if (existing[0].nickname !== nickname) {
      await fetch(
        `${SUPABASE_URL}/rest/v1/tribolab_profiles?player_id=eq.${playerId}`,
        {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ nickname }),
        }
      );
    }
    return { ...existing[0], nickname };
  }

  // Создаём новый профиль
  const insertRes = await fetch(
    `${SUPABASE_URL}/rest/v1/tribolab_profiles`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        player_id: playerId,
        nickname,
      }),
    }
  );

  if (!insertRes.ok) {
    console.error("Failed to create profile:", insertRes.statusText);
    return null;
  }

  const [profile] = await insertRes.json();
  return profile;
}

// Отправить результат забега
export async function submitRun(
  playerId: string,
  mode: 'daily' | 'random',
  deckModules: string[],
  waveReached: number,
  kills: number,
  livesLeft: number,
  runTimeMs: number
): Promise<{ success: boolean; runId?: string }> {
  // Валидация на клиенте (мягкая, только логирование)
  const validation = validateRun({ wave_reached: waveReached, kills, lives_left: livesLeft, run_time_ms: runTimeMs });
  if (!validation.valid) {
    console.warn("Run validation warning:", validation.reason, { waveReached, kills, livesLeft, runTimeMs });
    // Не блокируем отправку, просто предупреждаем
  }

  const deckKey = generateDeckKey(deckModules);
  const dailyDate = mode === 'daily' ? new Date().toISOString().split('T')[0] : null;

  const insertRes = await fetch(
    `${SUPABASE_URL}/rest/v1/tribolab_runs`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        player_id: playerId,
        mode,
        daily_date: dailyDate,
        deck_modules: deckModules,
        deck_key: deckKey,
        balance_version: BALANCE_VERSION,
        wave_reached: waveReached,
        kills,
        lives_left: livesLeft,
        run_time_ms: runTimeMs,
      }),
    }
  );

  if (!insertRes.ok) {
    const errorText = await insertRes.text();
    console.error("Failed to submit run:", insertRes.status, insertRes.statusText, errorText);
    console.error("Data that failed:", { playerId, mode, dailyDate, deckModules, deckKey, waveReached, kills, livesLeft, runTimeMs });
    return { success: false };
  }

  const data = await insertRes.json();
  console.log("Run submitted successfully:", data);
  const run = Array.isArray(data) ? data[0] : data;
  return { success: true, runId: run?.id };
}

// Получить Daily лидерборд
export async function getDailyLeaderboard(date?: string, limit = 100): Promise<LeaderboardEntry[]> {
  const targetDate = date || new Date().toISOString().split('T')[0];

  // Получаем забеги
  const runsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/tribolab_runs?mode=eq.daily&daily_date=eq.${targetDate}&balance_version=eq.${BALANCE_VERSION}&select=*&order=wave_reached.desc,kills.desc,lives_left.desc,run_time_ms.asc&limit=${limit}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!runsRes.ok) {
    console.error("Failed to fetch daily leaderboard:", runsRes.statusText);
    return [];
  }

  const runs: TribolabRun[] = await runsRes.json();

  // Получаем никнеймы
  const playerIds = [...new Set(runs.map(r => r.player_id))];
  if (playerIds.length === 0) return [];

  const profilesRes = await fetch(
    `${SUPABASE_URL}/rest/v1/tribolab_profiles?player_id=in.(${playerIds.join(',')})&select=player_id,nickname`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  const profiles: { player_id: string; nickname: string }[] = profilesRes.ok ? await profilesRes.json() : [];
  const nicknameMap = new Map(profiles.map(p => [p.player_id, p.nickname]));

  // Оставляем только лучший результат для каждого игрока
  const bestByPlayer = new Map<string, TribolabRun>();
  for (const run of runs) {
    const existing = bestByPlayer.get(run.player_id);
    if (!existing || compareRuns(run, existing) > 0) {
      bestByPlayer.set(run.player_id, run);
    }
  }

  return Array.from(bestByPlayer.values())
    .sort((a, b) => compareRuns(b, a))
    .slice(0, limit)
    .map(run => ({
      ...run,
      nickname: nicknameMap.get(run.player_id) || 'Аноним',
    }));
}

// Получить Random лидерборд (общий)
export async function getRandomLeaderboard(limit = 100): Promise<LeaderboardEntry[]> {
  const runsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/tribolab_runs?mode=eq.random&balance_version=eq.${BALANCE_VERSION}&select=*&order=wave_reached.desc,kills.desc,lives_left.desc,run_time_ms.asc&limit=${limit * 3}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!runsRes.ok) {
    console.error("Failed to fetch random leaderboard:", runsRes.statusText);
    return [];
  }

  const runs: TribolabRun[] = await runsRes.json();

  // Получаем никнеймы
  const playerIds = [...new Set(runs.map(r => r.player_id))];
  if (playerIds.length === 0) return [];

  const profilesRes = await fetch(
    `${SUPABASE_URL}/rest/v1/tribolab_profiles?player_id=in.(${playerIds.join(',')})&select=player_id,nickname`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  const profiles: { player_id: string; nickname: string }[] = profilesRes.ok ? await profilesRes.json() : [];
  const nicknameMap = new Map(profiles.map(p => [p.player_id, p.nickname]));

  // Лучший результат для каждого игрока
  const bestByPlayer = new Map<string, TribolabRun>();
  for (const run of runs) {
    const existing = bestByPlayer.get(run.player_id);
    if (!existing || compareRuns(run, existing) > 0) {
      bestByPlayer.set(run.player_id, run);
    }
  }

  return Array.from(bestByPlayer.values())
    .sort((a, b) => compareRuns(b, a))
    .slice(0, limit)
    .map(run => ({
      ...run,
      nickname: nicknameMap.get(run.player_id) || 'Аноним',
    }));
}

// Получить Random лидерборд по конкретной колоде
export async function getRandomLeaderboardByDeck(deckKey: string, limit = 100): Promise<LeaderboardEntry[]> {
  const runsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/tribolab_runs?mode=eq.random&deck_key=eq.${encodeURIComponent(deckKey)}&balance_version=eq.${BALANCE_VERSION}&select=*&order=wave_reached.desc,kills.desc,lives_left.desc,run_time_ms.asc&limit=${limit * 3}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!runsRes.ok) {
    console.error("Failed to fetch deck leaderboard:", runsRes.statusText);
    return [];
  }

  const runs: TribolabRun[] = await runsRes.json();

  const playerIds = [...new Set(runs.map(r => r.player_id))];
  if (playerIds.length === 0) return [];

  const profilesRes = await fetch(
    `${SUPABASE_URL}/rest/v1/tribolab_profiles?player_id=in.(${playerIds.join(',')})&select=player_id,nickname`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  const profiles: { player_id: string; nickname: string }[] = profilesRes.ok ? await profilesRes.json() : [];
  const nicknameMap = new Map(profiles.map(p => [p.player_id, p.nickname]));

  // Лучший результат для каждого игрока
  const bestByPlayer = new Map<string, TribolabRun>();
  for (const run of runs) {
    const existing = bestByPlayer.get(run.player_id);
    if (!existing || compareRuns(run, existing) > 0) {
      bestByPlayer.set(run.player_id, run);
    }
  }

  return Array.from(bestByPlayer.values())
    .sort((a, b) => compareRuns(b, a))
    .slice(0, limit)
    .map(run => ({
      ...run,
      nickname: nicknameMap.get(run.player_id) || 'Аноним',
    }));
}

// Получить рекорды игрока
export async function getPlayerRuns(playerId: string, limit = 50): Promise<TribolabRun[]> {
  const runsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/tribolab_runs?player_id=eq.${playerId}&select=*&order=created_at.desc&limit=${limit}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!runsRes.ok) {
    console.error("Failed to fetch player runs:", runsRes.statusText);
    return [];
  }

  return runsRes.json();
}

// Получить колоду дня
export async function getDailyDeck(date?: string): Promise<string[] | null> {
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/tribolab_daily_decks?date=eq.${targetDate}&select=deck_modules`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!res.ok) {
      // Таблица может не существовать или быть пустой - это нормально
      return null;
    }

    const data = await res.json();
    return data.length > 0 ? data[0].deck_modules : null;
  } catch (err) {
    // Сетевая ошибка - молча возвращаем null
    return null;
  }
}

// Сравнение двух забегов (для сортировки)
// Возвращает >0 если a лучше b, <0 если b лучше a
function compareRuns(a: TribolabRun, b: TribolabRun): number {
  // 1. Больше волн = лучше
  if (a.wave_reached !== b.wave_reached) {
    return a.wave_reached - b.wave_reached;
  }
  // 2. Больше убийств = лучше
  if (a.kills !== b.kills) {
    return a.kills - b.kills;
  }
  // 3. Больше жизней = лучше
  if (a.lives_left !== b.lives_left) {
    return a.lives_left - b.lives_left;
  }
  // 4. Меньше времени = лучше
  return b.run_time_ms - a.run_time_ms;
}
