import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Путь к файлу с результатами
const SCORES_FILE = path.join(process.cwd(), "data", "digits-scores.json");

interface ScoreEntry {
  id: string;
  name: string;
  score: number;
  gameScore: number;
  timeBonus: number;
  remainingTime: number;
  date: string;
}

// Загрузить результаты из файла
async function loadScores(): Promise<ScoreEntry[]> {
  try {
    const data = await fs.readFile(SCORES_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Сохранить результаты в файл
async function saveScores(scores: ScoreEntry[]): Promise<void> {
  const dir = path.dirname(SCORES_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(SCORES_FILE, JSON.stringify(scores, null, 2));
}

// GET - получить таблицу лидеров
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");

    const scores = await loadScores();

    // Сортировка по убыванию счёта
    const sorted = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      scores: sorted,
      total: scores.length,
    });
  } catch (error) {
    console.error("Error loading scores:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load scores" },
      { status: 500 }
    );
  }
}

// POST - отправить новый результат
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Валидация
    const { name, gameScore, remainingTime } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    if (typeof gameScore !== "number" || gameScore < 0) {
      return NextResponse.json(
        { success: false, error: "Invalid gameScore" },
        { status: 400 }
      );
    }

    if (typeof remainingTime !== "number" || remainingTime < 0) {
      return NextResponse.json(
        { success: false, error: "Invalid remainingTime" },
        { status: 400 }
      );
    }

    // Рассчитываем итоговый счёт (как в Python)
    const timeBonus = 300 + 5 * Math.round(remainingTime);
    const totalScore = gameScore + timeBonus;

    const entry: ScoreEntry = {
      id: crypto.randomUUID(),
      name: name.trim().slice(0, 50), // Ограничение длины имени
      score: totalScore,
      gameScore,
      timeBonus,
      remainingTime,
      date: new Date().toISOString(),
    };

    // Добавляем результат
    const scores = await loadScores();
    scores.push(entry);

    // Сохраняем (оставляем только топ-1000)
    const sorted = scores.sort((a, b) => b.score - a.score).slice(0, 1000);
    await saveScores(sorted);

    // Находим позицию в рейтинге
    const position = sorted.findIndex((s) => s.id === entry.id) + 1;

    return NextResponse.json({
      success: true,
      entry,
      position,
      total: sorted.length,
    });
  } catch (error) {
    console.error("Error saving score:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save score" },
      { status: 500 }
    );
  }
}
