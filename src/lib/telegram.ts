// Telegram Bot API helper

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export interface TelegramResult {
  success: boolean;
  error?: string;
}

/**
 * Отправить сообщение в Telegram
 */
export async function sendTelegramMessage(text: string): Promise<TelegramResult> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('Telegram credentials not configured');
    return { success: false, error: 'Telegram not configured' };
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: 'HTML',
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Telegram API error:', errorData);
      return { success: false, error: errorData };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to send Telegram message:', message);
    return { success: false, error: message };
  }
}

/**
 * Отправить уведомление о новом рекорде
 */
export async function notifyNewRecord(
  game: string,
  playerName: string,
  score: number | string,
  mode?: string
): Promise<TelegramResult> {
  const modeText = mode ? ` (${mode})` : '';
  const text = `🏆 <b>Новый рекорд!</b>\n\n` +
    `Игра: ${game}${modeText}\n` +
    `Игрок: ${playerName}\n` +
    `Результат: ${score}`;

  return sendTelegramMessage(text);
}

/**
 * Отправить уведомление об ошибке
 */
export async function notifyError(
  context: string,
  error: string
): Promise<TelegramResult> {
  const text = `⚠️ <b>Ошибка</b>\n\n` +
    `Контекст: ${context}\n` +
    `Ошибка: ${error}`;

  return sendTelegramMessage(text);
}
