-- ============================================
-- TRIBOLOGY LAB: Таблицы для рейтинговой системы
-- Выполнить в Supabase SQL Editor
-- ============================================

-- 1. Таблица профилей игроков
CREATE TABLE IF NOT EXISTS tribolab_profiles (
  player_id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Таблица забегов
CREATE TABLE IF NOT EXISTS tribolab_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL REFERENCES tribolab_profiles(player_id),
  mode TEXT NOT NULL CHECK (mode IN ('daily', 'random')),
  daily_date DATE, -- только для daily режима
  deck_modules JSONB NOT NULL, -- массив 5 модулей: ["laser", "cooler", ...]
  deck_key TEXT NOT NULL, -- канонический ключ: "analyzer|cooler|laser|..."
  balance_version INT NOT NULL,

  -- Результаты
  wave_reached INT NOT NULL,
  kills INT NOT NULL,
  lives_left INT NOT NULL,
  run_time_ms INT NOT NULL,

  -- Метаданные
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ограничения
  CONSTRAINT valid_wave CHECK (wave_reached >= 1 AND wave_reached <= 500),
  CONSTRAINT valid_lives CHECK (lives_left >= 0 AND lives_left <= 10),
  CONSTRAINT valid_time CHECK (run_time_ms >= 0 AND run_time_ms <= 7200000)
);

-- 3. Таблица ежедневных колод
CREATE TABLE IF NOT EXISTS tribolab_daily_decks (
  date DATE PRIMARY KEY,
  deck_modules JSONB NOT NULL, -- массив 5 модулей
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ИНДЕКСЫ
-- ============================================

-- Daily лидерборд
CREATE INDEX IF NOT EXISTS idx_tribolab_daily_leaderboard
  ON tribolab_runs(mode, daily_date, balance_version, wave_reached DESC, kills DESC, lives_left DESC, run_time_ms ASC)
  WHERE mode = 'daily';

-- Random лидерборд (общий)
CREATE INDEX IF NOT EXISTS idx_tribolab_random_leaderboard
  ON tribolab_runs(mode, balance_version, wave_reached DESC, kills DESC, lives_left DESC, run_time_ms ASC)
  WHERE mode = 'random';

-- Random лидерборд (по колоде)
CREATE INDEX IF NOT EXISTS idx_tribolab_random_by_deck
  ON tribolab_runs(mode, deck_key, balance_version, wave_reached DESC, kills DESC, lives_left DESC, run_time_ms ASC)
  WHERE mode = 'random';

-- Забеги пользователя
CREATE INDEX IF NOT EXISTS idx_tribolab_user_runs
  ON tribolab_runs(player_id, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Включаем RLS
ALTER TABLE tribolab_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribolab_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribolab_daily_decks ENABLE ROW LEVEL SECURITY;

-- Политики для profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON tribolab_profiles FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create profiles"
  ON tribolab_profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Players can update own profile"
  ON tribolab_profiles FOR UPDATE
  USING (true);

-- Политики для runs
CREATE POLICY "Runs are viewable by everyone"
  ON tribolab_runs FOR SELECT
  USING (true);

CREATE POLICY "Anyone can submit runs"
  ON tribolab_runs FOR INSERT
  WITH CHECK (true);

-- Политики для daily_decks
CREATE POLICY "Daily decks are viewable by everyone"
  ON tribolab_daily_decks FOR SELECT
  USING (true);

-- ============================================
-- ФУНКЦИЯ: Генерация колоды дня
-- ============================================

-- Список всех доступных модулей
-- laser, cooler, lubricant, analyzer, electrostatic, inhibitor, resonator, filter

CREATE OR REPLACE FUNCTION generate_daily_deck(target_date DATE)
RETURNS JSONB AS $$
DECLARE
  all_modules TEXT[] := ARRAY['laser', 'cooler', 'lubricant', 'analyzer', 'electrostatic', 'inhibitor', 'resonator', 'filter'];
  deck TEXT[] := ARRAY[]::TEXT[];
  seed INT;
  i INT;
  idx INT;
  shuffled TEXT[];
BEGIN
  -- Используем дату как seed для детерминированной генерации
  seed := EXTRACT(EPOCH FROM target_date)::INT;

  -- Перемешиваем массив (Fisher-Yates с seed)
  shuffled := all_modules;
  FOR i IN REVERSE array_length(shuffled, 1)..2 LOOP
    -- Простой детерминированный random на основе seed
    idx := 1 + ((seed * i * 31337) % i);
    -- Меняем местами
    DECLARE temp TEXT;
    BEGIN
      temp := shuffled[i];
      shuffled[i] := shuffled[idx];
      shuffled[idx] := temp;
    END;
  END LOOP;

  -- Берём первые 5
  deck := shuffled[1:5];

  RETURN to_jsonb(deck);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ФУНКЦИЯ: Получить или создать колоду дня
-- ============================================

CREATE OR REPLACE FUNCTION get_or_create_daily_deck(target_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Проверяем, есть ли уже колода на эту дату
  SELECT deck_modules INTO result
  FROM tribolab_daily_decks
  WHERE date = target_date;

  IF result IS NULL THEN
    -- Генерируем новую колоду
    result := generate_daily_deck(target_date);

    -- Сохраняем
    INSERT INTO tribolab_daily_decks (date, deck_modules)
    VALUES (target_date, result)
    ON CONFLICT (date) DO NOTHING;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
