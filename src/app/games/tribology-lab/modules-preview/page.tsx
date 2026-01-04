'use client';

import { MODULES, ModuleType } from '@/lib/tribology-lab/types';
import { ModuleCard } from '@/lib/tribology-lab/components';

export default function ModulesPreview() {
  const moduleTypes = Object.keys(MODULES) as ModuleType[];

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-3xl font-bold text-white mb-2">Модули — Tribology Lab</h1>
      <p className="text-gray-400 mb-8">Инженерный каталог лабораторного оборудования</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
        {moduleTypes.map(type => (
          <ModuleCard
            key={type}
            type={type}
            showDetails={true}
          />
        ))}
      </div>

      {/* Демо уровней */}
      <div className="mt-12 max-w-5xl">
        <h2 className="text-xl font-bold text-white mb-4">Система уровней</h2>
        <p className="text-gray-400 text-sm mb-6">
          Объединяйте одинаковые модули для повышения уровня. Максимальный уровень — 5.
        </p>

        <div className="flex flex-wrap gap-4">
          {[1, 2, 3, 4, 5].map(level => (
            <ModuleCard
              key={level}
              type="magnet"
              level={level}
              showDetails={false}
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
