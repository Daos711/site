"use client";

import { getRank, calculateBonus, calculateTotalScore } from "@/lib/game-ranks";

interface ResultWindowProps {
  gameScore: number;
  remainingTime: number;
  onNewGame: () => void;
  onMenu: () => void;
  isWin: boolean;
}

export function ResultWindow({
  gameScore,
  remainingTime,
  onNewGame,
  onMenu,
  isWin,
}: ResultWindowProps) {
  const bonus = calculateBonus(remainingTime);
  const totalScore = calculateTotalScore(gameScore, remainingTime);
  const rank = getRank(totalScore);

  // Создаём градиент для легендарных рангов
  const rankBgStyle = rank.isLegendary && rank.gradient
    ? {
        background: `linear-gradient(90deg, ${rank.gradient.join(", ")})`,
      }
    : {
        background: rank.bgColor,
      };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <div
        className="bg-white shadow-2xl p-0 w-[380px]"
        style={{ border: "3px solid rgb(62, 157, 203)" }}
      >
        {/* Заголовок */}
        <div
          className="text-center py-3 text-white font-bold text-xl"
          style={{ background: "rgb(62, 157, 203)" }}
        >
          {isWin ? "Победа!" : "Время вышло!"}
        </div>

        {/* Контент */}
        <div className="p-5">
          {/* Строки результатов */}
          <div className="space-y-3">
            {/* Очки */}
            <div
              className="flex justify-between items-center px-4 py-3 rounded"
              style={{ background: "#f0f7fa", border: "1px solid #c8dce6" }}
            >
              <span className="text-gray-600 font-medium">Очки:</span>
              <span className="text-2xl font-bold" style={{ color: "rgb(62, 157, 203)" }}>
                {gameScore}
              </span>
            </div>

            {/* Бонус */}
            <div
              className="flex justify-between items-center px-4 py-3 rounded"
              style={{ background: "#fff8e6", border: "1px solid #e6d9b3" }}
            >
              <span className="text-gray-600 font-medium">
                Бонус за время:
              </span>
              <span className="text-2xl font-bold" style={{ color: "#d4a017" }}>
                +{bonus}
              </span>
            </div>

            {/* Итого */}
            <div
              className="flex justify-between items-center px-4 py-3 rounded"
              style={{ background: "#e8f5e9", border: "1px solid #a5d6a7" }}
            >
              <span className="text-gray-600 font-medium">Итого:</span>
              <span className="text-2xl font-bold" style={{ color: "#2e7d32" }}>
                {totalScore}
              </span>
            </div>

            {/* Ранг */}
            <div
              className="flex justify-between items-center px-4 py-3 rounded"
              style={{ background: "#f3e8fd", border: "1px solid #d1b3e8" }}
            >
              <span className="text-gray-600 font-medium">Ранг:</span>
              <span
                className="px-4 py-1 rounded-full font-bold text-sm"
                style={{
                  color: rank.textColor,
                  ...rankBgStyle,
                  boxShadow: rank.isLegendary
                    ? "0 2px 8px rgba(0,0,0,0.3)"
                    : "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                {rank.name}
              </span>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onNewGame}
              className="flex-1 py-3 font-bold text-white transition-all hover:brightness-110"
              style={{ background: "rgb(62, 157, 203)" }}
            >
              Играть снова
            </button>
            <button
              onClick={onMenu}
              className="flex-1 py-3 font-bold text-gray-600 transition-all hover:bg-gray-200"
              style={{ background: "#e8e8e8" }}
            >
              Меню
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
