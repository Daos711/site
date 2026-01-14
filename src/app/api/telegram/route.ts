import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

// POST /api/telegram - отправить сообщение (только для серверных вызовов)
export async function POST(request: NextRequest) {
  try {
    // Проверяем секретный ключ для защиты от внешних вызовов
    const authHeader = request.headers.get('x-api-secret');
    const apiSecret = process.env.API_SECRET;

    if (apiSecret && authHeader !== apiSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const result = await sendTelegramMessage(message);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Telegram API route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/telegram - проверка статуса (тест)
export async function GET() {
  const configured = !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
  return NextResponse.json({
    configured,
    message: configured ? 'Telegram bot is configured' : 'Telegram credentials not set'
  });
}
