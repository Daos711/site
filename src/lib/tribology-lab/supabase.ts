// Supabase конфигурация для Tribology Lab
export const SUPABASE_URL = "https://tuskcdlcbasehlrsrsoe.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1c2tjZGxjYmFzZWhscnNyc29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyOTM4NzcsImV4cCI6MjA4MTg2OTg3N30.VdfhknWL4SgbMUOxFZKsnAsjI3SUbcyoYXDiONjOjao";

// Текущая версия баланса (инкремент при каждом патче)
export const BALANCE_VERSION = 1;

// ==================== КЭШИРОВАНИЕ ====================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache: Map<string, CacheEntry<unknown>> = new Map();
const CACHE_TTL = 30000; // 30 секунд

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Очистить кэш (вызывать после отправки результата)
export function clearLeaderboardCache(): void {
  cache.clear();
}

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
  const run = Array.isArray(data) ? data[0] : data;

  // Очищаем кэш чтобы новый результат сразу появился
  clearLeaderboardCache();

  return { success: true, runId: run?.id };
}

// ==================== ХЕЛПЕРЫ ДЛЯ ЛИДЕРБОРДА ====================

// Общие заголовки для запросов
const SUPABASE_HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

// Получить никнеймы по списку player_id
async function fetchNicknames(playerIds: string[]): Promise<Map<string, string>> {
  if (playerIds.length === 0) return new Map();

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/tribolab_profiles?player_id=in.(${playerIds.join(',')})&select=player_id,nickname`,
    { headers: SUPABASE_HEADERS }
  );

  if (!res.ok) return new Map();

  const profiles: { player_id: string; nickname: string }[] = await res.json();
  return new Map(profiles.map(p => [p.player_id, p.nickname]));
}

// Обработка забегов: лучший результат на игрока + никнеймы
async function processRuns(runs: TribolabRun[], limit: number): Promise<LeaderboardEntry[]> {
  const playerIds = [...new Set(runs.map(r => r.player_id))];
  const nicknameMap = await fetchNicknames(playerIds);

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

// ==================== API ЛИДЕРБОРДА ====================

// Получить Daily лидерборд (с кэшированием)
export async function getDailyLeaderboard(date?: string, limit = 100): Promise<LeaderboardEntry[]> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const cacheKey = `daily_${targetDate}_${limit}`;

  const cached = getCached<LeaderboardEntry[]>(cacheKey);
  if (cached) return cached;

  // Загружаем достаточно записей для Daily
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/tribolab_runs?mode=eq.daily&daily_date=eq.${targetDate}&balance_version=eq.${BALANCE_VERSION}&select=*&order=wave_reached.desc,kills.desc,run_time_ms.asc&limit=1000`,
    { headers: SUPABASE_HEADERS }
  );

  if (!res.ok) return [];

  const runs: TribolabRun[] = await res.json();
  const result = await processRuns(runs, limit);

  setCache(cacheKey, result);
  return result;
}

// Получить Random лидерборд (с кэшированием)
export async function getRandomLeaderboard(limit = 100): Promise<LeaderboardEntry[]> {
  const cacheKey = `random_${limit}`;

  const cached = getCached<LeaderboardEntry[]>(cacheKey);
  if (cached) return cached;

  // Загружаем достаточно записей чтобы покрыть лучшие результаты всех игроков
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/tribolab_runs?mode=eq.random&balance_version=eq.${BALANCE_VERSION}&select=*&order=wave_reached.desc,kills.desc,run_time_ms.asc&limit=1000`,
    { headers: SUPABASE_HEADERS }
  );

  if (!res.ok) return [];

  const runs: TribolabRun[] = await res.json();
  const result = await processRuns(runs, limit);

  setCache(cacheKey, result);
  return result;
}

// Получить Random лидерборд по конкретному набору (с кэшированием)
export async function getRandomLeaderboardByDeck(deckKey: string, limit = 100): Promise<LeaderboardEntry[]> {
  const cacheKey = `random_deck_${deckKey}_${limit}`;

  const cached = getCached<LeaderboardEntry[]>(cacheKey);
  if (cached) return cached;

  // Загружаем достаточно записей для конкретного набора
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/tribolab_runs?mode=eq.random&deck_key=eq.${encodeURIComponent(deckKey)}&balance_version=eq.${BALANCE_VERSION}&select=*&order=wave_reached.desc,kills.desc,run_time_ms.asc&limit=1000`,
    { headers: SUPABASE_HEADERS }
  );

  if (!res.ok) return [];

  const runs: TribolabRun[] = await res.json();
  const result = await processRuns(runs, limit);

  setCache(cacheKey, result);
  return result;
}

// Получить рекорды игрока (с кэшированием)
export async function getPlayerRuns(playerId: string, limit = 50): Promise<TribolabRun[]> {
  const cacheKey = `player_${playerId}_${limit}`;

  const cached = getCached<TribolabRun[]>(cacheKey);
  if (cached) return cached;

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/tribolab_runs?player_id=eq.${playerId}&select=*&order=created_at.desc&limit=${limit}`,
    { headers: SUPABASE_HEADERS }
  );

  if (!res.ok) return [];

  const result = await res.json();
  setCache(cacheKey, result);
  return result;
}

// Роли модулей (должны совпадать с MainMenu!)
const MODULE_ROLES = {
  dps: ['filter', 'magnet', 'laser', 'electrostatic', 'ultrasonic'],
  control: ['cooler', 'centrifuge', 'barrier'],
  support: ['lubricant', 'analyzer', 'inhibitor', 'demulsifier'],
};

// PRNG на основе seed (должен совпадать с MainMenu!)
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// Генерация набора по правилам: 2 DPS + 1 Control + 2 Support
// Алгоритм ДОЛЖЕН совпадать с MainMenu для консистентности!
function generateDailyDeckFromDate(dateStr: string): string[] {
  // Преобразуем дату в seed (YYYYMMDD)
  const [year, month, day] = dateStr.split('-').map(Number);
  const seed = year * 10000 + month * 100 + day;

  const random = seededRandom(seed);

  const shuffledDps = [...MODULE_ROLES.dps].sort(() => random() - 0.5);
  const shuffledControl = [...MODULE_ROLES.control].sort(() => random() - 0.5);
  const shuffledSupport = [...MODULE_ROLES.support].sort(() => random() - 0.5);

  return [
    shuffledDps[0],      // DPS 1
    shuffledDps[1],      // DPS 2
    shuffledControl[0],  // Control
    shuffledSupport[0],  // Support 1
    shuffledSupport[1],  // Support 2
  ];
}

// Получить набор дня (генерируется автоматически из даты)
export async function getDailyDeck(date?: string): Promise<string[]> {
  const targetDate = date || new Date().toISOString().split('T')[0];

  // Всегда генерируем набор детерминированно из даты
  // Это гарантирует одинаковый набор для всех игроков в один день
  return generateDailyDeckFromDate(targetDate);
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
