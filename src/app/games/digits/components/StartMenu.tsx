"use client";

import { TILE_COLORS } from "@/lib/digits-game";

interface StartMenuProps {
  onStart: () => void;
}

// Буквы для заголовка "ЦИФРЫ"
const TITLE_LETTERS = [
  { letter: "Ц", color: TILE_COLORS[1] },
  { letter: "И", color: TILE_COLORS[2] },
  { letter: "Ф", color: TILE_COLORS[3] },
  { letter: "Р", color: TILE_COLORS[4] },
  { letter: "Ы", color: TILE_COLORS[5] },
];

export function StartMenu({ onStart }: StartMenuProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      {/* Клетчатый фон */}
      <div
        className="absolute inset-0"
        style={{
          background: "white",
          backgroundImage: `
            linear-gradient(rgb(218, 236, 241) 1px, transparent 1px),
            linear-gradient(90deg, rgb(218, 236, 241) 1px, transparent 1px)
          `,
          backgroundSize: "18px 18px",
        }}
      />

      {/* Контент */}
      <div className="relative z-10 text-center">
        {/* Заголовок из плиток */}
        <div className="flex justify-center gap-2 mb-12">
          {TITLE_LETTERS.map((item, index) => {
            // Вычисляем тёмный цвет для тени
            const rgb = item.color.match(/\d+/g);
            const darkColor = rgb
              ? `rgb(${Math.floor(Number(rgb[0]) * 0.4)}, ${Math.floor(Number(rgb[1]) * 0.4)}, ${Math.floor(Number(rgb[2]) * 0.4)})`
              : "#333";

            return (
              <div
                key={index}
                className="w-16 h-16 flex items-center justify-center text-3xl font-medium select-none"
                style={{
                  background: item.color,
                  color: "black",
                  fontFamily: "'Open Sans', system-ui, sans-serif",
                  border: "1px solid rgb(71, 74, 72)",
                  boxShadow: `inset -3px -3px 0 ${darkColor}`,
                }}
              >
                {item.letter}
              </div>
            );
          })}
        </div>

        {/* Кнопка начать игру */}
        <button
          onClick={onStart}
          className="px-12 py-4 text-xl font-bold text-white transition-all hover:brightness-110 hover:scale-105"
          style={{
            background: "rgb(62, 157, 203)",
            boxShadow: "0 4px 15px rgba(62, 157, 203, 0.4)",
          }}
        >
          Играть
        </button>

        {/* Подсказка */}
        <div className="mt-8 text-gray-500 text-sm">
          <p>Убирай пары чисел:</p>
          <p>одинаковые или сумма = 10</p>
        </div>
      </div>
    </div>
  );
}
