-- =====================================================
-- Telegram уведомления для всех игр
-- Выполни этот скрипт в Supabase SQL Editor
-- =====================================================

-- 1. Включаем расширение pg_net (если ещё не включено)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Создаём функцию отправки в Telegram
CREATE OR REPLACE FUNCTION send_telegram_notification(message TEXT)
RETURNS void AS $$
DECLARE
  bot_token TEXT := '8315826768:AAGL1C0KqZCh5KD4JgD1HaaMOxMniXlrU4A';
  chat_id TEXT := '716489620';
BEGIN
  PERFORM net.http_post(
    url := 'https://api.telegram.org/bot' || bot_token || '/sendMessage',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'chat_id', chat_id,
      'text', message,
      'parse_mode', 'HTML'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ТРИГГЕРНЫЕ ФУНКЦИИ ДЛЯ КАЖДОЙ ИГРЫ
-- =====================================================

-- Ball Merge
CREATE OR REPLACE FUNCTION notify_ball_merge_score()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM send_telegram_notification(
    '🎱 <b>Ball Merge</b>' || chr(10) ||
    'Игрок: ' || NEW.name || chr(10) ||
    'Очки: ' || NEW.score || chr(10) ||
    'Режим: ' || COALESCE(NEW.mode, 'normal')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2048
CREATE OR REPLACE FUNCTION notify_2048_score()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM send_telegram_notification(
    '🔢 <b>2048 (4x4)</b>' || chr(10) ||
    'Игрок: ' || NEW.name || chr(10) ||
    'Очки: ' || NEW.score || chr(10) ||
    'Макс. плитка: ' || NEW.max_tile
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2048 3x3
CREATE OR REPLACE FUNCTION notify_2048_3x3_score()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM send_telegram_notification(
    '🔢 <b>2048 (3x3)</b>' || chr(10) ||
    'Игрок: ' || NEW.name || chr(10) ||
    'Очки: ' || NEW.score || chr(10) ||
    'Макс. плитка: ' || NEW.max_tile
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sokoban
CREATE OR REPLACE FUNCTION notify_sokoban_score()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM send_telegram_notification(
    '📦 <b>Sokoban</b>' || chr(10) ||
    'Игрок: ' || NEW.name || chr(10) ||
    'Уровень: ' || NEW.level || chr(10) ||
    'Ходов: ' || NEW.moves || ', толчков: ' || NEW.pushes
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Quick Math
CREATE OR REPLACE FUNCTION notify_quickmath_score()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM send_telegram_notification(
    '🧮 <b>Quick Math</b>' || chr(10) ||
    'Игрок: ' || NEW.name || chr(10) ||
    'Сложность: ' || NEW.difficulty || chr(10) ||
    'Время: ' || (NEW.time_ms / 1000.0)::numeric(10,2) || 'с'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Digits
CREATE OR REPLACE FUNCTION notify_digits_score()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM send_telegram_notification(
    '🔵 <b>Digits</b>' || chr(10) ||
    'Игрок: ' || NEW.name || chr(10) ||
    'Очки: ' || NEW.score
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tribolab
CREATE OR REPLACE FUNCTION notify_tribolab_run()
RETURNS TRIGGER AS $$
DECLARE
  player_nickname TEXT;
BEGIN
  -- Получаем никнейм игрока
  SELECT nickname INTO player_nickname
  FROM tribolab_profiles
  WHERE player_id = NEW.player_id;

  PERFORM send_telegram_notification(
    '🔬 <b>Tribo-Lab</b>' || chr(10) ||
    'Игрок: ' || COALESCE(player_nickname, 'Аноним') || chr(10) ||
    'Режим: ' || NEW.mode || chr(10) ||
    'Волна: ' || NEW.wave_reached || ', убийств: ' || NEW.kills
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- СОЗДАЁМ ТРИГГЕРЫ (удаляем старые если есть)
-- =====================================================

-- Ball Merge
DROP TRIGGER IF EXISTS trigger_notify_ball_merge ON ball_merge_scores;
CREATE TRIGGER trigger_notify_ball_merge
  AFTER INSERT ON ball_merge_scores
  FOR EACH ROW EXECUTE FUNCTION notify_ball_merge_score();

-- 2048
DROP TRIGGER IF EXISTS trigger_notify_2048 ON scores_2048;
CREATE TRIGGER trigger_notify_2048
  AFTER INSERT ON scores_2048
  FOR EACH ROW EXECUTE FUNCTION notify_2048_score();

-- 2048 3x3
DROP TRIGGER IF EXISTS trigger_notify_2048_3x3 ON scores_2048_3x3;
CREATE TRIGGER trigger_notify_2048_3x3
  AFTER INSERT ON scores_2048_3x3
  FOR EACH ROW EXECUTE FUNCTION notify_2048_3x3_score();

-- Sokoban
DROP TRIGGER IF EXISTS trigger_notify_sokoban ON scores_sokoban;
CREATE TRIGGER trigger_notify_sokoban
  AFTER INSERT ON scores_sokoban
  FOR EACH ROW EXECUTE FUNCTION notify_sokoban_score();

-- Quick Math
DROP TRIGGER IF EXISTS trigger_notify_quickmath ON scores_quickmath;
CREATE TRIGGER trigger_notify_quickmath
  AFTER INSERT ON scores_quickmath
  FOR EACH ROW EXECUTE FUNCTION notify_quickmath_score();

-- Digits (если таблица существует)
DROP TRIGGER IF EXISTS trigger_notify_digits ON scores;
CREATE TRIGGER trigger_notify_digits
  AFTER INSERT ON scores
  FOR EACH ROW EXECUTE FUNCTION notify_digits_score();

-- Tribolab
DROP TRIGGER IF EXISTS trigger_notify_tribolab ON tribolab_runs;
CREATE TRIGGER trigger_notify_tribolab
  AFTER INSERT ON tribolab_runs
  FOR EACH ROW EXECUTE FUNCTION notify_tribolab_run();

-- =====================================================
-- ГОТОВО! Теперь при каждом INSERT будет уведомление
-- =====================================================
