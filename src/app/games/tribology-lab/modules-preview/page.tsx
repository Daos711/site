'use client';

import { MODULES, ModuleType } from '@/lib/tribology-lab/types';
import { FieldTile } from '@/lib/tribology-lab/components';

export default function ModulesPreview() {
  const moduleTypes = Object.keys(MODULES) as ModuleType[];

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-3xl font-bold text-white mb-2">Модули — Tribology Lab</h1>
      <p className="text-gray-400 mb-8">Инженерный каталог лабораторного оборудования</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-5xl">
        {moduleTypes.map(type => {
          const config = MODULES[type];
          return (
            <div key={type} className="flex flex-col items-center gap-3">
              <FieldTile type={type} level={1} size={110} />
              <div className="text-center">
                <div className="text-white font-medium text-sm">{config.name}</div>
                <div className="text-gray-500 text-xs mt-1">{config.description}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Демо уровней */}
      <div className="mt-12 max-w-5xl">
        <h2 className="text-xl font-bold text-white mb-4">Система уровней</h2>
        <p className="text-gray-400 text-sm mb-6">
          Объединяйте одинаковые модули для повышения уровня. Максимальный уровень — 5.
        </p>

        <div className="flex flex-wrap gap-4">
          {[1, 2, 3, 4, 5].map(level => (
            <FieldTile
              key={level}
              type="magnet"
              level={level}
              size={110}
            />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-5 gap-4 text-center text-sm">
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-gray-400">Lv.1</div>
            <div className="text-white font-bold">×1.0</div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-gray-400">Lv.2</div>
            <div className="text-white font-bold">×1.5</div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-gray-400">Lv.3</div>
            <div className="text-white font-bold">×2.25</div>
          </div>
          <div className="bg-gray-700 p-3 rounded border border-yellow-600/30">
            <div className="text-yellow-500">Lv.4</div>
            <div className="text-white font-bold">×3.4</div>
          </div>
          <div className="bg-yellow-900/30 p-3 rounded border border-yellow-500/50">
            <div className="text-yellow-400">Lv.5</div>
            <div className="text-yellow-300 font-bold">×5.0</div>
          </div>
        </div>
      </div>

      {/* Демо статусов */}
      <div className="mt-12 max-w-5xl">
        <h2 className="text-xl font-bold text-white mb-4">Статусы модулей</h2>
        <p className="text-gray-400 text-sm mb-6">
          Модули могут получать баффы и дебаффы во время игры.
        </p>

        <div className="flex flex-wrap gap-6">
          <div className="flex flex-col items-center gap-2">
            <FieldTile type="magnet" level={2} size={110} />
            <div className="text-gray-400 text-xs">Обычный</div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <FieldTile type="magnet" level={2} size={110} isLubricated={true} />
            <div className="text-purple-400 text-xs">💧 Смазан</div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <FieldTile type="magnet" level={2} size={110} corrosionStacks={1} />
            <div className="text-green-400 text-xs">🦠 Коррозия ×1</div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <FieldTile type="magnet" level={2} size={110} corrosionStacks={2} />
            <div className="text-green-400 text-xs">🦠 Коррозия ×2</div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <FieldTile type="magnet" level={2} size={110} corrosionStacks={3} />
            <div className="text-green-400 text-xs">🦠 Коррозия ×3</div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <FieldTile type="filter" level={2} size={110} corrosionStacks={1} />
            <div className="text-yellow-400 text-xs">🛡️ Иммунитет</div>
          </div>
        </div>
      </div>

      {/* Легенда тегов */}
      <div className="mt-12 bg-gray-800 rounded-lg p-6 max-w-5xl">
        <h2 className="text-xl font-bold text-white mb-4">Теги врагов</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙</span>
            <div>
              <div className="text-white">metal</div>
              <div className="text-gray-500">Металлические</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <div>
              <div className="text-white">hot</div>
              <div className="text-gray-500">Горячие</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">💨</span>
            <div>
              <div className="text-white">dusty</div>
              <div className="text-gray-500">Пыльные</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">💧</span>
            <div>
              <div className="text-white">wet</div>
              <div className="text-gray-500">Влажные</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <div>
              <div className="text-white">organic</div>
              <div className="text-gray-500">Органические</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
