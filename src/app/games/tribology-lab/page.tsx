"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  MODULES,
  ENEMIES,
  GRID_COLS,
  GRID_ROWS,
  INITIAL_LIVES,
  INITIAL_GOLD,
  MODULE_CODES,
  MODULE_GRADIENTS,
  DEV_MODULE_CODES_RU,
  type ModuleType,
  type EnemyType,
  type Module,
  type Enemy,
  type AttackEffect,
  type ActiveBarrier,
} from "@/lib/tribology-lab/types";
import {
  generatePath,
  getPathLength,
  getPositionOnPath,
  createEnemy,
  getWaveConfig,
  updateEnemy,
  hasReachedFinish,
  isDead,
  type WaveEnemy,
} from "@/lib/tribology-lab/enemies";
import {
  processAllAttacks,
  processBurnDamage,
  processBossRegeneration,
  generateShopSlots,
  getModulePosition,
  getDistance,
  findClosestPathPointWithDirection,
} from "@/lib/tribology-lab/combat";
import { ModuleCard, FieldTile } from "@/lib/tribology-lab/components";
import { SplashScreen } from "@/lib/tribology-lab/components/SplashScreen";
import { MainMenu } from "@/lib/tribology-lab/components/MainMenu";
import { Tutorial } from "@/lib/tribology-lab/components/Tutorial";
import { LeaderboardModal } from "@/lib/tribology-lab/components/LeaderboardModal";
import { WaveOverlay } from "@/lib/tribology-lab/components/WaveOverlay";
import { PrepPhase } from "@/lib/tribology-lab/components/PrepPhase";
import { Handbook } from "@/lib/tribology-lab/components/handbook";
import type { GameMode } from "@/lib/tribology-lab/components/ModeToggle";
import {
  getOrCreatePlayerId,
  getOrCreateProfile,
  getPlayerNickname,
  setPlayerNickname,
  submitRun,
  generateDeckKey,
} from "@/lib/tribology-lab/supabase";

// Запасные модули (если не передана колода из меню)
const FALLBACK_SHOP: ModuleType[] = ['magnet', 'cooler', 'filter', 'lubricant', 'magnet'];

interface DragState {
  type: 'shop' | 'field';
  shopIndex?: number;
  moduleId?: string;
  moduleType: ModuleType;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

// Эффект смерти врага
interface DeathEffect {
  id: string;
  x: number;
  y: number;
  color: string;
  size: number;
  direction: number;  // угол направления движения (радианы)
  startTime: number;
  duration: number;   // 250ms (400ms для боссов)
  particleCount: number;  // 5 обычные, 10 боссы
  particleSpeed: number;  // 60 обычные, 100 боссы
  ringCount: number;      // 1 обычные, 2 боссы
}

type GamePhase = 'intro_wave' | 'preparing' | 'wave' | 'victory' | 'defeat';

// ═══════════════════════════════════════════════════════════════════════════
// GAME OVER MODAL — Аварийная остановка стенда
// ═══════════════════════════════════════════════════════════════════════════
interface GameOverModalProps {
  isOpen: boolean;
  wave: number;
  time: number; // в секундах
  kills: number;
  leaks: number;
  gold: number;
  nickname: string;
  onNicknameChange: (value: string) => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onShowLeaderboard: () => void;
}

function GameOverModal({ isOpen, wave, time, kills, leaks, gold, nickname, onNicknameChange, onRestart, onMainMenu, onShowLeaderboard }: GameOverModalProps) {
  const [showPanel, setShowPanel] = useState(false);
  const [localNickname, setLocalNickname] = useState(nickname);
  const [nicknameSaved, setNicknameSaved] = useState(false);

  // Форматирование времени MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Синхронизация никнейма при открытии
  useEffect(() => {
    if (isOpen) {
      setLocalNickname(nickname);
    }
  }, [isOpen, nickname]);

  // Анимация появления панели
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowPanel(true), 400);
      return () => clearTimeout(timer);
    } else {
      setShowPanel(false);
    }
  }, [isOpen]);

  // Сохранение никнейма
  const saveNickname = () => {
    if (localNickname.trim() && localNickname.trim() !== nickname) {
      onNicknameChange(localNickname.trim());
      setNicknameSaved(true);
      setTimeout(() => setNicknameSaved(false), 2000);
    }
  };

  const handleNicknameBlur = () => {
    saveNickname();
  };

  const handleNicknameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveNickname();
      (e.target as HTMLInputElement).blur();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 100,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        // Шум/сканер эффект
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)),
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(50, 214, 255, 0.03) 2px,
            rgba(50, 214, 255, 0.03) 4px
          )
        `,
        animation: 'scanlines 40s linear infinite',
      }}
    >
      {/* Красная вспышка при появлении */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'rgba(255, 59, 77, 0.4)',
          animation: 'alarm-flash 0.3s ease-out forwards',
        }}
      />

      {/* Центральная панель */}
      <div
        className="relative"
        style={{
          width: 'min(480px, 90vw)',
          minHeight: '400px',
          padding: '32px',
          background: '#0F1419',
          border: '2px solid #FF3B4D',
          borderRadius: '16px',
          boxShadow: '0 12px 48px rgba(0,0,0,0.8), 0 0 40px rgba(255,59,77,0.2)',
          transform: showPanel ? 'translateY(0)' : 'translateY(100px)',
          opacity: showPanel ? 1 : 0,
          transition: 'transform 0.5s ease-out, opacity 0.5s ease-out',
        }}
      >
        {/* LED + Заголовок */}
        <div className="flex items-center gap-3 mb-2">
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#FF3B4D',
              boxShadow: '0 0 12px rgba(255,59,77,0.8)',
              animation: 'led-blink 1.2s ease-in-out infinite',
            }}
          />
          <span
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#FF3B4D',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Аварийная остановка
          </span>
        </div>

        {/* Подзаголовок */}
        <p style={{ fontSize: '14px', color: '#7A8A99', marginBottom: '32px' }}>
          Потери превысили допустимые
        </p>

        {/* Крупная цифра волны */}
        <div
          className="text-center mb-8"
          style={{
            animation: showPanel ? 'wave-bounce 0.4s ease-out 0.2s backwards' : 'none',
          }}
        >
          <span
            style={{
              fontSize: 'clamp(48px, 10vw, 64px)',
              fontWeight: 800,
              background: 'linear-gradient(180deg, #FFFFFF 0%, #32D6FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ВОЛНА {wave}
          </span>
        </div>

        {/* Статистика */}
        <div
          className="space-y-3 mb-6"
          style={{ color: '#C5D1DE', fontSize: '15px' }}
        >
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '16px' }}>⏱️</span>
            <span>Время: {formatTime(time)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '16px' }}>⚔️</span>
            <span>Уничтожено врагов: {kills}</span>
          </div>
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" className="flex-shrink-0">
              <defs>
                <radialGradient id="metalGradModal">
                  <stop offset="0%" stopColor="#A8B2C1"/>
                  <stop offset="100%" stopColor="#6B7280"/>
                </radialGradient>
              </defs>
              <path d="M12,1 L13.5,4 L16,3.5 L17,6 L20,6 L19.5,9 L22,10.5 L20,12 L22,13.5 L19.5,15 L20,18 L17,18 L16,20.5 L13.5,20 L12,23 L10.5,20 L8,20.5 L7,18 L4,18 L4.5,15 L2,13.5 L4,12 L2,10.5 L4.5,9 L4,6 L7,6 L8,3.5 L10.5,4 Z"
                    fill="url(#metalGradModal)" stroke="#4A5568" strokeWidth="0.5"/>
              <circle cx="12" cy="12" r="4" fill="#2D3748"/>
              <circle cx="12" cy="12" r="3" fill="#1A202C"/>
            </svg>
            <span>Получено шестерёнок: {gold}</span>
          </div>
        </div>

        {/* Ввод никнейма для рейтинга */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '12px', color: '#7A8A99' }}>
              Имя для рейтинга:
            </label>
            {nicknameSaved && (
              <span style={{ fontSize: '11px', color: '#22C55E' }}>
                ✓ Сохранено
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={localNickname}
              onChange={(e) => setLocalNickname(e.target.value)}
              onKeyDown={handleNicknameKeyDown}
              placeholder="Введите имя..."
              maxLength={20}
              style={{
                flex: 1,
                padding: '10px 12px',
                background: '#1A202C',
                border: nicknameSaved ? '1px solid #22C55E' : '1px solid #2A3441',
                borderRadius: '8px',
                color: '#E5E7EB',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                if (!nicknameSaved) e.currentTarget.style.borderColor = '#32D6FF';
              }}
              onBlurCapture={(e) => {
                if (!nicknameSaved) e.currentTarget.style.borderColor = '#2A3441';
              }}
            />
            <button
              onClick={saveNickname}
              disabled={!localNickname.trim() || localNickname.trim() === nickname}
              style={{
                padding: '10px 16px',
                background: localNickname.trim() && localNickname.trim() !== nickname
                  ? '#22C55E'
                  : '#2A3441',
                border: 'none',
                borderRadius: '8px',
                color: localNickname.trim() && localNickname.trim() !== nickname
                  ? '#FFFFFF'
                  : '#7A8A99',
                fontSize: '13px',
                fontWeight: 600,
                cursor: localNickname.trim() && localNickname.trim() !== nickname
                  ? 'pointer'
                  : 'default',
                transition: 'all 0.2s ease',
              }}
            >
              OK
            </button>
          </div>
        </div>

        {/* Кнопки */}
        <button
          onClick={onRestart}
          className="w-full mb-3 transition-all"
          style={{
            height: '56px',
            background: '#32D6FF',
            color: '#0B0F14',
            fontSize: '16px',
            fontWeight: 700,
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#7dd3fc';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(50,214,255,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#32D6FF';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Повторить испытание
        </button>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onMainMenu}
            className="flex-1 transition-all"
            style={{
              height: '48px',
              background: 'transparent',
              color: '#7A8A99',
              fontSize: '15px',
              fontWeight: 600,
              border: '1px solid #2A3441',
              borderRadius: '12px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#32D6FF';
              e.currentTarget.style.color = '#C5D1DE';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#2A3441';
              e.currentTarget.style.color = '#7A8A99';
            }}
          >
            В меню
          </button>
          <button
            onClick={onShowLeaderboard}
            className="flex-1 transition-all"
            style={{
              height: '48px',
              background: 'rgba(245, 158, 11, 0.1)',
              color: '#F59E0B',
              fontSize: '15px',
              fontWeight: 600,
              border: '1px solid #F59E0B40',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)';
              e.currentTarget.style.borderColor = '#F59E0B';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
              e.currentTarget.style.borderColor = '#F59E0B40';
            }}
          >
            <span>🏆</span>
            Рейтинг
          </button>
        </div>

        {/* ID стенда (мелкий текст внизу) */}
        <div
          className="text-center mt-4"
          style={{ fontSize: '9px', color: '#4A5568' }}
        >
          LAB STAND #{Math.floor(Math.random() * 900 + 100)} • ПРОГОН #{wave} • {new Date().toLocaleDateString('ru-RU')}
        </div>
      </div>

      {/* CSS анимации */}
      <style jsx>{`
        @keyframes alarm-flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes led-blink {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes wave-bounce {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes scanlines {
          0% { background-position: 0 0; }
          100% { background-position: 0 100vh; }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAUSE MODAL — Испытание приостановлено
// ═══════════════════════════════════════════════════════════════════════════
interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onMainMenu: () => void;
  onHandbook: () => void;
}

function PauseModal({ isOpen, onResume, onMainMenu, onHandbook }: PauseModalProps) {
  const [showPanel, setShowPanel] = useState(false);

  // Анимация появления панели
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowPanel(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowPanel(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 95,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
        // Шум/сканер эффект
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)),
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(50, 214, 255, 0.03) 2px,
            rgba(50, 214, 255, 0.03) 4px
          )
        `,
        animation: 'pause-scanlines 60s linear infinite',
      }}
    >
      {/* Центральная панель */}
      <div
        className="relative"
        style={{
          width: 'min(420px, 85vw)',
          padding: '32px',
          background: '#0F1419',
          border: '2px solid #32D6FF',
          borderRadius: '16px',
          boxShadow: '0 12px 48px rgba(0,0,0,0.8), 0 0 30px rgba(50,214,255,0.15)',
          transform: showPanel ? 'scale(1)' : 'scale(0.9)',
          opacity: showPanel ? 1 : 0,
          transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
        }}
      >
        {/* Штамп PAUSED (фоновый) */}
        <div
          className="absolute pointer-events-none select-none"
          style={{
            top: '20px',
            right: '20px',
            fontSize: '14px',
            fontWeight: 900,
            color: 'rgba(50,214,255,0.08)',
            letterSpacing: '0.2em',
            transform: 'rotate(-12deg)',
          }}
        >
          PAUSED
        </div>

        {/* LED индикатор + заголовок */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#FF6B35',
              boxShadow: '0 0 12px rgba(255,107,53,0.7)',
              animation: 'paused-blink 1.5s ease-in-out infinite',
            }}
          />
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#7A8A99',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            PAUSED
          </span>
        </div>

        {/* Иконка паузы */}
        <div className="flex justify-center mb-8">
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            style={{ color: 'rgba(50,214,255,0.15)' }}
          >
            <rect x="20" y="15" width="15" height="50" fill="currentColor" rx="3"/>
            <rect x="45" y="15" width="15" height="50" fill="currentColor" rx="3"/>
          </svg>
        </div>

        {/* Заголовок */}
        <h2
          className="text-center mb-10"
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#32D6FF',
            letterSpacing: '0.08em',
          }}
        >
          ИСПЫТАНИЕ ПРИОСТАНОВЛЕНО
        </h2>

        {/* Кнопка "Возобновить" */}
        <button
          onClick={onResume}
          className="w-full mb-3 transition-all"
          style={{
            height: '56px',
            background: '#32D6FF',
            color: '#0B0F14',
            fontSize: '16px',
            fontWeight: 700,
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            animation: 'pulse-resume 2s ease-in-out infinite',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#7dd3fc';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(50,214,255,0.4)';
            e.currentTarget.style.animation = 'none';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#32D6FF';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.animation = 'pulse-resume 2s ease-in-out infinite';
          }}
        >
          Возобновить испытание
        </button>

        {/* Кнопка "В меню" */}
        <button
          onClick={onMainMenu}
          className="w-full mb-3 transition-all"
          style={{
            height: '48px',
            background: 'transparent',
            color: '#7A8A99',
            fontSize: '15px',
            fontWeight: 600,
            border: '1px solid #2A3441',
            borderRadius: '12px',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#32D6FF';
            e.currentTarget.style.color = '#C5D1DE';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#2A3441';
            e.currentTarget.style.color = '#7A8A99';
          }}
        >
          В меню
        </button>

        {/* Кнопка "Справочник" */}
        <button
          onClick={onHandbook}
          className="w-full mb-6 transition-all"
          style={{
            height: '48px',
            background: 'transparent',
            color: '#7A8A99',
            fontSize: '15px',
            fontWeight: 600,
            border: '1px solid #2A3441',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#32D6FF';
            e.currentTarget.style.color = '#C5D1DE';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#2A3441';
            e.currentTarget.style.color = '#7A8A99';
          }}
        >
          <span>📖</span> Справочник
        </button>

        {/* Подсказка ESC */}
        <p
          className="text-center"
          style={{ fontSize: '12px', color: '#7A8A99' }}
        >
          Нажми ESC чтобы продолжить
        </p>
      </div>

      {/* CSS анимации */}
      <style jsx>{`
        @keyframes paused-blink {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1.0; }
        }
        @keyframes pulse-resume {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes pause-scanlines {
          0% { background-position: 0 0; }
          100% { background-position: 0 100vh; }
        }
      `}</style>
    </div>
  );
}

export default function TribologyLabPage() {
  const [wave, setWave] = useState(1);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [gold, setGold] = useState(INITIAL_GOLD);
  const [modules, setModules] = useState<Module[]>([]);
  const modulesRef = useRef<Module[]>([]); // Ref для актуальных модулей в game loop
  const [shop, setShop] = useState<ModuleType[]>(FALLBACK_SHOP);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [mergingCell, setMergingCell] = useState<{x: number, y: number} | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

  // Синхронизируем ref с state
  useEffect(() => {
    modulesRef.current = modules;
  }, [modules]);

  // Игровое состояние
  const [gamePhase, setGamePhase] = useState<GamePhase>('preparing');
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const enemiesRef = useRef<Enemy[]>([]); // ГЛАВНЫЙ источник истины для врагов в game loop
  const [spawnQueue, setSpawnQueue] = useState<{ id: string; type: string; spawnAt: number }[]>([]);
  const [waveStartTime, setWaveStartTime] = useState(0);
  const [attackEffects, setAttackEffects] = useState<AttackEffect[]>([]);
  const [activeBarriers, setActiveBarriers] = useState<ActiveBarrier[]>([]);
  const activeBarriersRef = useRef<ActiveBarrier[]>([]); // Ref для доступа в game loop
  const [deathEffects, setDeathEffects] = useState<DeathEffect[]>([]);
  const lastUpdateRef = useRef(0);
  const gameLoopRef = useRef<number>(0);
  const waveEndingRef = useRef(false); // Флаг чтобы endWave вызывался только раз
  const spawnedIdsRef = useRef<Set<string>>(new Set()); // Отслеживание заспавненных врагов

  // DEBUG: Скорость игры (1 = нормальная, 5 = быстрая)
  const [gameSpeed, setGameSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showHandbookFromPause, setShowHandbookFromPause] = useState(false);
  const pauseTimeRef = useRef(0);      // Накопленное время на паузе
  const pauseStartRef = useRef(0);     // Timestamp начала текущей паузы
  const [gameStarted, setGameStarted] = useState(false);  // Игра началась (после первого старта)
  const [nextWaveCountdown, setNextWaveCountdown] = useState(0);  // Обратный отсчёт до след. волны
  const labStandId = useRef(Math.floor(Math.random() * 900) + 100);  // Лаб-стенд №XXX

  // DEV-панель для тестирования
  const [devMode, setDevMode] = useState(false);
  const [selectedDevModule, setSelectedDevModule] = useState<ModuleType | null>(null);

  // Модальное окно выхода
  const [showExitModal, setShowExitModal] = useState(false);
  const wasPausedBeforeModal = useRef(false);

  // Game Over модалка и статистика
  const [showGameOver, setShowGameOver] = useState(false);
  const [totalKills, setTotalKills] = useState(0);
  const [totalGoldEarned, setTotalGoldEarned] = useState(0);
  const [gameOverTime, setGameOverTime] = useState(0); // Время игры при Game Over (секунды)
  const gameStartTimeRef = useRef(0); // Timestamp начала игры

  // Звуки — пул аудио-элементов для одновременного воспроизведения
  const DEATH_SOUND_POOL_SIZE = 12; // Увеличен пул для быстрых волн
  const deathSoundPoolRef = useRef<HTMLAudioElement[]>([]);
  const deathSoundIndexRef = useRef(0);
  const buySoundRef = useRef<HTMLAudioElement | null>(null);
  const lifeLostSoundRef = useRef<HTMLAudioElement | null>(null);
  const uiClickSoundRef = useRef<HTMLAudioElement | null>(null);
  const soundsUnlockedRef = useRef(false);

  // Создаём аудио с предзагрузкой
  const createAudio = (src: string, volume: number) => {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.volume = volume;
    return audio;
  };

  useEffect(() => {
    // Пул для звуков смерти (много одновременно)
    deathSoundPoolRef.current = Array.from({ length: DEATH_SOUND_POOL_SIZE }, () =>
      createAudio('/sounds/tribology-lab/enemy-death.wav', 0.3)
    );
    // Одиночные звуки
    buySoundRef.current = createAudio('/sounds/tribology-lab/buy-module.wav', 0.4);
    lifeLostSoundRef.current = createAudio('/sounds/tribology-lab/lose-life.wav', 0.5);
    uiClickSoundRef.current = createAudio('/sounds/tribology-lab/ui-click.wav', 0.25);
  }, []);

  // Разблокировка звуков при первом клике (требуется для браузеров)
  const unlockSounds = () => {
    if (soundsUnlockedRef.current) return;
    soundsUnlockedRef.current = true;
    // Пробуем "разбудить" все аудио-элементы
    const allSounds = [
      ...deathSoundPoolRef.current,
      buySoundRef.current,
      lifeLostSoundRef.current,
      uiClickSoundRef.current,
    ].filter(Boolean) as HTMLAudioElement[];
    allSounds.forEach(audio => {
      audio.volume = 0;
      audio.play().then(() => audio.pause()).catch(() => {});
    });
    // Восстанавливаем громкость
    setTimeout(() => {
      deathSoundPoolRef.current.forEach(a => a.volume = 0.3);
      if (buySoundRef.current) buySoundRef.current.volume = 0.4;
      if (lifeLostSoundRef.current) lifeLostSoundRef.current.volume = 0.5;
      if (uiClickSoundRef.current) uiClickSoundRef.current.volume = 0.25;
    }, 50);
  };

  const playDeathSound = () => {
    unlockSounds();
    const pool = deathSoundPoolRef.current;
    if (pool.length === 0) return;
    const sound = pool[deathSoundIndexRef.current];
    deathSoundIndexRef.current = (deathSoundIndexRef.current + 1) % DEATH_SOUND_POOL_SIZE;
    sound.currentTime = 0;
    sound.play().catch(() => {});
  };

  const playBuySound = () => {
    unlockSounds();
    if (buySoundRef.current) {
      buySoundRef.current.currentTime = 0;
      buySoundRef.current.play().catch(() => {});
    }
  };

  const playLifeLostSound = () => {
    unlockSounds();
    if (lifeLostSoundRef.current) {
      lifeLostSoundRef.current.currentTime = 0;
      lifeLostSoundRef.current.play().catch(() => {});
    }
  };

  const playUIClick = () => {
    unlockSounds(); // Разблокируем при любом взаимодействии
    if (uiClickSoundRef.current) {
      uiClickSoundRef.current.currentTime = 0;
      uiClickSoundRef.current.play().catch(() => {});
    }
  };

  // Лидерборд
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [playerId, setPlayerId] = useState<string>('');
  const [playerNickname, setPlayerNicknameState] = useState<string>('');

  // Экраны: splash → menu → tutorial → game
  type ScreenState = 'splash' | 'menu' | 'tutorial' | 'game';
  const [screen, setScreen] = useState<ScreenState>('splash');
  const [gameSeed, setGameSeed] = useState(0);
  const [gameMode, setGameMode] = useState<GameMode>('daily');
  const [menuDeck, setMenuDeck] = useState<ModuleType[] | null>(null);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(false);

  // Загружаем флаг туториала из localStorage
  useEffect(() => {
    const completed = localStorage.getItem('tribolab_tutorial_completed') === 'true';
    setHasCompletedTutorial(completed);
  }, []);

  // Инициализация playerId и nickname для лидерборда
  useEffect(() => {
    const id = getOrCreatePlayerId();
    setPlayerId(id);
    const nick = getPlayerNickname();
    setPlayerNicknameState(nick);
  }, []);

  // Сохраняем флаг туториала
  const markTutorialCompleted = useCallback(() => {
    localStorage.setItem('tribolab_tutorial_completed', 'true');
    setHasCompletedTutorial(true);
  }, []);

  // Тестовая колода для ручного тестирования баланса (?deck=...)
  const [testDeck, setTestDeck] = useState<ModuleType[] | null>(null);

  // Селектор колоды для ручного тестирования
  const [showDeckSelector, setShowDeckSelector] = useState(false);
  const [deckDps1, setDeckDps1] = useState<ModuleType>('filter');
  const [deckDps2, setDeckDps2] = useState<ModuleType>('magnet');
  const [deckControl, setDeckControl] = useState<ModuleType>('cooler');
  const [deckSupport, setDeckSupport] = useState<ModuleType>('lubricant');
  const [deckUtility, setDeckUtility] = useState<ModuleType>('ultrasonic');

  // Обработчики экранов
  const handleSplashComplete = useCallback(() => {
    setScreen('menu');
  }, []);

  const handleStartGame = useCallback((seed: number, mode: GameMode, deck: ModuleType[]) => {
    setGameSeed(seed);
    setGameMode(mode);
    setMenuDeck(deck);
    // Сбрасываем игру при старте
    setWave(1);
    setLives(INITIAL_LIVES);
    setGold(INITIAL_GOLD);
    setModules([]);
    setEnemies([]);
    enemiesRef.current = [];
    activeBarriersRef.current = [];
    setActiveBarriers([]);
    setAttackEffects([]);
    setDeathEffects([]);
    setNextWaveCountdown(0);
    spawnedIdsRef.current.clear();
    // Сбрасываем статистику для Game Over
    setTotalKills(0);
    setTotalGoldEarned(0);
    setShowGameOver(false);
    setGameOverTime(0);
    gameStartTimeRef.current = 0;
    // Устанавливаем магазин из меню (testDeck приоритетнее)
    if (!testDeck) {
      setShop([...deck]);
    }
    // Сразу запускаем игру — показываем оверлей "ВОЛНА 1"
    setGameStarted(true);
    setGamePhase('intro_wave');
    setScreen('game');
  }, [testDeck]);

  const handleShowTutorial = useCallback(() => {
    setScreen('tutorial');
  }, []);

  const handleTutorialComplete = useCallback(() => {
    markTutorialCompleted();
    setScreen('menu');
  }, [markTutorialCompleted]);

  // Обработчики модалки выхода
  const handleOpenExitModal = useCallback(() => {
    wasPausedBeforeModal.current = isPaused;
    if (!isPaused) {
      setIsPaused(true);
    }
    setShowExitModal(true);
  }, [isPaused]);

  const handleCloseExitModal = useCallback(() => {
    setShowExitModal(false);
    if (!wasPausedBeforeModal.current) {
      setIsPaused(false);
    }
  }, []);

  const handleConfirmExit = useCallback(() => {
    setShowExitModal(false);
    setIsPaused(false);
    // Полный сброс состояния
    setWave(1);
    setLives(INITIAL_LIVES);
    setGold(INITIAL_GOLD);
    setModules([]);
    setEnemies([]);
    enemiesRef.current = [];
    setGamePhase('preparing');
    activeBarriersRef.current = [];
    setActiveBarriers([]);
    setAttackEffects([]);
    setDeathEffects([]);
    setGameStarted(false);
    setNextWaveCountdown(0);
    spawnedIdsRef.current.clear();
    // Возврат в главное меню
    setScreen('menu');
  }, []);

  // Pause Modal: Возобновить игру
  const handlePauseResume = useCallback(() => {
    setShowPauseModal(false);
    setIsPaused(false);
  }, []);

  // Pause Modal: В меню
  const handlePauseMainMenu = useCallback(() => {
    setShowPauseModal(false);
    setIsPaused(false);
    // Полный сброс состояния
    setWave(1);
    setLives(INITIAL_LIVES);
    setGold(INITIAL_GOLD);
    setModules([]);
    setEnemies([]);
    enemiesRef.current = [];
    setGamePhase('preparing');
    activeBarriersRef.current = [];
    setActiveBarriers([]);
    setAttackEffects([]);
    setDeathEffects([]);
    setGameStarted(false);
    setNextWaveCountdown(0);
    spawnedIdsRef.current.clear();
    // Возврат в главное меню
    setScreen('menu');
  }, []);

  // Game Over: Повторить испытание
  const handleGameOverRestart = useCallback(() => {
    setShowGameOver(false);
    setIsPaused(false);
    // Полный сброс состояния игры
    setWave(1);
    setLives(INITIAL_LIVES);
    setGold(INITIAL_GOLD);
    setModules([]);
    setEnemies([]);
    enemiesRef.current = [];
    activeBarriersRef.current = [];
    setActiveBarriers([]);
    setAttackEffects([]);
    setDeathEffects([]);
    setNextWaveCountdown(0);
    spawnedIdsRef.current.clear();
    // Сбрасываем статистику
    setTotalKills(0);
    setTotalGoldEarned(0);
    setGameOverTime(0);
    gameStartTimeRef.current = 0;
    // Восстанавливаем магазин
    if (testDeck) {
      setShop([...testDeck]);
    } else if (menuDeck) {
      setShop([...menuDeck]);
    } else {
      setShop(FALLBACK_SHOP);
    }
    // Сразу запускаем игру — показываем оверлей "ВОЛНА 1"
    setGameStarted(true);
    setGamePhase('intro_wave');
  }, [testDeck, menuDeck]);

  // Game Over: В меню
  const handleGameOverMainMenu = useCallback(() => {
    setShowGameOver(false);
    setIsPaused(false);
    // Полный сброс состояния
    setWave(1);
    setLives(INITIAL_LIVES);
    setGold(INITIAL_GOLD);
    setModules([]);
    setEnemies([]);
    enemiesRef.current = [];
    setGamePhase('preparing');
    activeBarriersRef.current = [];
    setActiveBarriers([]);
    setAttackEffects([]);
    setDeathEffects([]);
    setGameStarted(false);
    setNextWaveCountdown(0);
    spawnedIdsRef.current.clear();
    // Сбрасываем статистику
    setTotalKills(0);
    setTotalGoldEarned(0);
    setGameOverTime(0);
    gameStartTimeRef.current = 0;
    // Возврат в меню
    setScreen('menu');
  }, []);

  // Роли модулей для селектора
  const MODULE_ROLES = {
    dps: ['filter', 'magnet', 'laser', 'electrostatic'] as ModuleType[],
    control: ['cooler', 'centrifuge', 'barrier'] as ModuleType[],
    support: ['lubricant', 'inhibitor', 'analyzer'] as ModuleType[],
    utility: ['ultrasonic', 'demulsifier'] as ModuleType[],
  };

  // Размеры
  const cellSize = 110;
  const cellGap = 14;
  const conveyorWidth = Math.round(cellSize * 0.95); // Увеличенная ширина канала (~1.0 ячейки)
  const cornerRadius = conveyorWidth * 1.0; // Увеличен для равномерной ширины канала на поворотах
  const gridWidth = GRID_COLS * cellSize + (GRID_COLS - 1) * cellGap;
  const gridHeight = GRID_ROWS * cellSize + (GRID_ROWS - 1) * cellGap;
  const panelPadding = 16;

  const totalWidth = gridWidth + panelPadding * 2 + conveyorWidth * 2;
  const totalHeight = gridHeight + panelPadding * 2 + conveyorWidth;

  // Позиция сетки карточек внутри поля
  const gridStartX = conveyorWidth + panelPadding;
  const gridStartY = conveyorWidth + panelPadding;

  // Путь для врагов
  const innerOffset = 8;
  const enemyPath = generatePath(totalWidth, totalHeight, conveyorWidth, innerOffset, cornerRadius);
  const pathLength = getPathLength(enemyPath);

  // Вычисляем какие модули получают бафф от Смазки
  const lubricatedModuleIds = useMemo(() => {
    const lubricants = modules.filter(m => m.type === 'lubricant');
    const buffedIds = new Set<string>();

    for (const lub of lubricants) {
      for (const mod of modules) {
        if (mod.id === lub.id) continue;
        if (Math.abs(mod.x - lub.x) <= 1 && Math.abs(mod.y - lub.y) <= 1) {
          buffedIds.add(mod.id);
        }
      }
    }

    return buffedIds;
  }, [modules]);

  // Вычисляем какие модули получают защиту от Ингибитора
  const protectedModuleIds = useMemo(() => {
    const inhibitors = modules.filter(m => m.type === 'inhibitor');
    const protectedIds = new Set<string>();

    for (const inh of inhibitors) {
      for (const mod of modules) {
        if (mod.id === inh.id) continue;
        if (Math.abs(mod.x - inh.x) <= 1 && Math.abs(mod.y - inh.y) <= 1) {
          protectedIds.add(mod.id);
        }
      }
    }

    return protectedIds;
  }, [modules]);

  // Функция для вычисления стеков коррозии на модуле
  const getCorrosionStacks = useCallback((module: Module): number => {
    // Фильтр и Ингибитор иммунны к коррозии
    if (module.type === 'filter' || module.type === 'inhibitor') {
      return 0;
    }

    const modulePos = getModulePosition(module);
    const corrosionRadius = 140;

    let stacks = 0;
    for (const enemy of enemies) {
      if (enemy.type !== 'corrosion') continue;
      const enemyConfig = ENEMIES[enemy.type];
      const enemyPos = getPositionOnPath(enemyPath, enemy.progress, enemyConfig.oscillation);
      const dist = getDistance(modulePos.x, modulePos.y, enemyPos.x, enemyPos.y);
      if (dist <= corrosionRadius) stacks++;
    }
    return Math.min(stacks, 3);
  }, [enemies, enemyPath]);

  // Проверяет, есть ли коррозия рядом с модулем (для показа иммунитета)
  const hasNearbyCorrosion = useCallback((module: Module): boolean => {
    const modulePos = getModulePosition(module);
    const corrosionRadius = 140;
    return enemies.some(enemy => {
      if (enemy.type !== 'corrosion') return false;
      const enemyConfig = ENEMIES[enemy.type];
      const enemyPos = getPositionOnPath(enemyPath, enemy.progress, enemyConfig.oscillation);
      return getDistance(modulePos.x, modulePos.y, enemyPos.x, enemyPos.y) <= corrosionRadius;
    });
  }, [enemies, enemyPath]);

  // Начало волны — показ intro_wave (1.3 сек), потом переход в wave
  const startWave = useCallback(() => {
    if (gamePhase !== 'preparing') return;

    // Разблокируем звуки при первом взаимодействии
    unlockSounds();

    // Сначала показываем intro_wave (оверлей "ВОЛНА N")
    setNextWaveCountdown(0);       // Сбрасываем обратный отсчёт
    setGameStarted(true);          // Игра началась
    setGamePhase('intro_wave');    // Показываем оверлей
  }, [gamePhase]);

  // После intro_wave (1.3 сек) → переход в wave
  const startWaveActual = useCallback(() => {
    const config = getWaveConfig(wave);
    const queue: { id: string; type: string; spawnAt: number }[] = [];
    let currentTime = 0;
    let spawnIndex = 0;

    for (const group of config.enemies) {
      if (group.delay) {
        currentTime += group.delay;
      }
      for (let i = 0; i < group.count; i++) {
        queue.push({ id: `wave${wave}-spawn${spawnIndex++}`, type: group.type, spawnAt: currentTime });
        currentTime += config.spawnInterval;
      }
    }

    spawnedIdsRef.current.clear(); // Сбрасываем отслеживание
    pauseTimeRef.current = 0;      // Сбрасываем время паузы
    pauseStartRef.current = 0;     // Сбрасываем начало паузы
    setIsPaused(false);            // Снимаем паузу
    // Записываем время начала игры (только при первой волне)
    if (gameStartTimeRef.current === 0) {
      gameStartTimeRef.current = Date.now();
    }
    setSpawnQueue(queue);
    setWaveStartTime(performance.now());
    setGamePhase('wave');          // Теперь волна идёт
    lastUpdateRef.current = performance.now();
    waveEndingRef.current = false; // Сбрасываем флаг
  }, [wave]);

  // Конец волны
  const endWave = useCallback(() => {
    const config = getWaveConfig(wave);
    const nextWave = wave + 1;
    setGold(prev => prev + config.reward);
    setWave(nextWave);
    setGamePhase('preparing');
    enemiesRef.current = [];
    setEnemies([]);
    setSpawnQueue([]);
    activeBarriersRef.current = [];
    setActiveBarriers([]);
    // Обновляем магазин: testDeck → menuDeck → fallback
    if (testDeck) {
      setShop([...testDeck]);
    } else if (menuDeck) {
      setShop([...menuDeck]);
    } else {
      setShop(generateShopSlots(nextWave));
    }
    // Запускаем обратный отсчёт до следующей волны (5 сек)
    setNextWaveCountdown(5);
  }, [wave, testDeck, menuDeck]);

  // Автостарт следующей волны
  useEffect(() => {
    if (gamePhase !== 'preparing' || !gameStarted || nextWaveCountdown <= 0) return;

    const timer = setTimeout(() => {
      if (nextWaveCountdown === 1) {
        startWave();
      } else {
        setNextWaveCountdown(prev => prev - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [gamePhase, gameStarted, nextWaveCountdown, startWave]);

  // Ref для отслеживания что нужно заспавнить
  const spawnQueueRef = useRef<{ id: string; type: string; spawnAt: number }[]>([]);

  // Синхронизируем ref с state
  useEffect(() => {
    spawnQueueRef.current = spawnQueue;
  }, [spawnQueue]);

  // Обработчик клавиши D для Dev-панели и ESC для паузы
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // D — dev-панель
      if (e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В') {
        // Не активируем если фокус в input
        if (document.activeElement?.tagName === 'INPUT') return;
        setDevMode(prev => !prev);
      }
      // ESC — пауза (только во время игры)
      if (e.key === 'Escape' && screen === 'game' && gamePhase === 'wave' && !showGameOver && !showExitModal) {
        if (showPauseModal) {
          // Закрыть паузу
          setShowPauseModal(false);
          setIsPaused(false);
        } else {
          // Открыть паузу
          setIsPaused(true);
          setShowPauseModal(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, gamePhase, showGameOver, showExitModal, showPauseModal]);

  // Парсинг URL параметра ?deck= для тестовой колоды
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const deckParam = params.get('deck');
    if (deckParam) {
      const validModules = Object.keys(MODULES) as ModuleType[];
      const modules = deckParam.split(',').filter(m =>
        validModules.includes(m as ModuleType)
      ) as ModuleType[];
      if (modules.length > 0) {
        setTestDeck(modules);
        // Магазин = ровно те модули из колоды (по одному каждого)
        setShop([...modules]);
      }
    }
  }, []);

  // Game Over: когда lives достигает 0
  useEffect(() => {
    if (lives <= 0 && gameStarted && !showGameOver) {
      // Вычисляем итоговое время игры
      const finalTime = gameStartTimeRef.current > 0
        ? Math.floor((Date.now() - gameStartTimeRef.current) / 1000)
        : 0;
      const finalTimeMs = finalTime * 1000;
      setGameOverTime(finalTime);
      // ПОЛНОСТЬЮ останавливаем игру
      setGamePhase('defeat');  // Останавливает game loop
      setIsPaused(true);
      setShowGameOver(true);

      // Отправляем результат в лидерборд (если есть никнейм)
      const currentDeck = testDeck || menuDeck || FALLBACK_SHOP;
      const nick = getPlayerNickname();

      if (nick && playerId) {
        (async () => {
          try {
            await getOrCreateProfile(playerId, nick);
            await submitRun(
              playerId,
              gameMode,
              currentDeck,
              wave,
              totalKills,
              0,
              finalTimeMs
            );
          } catch (err) {
            console.error('Ошибка отправки результата:', err);
          }
        })();
      }
    }
  }, [lives, gameStarted, showGameOver, testDeck, menuDeck, playerId, gameMode, wave, totalKills]);

  // DEV: Спавн врага вне волны
  const devSpawnEnemy = useCallback((type: EnemyType, count: number = 1) => {
    // Автоматически запускаем волну, чтобы враги двигались
    if (gamePhase !== 'wave') {
      setGamePhase('wave');
    }
    const newEnemies: Enemy[] = [];
    for (let i = 0; i < count; i++) {
      const enemy = createEnemy(type, wave);
      // Добавляем небольшое смещение по progress чтобы враги не накладывались
      enemy.progress = i * 0.02;
      newEnemies.push(enemy);
    }
    setEnemies(prev => [...prev, ...newEnemies]);
    enemiesRef.current = [...enemiesRef.current, ...newEnemies];
  }, [wave, gamePhase]);

  // DEV: Установка модуля на поле
  const devPlaceModule = useCallback((x: number, y: number) => {
    if (!selectedDevModule) return;

    const existing = modules.find(m => m.x === x && m.y === y);
    if (existing) {
      // Повысить уровень (до 5)
      if (existing.level < 5) {
        setModules(prev => prev.map(m =>
          m.id === existing.id ? { ...m, level: m.level + 1 } : m
        ));
      }
    } else {
      // Новый модуль
      const newModule: Module = {
        id: `dev-${Date.now()}-${Math.random()}`,
        type: selectedDevModule,
        level: 1,
        x,
        y,
        lastAttack: 0,
      };
      setModules(prev => [...prev, newModule]);
    }
  }, [selectedDevModule, modules]);

  // Игровой цикл
  useEffect(() => {
    if (gamePhase !== 'wave') return;

    const gameLoop = (timestamp: number) => {
      // Если на паузе — запоминаем начало паузы и ждём
      if (isPaused) {
        if (pauseStartRef.current === 0) {
          pauseStartRef.current = timestamp;  // Запоминаем момент начала паузы
        }
        lastUpdateRef.current = timestamp;
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      // Если только что вышли из паузы — добавляем время паузы
      if (pauseStartRef.current > 0) {
        pauseTimeRef.current += timestamp - pauseStartRef.current;
        pauseStartRef.current = 0;  // Сбрасываем
      }

      const deltaTime = (timestamp - lastUpdateRef.current) * gameSpeed;
      lastUpdateRef.current = timestamp;
      const elapsedSinceStart = ((timestamp - waveStartTime) - pauseTimeRef.current) * gameSpeed;

      // Получаем текущую очередь спавна
      const currentQueue = spawnQueueRef.current;
      const ready = currentQueue.filter(s => s.spawnAt <= elapsedSinceStart);
      const toSpawn = ready.find(s => !spawnedIdsRef.current.has(s.id));

      // ======= ИСПОЛЬЗУЕМ REF КАК ИСТОЧНИК ИСТИНЫ =======
      // Это решает проблему когда setEnemies(prev => ...) получает stale state
      let updated = [...enemiesRef.current];

      // 1. Спавн нового врага (если есть место)
      if (toSpawn && !updated.some(e => e.progress < 0.03)) {
        spawnedIdsRef.current.add(toSpawn.id);
        const newEnemy = createEnemy(toSpawn.type as any, wave);
        updated.push(newEnemy);
      }

      // 2. Движение врагов
      updated = updated.map(enemy => updateEnemy(enemy, deltaTime, pathLength));

      // 2.5. Динамическая блокировка врагов барьерами (по координатам)
      const currentBarriers = activeBarriersRef.current;
      if (currentBarriers.length > 0) {
        updated = updated.map(enemy => {
          const enemyConfig = ENEMIES[enemy.type as EnemyType];
          const enemyPos = getPositionOnPath(enemyPath, enemy.progress, enemyConfig.oscillation);
          const enemyRadius = enemyConfig.size / 2;

          for (const barrier of currentBarriers) {
            if (barrier.duration <= 0) continue;

            // Расстояние от ЦЕНТРА врага до барьера
            const distToBarrier = Math.sqrt(
              Math.pow(enemyPos.x - barrier.x, 2) +
              Math.pow(enemyPos.y - barrier.y, 2)
            );

            // Порог расстояния зависит от размера врага (боссы больше)
            const blockDistance = enemy.type.startsWith('boss_') ? 35 : 25;

            // Определяем направление движения и позицию относительно барьера
            let isBeforeBarrier: boolean;
            let distanceAlongPath: number;

            if (barrier.isHorizontal) {
              // Горизонтальный барьер (на вертикальном канале)
              distanceAlongPath = enemyPos.y - barrier.y;
              const isLeftChannel = barrier.x < 200;
              isBeforeBarrier = isLeftChannel ? (distanceAlongPath > 0) : (distanceAlongPath < 0);
            } else {
              // Вертикальный барьер (на горизонтальном канале)
              distanceAlongPath = enemyPos.x - barrier.x;
              isBeforeBarrier = distanceAlongPath < 0;
            }

            // Блокируем если враг близко к барьеру
            if (distToBarrier < blockDistance) {
              // passThreshold: при каком remainingRatio враг НАЧИНАЕТ проходить
              // boss: проходит когда осталось 65% барьера (блокируется первые 35%)
              // elite: проходит когда осталось 30% (блокируется первые 70%)
              // обычный: passThreshold = 0, блокируется ВСЁ время
              let passThreshold = 0;
              if (enemy.type.startsWith('boss_')) passThreshold = 0.65;
              else if (['abrasive', 'metal', 'corrosion'].includes(enemy.type)) passThreshold = 0.30;

              const remainingRatio = barrier.duration / barrier.maxDuration;

              // Блокируем если барьер ещё "держит" этого врага
              if (remainingRatio > passThreshold) {
                // Если враг уже ПРОШЁЛ барьер (центр за барьером) — выталкиваем вперёд
                if (!isBeforeBarrier && Math.abs(distanceAlongPath) < enemyRadius) {
                  return {
                    ...enemy,
                    progress: enemy.progress + 0.002,
                  };
                }

                // Если враг ДО барьера — ОТКАТЫВАЕМ и держим
                if (isBeforeBarrier) {
                  // Минимальный откат — враг стоит на месте без вибрации
                  return {
                    ...enemy,
                    progress: Math.max(0, enemy.progress - 0.0005),
                  };
                }
              }
            }
          }
          return enemy;
        });
      }

      // 3. Регенерация босса Питтинг
      updated = processBossRegeneration(updated, deltaTime);

      // 4. Боевая система — атаки модулей
      const currentModules = modulesRef.current;
      if (currentModules.length > 0 && updated.length > 0) {
        const attackResult = processAllAttacks(
          currentModules,
          updated,
          enemyPath,
          timestamp,
          gameSpeed
        );

        updated = attackResult.updatedEnemies;

        // Обновляем модули (lastAttack)
        if (attackResult.newAttackEffects.length > 0 || attackResult.newBarriers.length > 0) {
          modulesRef.current = attackResult.updatedModules;
          setModules(attackResult.updatedModules);

          // Для анализатора: убираем ВСЕ старые прицелы при новой атаке
          const hasNewAnalyzerAttack = attackResult.newAttackEffects.some(e => e.moduleType === 'analyzer');

          setAttackEffects(prevEffects => {
            // Если есть новая атака анализатора — удаляем ВСЕ старые прицелы
            const filtered = hasNewAnalyzerAttack
              ? prevEffects.filter(eff => eff.moduleType !== 'analyzer')
              : prevEffects;
            return [...filtered, ...attackResult.newAttackEffects];
          });

          // Добавляем новые барьеры
          if (attackResult.newBarriers.length > 0) {
            activeBarriersRef.current = [...activeBarriersRef.current, ...attackResult.newBarriers];
            setActiveBarriers(activeBarriersRef.current);
          }
        }
      }

      // 5. Урон от горения (burn)
      updated = processBurnDamage(updated, deltaTime);

      // 6. Фильтрация: враги дошли до финиша или погибли
      let livesLost = 0;
      let goldEarned = 0;
      let killsInFrame = 0;  // Подсчёт убийств для статистики
      const deadEnemyIds: string[] = [];
      const newDeathEffects: DeathEffect[] = [];

      updated = updated.filter(enemy => {
        if (hasReachedFinish(enemy)) {
          // Боссы снимают больше жизней
          if (enemy.type === 'boss_pitting') {
            livesLost += 5;
          } else if (enemy.type === 'boss_wear') {
            livesLost += 3;
          } else {
            livesLost += 1;
          }
          deadEnemyIds.push(enemy.id);
          // БЕЗ анимации смерти — враг просто ушёл
          return false;
        }
        if (isDead(enemy)) {
          goldEarned += enemy.reward;
          killsInFrame += 1;  // Считаем убийство
          deadEnemyIds.push(enemy.id);

          // Создаём эффект смерти
          const config = ENEMIES[enemy.type];
          const pos = getPositionOnPath(enemyPath, enemy.progress, config.oscillation);

          // Определяем направление движения (по касательной к пути)
          const nextPos = getPositionOnPath(enemyPath, Math.min(1, enemy.progress + 0.01), config.oscillation);
          const direction = Math.atan2(nextPos.y - pos.y, nextPos.x - pos.x);

          const isBoss = enemy.type.startsWith('boss_');
          newDeathEffects.push({
            id: `death-${enemy.id}`,
            x: pos.x,
            y: pos.y,
            color: config.color,
            size: config.size,
            direction: direction,
            startTime: timestamp,
            duration: isBoss ? 400 : 250,
            particleCount: isBoss ? 10 : 5,
            particleSpeed: isBoss ? 100 : 60,
            ringCount: isBoss ? 2 : 1,
          });

          return false;
        }
        return true;
      });

      // Добавляем эффекты смерти
      if (newDeathEffects.length > 0) {
        setDeathEffects(prev => [...prev, ...newDeathEffects]);
        // Воспроизводим звук смерти
        playDeathSound();
      }

      // Удаляем эффекты анализатора, нацеленные на мёртвых врагов
      if (deadEnemyIds.length > 0) {
        setAttackEffects(prev => prev.filter(eff => {
          // Если эффект анализатора и враг мёртв — удалить
          if (eff.moduleType === 'analyzer' && eff.targetId && deadEnemyIds.includes(eff.targetId)) {
            return false;
          }
          return true;
        }));
      }

      if (livesLost > 0) {
        setLives(l => Math.max(0, l - livesLost));
        playLifeLostSound();
      }

      if (goldEarned > 0) {
        setGold(g => g + goldEarned);
        setTotalGoldEarned(prev => prev + goldEarned);
      }

      // Обновляем статистику убийств
      if (killsInFrame > 0) {
        setTotalKills(prev => prev + killsInFrame);
      }

      // 7. Проверка окончания волны
      if (updated.length === 0 && spawnQueueRef.current.every(s => spawnedIdsRef.current.has(s.id)) && !waveEndingRef.current) {
        waveEndingRef.current = true;
        setTimeout(() => endWave(), 500);
      }

      // ======= ОБНОВЛЯЕМ REF И STATE =======
      enemiesRef.current = updated;
      setEnemies(updated);

      // Обновляем очередь спавна (отдельно, не влияет на enemies)
      if (toSpawn && spawnedIdsRef.current.has(toSpawn.id)) {
        setSpawnQueue(prev => prev.filter(s => !spawnedIdsRef.current.has(s.id)));
      }

      // Обновление анимации эффектов атак
      setAttackEffects(prev => prev
        .map(effect => ({
          ...effect,
          progress: Math.min(1, (timestamp - effect.startTime) / effect.duration),
        }))
        .filter(effect => effect.progress < 1)
      );

      // Обновление и очистка барьеров
      const updatedBarriers = activeBarriersRef.current
        .map(barrier => ({
          ...barrier,
          duration: barrier.duration - deltaTime,
        }))
        .filter(barrier => barrier.duration > 0);
      activeBarriersRef.current = updatedBarriers;
      setActiveBarriers(updatedBarriers);

      // Очистка завершённых эффектов смерти
      setDeathEffects(prev => prev.filter(effect => {
        const elapsed = timestamp - effect.startTime;
        return elapsed < effect.duration;
      }));

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gamePhase, waveStartTime, wave, pathLength, endWave, gameSpeed, isPaused]);

  // Получить модуль в ячейке
  const getModuleAt = (x: number, y: number): Module | undefined => {
    return modules.find(m => m.x === x && m.y === y);
  };

  // Получить позицию ячейки по координатам мыши
  const getCellFromPosition = (clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!fieldRef.current) return null;
    const rect = fieldRef.current.getBoundingClientRect();
    const gridStartX = conveyorWidth + panelPadding;
    const gridStartY = conveyorWidth + panelPadding;

    const relX = clientX - rect.left - gridStartX;
    const relY = clientY - rect.top - gridStartY;

    const cellX = Math.floor(relX / (cellSize + cellGap));
    const cellY = Math.floor(relY / (cellSize + cellGap));

    if (cellX >= 0 && cellX < GRID_COLS && cellY >= 0 && cellY < GRID_ROWS) {
      const inCellX = relX - cellX * (cellSize + cellGap);
      const inCellY = relY - cellY * (cellSize + cellGap);
      if (inCellX >= 0 && inCellX < cellSize && inCellY >= 0 && inCellY < cellSize) {
        return { x: cellX, y: cellY };
      }
    }
    return null;
  };

  // Начало перетаскивания из магазина
  const handleShopDragStart = (e: React.MouseEvent | React.TouchEvent, index: number) => {
    // Блокировка на паузе
    if (isPaused) return;

    const moduleType = shop[index];
    const config = MODULES[moduleType];
    if (gold < config.basePrice) return;

    playUIClick(); // Звук при взятии модуля

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setDragState({
      type: 'shop',
      shopIndex: index,
      moduleType,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
    });
  };

  // Начало перетаскивания с поля
  const handleFieldDragStart = (e: React.MouseEvent | React.TouchEvent, module: Module) => {
    // Блокировка на паузе
    if (isPaused) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setDragState({
      type: 'field',
      moduleId: module.id,
      moduleType: module.type,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
    });
  };

  // Обработка перемещения
  useEffect(() => {
    if (!dragState) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setDragState(prev => prev ? { ...prev, currentX: clientX, currentY: clientY } : null);
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      if (!dragState) return;

      const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
      const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
      const targetCell = getCellFromPosition(clientX, clientY);

      if (targetCell) {
        const existingModule = getModuleAt(targetCell.x, targetCell.y);

        if (dragState.type === 'shop') {
          const config = MODULES[dragState.moduleType];

          if (!existingModule) {
            // Пустая ячейка — размещаем новый модуль
            if (gold >= config.basePrice) {
              const newModule: Module = {
                id: `${dragState.moduleType}-${Date.now()}`,
                type: dragState.moduleType,
                level: 1,
                x: targetCell.x,
                y: targetCell.y,
                lastAttack: 0,
              };
              setModules(prev => [...prev, newModule]);
              setGold(prev => prev - config.basePrice);
              playBuySound();
            }
          } else if (
            existingModule.type === dragState.moduleType &&
            existingModule.level === 1 &&  // Из магазина идёт уровень 1, мёрж только с уровнем 1!
            gold >= config.basePrice
          ) {
            // Такой же тип на поле — мерж из магазина!
            // Анимация слияния
            setMergingCell({ x: targetCell.x, y: targetCell.y });
            setTimeout(() => setMergingCell(null), 400);

            setModules(prev => prev.map(m =>
              m.id === existingModule.id ? { ...m, level: m.level + 1 } : m
            ));
            setGold(prev => prev - config.basePrice);
            playBuySound();
          }
        } else if (dragState.type === 'field' && dragState.moduleId) {
          // ХАРДКОР: модули с поля НЕЛЬЗЯ перемещать, только merge!
          const draggedModule = modules.find(m => m.id === dragState.moduleId);
          if (draggedModule && existingModule) {
            // Merge: только на такой же модуль того же уровня
            if (
              existingModule.id !== dragState.moduleId &&
              existingModule.type === draggedModule.type &&
              existingModule.level === draggedModule.level &&
              existingModule.level < 5
            ) {
              // Анимация слияния
              setMergingCell({ x: targetCell.x, y: targetCell.y });
              setTimeout(() => setMergingCell(null), 400);

              setModules(prev => prev
                .filter(m => m.id !== dragState.moduleId)
                .map(m => m.id === existingModule.id ? { ...m, level: m.level + 1 } : m)
              );
            }
            // Иначе (другой тип/уровень) — модуль просто вернётся на место
          }
          // Если !existingModule (пустая ячейка) — модуль вернётся на место
        }
      }

      setDragState(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [dragState, gold, modules]);

  // Компонент плитки модуля
  const ModuleTile = ({ module, isDragging = false, size = cellSize }: { module: { type: ModuleType; level: number }; isDragging?: boolean; size?: number }) => {
    const config = MODULES[module.type];
    const gradient = MODULE_GRADIENTS[module.type];

    return (
      <div
        className={`
          w-full h-full rounded-xl flex flex-col items-center justify-center relative
          ${isDragging ? 'opacity-90 scale-105' : ''}
        `}
        style={{
          background: gradient.bg,
          border: `3px solid ${gradient.border}`,
          boxShadow: `0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 20px ${config.color}40, 0 2px 0 ${config.color}, 0 4px 15px ${config.color}50`,
        }}
      >
        <span style={{ fontSize: size * 0.4 }} className="drop-shadow-lg">{config.icon}</span>
        <div
          className="absolute top-2 right-2 rounded-full flex items-center justify-center font-bold shadow-lg"
          style={{
            width: size * 0.22,
            height: size * 0.22,
            fontSize: size * 0.14,
            background: 'linear-gradient(145deg, #1e1e1e, #2a2a2a)',
            border: `2px solid ${gradient.border}`,
            color: '#fff',
          }}
        >
          {module.level}
        </div>
      </div>
    );
  };

  // Координаты для SVG пути
  const pathOuter = {
    startX: 0,
    startY: totalHeight,
    leftTopY: cornerRadius,
    topLeftX: cornerRadius,
    topRightX: totalWidth - cornerRadius,
    rightTopY: cornerRadius,
    rightBottomY: totalHeight,
  };

  const pathInner = {
    startX: conveyorWidth,
    startY: totalHeight,
    leftTopY: conveyorWidth + 21,
    topLeftX: conveyorWidth + 21,
    topRightX: totalWidth - conveyorWidth - 21,
    rightTopY: conveyorWidth + 21,
    rightBottomY: totalHeight,
  };

  // Рендер экранов: splash → menu → tutorial → game
  if (screen === 'splash') {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (screen === 'menu') {
    return (
      <>
        <MainMenu
          onStart={handleStartGame}
          onTutorial={handleShowTutorial}
          onShowLeaderboard={() => setShowLeaderboard(true)}
          hasCompletedTutorial={hasCompletedTutorial}
        />
        <LeaderboardModal
          isOpen={showLeaderboard}
          onClose={() => setShowLeaderboard(false)}
          currentDeck={menuDeck || undefined}
          highlightPlayerId={playerId}
        />
      </>
    );
  }

  if (screen === 'tutorial') {
    return (
      <Tutorial
        onComplete={handleTutorialComplete}
        onSkip={handleTutorialComplete}
      />
    );
  }

  // screen === 'game' — основной игровой интерфейс
  return (
    <div
      className="flex flex-col items-center gap-3 py-4"
      style={{
        position: 'relative',
        minHeight: '100vh',
      }}
    >
      {/* SVG фон — приглушённая гексагональная сетка (ПОД всем контентом) */}
      <svg
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.35,
          pointerEvents: 'none',
          zIndex: -1,
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Гексагональный паттерн */}
          <pattern
            id="gameHexGrid"
            width="56"
            height="100"
            patternUnits="userSpaceOnUse"
            patternTransform="scale(1.2)"
          >
            <path
              d="M28 0 L56 16.6 L56 50 L28 66.6 L0 50 L0 16.6 Z"
              fill="none"
              stroke="#1c1f24"
              strokeWidth="1"
            />
            <path
              d="M28 66.6 L56 83.2 L56 116.6 L28 133.2 L0 116.6 L0 83.2 Z"
              fill="none"
              stroke="#1c1f24"
              strokeWidth="1"
              transform="translate(28, -33.3)"
            />
          </pattern>

        </defs>

        {/* Гексагональная сетка — равномерно по всему экрану */}
        <rect width="100%" height="100%" fill="url(#gameHexGrid)" />

        {/* Декоративные угловые линии */}
        <g stroke="#32D6FF" strokeWidth="2" strokeOpacity="0.08" fill="none">
          <path d="M 0 50 L 0 0 L 50 0" />
          <path d="M 100% 50 L 100% 0 L calc(100% - 50px) 0" />
          <path d="M 0 calc(100% - 50px) L 0 100% L 50 100%" />
          <path d="M 100% calc(100% - 50px) L 100% 100% L calc(100% - 50px) 100%" />
        </g>
      </svg>
      <style jsx>{`
        @keyframes oilFlow {
          0% { transform: translateY(0); }
          100% { transform: translateY(20px); }
        }
        @keyframes oilFlowHorizontal {
          0% { transform: translateX(0); }
          100% { transform: translateX(20px); }
        }
        @keyframes pulseFinish {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .oil-flow-vertical {
          animation: oilFlow 3s linear infinite;
        }
        .oil-flow-horizontal {
          animation: oilFlowHorizontal 3s linear infinite;
        }
        .pulse-finish {
          animation: pulseFinish 2s ease-in-out infinite;
        }
        @keyframes merge {
          0% {
            transform: scale(1);
            filter: brightness(1);
          }
          30% {
            transform: scale(1.15);
            filter: brightness(1.5) saturate(1.3);
          }
          60% {
            transform: scale(0.95);
            filter: brightness(1.2);
          }
          100% {
            transform: scale(1);
            filter: brightness(1);
          }
        }
        @keyframes mergeGlow {
          0% { box-shadow: 0 0 0 rgba(255,255,100,0); }
          50% { box-shadow: 0 0 30px rgba(255,255,100,0.8), 0 0 60px rgba(255,200,50,0.4); }
          100% { box-shadow: 0 0 0 rgba(255,255,100,0); }
        }
        .animate-merge {
          animation: merge 0.4s ease-out, mergeGlow 0.4s ease-out;
        }
        /* Header animations */
        @keyframes gearSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes thermoBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes pauseButtonGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(220, 38, 38, 0.4); }
          50% { box-shadow: 0 0 16px rgba(220, 38, 38, 0.8); }
        }
      `}</style>

      {/* Кнопка выбора колоды + индикатор */}
      <div style={{
        position: 'fixed',
        top: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}>
        {/* Индикатор активной тестовой колоды */}
        {testDeck && (
          <div style={{
            background: 'rgba(234, 179, 8, 0.9)',
            color: '#000',
            padding: '4px 12px',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 600,
          }}>
            🧪 ТЕСТ: {testDeck.join(', ')}
          </div>
        )}

      </div>

      {/* Заголовок с кнопкой выхода */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleOpenExitModal}
          className="flex items-center gap-1.5 rounded transition-all"
          style={{
            padding: '3px 8px',
            background: 'linear-gradient(145deg, #1a1f26 0%, #161b22 100%)',
            border: '1px solid #30363d',
            color: '#9CA3AF',
            fontSize: 12,
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#f87171';
            e.currentTarget.style.boxShadow = '0 0 12px rgba(248, 113, 113, 0.25)';
            e.currentTarget.style.color = '#f87171';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#30363d';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.color = '#9CA3AF';
          }}
          title="Покинуть испытание"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>Выйти</span>
        </button>
        <h1 className="text-3xl font-bold text-amber-400">⚙️ Трибо-Лаб</h1>
      </div>

      {/* Статус-бар */}
      <div className="flex items-center gap-6 text-xl mb-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Волна:</span>
          <span className="font-bold text-white">{wave}</span>
        </div>

        {/* Жизни — Термометр */}
        <div className="flex items-center gap-2">
          <svg width="20" height="24" viewBox="0 0 20 24" className="flex-shrink-0">
            <defs>
              <linearGradient id="tempGradHeader" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={lives <= 3 ? '#DC2626' : lives <= 6 ? '#F97316' : '#F59E0B'}/>
                <stop offset="100%" stopColor="#DC2626"/>
              </linearGradient>
            </defs>
            {/* Колба термометра */}
            <rect x="7" y="2" width="6" height="16" rx="3"
                  fill="#2D3748" stroke="#4A5568" strokeWidth="1"/>
            {/* Шарик снизу */}
            <circle cx="10" cy="20" r="3.5"
                    fill={lives <= 3 ? '#DC2626' : lives <= 6 ? '#F97316' : '#F59E0B'}
                    stroke="#991B1B" strokeWidth="1"
                    style={lives <= 3 ? { animation: 'thermoBlink 0.5s ease-in-out infinite' } : undefined}/>
            {/* Жидкость (столбик, высота зависит от жизней) */}
            <rect x="8.5" y={4 + 14 * (1 - lives / 10)} width="3"
                  height={14 * (lives / 10)} rx="1.5"
                  fill="url(#tempGradHeader)"/>
            {/* Штрихи разметки */}
            <line x1="13" y1="6" x2="15" y2="6" stroke="#6B7280" strokeWidth="0.5"/>
            <line x1="13" y1="10" x2="15" y2="10" stroke="#6B7280" strokeWidth="0.5"/>
            <line x1="13" y1="14" x2="15" y2="14" stroke="#6B7280" strokeWidth="0.5"/>
          </svg>
          <span className="font-bold text-white">{lives}</span>
        </div>

        {/* Золото — Шестерёнки */}
        <div className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" className="flex-shrink-0" style={{ animation: 'gearSpin 60s linear infinite' }}>
            <defs>
              <radialGradient id="metalGradHeader">
                <stop offset="0%" stopColor="#A8B2C1"/>
                <stop offset="100%" stopColor="#6B7280"/>
              </radialGradient>
            </defs>
            {/* Зубчатое колесо */}
            <path d="M12,1 L13.5,4 L16,3.5 L17,6 L20,6 L19.5,9 L22,10.5 L20,12 L22,13.5 L19.5,15 L20,18 L17,18 L16,20.5 L13.5,20 L12,23 L10.5,20 L8,20.5 L7,18 L4,18 L4.5,15 L2,13.5 L4,12 L2,10.5 L4.5,9 L4,6 L7,6 L8,3.5 L10.5,4 Z"
                  fill="url(#metalGradHeader)"
                  stroke="#4A5568"
                  strokeWidth="0.5"/>
            {/* Центральное отверстие */}
            <circle cx="12" cy="12" r="4" fill="#2D3748"/>
            <circle cx="12" cy="12" r="3" fill="#1A202C"/>
            {/* Блик */}
            <ellipse cx="9" cy="9" rx="2" ry="1.5" fill="rgba(255,255,255,0.25)"/>
          </svg>
          <span className="font-bold" style={{ color: '#E5E7EB' }}>{gold}</span>
        </div>

        {/* Индикатор волны в процессе + кнопка паузы */}
        {gamePhase === 'wave' && (
          <>
            {/* Цифровой дисплей — враги на поле */}
            <div
              className="relative flex items-center justify-center"
              style={{
                background: '#1A202C',
                border: '1px solid #4A5568',
                borderRadius: '6px',
                padding: '4px 12px',
                minWidth: '40px',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              {/* Внутренняя подсветка */}
              <div
                className="absolute inset-0 rounded-md"
                style={{
                  background: isPaused
                    ? 'rgba(59, 130, 246, 0.1)'
                    : 'rgba(50, 214, 255, 0.05)',
                  pointerEvents: 'none',
                }}
              />
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: isPaused ? '#3B82F6' : '#32D6FF',
                  textShadow: isPaused
                    ? '0 0 8px rgba(59, 130, 246, 0.8)'
                    : '0 0 8px rgba(50, 214, 255, 0.6)',
                }}
              >
                {isPaused ? 'ПАУЗА' : enemies.length}
              </span>
            </div>

            {/* Кнопка паузы — cyan в стиле лаборатории */}
            <button
              onClick={() => {
                playUIClick();
                if (isPaused) {
                  setShowPauseModal(false);
                  setIsPaused(false);
                } else {
                  setIsPaused(true);
                  setShowPauseModal(true);
                }
              }}
              className="flex items-center justify-center transition-all active:scale-95 hover:scale-105"
              style={{
                height: '30px',
                padding: '0 10px',
                background: isPaused
                  ? 'linear-gradient(145deg, #22C55E 0%, #16A34A 100%)'
                  : 'linear-gradient(145deg, #32D6FF 0%, #0EA5E9 100%)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: isPaused
                  ? '0 2px 8px rgba(34, 197, 94, 0.4)'
                  : '0 2px 8px rgba(50, 214, 255, 0.4)',
                fontSize: '12px',
                fontWeight: 700,
                color: isPaused ? '#FFFFFF' : '#0B1622',
                letterSpacing: '0.05em',
              }}
              title={isPaused ? 'Возобновить' : 'Пауза'}
            >
              {isPaused ? '▶' : 'ПАУЗА'}
            </button>
          </>
        )}
      </div>

      {/* DEBUG: Панель отладки */}
      <div className="flex items-center gap-3 text-sm mb-2 bg-gray-800/50 px-3 py-1.5 rounded-lg">
        <span className="text-gray-400">⚡ Скорость игры:</span>
        {[1, 3, 5, 10].map(speed => (
          <button
            key={speed}
            onClick={() => setGameSpeed(speed)}
            className={`px-2 py-0.5 rounded ${gameSpeed === speed ? 'bg-amber-500 text-black' : 'bg-gray-700 text-white'}`}
          >
            {speed}x
          </button>
        ))}
        {/* Кнопки волн скрыты по умолчанию, видны только в devMode */}
        {devMode && (
          <>
            <span className="text-gray-500 mx-2">|</span>
            <span className="text-gray-400">Волна:</span>
            <button
              onClick={() => setWave(w => Math.max(1, w - 1))}
              className="px-2 py-0.5 rounded bg-gray-700 text-white hover:bg-gray-600"
            >
              -
            </button>
            <button
              onClick={() => setWave(w => w + 1)}
              className="px-2 py-0.5 rounded bg-gray-700 text-white hover:bg-gray-600"
            >
              +
            </button>
            <button
              onClick={() => setWave(5)}
              className="px-2 py-0.5 rounded bg-gray-700 text-white hover:bg-gray-600"
            >
              →5
            </button>
            <button
              onClick={() => setWave(10)}
              className="px-2 py-0.5 rounded bg-gray-700 text-white hover:bg-gray-600"
            >
              →10
            </button>
            <button
              onClick={() => setWave(15)}
              className="px-2 py-0.5 rounded bg-gray-700 text-white hover:bg-gray-600"
            >
              →15
            </button>
          </>
        )}
      </div>

      {/* Игровое поле */}
      <div
        ref={fieldRef}
        className="relative select-none"
        style={{ width: totalWidth, height: totalHeight + 130 }}
      >
        {/* Фон поля — прозрачный, чтобы виден был общий гекс-паттерн */}
        <div
          className="absolute"
          style={{
            top: 0,
            left: 0,
            width: totalWidth,
            height: totalHeight + 130,
            background: 'rgba(10, 13, 18, 0.6)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
            borderRadius: `${cornerRadius}px ${cornerRadius}px 16px 16px`,
            border: '2px solid rgba(33, 38, 45, 0.5)',
          }}
        />

        {/* SVG для масляного канала */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={totalWidth}
          height={totalHeight + 130}
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Градиент для масляной плёнки с "живостью" */}
            <linearGradient id="oilGradientMain" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0a1520" />
              <stop offset="25%" stopColor="#0f1f30" />
              <stop offset="50%" stopColor="#132740" />
              <stop offset="75%" stopColor="#0f1f30" />
              <stop offset="100%" stopColor="#0a1520" />
            </linearGradient>

            {/* Градиент для металлических бортиков (приглушённый) */}
            <linearGradient id="metalBorderGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#454a52" />
              <stop offset="50%" stopColor="#2d3138" />
              <stop offset="100%" stopColor="#1a1e22" />
            </linearGradient>

            {/* Градиент для старта (бирюзовый) */}
            <radialGradient id="startGlow" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="rgba(20, 184, 166, 0.5)" />
              <stop offset="100%" stopColor="rgba(20, 184, 166, 0)" />
            </radialGradient>

            {/* Градиент для финиша (красно-янтарный, как у старта) */}
            <radialGradient id="finishGlow" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="rgba(180, 74, 58, 0.6)" />
              <stop offset="100%" stopColor="rgba(180, 74, 58, 0)" />
            </radialGradient>

            {/* Глубокое затемнение внутри финиша */}
            <radialGradient id="finishInnerDark" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0, 0, 0, 0.9)" />
              <stop offset="60%" stopColor="rgba(0, 0, 0, 0.6)" />
              <stop offset="100%" stopColor="rgba(20, 10, 5, 0.3)" />
            </radialGradient>

            {/* ClipPath для обрезки по внешнему контуру - без "ушек" */}
            <clipPath id="outerClip">
              <path d={`
                M 0 ${totalHeight}
                L 0 ${cornerRadius}
                Q 0 0 ${cornerRadius} 0
                L ${totalWidth - cornerRadius} 0
                Q ${totalWidth} 0 ${totalWidth} ${cornerRadius}
                L ${totalWidth} ${totalHeight}
                Z
              `} />
            </clipPath>

            {/* ClipPath для масла - рамка с вырезанной панелью карточек */}
            {(() => {
              const innerR = cornerRadius - innerOffset;
              const innerCornerRadius = 21;
              return (
                <clipPath id="oilClip">
                  <path
                    fillRule="evenodd"
                    d={`
                      M ${innerOffset} ${totalHeight}
                      L ${innerOffset} ${innerOffset + innerR}
                      A ${innerR} ${innerR} 0 0 1 ${innerOffset + innerR} ${innerOffset}
                      L ${totalWidth - innerOffset - innerR} ${innerOffset}
                      A ${innerR} ${innerR} 0 0 1 ${totalWidth - innerOffset} ${innerOffset + innerR}
                      L ${totalWidth - innerOffset} ${totalHeight}
                      Z
                      M ${conveyorWidth} ${totalHeight}
                      L ${totalWidth - conveyorWidth} ${totalHeight}
                      L ${totalWidth - conveyorWidth} ${conveyorWidth + innerCornerRadius}
                      A ${innerCornerRadius} ${innerCornerRadius} 0 0 0 ${totalWidth - conveyorWidth - innerCornerRadius} ${conveyorWidth}
                      L ${conveyorWidth + innerCornerRadius} ${conveyorWidth}
                      A ${innerCornerRadius} ${innerCornerRadius} 0 0 0 ${conveyorWidth} ${conveyorWidth + innerCornerRadius}
                      Z
                    `}
                  />
                </clipPath>
              );
            })()}

            {/* Анимированный блик масла */}
            <linearGradient id={`oilSheen-${gameSpeed}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="45%" stopColor="transparent" />
              <stop offset="50%" stopColor="rgba(100, 150, 200, 0.08)" />
              <stop offset="55%" stopColor="transparent" />
              <stop offset="100%" stopColor="transparent" />
              <animate
                attributeName="x1"
                values="-100%;200%"
                dur={`${12 / gameSpeed}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="x2"
                values="0%;300%"
                dur={`${12 / gameSpeed}s`}
                repeatCount="indefinite"
              />
            </linearGradient>

            {/* ===== ГРАДИЕНТЫ ДЛЯ ВРАГОВ ===== */}

            {/* Пыль — мягкий серый */}
            <radialGradient id="dustGradient">
              <stop offset="0%" stopColor="#b0b5bd" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#9ca3af" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#6b7280" stopOpacity="0.3" />
            </radialGradient>

            {/* Абразив — песочный камень */}
            <linearGradient id="abrasiveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c9a66b" />
              <stop offset="40%" stopColor="#a67c52" />
              <stop offset="100%" stopColor="#7a5c30" />
            </linearGradient>

            {/* Перегрев — температурный градиент */}
            <radialGradient id="heatGradient">
              <stop offset="0%" stopColor="#fffde7" />
              <stop offset="25%" stopColor="#ffcc00" />
              <stop offset="55%" stopColor="#ff6600" />
              <stop offset="85%" stopColor="#cc3300" />
              <stop offset="100%" stopColor="#8b0000" />
            </radialGradient>

            {/* Тепловое марево */}
            <radialGradient id="heatHaze">
              <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#ff6b35" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ff6b35" stopOpacity="0" />
            </radialGradient>

            {/* Стружка — металл */}
            <linearGradient id="metalShavingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e8e8e8" />
              <stop offset="30%" stopColor="#c0c0c0" />
              <stop offset="70%" stopColor="#909090" />
              <stop offset="100%" stopColor="#606060" />
            </linearGradient>

            {/* Коррозия — буро-зелёный */}
            <radialGradient id="corrosionGradient">
              <stop offset="0%" stopColor="#5a7c59" />
              <stop offset="50%" stopColor="#4a6b48" />
              <stop offset="100%" stopColor="#3a5a38" />
            </radialGradient>

            {/* Аура коррозии */}
            <radialGradient id="corrosionAura">
              <stop offset="0%" stopColor="#4a7c59" stopOpacity="0.15" />
              <stop offset="70%" stopColor="#4a7c59" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#4a7c59" stopOpacity="0" />
            </radialGradient>

            {/* Влага — прозрачная капля */}
            <radialGradient id="moistureGradient" cx="30%" cy="30%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="30%" stopColor="#60a5fa" stopOpacity="0.7" />
              <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.4" />
            </radialGradient>

            {/* Статика — свечение */}
            <radialGradient id="sparkGlow">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="30%" stopColor="#facc15" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
            </radialGradient>

            {/* Задир — тёмный металл */}
            <radialGradient id="scarredGradient">
              <stop offset="0%" stopColor="#7a7a7a" />
              <stop offset="50%" stopColor="#5a5a5a" />
              <stop offset="100%" stopColor="#3a3a3a" />
            </radialGradient>

            {/* Питтинг — металлическая поверхность */}
            <radialGradient id="pittingGradient">
              <stop offset="0%" stopColor="#5a6068" />
              <stop offset="60%" stopColor="#3a4048" />
              <stop offset="100%" stopColor="#1a2028" />
            </radialGradient>

            {/* Контактная тень (общая) */}
            <radialGradient id="contactShadow">
              <stop offset="0%" stopColor="#0a1520" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0a1520" stopOpacity="0" />
            </radialGradient>

            {/* Масляной мениск */}
            <linearGradient id="oilMeniscus" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
            </linearGradient>

            {/* ClipPath для канала — П-образная форма с закруглениями */}
            <clipPath id="channelClip">
              <path
                fillRule="evenodd"
                d={`
                  M ${innerOffset} ${totalHeight}
                  L ${innerOffset} ${cornerRadius}
                  Q ${innerOffset} ${innerOffset} ${cornerRadius} ${innerOffset}
                  L ${totalWidth - cornerRadius} ${innerOffset}
                  Q ${totalWidth - innerOffset} ${innerOffset} ${totalWidth - innerOffset} ${cornerRadius}
                  L ${totalWidth - innerOffset} ${totalHeight}
                  Z
                  M ${conveyorWidth} ${totalHeight}
                  L ${conveyorWidth} ${conveyorWidth + 21}
                  Q ${conveyorWidth} ${conveyorWidth} ${conveyorWidth + 21} ${conveyorWidth}
                  L ${totalWidth - conveyorWidth - 21} ${conveyorWidth}
                  Q ${totalWidth - conveyorWidth} ${conveyorWidth} ${totalWidth - conveyorWidth} ${conveyorWidth + 21}
                  L ${totalWidth - conveyorWidth} ${totalHeight}
                  Z
                `}
              />
            </clipPath>

            {/* Path для анимации частиц потока (центр канала) */}
            {(() => {
              const channelCenter = innerOffset + (conveyorWidth - innerOffset) / 2;
              const channelCenterRight = totalWidth - innerOffset - (conveyorWidth - innerOffset) / 2;
              const turnRadius = channelCenter;
              return (
                <path
                  id="flowPath"
                  d={`
                    M ${channelCenter} ${totalHeight}
                    L ${channelCenter} ${turnRadius + channelCenter}
                    A ${turnRadius} ${turnRadius} 0 0 1 ${turnRadius + channelCenter} ${channelCenter}
                    L ${totalWidth - turnRadius - channelCenter} ${channelCenter}
                    A ${turnRadius} ${turnRadius} 0 0 1 ${channelCenterRight} ${turnRadius + channelCenter}
                    L ${channelCenterRight} ${totalHeight}
                  `}
                  fill="none"
                  stroke="none"
                />
              );
            })()}
          </defs>

          {/* Металлический бортик - с дугами для одинаковой ширины */}
          {(() => {
            const outerR = cornerRadius;
            const innerR = cornerRadius - innerOffset;
            return (
              <path
                d={`
                  M 0 ${totalHeight}
                  L 0 ${outerR}
                  A ${outerR} ${outerR} 0 0 1 ${outerR} 0
                  L ${totalWidth - outerR} 0
                  A ${outerR} ${outerR} 0 0 1 ${totalWidth} ${outerR}
                  L ${totalWidth} ${totalHeight}
                  L ${totalWidth - innerOffset} ${totalHeight}
                  L ${totalWidth - innerOffset} ${innerOffset + innerR}
                  A ${innerR} ${innerR} 0 0 0 ${totalWidth - innerOffset - innerR} ${innerOffset}
                  L ${innerOffset + innerR} ${innerOffset}
                  A ${innerR} ${innerR} 0 0 0 ${innerOffset} ${innerOffset + innerR}
                  L ${innerOffset} ${totalHeight}
                  Z
                `}
                fill="url(#metalBorderGradient)"
              />
            );
          })()}

          {/* Масляный канал и пятна масла - всё в группе с clipPath */}
          <g clipPath="url(#oilClip)">
            {(() => {
              const innerR = cornerRadius - innerOffset;
              const innerCornerRadius = 21; // Фиксированный радиус для соответствия панели карточек
              return (
                <path
                  d={`
                    M ${innerOffset} ${totalHeight}
                    L ${innerOffset} ${innerOffset + innerR}
                    A ${innerR} ${innerR} 0 0 1 ${innerOffset + innerR} ${innerOffset}
                    L ${totalWidth - innerOffset - innerR} ${innerOffset}
                    A ${innerR} ${innerR} 0 0 1 ${totalWidth - innerOffset} ${innerOffset + innerR}
                    L ${totalWidth - innerOffset} ${totalHeight}
                    L ${totalWidth - conveyorWidth} ${totalHeight}
                    L ${totalWidth - conveyorWidth} ${conveyorWidth + innerCornerRadius}
                    A ${innerCornerRadius} ${innerCornerRadius} 0 0 0 ${totalWidth - conveyorWidth - innerCornerRadius} ${conveyorWidth}
                    L ${conveyorWidth + innerCornerRadius} ${conveyorWidth}
                    A ${innerCornerRadius} ${innerCornerRadius} 0 0 0 ${conveyorWidth} ${conveyorWidth + innerCornerRadius}
                    L ${conveyorWidth} ${totalHeight}
                    Z
                  `}
                  fill="url(#oilGradientMain)"
                />
              );
            })()}

            {/* Мелкие органичные пятна масла (у краёв и в углах) */}
            {/* Левый участок - у внутреннего края */}
            <ellipse cx={conveyorWidth - 15} cy={totalHeight * 0.35} rx={6} ry={10} fill="rgba(25, 50, 80, 0.35)" transform="rotate(-5)" />
            <ellipse cx={conveyorWidth - 20} cy={totalHeight * 0.55} rx={4} ry={7} fill="rgba(30, 55, 85, 0.3)" />
            <ellipse cx={conveyorWidth - 12} cy={totalHeight * 0.75} rx={5} ry={8} fill="rgba(25, 50, 80, 0.25)" transform="rotate(10)" />
            {/* В левом верхнем углу */}
            <ellipse cx={conveyorWidth * 0.7} cy={conveyorWidth * 0.7} rx={8} ry={6} fill="rgba(30, 55, 85, 0.3)" transform="rotate(-30)" />
            {/* Верхний участок */}
            <ellipse cx={totalWidth * 0.3} cy={conveyorWidth - 15} rx={7} ry={4} fill="rgba(25, 50, 80, 0.3)" />
            <ellipse cx={totalWidth * 0.5} cy={conveyorWidth - 18} rx={5} ry={3} fill="rgba(30, 55, 85, 0.25)" transform="rotate(5)" />
            <ellipse cx={totalWidth * 0.7} cy={conveyorWidth - 12} rx={6} ry={4} fill="rgba(25, 50, 80, 0.3)" transform="rotate(-8)" />
            {/* В правом верхнем углу */}
            <ellipse cx={totalWidth - conveyorWidth * 0.7} cy={conveyorWidth * 0.7} rx={7} ry={5} fill="rgba(30, 55, 85, 0.3)" transform="rotate(25)" />
            {/* Правый участок */}
            <ellipse cx={totalWidth - conveyorWidth + 15} cy={totalHeight * 0.4} rx={5} ry={9} fill="rgba(25, 50, 80, 0.3)" transform="rotate(8)" />
            <ellipse cx={totalWidth - conveyorWidth + 18} cy={totalHeight * 0.6} rx={4} ry={6} fill="rgba(30, 55, 85, 0.25)" />

            {/* Анимированный блик поверх масла */}
            {(() => {
              const innerR = cornerRadius - innerOffset;
              const innerCornerRadius = 21;
              return (
                <path
                  d={`
                    M ${innerOffset} ${totalHeight}
                    L ${innerOffset} ${innerOffset + innerR}
                    A ${innerR} ${innerR} 0 0 1 ${innerOffset + innerR} ${innerOffset}
                    L ${totalWidth - innerOffset - innerR} ${innerOffset}
                    A ${innerR} ${innerR} 0 0 1 ${totalWidth - innerOffset} ${innerOffset + innerR}
                    L ${totalWidth - innerOffset} ${totalHeight}
                    L ${totalWidth - conveyorWidth} ${totalHeight}
                    L ${totalWidth - conveyorWidth} ${conveyorWidth + innerCornerRadius}
                    A ${innerCornerRadius} ${innerCornerRadius} 0 0 0 ${totalWidth - conveyorWidth - innerCornerRadius} ${conveyorWidth}
                    L ${conveyorWidth + innerCornerRadius} ${conveyorWidth}
                    A ${innerCornerRadius} ${innerCornerRadius} 0 0 0 ${conveyorWidth} ${conveyorWidth + innerCornerRadius}
                    L ${conveyorWidth} ${totalHeight}
                    Z
                  `}
                  fill={`url(#oilSheen-${gameSpeed})`}
                  style={{ pointerEvents: 'none' }}
                />
              );
            })()}
          </g>

          {/* Болты/заклёпки - по центру ширины бортика */}
          {/* Левая сторона */}
          <circle cx={innerOffset / 2} cy={conveyorWidth + 60} r={3} fill="#22262a" stroke="#333840" strokeWidth={0.5} />
          <circle cx={innerOffset / 2} cy={totalHeight - 60} r={3} fill="#22262a" stroke="#333840" strokeWidth={0.5} />
          {/* Верхняя сторона */}
          <circle cx={conveyorWidth + 60} cy={innerOffset / 2} r={3} fill="#22262a" stroke="#333840" strokeWidth={0.5} />
          <circle cx={totalWidth / 2} cy={innerOffset / 2} r={3} fill="#22262a" stroke="#333840" strokeWidth={0.5} />
          <circle cx={totalWidth - conveyorWidth - 60} cy={innerOffset / 2} r={3} fill="#22262a" stroke="#333840" strokeWidth={0.5} />
          {/* Правая сторона */}
          <circle cx={totalWidth - innerOffset / 2} cy={conveyorWidth + 60} r={3} fill="#22262a" stroke="#333840" strokeWidth={0.5} />
          <circle cx={totalWidth - innerOffset / 2} cy={totalHeight - 60} r={3} fill="#22262a" stroke="#333840" strokeWidth={0.5} />

          {/* Враги — рисуются ПОД патрубками старта/финиша */}
          {/* Обёртка с clipPath для обрезки аур коррозии по границам канала */}
          <g clipPath="url(#channelClip)">
          {enemies.map(enemy => {
            const config = ENEMIES[enemy.type];
            const pos = getPositionOnPath(enemyPath, enemy.progress, config.oscillation);
            const size = config.size;
            const hpPercent = enemy.hp / enemy.maxHp;

            // HP-бар показываем только если: получал урон в последние 2 сек ИЛИ HP < 99%
            const now = Date.now();
            const showHpBar = (enemy.lastDamageTime > 0 && now - enemy.lastDamageTime < 2000) || hpPercent < 0.99;

            // Fade in/out
            const opacity = enemy.progress < 0.03
              ? enemy.progress / 0.03
              : enemy.progress > 0.97
                ? (1 - enemy.progress) / 0.03
                : 1;

            return (
              <g key={enemy.id} transform={`translate(${pos.x}, ${pos.y})`} opacity={opacity}>

                {/* ═══════════════════════════════════════════════════════════════
                    ПЫЛЬ (dust) — облачко мелких частиц
                    ═══════════════════════════════════════════════════════════════ */}
                {enemy.type === 'dust' && (
                  <g>
                    {/* Контактная тень (слабая, размытая) */}
                    <ellipse cx={0} cy={size*0.6} rx={size*1.0} ry={size*0.3} fill="url(#contactShadow)" opacity={0.4} />

                    {/* Облачко из нескольких частиц */}
                    <g opacity={0.85}>
                      <circle cx={-size*0.35} cy={-size*0.25} r={size*0.45} fill="url(#dustGradient)" />
                      <circle cx={size*0.25} cy={-size*0.15} r={size*0.38} fill="url(#dustGradient)" />
                      <circle cx={0} cy={size*0.25} r={size*0.52} fill="url(#dustGradient)" />
                      <circle cx={-size*0.25} cy={size*0.35} r={size*0.32} fill="url(#dustGradient)" />
                      <circle cx={size*0.35} cy={size*0.25} r={size*0.28} fill="url(#dustGradient)" />

                      {/* Дымка вокруг */}
                      <circle cx={0} cy={0} r={size*1.3} fill="rgba(156,163,175,0.1)" />

                      {/* Микрочастицы-спутники */}
                      <circle cx={size*1.0} cy={-size*0.3} r={size*0.12} fill="#9ca3af" opacity={0.5} />
                      <circle cx={-size*0.9} cy={size*0.5} r={size*0.1} fill="#9ca3af" opacity={0.4} />
                      <circle cx={size*0.6} cy={size*0.8} r={size*0.08} fill="#b0b5bd" opacity={0.35} />
                    </g>

                    {/* Rim light */}
                    <path
                      d={`M ${-size*0.5} ${-size*0.5} Q ${0} ${-size*0.8} ${size*0.4} ${-size*0.4}`}
                      fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeLinecap="round"
                    />
                  </g>
                )}


                {/* ═══════════════════════════════════════════════════════════════
                    АБРАЗИВ (shard) — твёрдый осколок/зерно
                    ═══════════════════════════════════════════════════════════════ */}
                {config.shape === 'shard' && (
                  <g>
                    {/* Контактная тень (плотная) */}
                    <ellipse cx={0} cy={size*0.55} rx={size*0.75} ry={size*0.25} fill="url(#contactShadow)" opacity={0.6} />

                    {/* Основной осколок */}
                    <polygon
                      points={`
                        ${size*0.1},${-size*0.95}
                        ${size*0.75},${-size*0.45}
                        ${size*0.9},${size*0.15}
                        ${size*0.55},${size*0.75}
                        ${size*0.1},${size*0.9}
                        ${-size*0.45},${size*0.7}
                        ${-size*0.85},${size*0.25}
                        ${-size*0.75},${-size*0.35}
                        ${-size*0.35},${-size*0.8}
                      `}
                      fill="url(#abrasiveGradient)"
                    />

                    {/* Грани (свет/тень) */}
                    <polygon
                      points={`${size*0.1},${-size*0.95} ${size*0.75},${-size*0.45} ${size*0.2},${-size*0.1} ${-size*0.35},${-size*0.8}`}
                      fill="rgba(255,255,255,0.15)"
                    />
                    <polygon
                      points={`${size*0.55},${size*0.75} ${size*0.1},${size*0.9} ${-size*0.45},${size*0.7} ${0},${size*0.3}`}
                      fill="rgba(0,0,0,0.2)"
                    />

                    {/* Зернистость */}
                    <circle cx={-size*0.2} cy={-size*0.1} r={size*0.08} fill="#5c4020" opacity={0.5} />
                    <circle cx={size*0.25} cy={size*0.2} r={size*0.06} fill="#6b4d25" opacity={0.4} />
                    <circle cx={-size*0.35} cy={size*0.3} r={size*0.07} fill="#4a3015" opacity={0.45} />
                    <circle cx={size*0.4} cy={-size*0.25} r={size*0.05} fill="#7a5c30" opacity={0.35} />

                    {/* Скол (свежий разлом) */}
                    <polygon
                      points={`${size*0.7},${-size*0.3} ${size*0.85},${size*0.05} ${size*0.55},${-size*0.1}`}
                      fill="#d4b896"
                      opacity={0.7}
                    />

                    {/* Rim light */}
                    <path
                      d={`M ${-size*0.35} ${-size*0.8} L ${size*0.1} ${-size*0.95} L ${size*0.75} ${-size*0.45}`}
                      fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} strokeLinecap="round"
                    />
                  </g>
                )}


                {/* ═══════════════════════════════════════════════════════════════
                    ПЕРЕГРЕВ (heat) — горячий пузырь/очаг
                    ═══════════════════════════════════════════════════════════════ */}
                {enemy.type === 'heat' && (
                  <g>
                    {/* Зона нагрева масла */}
                    <ellipse cx={0} cy={0} rx={size*1.8} ry={size*1.6} fill="rgba(255,107,53,0.08)" />

                    {/* Контактная тень (слабая — он "парит") */}
                    <ellipse cx={0} cy={size*0.7} rx={size*0.9} ry={size*0.25} fill="url(#contactShadow)" opacity={0.3} />

                    {/* Тепловое марево */}
                    <ellipse cx={0} cy={0} rx={size*1.6} ry={size*1.5} fill="url(#heatHaze)">
                      <animate attributeName="rx" values={`${size*1.4};${size*1.8};${size*1.4}`} dur={`${1.8 / gameSpeed}s`} repeatCount="indefinite" />
                      <animate attributeName="ry" values={`${size*1.3};${size*1.7};${size*1.3}`} dur={`${1.8 / gameSpeed}s`} repeatCount="indefinite" />
                    </ellipse>

                    {/* Основной пузырь */}
                    <ellipse cx={0} cy={size*0.05} rx={size*0.85} ry={size*0.95} fill="url(#heatGradient)" />

                    {/* Яркое ядро */}
                    <ellipse cx={0} cy={-size*0.15} rx={size*0.35} ry={size*0.4} fill="#fffde7" opacity={0.7}>
                      <animate attributeName="opacity" values="0.7;0.5;0.7" dur={`${1.2 / gameSpeed}s`} repeatCount="indefinite" />
                    </ellipse>

                    {/* Микропузырьки */}
                    <circle cx={size*0.55} cy={-size*0.35} r={size*0.1} fill="#ffcc00" opacity={0.7}>
                      <animate attributeName="cy" values={`${-size*0.35};${-size*0.9};${-size*0.35}`} dur={`${2 / gameSpeed}s`} repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.7;0;0.7" dur={`${2 / gameSpeed}s`} repeatCount="indefinite" />
                    </circle>
                    <circle cx={-size*0.4} cy={-size*0.2} r={size*0.07} fill="#ffaa00" opacity={0.6}>
                      <animate attributeName="cy" values={`${-size*0.2};${-size*0.75};${-size*0.2}`} dur={`${2.5 / gameSpeed}s`} repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.6;0;0.6" dur={`${2.5 / gameSpeed}s`} repeatCount="indefinite" />
                    </circle>
                    <circle cx={size*0.2} cy={size*0.3} r={size*0.06} fill="#ff8800" opacity={0.5}>
                      <animate attributeName="cy" values={`${size*0.3};${-size*0.5};${size*0.3}`} dur={`${3 / gameSpeed}s`} repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0;0.5" dur={`${3 / gameSpeed}s`} repeatCount="indefinite" />
                    </circle>

                    {/* Влажный блик */}
                    <ellipse cx={-size*0.3} cy={-size*0.55} rx={size*0.25} ry={size*0.1} fill="rgba(255,255,255,0.5)" />
                  </g>
                )}


                {/* ═══════════════════════════════════════════════════════════════
                    СТРУЖКА (shavings) — металлические завитки
                    ═══════════════════════════════════════════════════════════════ */}
                {config.shape === 'shavings' && (
                  <g>
                    {/* Контактная тень */}
                    <ellipse cx={0} cy={size*0.6} rx={size*0.85} ry={size*0.3} fill="url(#contactShadow)" opacity={0.6} />

                    {/* Основной завиток */}
                    <path
                      d={`M ${-size*0.85} ${-size*0.25}
                          Q ${-size*0.5} ${-size*0.95} ${size*0.2} ${-size*0.6}
                          Q ${size*0.85} ${-size*0.25} ${size*0.6} ${size*0.35}
                          Q ${size*0.35} ${size*0.75} ${size*0.1} ${size*0.65}`}
                      fill="none"
                      stroke="url(#metalShavingGradient)"
                      strokeWidth={size * 0.28}
                      strokeLinecap="round"
                    />

                    {/* Тёмная сторона завитка */}
                    <path
                      d={`M ${-size*0.75} ${-size*0.15}
                          Q ${-size*0.4} ${-size*0.75} ${size*0.15} ${-size*0.5}`}
                      fill="none"
                      stroke="rgba(40,40,50,0.4)"
                      strokeWidth={size * 0.12}
                      strokeLinecap="round"
                    />

                    {/* Второй завиток */}
                    <path
                      d={`M ${-size*0.5} ${size*0.2}
                          Q ${-size*0.15} ${size*0.75} ${size*0.35} ${size*0.5}`}
                      fill="none"
                      stroke="#a0a0a0"
                      strokeWidth={size * 0.18}
                      strokeLinecap="round"
                    />

                    {/* Жёсткий металлический блик */}
                    <path
                      d={`M ${-size*0.7} ${-size*0.35}
                          Q ${-size*0.35} ${-size*0.85} ${size*0.25} ${-size*0.55}`}
                      fill="none"
                      stroke="rgba(255,255,255,0.85)"
                      strokeWidth={size * 0.06}
                      strokeLinecap="round"
                    />

                    {/* Вторичный мягкий блик */}
                    <path
                      d={`M ${size*0.4} ${-size*0.35}
                          Q ${size*0.7} ${-size*0.1} ${size*0.55} ${size*0.25}`}
                      fill="none"
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth={size * 0.08}
                      strokeLinecap="round"
                    />

                    {/* Острый конец */}
                    <circle cx={size*0.1} cy={size*0.65} r={size*0.08} fill="#808080" />
                  </g>
                )}


                {/* ═══════════════════════════════════════════════════════════════
                    КОРРОЗИЯ (blob) — пятно/язва
                    ═══════════════════════════════════════════════════════════════ */}
                {config.shape === 'blob' && (
                  <g>
                    {/* Аура коррозии 80px радиус (160px диаметр - уменьшена чтобы не выходила за канал) */}
                    <circle
                      cx={0}
                      cy={0}
                      r={80}
                      fill="url(#corrosionAura)"
                      opacity={0.4}
                    />

                    {/* Контактная тень */}
                    <ellipse cx={0} cy={size*0.55} rx={size*0.8} ry={size*0.25} fill="url(#contactShadow)" opacity={0.5} />

                    {/* Основное пятно */}
                    <path
                      d={`M ${size*0.05} ${-size*0.85}
                          L ${size*0.35} ${-size*0.8}
                          Q ${size*0.7} ${-size*0.65} ${size*0.85} ${-size*0.25}
                          L ${size*0.9} ${size*0.1}
                          Q ${size*0.85} ${size*0.5} ${size*0.6} ${size*0.75}
                          L ${size*0.35} ${size*0.85}
                          Q ${0} ${size*0.95} ${-size*0.35} ${size*0.8}
                          L ${-size*0.6} ${size*0.65}
                          Q ${-size*0.9} ${size*0.35} ${-size*0.85} ${-size*0.05}
                          L ${-size*0.75} ${-size*0.4}
                          Q ${-size*0.6} ${-size*0.75} ${-size*0.25} ${-size*0.85}
                          Z`}
                      fill="url(#corrosionGradient)"
                    />

                    {/* Рыжеватые вкрапления (ржавчина) */}
                    <ellipse cx={size*0.35} cy={-size*0.3} rx={size*0.18} ry={size*0.12} fill="#8b5a2b" opacity={0.6} />
                    <ellipse cx={-size*0.25} cy={size*0.35} rx={size*0.12} ry={size*0.08} fill="#9b6a3b" opacity={0.5} />

                    {/* Тёмные язвы/поры */}
                    <ellipse cx={-size*0.2} cy={-size*0.15} rx={size*0.18} ry={size*0.12} fill="#1a3020" opacity={0.8} />
                    <ellipse cx={size*0.3} cy={size*0.2} rx={size*0.14} ry={size*0.1} fill="#0f2518" opacity={0.75} />
                    <ellipse cx={-size*0.35} cy={size*0.25} rx={size*0.1} ry={size*0.07} fill="#1a3020" opacity={0.7} />
                    <ellipse cx={size*0.1} cy={-size*0.45} rx={size*0.08} ry={size*0.06} fill="#152a1c" opacity={0.65} />
                    <ellipse cx={size*0.5} cy={size*0.45} rx={size*0.12} ry={size*0.08} fill="#1a3020" opacity={0.7} />

                    {/* Мелкие поры */}
                    <circle cx={0} cy={size*0.5} r={size*0.05} fill="#0f2015" opacity={0.6} />
                    <circle cx={size*0.55} cy={-size*0.1} r={size*0.04} fill="#1a3020" opacity={0.5} />
                    <circle cx={-size*0.5} cy={-size*0.35} r={size*0.045} fill="#152a1c" opacity={0.55} />

                    {/* Пузырьки реакции */}
                    <circle cx={size*0.6} cy={-size*0.5} r={size*0.06} fill="#6aac69" opacity={0.5} />
                    <circle cx={-size*0.55} cy={size*0.5} r={size*0.05} fill="#7abc79" opacity={0.4} />

                    {/* Rim light */}
                    <path
                      d={`M ${-size*0.25} ${-size*0.85} Q ${size*0.2} ${-size*0.9} ${size*0.6} ${-size*0.55}`}
                      fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeLinecap="round"
                    />
                  </g>
                )}


                {/* ═══════════════════════════════════════════════════════════════
                    ВЛАГА (moisture) — прозрачная капля
                    ═══════════════════════════════════════════════════════════════ */}
                {enemy.type === 'moisture' && (
                  <g>
                    {/* "Линза" под каплей */}
                    <ellipse cx={0} cy={size*0.15} rx={size*0.9} ry={size*0.7} fill="rgba(30,60,100,0.15)" />

                    {/* Контактная тень (слабая) */}
                    <ellipse cx={0} cy={size*0.65} rx={size*0.7} ry={size*0.2} fill="url(#contactShadow)" opacity={0.35} />

                    {/* Основная капля */}
                    <ellipse cx={0} cy={size*0.1} rx={size*0.7} ry={size*0.95} fill="url(#moistureGradient)" />

                    {/* Эффект толщины */}
                    <ellipse cx={0} cy={size*0.2} rx={size*0.55} ry={size*0.75} fill="rgba(255,255,255,0.08)" />

                    {/* Широкий мягкий блик */}
                    <ellipse cx={-size*0.15} cy={-size*0.3} rx={size*0.35} ry={size*0.18} fill="rgba(255,255,255,0.3)" />

                    {/* Маленький яркий блик */}
                    <ellipse cx={-size*0.22} cy={-size*0.5} rx={size*0.12} ry={size*0.07} fill="rgba(255,255,255,0.8)" />

                    {/* Микрокапля-спутник */}
                    <ellipse cx={size*0.6} cy={size*0.55} rx={size*0.15} ry={size*0.2} fill="url(#moistureGradient)" opacity={0.7} />
                    <ellipse cx={size*0.58} cy={size*0.48} rx={size*0.05} ry={size*0.03} fill="rgba(255,255,255,0.5)" />
                  </g>
                )}


                {/* ═══════════════════════════════════════════════════════════════
                    СТАТИКА (spark) — электрический разряд
                    ═══════════════════════════════════════════════════════════════ */}
                {config.shape === 'spark' && (
                  <g>
                    {/* Общее мерцание */}
                    <animate attributeName="opacity" values="1;0.5;0.9;0.6;1" dur={`${0.2 / gameSpeed}s`} repeatCount="indefinite" />

                    {/* Свечение (glow) */}
                    <ellipse cx={0} cy={0} rx={size*1.8} ry={size*1.6} fill="url(#sparkGlow)" opacity={0.6} />

                    {/* Разряды */}
                    <g stroke="#ffffff" strokeWidth={1.5} strokeLinecap="round" fill="none">
                      <path d={`M ${size*0.2} ${-size*0.3} L ${size*0.5} ${-size*1.0} L ${size*0.3} ${-size*1.4} L ${size*0.6} ${-size*1.8}`}>
                        <animate attributeName="d"
                          values={`M ${size*0.2} ${-size*0.3} L ${size*0.5} ${-size*1.0} L ${size*0.3} ${-size*1.4} L ${size*0.6} ${-size*1.8};
                                   M ${size*0.15} ${-size*0.35} L ${size*0.6} ${-size*0.9} L ${size*0.25} ${-size*1.5} L ${size*0.55} ${-size*1.7};
                                   M ${size*0.2} ${-size*0.3} L ${size*0.5} ${-size*1.0} L ${size*0.3} ${-size*1.4} L ${size*0.6} ${-size*1.8}`}
                          dur={`${0.4 / gameSpeed}s`} repeatCount="indefinite" />
                      </path>
                      <path d={`M ${size*0.35} ${size*0.15} L ${size*1.0} ${size*0.3} L ${size*1.4} ${size*0.15}`} opacity={0.9} />
                      <path d={`M ${-size*0.3} ${size*0.1} L ${-size*0.9} ${-size*0.15} L ${-size*1.2} ${size*0.05}`} opacity={0.8} />
                      <path d={`M ${-size*0.15} ${size*0.35} L ${-size*0.4} ${size*1.0} L ${-size*0.2} ${size*1.3}`} opacity={0.7} />
                    </g>

                    {/* Вторичные разряды (жёлтые) */}
                    <g stroke="#ffe066" strokeWidth={1} strokeLinecap="round" fill="none" opacity={0.7}>
                      <path d={`M ${size*0.1} ${-size*0.25} L ${-size*0.3} ${-size*0.8}`} />
                      <path d={`M ${size*0.25} ${size*0.2} L ${size*0.7} ${size*0.6}`} />
                    </g>

                    {/* Ядро */}
                    <circle cx={0} cy={0} r={size*0.5} fill="#facc15" />
                    <circle cx={0} cy={0} r={size*0.3} fill="#fff">
                      <animate attributeName="r" values={`${size*0.3};${size*0.35};${size*0.25};${size*0.3}`} dur={`${0.15 / gameSpeed}s`} repeatCount="indefinite" />
                    </circle>

                    {/* Корона */}
                    <circle cx={0} cy={0} r={size*1.0} fill="none" stroke="#facc15" strokeWidth={1} opacity={0.5}>
                      <animate attributeName="r" values={`${size*0.9};${size*1.1};${size*0.9}`} dur={`${0.3 / gameSpeed}s`} repeatCount="indefinite" />
                    </circle>
                  </g>
                )}


                {/* ═══════════════════════════════════════════════════════════════
                    ЗАДИР (scarred) — мини-босс, царапины на металле
                    ═══════════════════════════════════════════════════════════════ */}
                {config.shape === 'scarred' && (
                  <g>
                    {/* Контактная тень */}
                    <ellipse cx={0} cy={size*0.6} rx={size*0.9} ry={size*0.35} fill="url(#contactShadow)" opacity={0.7} />

                    {/* Ореол опасности */}
                    <circle cx={0} cy={0} r={size * 0.9} fill="none" stroke="#dc2626" strokeWidth={3} opacity={0.4}>
                      <animate attributeName="opacity" values="0.3;0.6;0.3" dur={`${2 / gameSpeed}s`} repeatCount="indefinite" />
                      <animate attributeName="r" values={`${size*0.85};${size*0.95};${size*0.85}`} dur={`${2 / gameSpeed}s`} repeatCount="indefinite" />
                    </circle>

                    {/* Металлическая основа */}
                    <ellipse cx={0} cy={0} rx={size} ry={size*0.95} fill="url(#scarredGradient)" />

                    {/* Фаска/обод */}
                    <ellipse cx={0} cy={0} rx={size} ry={size*0.95} fill="none" stroke="#5a5a5a" strokeWidth={3} />

                    {/* Главная борозда */}
                    <path
                      d={`M ${-size*0.75} ${-size*0.55} L ${size*0.6} ${size*0.5}`}
                      fill="none" stroke="#1a1a1a" strokeWidth={4} strokeLinecap="round"
                    />
                    <path
                      d={`M ${-size*0.7} ${-size*0.5} L ${size*0.55} ${size*0.45}`}
                      fill="none" stroke="#909090" strokeWidth={1.5} strokeLinecap="round"
                    />

                    {/* Вторичные царапины */}
                    <path
                      d={`M ${-size*0.4} ${-size*0.75} L ${size*0.7} ${size*0.55}`}
                      fill="none" stroke="#2a2a2a" strokeWidth={2.5} strokeLinecap="round"
                    />
                    <path
                      d={`M ${size*0.25} ${-size*0.7} L ${size*0.8} ${size*0.15}`}
                      fill="none" stroke="#252525" strokeWidth={2} strokeLinecap="round"
                    />
                    <path
                      d={`M ${-size*0.65} ${size*0.1} L ${-size*0.2} ${size*0.6}`}
                      fill="none" stroke="#2a2a2a" strokeWidth={1.5} strokeLinecap="round"
                    />

                    {/* Заусенцы */}
                    <circle cx={size*0.6} cy={size*0.5} r={size*0.1} fill="#991b1b" />
                    <circle cx={size*0.7} cy={size*0.55} r={size*0.07} fill="#b91c1c" />
                    <circle cx={size*0.55} cy={size*0.45} r={size*0.05} fill="#dc2626" />

                    {/* Металлический блик */}
                    <ellipse cx={-size*0.4} cy={-size*0.45} rx={size*0.35} ry={size*0.12} fill="rgba(255,255,255,0.25)" />

                    {/* Rim light */}
                    <path
                      d={`M ${-size*0.8} ${-size*0.4} Q ${-size*0.3} ${-size*0.9} ${size*0.5} ${-size*0.7}`}
                      fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2} strokeLinecap="round"
                    />
                  </g>
                )}


                {/* ═══════════════════════════════════════════════════════════════
                    ПИТТИНГ (pitted) — босс, усталостные раковины
                    ═══════════════════════════════════════════════════════════════ */}
                {config.shape === 'pitted' && (
                  <g>
                    {/* Контактная тень */}
                    <ellipse cx={0} cy={size*0.65} rx={size*0.95} ry={size*0.35} fill="url(#contactShadow)" opacity={0.75} />

                    {/* Реген-ореол */}
                    <circle cx={0} cy={0} r={size * 0.9} fill="none" stroke="#22c55e" strokeWidth={3} opacity={0.35}>
                      <animate attributeName="opacity" values="0.2;0.5;0.2" dur={`${3 / gameSpeed}s`} repeatCount="indefinite" />
                    </circle>

                    {/* Металлическая основа */}
                    <circle cx={0} cy={0} r={size} fill="url(#pittingGradient)" />

                    {/* Кольцевая текстура */}
                    <circle cx={0} cy={0} r={size*0.85} fill="none" stroke="rgba(80,90,100,0.3)" strokeWidth={1} />
                    <circle cx={0} cy={0} r={size*0.6} fill="none" stroke="rgba(80,90,100,0.2)" strokeWidth={1} />

                    {/* Фаска */}
                    <circle cx={0} cy={0} r={size} fill="none" stroke="#4a5058" strokeWidth={3} />

                    {/* ГЛАВНЫЙ крупный кратер */}
                    <ellipse cx={-size*0.15} cy={size*0.15} rx={size*0.3} ry={size*0.25} fill="#050505" />
                    <ellipse cx={-size*0.15} cy={size*0.08} rx={size*0.3} ry={size*0.08} fill="#707880" opacity={0.6} />
                    <ellipse cx={-size*0.15} cy={size*0.15} rx={size*0.15} ry={size*0.12} fill="#22c55e" opacity={0.25}>
                      <animate attributeName="opacity" values="0.1;0.35;0.1" dur={`${2.5 / gameSpeed}s`} repeatCount="indefinite" />
                    </ellipse>

                    {/* Кратер 2 */}
                    <ellipse cx={size*0.45} cy={-size*0.35} rx={size*0.2} ry={size*0.16} fill="#080808" />
                    <ellipse cx={size*0.45} cy={-size*0.4} rx={size*0.2} ry={size*0.05} fill="#606870" opacity={0.5} />

                    {/* Кратер 3 */}
                    <ellipse cx={-size*0.5} cy={-size*0.3} rx={size*0.18} ry={size*0.14} fill="#0a0a0a" />
                    <ellipse cx={-size*0.5} cy={-size*0.35} rx={size*0.18} ry={size*0.05} fill="#707880" opacity={0.5} />

                    {/* Кратер 4 */}
                    <ellipse cx={size*0.5} cy={size*0.35} rx={size*0.22} ry={size*0.17} fill="#060606" />
                    <ellipse cx={size*0.5} cy={size*0.29} rx={size*0.22} ry={size*0.06} fill="#606870" opacity={0.55} />

                    {/* Кратер 5 */}
                    <ellipse cx={-size*0.45} cy={size*0.5} rx={size*0.15} ry={size*0.11} fill="#0a0a0a" />
                    <ellipse cx={-size*0.45} cy={size*0.45} rx={size*0.15} ry={size*0.04} fill="#707880" opacity={0.45} />

                    {/* Кратер 6 */}
                    <ellipse cx={size*0.15} cy={-size*0.6} rx={size*0.14} ry={size*0.1} fill="#080808" />
                    <ellipse cx={size*0.15} cy={-size*0.64} rx={size*0.14} ry={size*0.04} fill="#606870" opacity={0.5} />

                    {/* Мелкие кратеры */}
                    <circle cx={size*0.7} cy={0} r={size*0.08} fill="#0a0a0a" />
                    <circle cx={-size*0.7} cy={size*0.15} r={size*0.07} fill="#080808" />
                    <circle cx={size*0.25} cy={size*0.6} r={size*0.06} fill="#0a0a0a" />
                    <circle cx={-size*0.25} cy={-size*0.55} r={size*0.065} fill="#080808" />

                    {/* Металлический блик */}
                    <ellipse cx={-size*0.35} cy={-size*0.5} rx={size*0.4} ry={size*0.12} fill="rgba(255,255,255,0.2)" />

                    {/* Rim light */}
                    <path
                      d={`M ${-size*0.85} ${-size*0.35} Q ${-size*0.2} ${-size*0.95} ${size*0.6} ${-size*0.65}`}
                      fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={2.5} strokeLinecap="round"
                    />
                  </g>
                )}


                {/* ═══════════════════════════════════════════════════════════════
                    HP БАР (показывается только при уроне)
                    ═══════════════════════════════════════════════════════════════ */}
                {showHpBar && (
                  <g>
                    <rect x={-size*0.9} y={-size - 12} width={size * 1.8} height={6} rx={3} fill="rgba(0,0,0,0.7)" />
                    <rect x={-size*0.9} y={-size - 12} width={size * 1.8 * hpPercent} height={6} rx={3}
                      fill={hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#f59e0b' : '#ef4444'}
                    />
                    <rect x={-size*0.85} y={-size - 11} width={size * 1.7 * hpPercent} height={2} rx={1} fill="rgba(255,255,255,0.3)" />
                  </g>
                )}


                {/* ═══════════════════════════════════════════════════════════════
                    ИНДИКАТОРЫ ЭФФЕКТОВ — КОМПАКТНЫЕ БЕЙДЖИ СПРАВА
                    Приоритет: held > slow > marked > dry > burn > coated
                    Максимум 2 видимых + "+N"
                    ═══════════════════════════════════════════════════════════════ */}
                {enemy.effects.length > 0 && (() => {
                  // Собираем активные статусы с приоритетом
                  const statusList: { type: string; icon: React.ReactNode; color: string }[] = [];

                  // Приоритет 1: Захват (барьер старый)
                  if (enemy.effects.find(e => e.type === 'held')) {
                    statusList.push({ type: 'held', icon: '⛓', color: '#f59e0b' });
                  }
                  // Приоритет 1.5: Блокировка перегородкой (новый барьер)
                  if (enemy.effects.find(e => e.type === 'blocked')) {
                    statusList.push({
                      type: 'blocked',
                      icon: (
                        <svg viewBox="0 0 16 16" width="12" height="12">
                          {/* Вертикальная линия (перегородка) */}
                          <line x1="8" y1="2" x2="8" y2="14" stroke="#FFD166" strokeWidth="3" strokeLinecap="round"/>
                          {/* Горизонтальные метки */}
                          <line x1="4" y1="5" x2="12" y2="5" stroke="#FFD166" strokeWidth="1.5" strokeLinecap="round"/>
                          <line x1="4" y1="11" x2="12" y2="11" stroke="#FFD166" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      ),
                      color: '#FFD166'
                    });
                  }
                  // Приоритет 2: Заморозка (SVG снежинка для лучшего центрирования)
                  if (enemy.effects.find(e => e.type === 'slow')) {
                    statusList.push({
                      type: 'slow',
                      icon: (
                        <svg viewBox="0 0 16 16" width="12" height="12">
                          {/* Центральная снежинка */}
                          <line x1="8" y1="1" x2="8" y2="15" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="1" y1="8" x2="15" y2="8" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="3" y1="3" x2="13" y2="13" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round"/>
                          <line x1="13" y1="3" x2="3" y2="13" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round"/>
                          {/* Маленькие ответвления */}
                          <line x1="8" y1="3" x2="6" y2="1" stroke="#38bdf8" strokeWidth="1" strokeLinecap="round"/>
                          <line x1="8" y1="3" x2="10" y2="1" stroke="#38bdf8" strokeWidth="1" strokeLinecap="round"/>
                          <line x1="8" y1="13" x2="6" y2="15" stroke="#38bdf8" strokeWidth="1" strokeLinecap="round"/>
                          <line x1="8" y1="13" x2="10" y2="15" stroke="#38bdf8" strokeWidth="1" strokeLinecap="round"/>
                        </svg>
                      ),
                      color: '#38bdf8'
                    });
                  }
                  // Приоритет 3: Метка
                  if (enemy.effects.find(e => e.type === 'marked')) {
                    statusList.push({ type: 'marked', icon: '🎯', color: '#e0e8f0' });
                  }
                  // Приоритет 4: Сухость
                  if (enemy.effects.find(e => e.type === 'dry')) {
                    statusList.push({
                      type: 'dry',
                      icon: (
                        <svg viewBox="0 0 16 16" width="12" height="12">
                          <path d="M8 2 Q12 7 12 10 Q12 14 8 14 Q4 14 4 10 Q4 7 8 2 Z" fill="none" stroke="#C9C2B3" strokeWidth="1.5"/>
                          <line x1="3" y1="3" x2="13" y2="13" stroke="#C9C2B3" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      ),
                      color: '#C9C2B3'
                    });
                  }
                  // Приоритет 5: Ожог
                  if (enemy.effects.find(e => e.type === 'burn')) {
                    statusList.push({ type: 'burn', icon: '🔥', color: '#ef4444' });
                  }
                  // Приоритет 6: Покрытие смазкой
                  if (enemy.effects.find(e => e.type === 'coated')) {
                    statusList.push({ type: 'coated', icon: '💧', color: '#a855f7' });
                  }

                  if (statusList.length === 0) return null;

                  const visibleStatuses = statusList.slice(0, 2);
                  const hiddenCount = statusList.length - 2;
                  const badgeSize = 18;
                  const gap = 3;

                  // Статусы ВСЕГДА справа от врага
                  // Ограничиваем смещение чтобы статусы не вылезали на поле карточек
                  const maxAnchorX = 38;
                  const anchorX = Math.min(size + 6, maxAnchorX);

                  // Центрируем столбец статусов по вертикали относительно центра врага
                  const totalBadges = visibleStatuses.length + (hiddenCount > 0 ? 1 : 0);
                  const totalHeight = totalBadges * badgeSize + (totalBadges - 1) * gap;
                  const anchorY = -totalHeight / 2 + badgeSize / 2;

                  return (
                    <g>
                      {visibleStatuses.map((status, i) => (
                        <g key={status.type} transform={`translate(${anchorX}, ${anchorY + i * (badgeSize + gap)})`}>
                          {/* Фон бейджа */}
                          <rect
                            x={0} y={-badgeSize/2}
                            width={badgeSize} height={badgeSize}
                            rx={4}
                            fill="rgba(13, 18, 24, 0.85)"
                            stroke={status.color}
                            strokeWidth={1.2}
                            strokeOpacity={0.7}
                          />
                          {/* Иконка */}
                          {typeof status.icon === 'string' ? (
                            <text
                              x={badgeSize/2}
                              y={1}
                              textAnchor="middle"
                              fontSize={11}
                              dominantBaseline="middle"
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              {status.icon}
                            </text>
                          ) : (
                            <g transform={`translate(${(badgeSize - 12) / 2}, ${-6})`}>
                              {status.icon}
                            </g>
                          )}
                        </g>
                      ))}
                      {/* "+N" если больше 2 статусов */}
                      {hiddenCount > 0 && (
                        <g transform={`translate(${anchorX}, ${anchorY + 2 * (badgeSize + gap)})`}>
                          <rect
                            x={0} y={-badgeSize/2}
                            width={badgeSize} height={badgeSize}
                            rx={4}
                            fill="rgba(13, 18, 24, 0.85)"
                            stroke="#6b7280"
                            strokeWidth={1}
                            strokeOpacity={0.5}
                          />
                          <text x={badgeSize/2} y={1} textAnchor="middle" fontSize={10} fill="#9ca3af" dominantBaseline="middle" fontWeight="bold">
                            +{hiddenCount}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })()}

              </g>
            );
          })}
          </g>

          {/* Карман магазина — рисуется ПЕРВЫМ, чтобы патрубки были сверху */}
          <rect
            x={innerOffset}
            y={totalHeight + 5}
            width={totalWidth - innerOffset * 2}
            height={115}
            rx={8}
            fill="rgba(0,0,0,0.3)"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={1}
          />

          {/* Винты крепления кармана */}
          <circle cx={innerOffset + 15} cy={totalHeight + 20} r={3} fill="#1a1e22" stroke="#333" strokeWidth={0.5} />
          <circle cx={totalWidth - innerOffset - 15} cy={totalHeight + 20} r={3} fill="#1a1e22" stroke="#333" strokeWidth={0.5} />
          <circle cx={innerOffset + 15} cy={totalHeight + 100} r={3} fill="#1a1e22" stroke="#333" strokeWidth={0.5} />
          <circle cx={totalWidth - innerOffset - 15} cy={totalHeight + 100} r={3} fill="#1a1e22" stroke="#333" strokeWidth={0.5} />

          {/* СТАРТ - бирюзовый патрубок */}
          <g>
            {/* Свечение */}
            <ellipse cx={(innerOffset + conveyorWidth) / 2} cy={totalHeight + 3} rx={(conveyorWidth - innerOffset - 2) * 0.45} ry={12} fill="url(#startGlow)" />
            {/* Патрубок */}
            <rect x={innerOffset + 1} y={totalHeight - 6} width={conveyorWidth - innerOffset - 2} height={12} rx={3} fill="#0a2e2a" stroke="#0d9488" strokeWidth={1.5} />
            {/* Щель с тенью */}
            <rect x={innerOffset + 8} y={totalHeight - 2} width={conveyorWidth - innerOffset - 18} height={4} rx={2} fill="#051515" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.8))' }} />

            {/* Микро-частицы: ВСЯ ШИРИНА (X: 10%-90%, Y: -8 до -22px) */}
            {/* 16 частиц: двухслойная система — дальний слой + ближний слой */}
            {/* key с gameSpeed для пересоздания анимаций при смене скорости */}
            <g key={`start-particles-${gameSpeed}`} style={{ pointerEvents: 'none' }}>
              {/* === ДАЛЬНИЙ СЛОЙ (8 шт) — прозрачнее, больше blur, выше === */}
              <circle cx={innerOffset + 1 + (conveyorWidth - innerOffset - 2) * 0.10} cy={totalHeight - 18} r={2} fill="#32D6FF" opacity={0.18} style={{ filter: 'blur(0.8px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 18};${totalHeight - 22};${totalHeight - 18}`} dur={`${2.8 / gameSpeed}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.18;0.08;0.18" dur={`${2.8 / gameSpeed}s`} repeatCount="indefinite" />
              </circle>
              <circle cx={innerOffset + 1 + (conveyorWidth - innerOffset - 2) * 0.25} cy={totalHeight - 16} r={2.5} fill="#32D6FF" opacity={0.2} style={{ filter: 'blur(0.7px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 16};${totalHeight - 20};${totalHeight - 16}`} dur={`${3.0 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.4 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.2;0.1;0.2" dur={`${3.0 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.4 / gameSpeed}s`} />
              </circle>
              <circle cx={innerOffset + 1 + (conveyorWidth - innerOffset - 2) * 0.40} cy={totalHeight - 19} r={2} fill="#32D6FF" opacity={0.16} style={{ filter: 'blur(0.9px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 19};${totalHeight - 23};${totalHeight - 19}`} dur={`${2.6 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.8 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.16;0.06;0.16" dur={`${2.6 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.8 / gameSpeed}s`} />
              </circle>
              <circle cx={innerOffset + 1 + (conveyorWidth - innerOffset - 2) * 0.55} cy={totalHeight - 17} r={3} fill="#32D6FF" opacity={0.18} style={{ filter: 'blur(0.8px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 17};${totalHeight - 21};${totalHeight - 17}`} dur={`${2.9 / gameSpeed}s`} repeatCount="indefinite" begin={`${1.2 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.18;0.08;0.18" dur={`${2.9 / gameSpeed}s`} repeatCount="indefinite" begin={`${1.2 / gameSpeed}s`} />
              </circle>
              <circle cx={innerOffset + 1 + (conveyorWidth - innerOffset - 2) * 0.70} cy={totalHeight - 20} r={2} fill="#32D6FF" opacity={0.15} style={{ filter: 'blur(0.9px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 20};${totalHeight - 24};${totalHeight - 20}`} dur={`${2.7 / gameSpeed}s`} repeatCount="indefinite" begin={`${1.6 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.15;0.05;0.15" dur={`${2.7 / gameSpeed}s`} repeatCount="indefinite" begin={`${1.6 / gameSpeed}s`} />
              </circle>
              <circle cx={innerOffset + 1 + (conveyorWidth - innerOffset - 2) * 0.85} cy={totalHeight - 16} r={2.5} fill="#32D6FF" opacity={0.2} style={{ filter: 'blur(0.7px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 16};${totalHeight - 20};${totalHeight - 16}`} dur={`${3.1 / gameSpeed}s`} repeatCount="indefinite" begin={`${2.0 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.2;0.08;0.2" dur={`${3.1 / gameSpeed}s`} repeatCount="indefinite" begin={`${2.0 / gameSpeed}s`} />
              </circle>
              <circle cx={innerOffset + 1 + (conveyorWidth - innerOffset - 2) * 0.32} cy={totalHeight - 18} r={2} fill="#32D6FF" opacity={0.17} style={{ filter: 'blur(0.8px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 18};${totalHeight - 22};${totalHeight - 18}`} dur={`${2.5 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.6 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.17;0.07;0.17" dur={`${2.5 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.6 / gameSpeed}s`} />
              </circle>
              <circle cx={innerOffset + 1 + (conveyorWidth - innerOffset - 2) * 0.78} cy={totalHeight - 17} r={2} fill="#32D6FF" opacity={0.18} style={{ filter: 'blur(0.8px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 17};${totalHeight - 21};${totalHeight - 17}`} dur={`${2.8 / gameSpeed}s`} repeatCount="indefinite" begin={`${1.8 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.18;0.08;0.18" dur={`${2.8 / gameSpeed}s`} repeatCount="indefinite" begin={`${1.8 / gameSpeed}s`} />
              </circle>
              {/* === БЛИЖНИЙ СЛОЙ (8 шт) — ярче, меньше blur, ближе к щели === */}
              <circle cx={innerOffset + 1 + (conveyorWidth - innerOffset - 2) * 0.15} cy={totalHeight - 10} r={2} fill="#32D6FF" opacity={0.35} style={{ filter: 'blur(0.3px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 10};${totalHeight - 14};${totalHeight - 10}`} dur={`${2.2 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.1 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.35;0.18;0.35" dur={`${2.2 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.1 / gameSpeed}s`} />
              </circle>
              <circle cx={innerOffset + 1 + (conveyorWidth - innerOffset - 2) * 0.30} cy={totalHeight - 12} r={2.5} fill="#32D6FF" opacity={0.32} style={{ filter: 'blur(0.4px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 12};${totalHeight - 16};${totalHeight - 12}`} dur={`${2.4 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.5 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.32;0.15;0.32" dur={`${2.4 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.5 / gameSpeed}s`} />
              </circle>
              <circle cx={innerOffset + 1 + (conveyorWidth - innerOffset - 2) * 0.45} cy={totalHeight - 9} r={2} fill="#32D6FF" opacity={0.38} style={{ filter: 'blur(0.3px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 9};${totalHeight - 13};${totalHeight - 9}`} dur={`${2.1 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.9 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.38;0.18;0.38" dur={`${2.1 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.9 / gameSpeed}s`} />
              </circle>
              <circle cx={innerOffset + 1 + (conveyorWidth - innerOffset - 2) * 0.50} cy={totalHeight - 11} r={3} fill="#32D6FF" opacity={0.3} style={{ filter: 'blur(0.5px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 11};${totalHeight - 15};${totalHeight - 11}`} dur={`${2.5 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.3 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.3;0.14;0.3" dur={`${2.5 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.3 / gameSpeed}s`} />
              </circle>
              <circle cx={innerOffset + 1 + (conveyorWidth - innerOffset - 2) * 0.62} cy={totalHeight - 10} r={2} fill="#32D6FF" opacity={0.36} style={{ filter: 'blur(0.3px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 10};${totalHeight - 14};${totalHeight - 10}`} dur={`${2.3 / gameSpeed}s`} repeatCount="indefinite" begin={`${1.1 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.36;0.16;0.36" dur={`${2.3 / gameSpeed}s`} repeatCount="indefinite" begin={`${1.1 / gameSpeed}s`} />
              </circle>
              <circle cx={innerOffset + 1 + (conveyorWidth - innerOffset - 2) * 0.75} cy={totalHeight - 12} r={2.5} fill="#32D6FF" opacity={0.33} style={{ filter: 'blur(0.4px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 12};${totalHeight - 16};${totalHeight - 12}`} dur={`${2.6 / gameSpeed}s`} repeatCount="indefinite" begin={`${1.5 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.33;0.15;0.33" dur={`${2.6 / gameSpeed}s`} repeatCount="indefinite" begin={`${1.5 / gameSpeed}s`} />
              </circle>
              <circle cx={innerOffset + 1 + (conveyorWidth - innerOffset - 2) * 0.88} cy={totalHeight - 9} r={2} fill="#32D6FF" opacity={0.34} style={{ filter: 'blur(0.3px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 9};${totalHeight - 13};${totalHeight - 9}`} dur={`${2.2 / gameSpeed}s`} repeatCount="indefinite" begin={`${1.9 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.34;0.16;0.34" dur={`${2.2 / gameSpeed}s`} repeatCount="indefinite" begin={`${1.9 / gameSpeed}s`} />
              </circle>
              <circle cx={innerOffset + 1 + (conveyorWidth - innerOffset - 2) * 0.20} cy={totalHeight - 11} r={2} fill="#32D6FF" opacity={0.32} style={{ filter: 'blur(0.4px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 11};${totalHeight - 15};${totalHeight - 11}`} dur={`${2.4 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.7 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.32;0.14;0.32" dur={`${2.4 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.7 / gameSpeed}s`} />
              </circle>
            </g>
          </g>

          {/* ФИНИШ - красно-янтарный патрубок (СВЕРХУ кармана магазина) */}
          <g>
            {/* Свечение - как у старта */}
            <ellipse cx={totalWidth - (conveyorWidth + innerOffset) / 2} cy={totalHeight + 3} rx={(conveyorWidth - innerOffset - 2) * 0.45} ry={12} fill="url(#finishGlow)" />
            {/* Патрубок */}
            <rect x={totalWidth - conveyorWidth + 1} y={totalHeight - 6} width={conveyorWidth - innerOffset - 2} height={12} rx={3} fill="#2a1a18" stroke="#b84a3a" strokeWidth={1.5} />
            {/* Щель с тенью */}
            <rect x={totalWidth - conveyorWidth + 8} y={totalHeight - 2} width={conveyorWidth - innerOffset - 18} height={4} rx={2} fill="#1a0808" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.8))' }} />

            {/* Микро-частицы: ВСЯ ШИРИНА (X: 10%-90%, Y: -8 до -22px) */}
            {/* 16 частиц: двухслойная система — дальний слой + ближний слой */}
            {/* key с gameSpeed для пересоздания анимаций при смене скорости */}
            <g key={`finish-particles-${gameSpeed}`} style={{ pointerEvents: 'none' }}>
              {/* === ДАЛЬНИЙ СЛОЙ (8 шт) — прозрачнее, больше blur, выше === */}
              <circle cx={totalWidth - conveyorWidth + 1 + (conveyorWidth - innerOffset - 2) * 0.10} cy={totalHeight - 18} r={2} fill="#FF6B35" opacity={0.18} style={{ filter: 'blur(0.8px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 18};${totalHeight - 22};${totalHeight - 18}`} dur={`${2.8 / gameSpeed}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.18;0.08;0.18" dur={`${2.8 / gameSpeed}s`} repeatCount="indefinite" />
              </circle>
              <circle cx={totalWidth - conveyorWidth + 1 + (conveyorWidth - innerOffset - 2) * 0.25} cy={totalHeight - 16} r={2.5} fill="#FF3B4D" opacity={0.2} style={{ filter: 'blur(0.7px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 16};${totalHeight - 20};${totalHeight - 16}`} dur={`${3.0 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.4 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.2;0.1;0.2" dur={`${3.0 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.4 / gameSpeed}s`} />
              </circle>
              <circle cx={totalWidth - conveyorWidth + 1 + (conveyorWidth - innerOffset - 2) * 0.40} cy={totalHeight - 19} r={2} fill="#FF6B35" opacity={0.16} style={{ filter: 'blur(0.9px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 19};${totalHeight - 23};${totalHeight - 19}`} dur={`${2.6 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.8 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.16;0.06;0.16" dur={`${2.6 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.8 / gameSpeed}s`} />
              </circle>
              <circle cx={totalWidth - conveyorWidth + 1 + (conveyorWidth - innerOffset - 2) * 0.55} cy={totalHeight - 17} r={3} fill="#FF3B4D" opacity={0.18} style={{ filter: 'blur(0.8px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 17};${totalHeight - 21};${totalHeight - 17}`} dur={`${2.9 / gameSpeed}s`} repeatCount="indefinite" begin={`${1.2 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.18;0.08;0.18" dur={`${2.9 / gameSpeed}s`} repeatCount="indefinite" begin={`${1.2 / gameSpeed}s`} />
              </circle>
              <circle cx={totalWidth - conveyorWidth + 1 + (conveyorWidth - innerOffset - 2) * 0.70} cy={totalHeight - 20} r={2} fill="#FF6B35" opacity={0.15} style={{ filter: 'blur(0.9px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 20};${totalHeight - 24};${totalHeight - 20}`} dur={`${2.7 / gameSpeed}s`} repeatCount="indefinite" begin={`${1.6 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.15;0.05;0.15" dur={`${2.7 / gameSpeed}s`} repeatCount="indefinite" begin={`${1.6 / gameSpeed}s`} />
              </circle>
              <circle cx={totalWidth - conveyorWidth + 1 + (conveyorWidth - innerOffset - 2) * 0.85} cy={totalHeight - 16} r={2.5} fill="#FF3B4D" opacity={0.2} style={{ filter: 'blur(0.7px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 16};${totalHeight - 20};${totalHeight - 16}`} dur={`${3.1 / gameSpeed}s`} repeatCount="indefinite" begin={`${2.0 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.2;0.08;0.2" dur={`${3.1 / gameSpeed}s`} repeatCount="indefinite" begin={`${2.0 / gameSpeed}s`} />
              </circle>
              <circle cx={totalWidth - conveyorWidth + 1 + (conveyorWidth - innerOffset - 2) * 0.32} cy={totalHeight - 18} r={2} fill="#FF6B35" opacity={0.17} style={{ filter: 'blur(0.8px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 18};${totalHeight - 22};${totalHeight - 18}`} dur={`${2.5 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.6 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.17;0.07;0.17" dur={`${2.5 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.6 / gameSpeed}s`} />
              </circle>
              <circle cx={totalWidth - conveyorWidth + 1 + (conveyorWidth - innerOffset - 2) * 0.78} cy={totalHeight - 17} r={2} fill="#FF3B4D" opacity={0.18} style={{ filter: 'blur(0.8px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 17};${totalHeight - 21};${totalHeight - 17}`} dur={`${2.8 / gameSpeed}s`} repeatCount="indefinite" begin={`${1.8 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.18;0.08;0.18" dur={`${2.8 / gameSpeed}s`} repeatCount="indefinite" begin={`${1.8 / gameSpeed}s`} />
              </circle>
              {/* === БЛИЖНИЙ СЛОЙ (8 шт) — ярче, меньше blur, ближе к щели === */}
              <circle cx={totalWidth - conveyorWidth + 1 + (conveyorWidth - innerOffset - 2) * 0.15} cy={totalHeight - 10} r={2} fill="#FF6B35" opacity={0.35} style={{ filter: 'blur(0.3px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 10};${totalHeight - 14};${totalHeight - 10}`} dur={`${2.2 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.1 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.35;0.18;0.35" dur={`${2.2 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.1 / gameSpeed}s`} />
              </circle>
              <circle cx={totalWidth - conveyorWidth + 1 + (conveyorWidth - innerOffset - 2) * 0.30} cy={totalHeight - 12} r={2.5} fill="#FF3B4D" opacity={0.32} style={{ filter: 'blur(0.4px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 12};${totalHeight - 16};${totalHeight - 12}`} dur={`${2.4 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.5 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.32;0.15;0.32" dur={`${2.4 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.5 / gameSpeed}s`} />
              </circle>
              <circle cx={totalWidth - conveyorWidth + 1 + (conveyorWidth - innerOffset - 2) * 0.45} cy={totalHeight - 9} r={2} fill="#FF6B35" opacity={0.38} style={{ filter: 'blur(0.3px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 9};${totalHeight - 13};${totalHeight - 9}`} dur={`${2.1 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.9 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.38;0.18;0.38" dur={`${2.1 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.9 / gameSpeed}s`} />
              </circle>
              <circle cx={totalWidth - conveyorWidth + 1 + (conveyorWidth - innerOffset - 2) * 0.50} cy={totalHeight - 11} r={3} fill="#FF3B4D" opacity={0.3} style={{ filter: 'blur(0.5px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 11};${totalHeight - 15};${totalHeight - 11}`} dur={`${2.5 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.3 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.3;0.14;0.3" dur={`${2.5 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.3 / gameSpeed}s`} />
              </circle>
              <circle cx={totalWidth - conveyorWidth + 1 + (conveyorWidth - innerOffset - 2) * 0.62} cy={totalHeight - 10} r={2} fill="#FF6B35" opacity={0.36} style={{ filter: 'blur(0.3px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 10};${totalHeight - 14};${totalHeight - 10}`} dur={`${2.3 / gameSpeed}s`} repeatCount="indefinite" begin={`${1.1 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.36;0.16;0.36" dur={`${2.3 / gameSpeed}s`} repeatCount="indefinite" begin={`${1.1 / gameSpeed}s`} />
              </circle>
              <circle cx={totalWidth - conveyorWidth + 1 + (conveyorWidth - innerOffset - 2) * 0.75} cy={totalHeight - 12} r={2.5} fill="#FF3B4D" opacity={0.33} style={{ filter: 'blur(0.4px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 12};${totalHeight - 16};${totalHeight - 12}`} dur={`${2.6 / gameSpeed}s`} repeatCount="indefinite" begin={`${1.5 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.33;0.15;0.33" dur={`${2.6 / gameSpeed}s`} repeatCount="indefinite" begin={`${1.5 / gameSpeed}s`} />
              </circle>
              <circle cx={totalWidth - conveyorWidth + 1 + (conveyorWidth - innerOffset - 2) * 0.88} cy={totalHeight - 9} r={2} fill="#FF6B35" opacity={0.34} style={{ filter: 'blur(0.3px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 9};${totalHeight - 13};${totalHeight - 9}`} dur={`${2.2 / gameSpeed}s`} repeatCount="indefinite" begin={`${1.9 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.34;0.16;0.34" dur={`${2.2 / gameSpeed}s`} repeatCount="indefinite" begin={`${1.9 / gameSpeed}s`} />
              </circle>
              <circle cx={totalWidth - conveyorWidth + 1 + (conveyorWidth - innerOffset - 2) * 0.20} cy={totalHeight - 11} r={2} fill="#FF6B35" opacity={0.32} style={{ filter: 'blur(0.4px)' }}>
                <animate attributeName="cy" values={`${totalHeight - 11};${totalHeight - 15};${totalHeight - 11}`} dur={`${2.4 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.7 / gameSpeed}s`} />
                <animate attributeName="opacity" values="0.32;0.14;0.32" dur={`${2.4 / gameSpeed}s`} repeatCount="indefinite" begin={`${0.7 / gameSpeed}s`} />
              </circle>
            </g>
          </g>

          {/* LED индикаторы */}
          <circle key={`led-start-${gameSpeed}`} cx={innerOffset + 25} cy={totalHeight + 60} r={4} fill="#0ea5e9" opacity={0.6}>
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur={`${3 / gameSpeed}s`} repeatCount="indefinite" />
          </circle>
          <circle key={`led-finish-${gameSpeed}`} cx={totalWidth - innerOffset - 25} cy={totalHeight + 60} r={4} fill="#f59e0b" opacity={0.6}>
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur={`${3 / gameSpeed}s`} repeatCount="indefinite" />
          </circle>
        </svg>

        {/* Внутренняя панель с сеткой */}
        <div
          className="absolute"
          style={{
            left: conveyorWidth,
            top: conveyorWidth,
            width: gridWidth + panelPadding * 2,
            height: gridHeight + panelPadding * 2,
            background: 'linear-gradient(145deg, #0a0f15 0%, #0d1218 100%)',
            backgroundImage: `
              repeating-linear-gradient(
                135deg,
                transparent,
                transparent 1px,
                rgba(255,255,255,0.015) 1px,
                rgba(255,255,255,0.015) 2px
              )
            `,
            boxShadow: 'inset 0 8px 40px rgba(0,0,0,0.95), inset 0 -4px 20px rgba(0,0,0,0.5), inset 4px 0 20px rgba(0,0,0,0.3), inset -4px 0 20px rgba(0,0,0,0.3)',
            borderRadius: '21px 21px 0 0',
            borderTop: '2px solid #1a2530',
            borderLeft: '2px solid #1a2530',
            borderRight: '2px solid #1a2530',
          }}
        >
          {/* Сетка 4x3 */}
          <div
            className="absolute grid"
            style={{
              left: panelPadding,
              top: panelPadding,
              gridTemplateColumns: `repeat(${GRID_COLS}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${GRID_ROWS}, ${cellSize}px)`,
              gap: cellGap,
            }}
          >
            {Array.from({ length: GRID_ROWS }).map((_, y) =>
              Array.from({ length: GRID_COLS }).map((_, x) => {
                const module = getModuleAt(x, y);
                const isDraggingThis = dragState?.type === 'field' && dragState.moduleId === module?.id;
                const isDropTarget = dragState && !module;
                const canMerge = dragState && module && (() => {
                  if (dragState.type === 'field') {
                    const dragged = modules.find(m => m.id === dragState.moduleId);
                    return dragged && dragged.type === module.type && dragged.level === module.level && module.level < 5;
                  }
                  return dragState.moduleType === module.type && module.level === 1 && module.level < 5;
                })();
                const isMerging = mergingCell?.x === x && mergingCell?.y === y;

                // Подсветка зоны баффа при перетаскивании смазки
                const isInLubricantBuffZone = dragState?.moduleType === 'lubricant' && (() => {
                  // Вычисляем ячейку под курсором
                  const fieldRect = fieldRef.current?.getBoundingClientRect();
                  if (!fieldRect) return false;
                  const gridStartX = conveyorWidth + panelPadding;
                  const gridStartY = conveyorWidth + panelPadding;
                  const relX = dragState.currentX - fieldRect.left - gridStartX;
                  const relY = dragState.currentY - fieldRect.top - gridStartY;
                  const hoverX = Math.floor(relX / (cellSize + cellGap));
                  const hoverY = Math.floor(relY / (cellSize + cellGap));
                  // Эта ячейка в зоне баффа, если в пределах ±1 от hover и не сама hover
                  if (hoverX < 0 || hoverX >= GRID_COLS || hoverY < 0 || hoverY >= GRID_ROWS) return false;
                  const dx = Math.abs(x - hoverX);
                  const dy = Math.abs(y - hoverY);
                  return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);
                })();

                // DEV: Подсветка для выбранного модуля
                const isDevTarget = devMode && selectedDevModule && !module;

                return (
                  <div
                    key={`${x}-${y}`}
                    className={`
                      rounded-xl transition-all duration-150 relative overflow-hidden
                      ${isDropTarget ? 'ring-4 ring-green-500 ring-opacity-70' : ''}
                      ${canMerge ? 'ring-4 ring-yellow-400 ring-opacity-70' : ''}
                      ${isInLubricantBuffZone ? 'ring-2 ring-purple-400 ring-opacity-50' : ''}
                      ${isDevTarget ? 'ring-2 ring-cyan-400 ring-opacity-50 cursor-pointer' : ''}
                    `}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      background: 'linear-gradient(145deg, #080c10 0%, #0f1318 100%)',
                      boxShadow: 'inset 0 4px 15px rgba(0,0,0,0.9), inset 0 -1px 0 rgba(255,255,255,0.02)',
                    }}
                    onClick={() => {
                      if (devMode && selectedDevModule) {
                        devPlaceModule(x, y);
                      }
                    }}
                  >
                    {module && !isDraggingThis && (
                      <div
                        className={`absolute inset-0 cursor-grab active:cursor-grabbing ${isMerging ? 'animate-merge' : ''}`}
                        onMouseDown={(e) => handleFieldDragStart(e, module)}
                        onTouchStart={(e) => handleFieldDragStart(e, module)}
                      >
                        <FieldTile
                          type={module.type}
                          level={module.level}
                          size={cellSize}
                          isLubricated={lubricatedModuleIds.has(module.id)}
                          isProtected={protectedModuleIds.has(module.id)}
                          corrosionStacks={getCorrosionStacks(module)}
                          hasNearbyCorrosion={hasNearbyCorrosion(module)}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            ЭФФЕКТЫ АТАК (отдельный SVG-слой поверх сетки)
            ═══════════════════════════════════════════════════════════════ */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={totalWidth}
          height={totalHeight + 130}
          style={{ overflow: 'visible', zIndex: 50 }}
        >
          {attackEffects.map(effect => {
            const progress = effect.progress;
            const midX = (effect.fromX + effect.toX) / 2;

            // МАГНИТ — силовые линии (дуги)
            if (effect.moduleType === 'magnet') {
              return (
                <g key={effect.id} opacity={1 - progress * 0.7}>
                  {/* Главная дуга */}
                  <path
                    d={`M ${effect.fromX} ${effect.fromY} Q ${midX} ${effect.fromY - 30} ${effect.toX} ${effect.toY}`}
                    fill="none"
                    stroke="#6B4CD6"
                    strokeWidth={2}
                    strokeDasharray="8,4"
                  />
                  {/* Вторая дуга (снизу) */}
                  <path
                    d={`M ${effect.fromX} ${effect.fromY} Q ${midX} ${effect.fromY + 25} ${effect.toX} ${effect.toY}`}
                    fill="none"
                    stroke="#6B4CD6"
                    strokeWidth={1.5}
                    strokeDasharray="4,4"
                    opacity={0.5}
                  />
                  {/* Точка на цели */}
                  <circle cx={effect.toX} cy={effect.toY} r={5} fill="#6B4CD6" opacity={0.6} />
                </g>
              );
            }

            // ОХЛАДИТЕЛЬ — холодный снаряд
            if (effect.moduleType === 'cooler') {
              const x = effect.fromX + (effect.toX - effect.fromX) * progress;
              const y = effect.fromY + (effect.toY - effect.fromY) * progress;
              return (
                <g key={effect.id}>
                  {/* Ледяной след */}
                  <line
                    x1={effect.fromX}
                    y1={effect.fromY}
                    x2={x}
                    y2={y}
                    stroke="#2A9AC8"
                    strokeWidth={2}
                    opacity={0.3}
                  />
                  {/* Свечение */}
                  <circle cx={x} cy={y} r={10} fill="#2A9AC8" opacity={0.25} />
                  {/* Снаряд */}
                  <circle cx={x} cy={y} r={6} fill="#2A9AC8" />
                  {/* Ядро */}
                  <circle cx={x} cy={y} r={3} fill="#FFFFFF" opacity={0.8} />
                </g>
              );
            }

            // ФИЛЬТР — пульс на модуле → импакт НА ВРАГЕ
            if (effect.moduleType === 'filter') {
              return (
                <g key={effect.id}>
                  {/* ФАЗА 1: Источник — пульс на модуле (progress 0–0.3) */}
                  {progress < 0.3 && (
                    <circle
                      cx={effect.fromX}
                      cy={effect.fromY}
                      r={15 + progress * 50}
                      fill="none"
                      stroke="#C09A1E"
                      strokeWidth={2}
                      opacity={1 - progress * 3}
                    />
                  )}

                  {/* ФАЗА 2: Импакт — кольца ОТ ВРАГА (progress 0.2–1.0) */}
                  {progress >= 0.2 && (
                    <g opacity={1 - (progress - 0.2) * 1.2}>
                      {/* Внешнее кольцо */}
                      <circle
                        cx={effect.toX}
                        cy={effect.toY}
                        r={5 + (progress - 0.2) * 40}
                        fill="none"
                        stroke="#C09A1E"
                        strokeWidth={2.5}
                      />
                      {/* Внутреннее кольцо */}
                      <circle
                        cx={effect.toX}
                        cy={effect.toY}
                        r={3 + (progress - 0.2) * 25}
                        fill="none"
                        stroke="#C09A1E"
                        strokeWidth={1.5}
                        opacity={0.6}
                      />
                      {/* Микросетка (фильтрация) */}
                      <circle
                        cx={effect.toX}
                        cy={effect.toY}
                        r={12}
                        fill="none"
                        stroke="#C09A1E"
                        strokeWidth={1}
                        strokeDasharray="3,3"
                        opacity={0.5}
                      />
                      {/* Частицы "грязи" втягиваются к центру */}
                      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                        const dist = 20 * (1 - (progress - 0.2) * 1.2);
                        return (
                          <circle
                            key={i}
                            cx={effect.toX + Math.cos(angle * Math.PI / 180) * Math.max(0, dist)}
                            cy={effect.toY + Math.sin(angle * Math.PI / 180) * Math.max(0, dist)}
                            r={2}
                            fill="#8B7355"
                            opacity={Math.max(0, 1 - (progress - 0.2) * 1.2)}
                          />
                        );
                      })}
                    </g>
                  )}
                </g>
              );
            }

            // СМАЗКА — капля летит → плёнка растекается на враге
            if (effect.moduleType === 'lubricant') {
              return (
                <g key={effect.id}>
                  {/* ФАЗА 1: Капля летит к каналу (progress 0–0.5) */}
                  {progress < 0.5 && (
                    <g>
                      <ellipse
                        cx={effect.fromX + (effect.toX - effect.fromX) * progress * 2}
                        cy={effect.fromY + (effect.toY - effect.fromY) * progress * 2}
                        rx={4}
                        ry={6}
                        fill="#8845C7"
                        opacity={0.8}
                      />
                      {/* Блик */}
                      <ellipse
                        cx={effect.fromX + (effect.toX - effect.fromX) * progress * 2 - 1}
                        cy={effect.fromY + (effect.toY - effect.fromY) * progress * 2 - 2}
                        rx={1.5}
                        ry={2}
                        fill="#FFFFFF"
                        opacity={0.4}
                      />
                    </g>
                  )}

                  {/* ФАЗА 2: Плёнка растекается на враге (progress 0.4–1.0) */}
                  {progress >= 0.4 && (
                    <g opacity={Math.max(0, 1 - (progress - 0.4) * 1.5)}>
                      {/* Масляное пятно */}
                      <ellipse
                        cx={effect.toX}
                        cy={effect.toY}
                        rx={8 + (progress - 0.4) * 35}
                        ry={5 + (progress - 0.4) * 18}
                        fill="rgba(136, 69, 199, 0.35)"
                      />
                      {/* Глянцевый блик */}
                      <ellipse
                        cx={effect.toX - 5}
                        cy={effect.toY - 3}
                        rx={4 + (progress - 0.4) * 12}
                        ry={2 + (progress - 0.4) * 6}
                        fill="rgba(255, 255, 255, 0.3)"
                      />
                      {/* Контур пятна */}
                      <ellipse
                        cx={effect.toX}
                        cy={effect.toY}
                        rx={8 + (progress - 0.4) * 35}
                        ry={5 + (progress - 0.4) * 18}
                        fill="none"
                        stroke="#8845C7"
                        strokeWidth={1}
                        opacity={0.5}
                      />
                    </g>
                  )}
                </g>
              );
            }

            // УЛЬТРАЗВУК — мини-пинг на модуле → кавитация НА ВРАГЕ
            if (effect.moduleType === 'ultrasonic') {
              return (
                <g key={effect.id}>
                  {/* ФАЗА 1: Источник — мини-пинги на модуле (progress 0–0.3) */}
                  {progress < 0.3 && (
                    <g opacity={1 - progress * 3}>
                      <circle
                        cx={effect.fromX}
                        cy={effect.fromY}
                        r={10 + progress * 30}
                        fill="none"
                        stroke="#24A899"
                        strokeWidth={1.5}
                      />
                      <circle
                        cx={effect.fromX}
                        cy={effect.fromY}
                        r={5 + progress * 15}
                        fill="none"
                        stroke="#24A899"
                        strokeWidth={1}
                        opacity={0.6}
                      />
                    </g>
                  )}

                  {/* ФАЗА 2: Импакт — кавитация НА ВРАГЕ (progress 0.2–1.0) */}
                  {progress >= 0.2 && (
                    <g opacity={Math.max(0, 1 - (progress - 0.2) * 1.1)}>
                      {/* Концентрические кольца ОТ ВРАГА */}
                      <circle
                        cx={effect.toX}
                        cy={effect.toY}
                        r={10 + (progress - 0.2) * 60}
                        fill="none"
                        stroke="#24A899"
                        strokeWidth={2}
                      />
                      <circle
                        cx={effect.toX}
                        cy={effect.toY}
                        r={5 + (progress - 0.2) * 40}
                        fill="none"
                        stroke="#24A899"
                        strokeWidth={1.5}
                        opacity={0.7}
                      />
                      <circle
                        cx={effect.toX}
                        cy={effect.toY}
                        r={3 + (progress - 0.2) * 20}
                        fill="none"
                        stroke="#24A899"
                        strokeWidth={1}
                        opacity={0.4}
                      />

                      {/* Пузырьки кавитации вокруг врага */}
                      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                        const dist = 15 + Math.sin(progress * Math.PI * 2 + i) * 8;
                        const size = 2 + (i % 3);
                        return (
                          <circle
                            key={i}
                            cx={effect.toX + Math.cos(angle * Math.PI / 180) * dist}
                            cy={effect.toY + Math.sin(angle * Math.PI / 180) * dist}
                            r={size * Math.max(0, 1 - (progress - 0.2))}
                            fill="#24A899"
                            opacity={0.6 * Math.max(0, 1 - (progress - 0.2))}
                          />
                        );
                      })}
                    </g>
                  )}
                </g>
              );
            }

            // ЛАЗЕР — тонкий луч с фокусом
            if (effect.moduleType === 'laser') {
              return (
                <g key={effect.id} opacity={1 - progress * 0.5}>
                  {/* Свечение луча */}
                  <line
                    x1={effect.fromX}
                    y1={effect.fromY}
                    x2={effect.toX}
                    y2={effect.toY}
                    stroke="#FF6666"
                    strokeWidth={5}
                    opacity={0.3}
                  />
                  {/* Основной луч */}
                  <line
                    x1={effect.fromX}
                    y1={effect.fromY}
                    x2={effect.toX}
                    y2={effect.toY}
                    stroke="#BF3636"
                    strokeWidth={2}
                  />
                  {/* Точка фокуса (на цели) */}
                  <circle cx={effect.toX} cy={effect.toY} r={8} fill="#FF4444" opacity={0.5} />
                  <circle cx={effect.toX} cy={effect.toY} r={4} fill="#FFFFFF" opacity={0.8} />
                </g>
              );
            }

            // ИНГИБИТОР — волновой импульс (пассивная защита)
            if (effect.moduleType === 'inhibitor') {
              return (
                <g key={effect.id} opacity={1 - progress * 0.8}>
                  {/* Волна защиты */}
                  <circle
                    cx={effect.fromX}
                    cy={effect.fromY}
                    r={20 + progress * 80}
                    fill="none"
                    stroke="#C7B56A"
                    strokeWidth={2}
                    strokeDasharray="6,4"
                  />
                  <circle
                    cx={effect.fromX}
                    cy={effect.fromY}
                    r={10 + progress * 50}
                    fill="none"
                    stroke="#C7B56A"
                    strokeWidth={1}
                    opacity={0.5}
                  />
                </g>
              );
            }

            // ДЕЭМУЛЬГАТОР — конусная струя осушения
            if (effect.moduleType === 'demulsifier') {
              const dx = effect.toX - effect.fromX;
              const dy = effect.toY - effect.fromY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * 180 / Math.PI;

              return (
                <g key={effect.id} transform={`translate(${effect.fromX}, ${effect.fromY}) rotate(${angle})`}>
                  {/* Конусная струя */}
                  <path
                    d={`M 0,0 L ${dist * progress},-12 L ${dist * progress + 15},0 L ${dist * progress},12 Z`}
                    fill="rgba(212, 165, 116, 0.4)"
                    opacity={1 - progress * 0.6}
                  />
                  {/* Линии внутри конуса */}
                  <line x1={0} y1={0} x2={dist * progress * 0.9} y2={-6} stroke="#d4a574" strokeWidth={1} opacity={0.7 - progress * 0.5} />
                  <line x1={0} y1={0} x2={dist * progress} y2={0} stroke="#d4a574" strokeWidth={1.5} opacity={0.8 - progress * 0.5} />
                  <line x1={0} y1={0} x2={dist * progress * 0.9} y2={6} stroke="#d4a574" strokeWidth={1} opacity={0.7 - progress * 0.5} />
                  {/* Частицы испарения */}
                  <circle cx={dist * 0.5} cy={-4} r={2} fill="#d4a574" opacity={(0.6 - progress) * Math.max(0, 1 - progress * 2)} />
                  <circle cx={dist * 0.6} cy={3} r={1.5} fill="#d4a574" opacity={(0.5 - progress) * Math.max(0, 1 - progress * 2)} />
                  <circle cx={dist * 0.7} cy={-7} r={1} fill="#d4a574" opacity={(0.4 - progress) * Math.max(0, 1 - progress * 2)} />
                </g>
              );
            }

            // АНАЛИЗАТОР — упрощённая анимация "пинг + метка" (2 фазы)
            if (effect.moduleType === 'analyzer') {
              const pingDuration = 0.14; // Фаза 1: быстрый пинг

              // Получаем ТЕКУЩУЮ позицию врага по targetId (прицел следует за ним)
              let targetX = effect.toX;
              let targetY = effect.toY;
              if (effect.targetId) {
                const targetEnemy = enemies.find(e => e.id === effect.targetId);
                if (targetEnemy) {
                  const targetConfig = ENEMIES[targetEnemy.type];
                  const livePos = getPositionOnPath(enemyPath, targetEnemy.progress, targetConfig.oscillation);
                  targetX = livePos.x;
                  targetY = livePos.y;
                }
              }

              return (
                <g key={effect.id}>
                  {/* Фаза 1: Пинг — линия к цели + вспышка */}
                  {progress < pingDuration && (
                    <>
                      <line
                        x1={effect.fromX}
                        y1={effect.fromY}
                        x2={targetX}
                        y2={targetY}
                        stroke="#e0e8f0"
                        strokeWidth={2}
                        opacity={0.8 * (1 - progress / pingDuration)}
                        strokeLinecap="round"
                      />
                      {/* Вспышка на враге */}
                      <circle
                        cx={targetX}
                        cy={targetY}
                        r={2 + (progress / pingDuration) * 3}
                        fill="#e0e8f0"
                        opacity={0.9 * (1 - progress / pingDuration)}
                      />
                    </>
                  )}

                  {/* Фаза 2: Прицел (метка) — слегка "дышит" */}
                  {progress >= pingDuration && (
                    <g
                      transform={`translate(${Math.round(targetX)}, ${Math.round(targetY)})`}
                      opacity={0.75 + Math.sin(progress * 10) * 0.1}
                    >
                      {/* Круг прицела */}
                      <circle cx={0} cy={0} r={10} fill="none" stroke="#e0e8f0" strokeWidth={1.5} />
                      {/* 4 риски по сторонам */}
                      <line x1={0} y1={-15} x2={0} y2={-11} stroke="#e0e8f0" strokeWidth={2} strokeLinecap="round" />
                      <line x1={0} y1={11} x2={0} y2={15} stroke="#e0e8f0" strokeWidth={2} strokeLinecap="round" />
                      <line x1={-15} y1={0} x2={-11} y2={0} stroke="#e0e8f0" strokeWidth={2} strokeLinecap="round" />
                      <line x1={11} y1={0} x2={15} y2={0} stroke="#e0e8f0" strokeWidth={2} strokeLinecap="round" />
                      {/* Точка в центре */}
                      <circle cx={0} cy={0} r={2} fill="#e0e8f0" />
                    </g>
                  )}
                </g>
              );
            }

            // ЦЕНТРИФУГА — ударный импульс
            if (effect.moduleType === 'centrifuge') {
              const dx = effect.toX - effect.fromX;
              const dy = effect.toY - effect.fromY;
              const pushAngle = Math.atan2(dy, dx) + Math.PI; // назад от модуля
              const enemyRadius = 15;

              return (
                <g key={effect.id}>
                  {/* Ударное кольцо расширяется */}
                  <circle
                    cx={effect.toX}
                    cy={effect.toY}
                    r={enemyRadius * 1.1 + progress * enemyRadius * 0.6}
                    fill="none"
                    stroke="#FF9F43"
                    strokeWidth={3}
                    opacity={0.7 - progress * 0.7}
                  />
                  {/* Линии движения назад */}
                  {[-0.25, 0, 0.25].map((offset, i) => {
                    const lineAngle = pushAngle + offset;
                    const len = 12 + (1 - i % 2) * 4;
                    const dist = enemyRadius + 8 + progress * 15;
                    return (
                      <line
                        key={i}
                        x1={effect.toX + Math.cos(lineAngle) * dist}
                        y1={effect.toY + Math.sin(lineAngle) * dist}
                        x2={effect.toX + Math.cos(lineAngle) * (dist + len)}
                        y2={effect.toY + Math.sin(lineAngle) * (dist + len)}
                        stroke="#FF9F43"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        opacity={0.6 - progress * 0.5}
                      />
                    );
                  })}
                  {/* Микро-частицы вдоль направления отката */}
                  {[0, 1, 2, 3, 4].map((n) => {
                    // Частицы выстраиваются вдоль линий движения, между кольцом и линиями
                    const spread = [-0.2, 0.1, 0, -0.1, 0.2][n];
                    const a = pushAngle + spread;
                    const baseDist = enemyRadius + 3 + n * 3;
                    const r = baseDist + progress * 12;
                    return (
                      <circle
                        key={n}
                        cx={effect.toX + Math.cos(a) * r}
                        cy={effect.toY + Math.sin(a) * r}
                        r={1.5 + (n % 2) * 0.5}
                        fill="#FF9F43"
                        opacity={0.5 - progress * 0.45}
                      />
                    );
                  })}
                </g>
              );
            }

            // ЭЛЕКТРОСТАТ — цепная молния
            if (effect.moduleType === 'electrostatic') {
              // Генерируем зигзаг-путь для молнии
              const generateLightning = (x1: number, y1: number, x2: number, y2: number, segments = 6) => {
                const points: string[] = [];
                const dx = (x2 - x1) / segments;
                const dy = (y2 - y1) / segments;

                points.push(`M${x1},${y1}`);
                for (let i = 1; i < segments; i++) {
                  const offsetX = (Math.random() - 0.5) * 12;
                  const offsetY = (Math.random() - 0.5) * 12;
                  points.push(`L${x1 + dx * i + offsetX},${y1 + dy * i + offsetY}`);
                }
                points.push(`L${x2},${y2}`);
                return points.join(' ');
              };

              return (
                <g key={effect.id} opacity={1 - progress * 0.6}>
                  {/* Свечение */}
                  <path
                    d={generateLightning(effect.fromX, effect.fromY, effect.toX, effect.toY, 5)}
                    fill="none"
                    stroke="#fde047"
                    strokeWidth={6}
                    opacity={0.3}
                    style={{ filter: 'blur(3px)' }}
                  />
                  {/* Основная молния */}
                  <path
                    d={generateLightning(effect.fromX, effect.fromY, effect.toX, effect.toY, 6)}
                    fill="none"
                    stroke="#fde047"
                    strokeWidth={3}
                    opacity={0.9}
                  />
                  {/* Ядро молнии */}
                  <path
                    d={generateLightning(effect.fromX, effect.fromY, effect.toX, effect.toY, 4)}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    opacity={0.8}
                  />
                  {/* Искра на цели */}
                  <circle cx={effect.toX} cy={effect.toY} r={8 - progress * 5} fill="#fde047" opacity={0.7} />
                  <circle cx={effect.toX} cy={effect.toY} r={4} fill="#ffffff" opacity={0.9 - progress * 0.5} />
                </g>
              );
            }

            // БАРЬЕР — теперь рендерится через activeBarriers, здесь только вспышка активации
            if (effect.moduleType === 'barrier') {
              // Быстрая вспышка активации (0.3 сек)
              const flashDuration = 300;
              const flashProgress = Math.min(1, (performance.now() - effect.startTime) / flashDuration);
              if (flashProgress >= 1) return null;

              return (
                <g key={effect.id} transform={`translate(${effect.fromX}, ${effect.fromY})`} opacity={1 - flashProgress}>
                  {/* Круговая вспышка активации */}
                  <circle
                    r={30 + flashProgress * 40}
                    fill="none"
                    stroke="#FFD166"
                    strokeWidth={3 - flashProgress * 2}
                    opacity={0.8}
                  />
                  <circle
                    r={15 + flashProgress * 25}
                    fill="#FFD166"
                    opacity={0.3 - flashProgress * 0.3}
                  />
                </g>
              );
            }

            return null;
          })}

          {/* ═══════════════════════════════════════════════════════════════
              АКТИВНЫЕ БАРЬЕРЫ (МЕМБРАНЫ)
              ═══════════════════════════════════════════════════════════════ */}
          {activeBarriers.map(barrier => {
            const progress = 1 - barrier.duration / barrier.maxDuration;
            const fadeOut = progress > 0.7 ? (1 - progress) / 0.3 : 1;

            // Анимация появления (первые 0.15 сек = 6% от 2.5 сек)
            const materializeProgress = Math.min(1, progress / 0.06);

            // Длина мембраны (внутри канала, не пересекает бортики)
            const membraneLength = (conveyorWidth - 14) * materializeProgress;

            // "Дыхание" мембраны (после появления)
            const breathe = materializeProgress >= 1 ? Math.sin(progress * Math.PI * 8) * 1.5 : 0;

            // Цвета: серо-голубая плёнка, красноватая при боссе
            const membraneColor = barrier.bossPresure ? '#D4A0A0' : '#8BA4B8';
            const membraneOpacity = 0.6 + breathe * 0.05;
            const glowColor = barrier.bossPresure ? 'rgba(255, 107, 107, 0.25)' : 'rgba(139, 164, 184, 0.3)';
            const flowColor = barrier.bossPresure ? '#E0B0B0' : '#A0B8C8';

            // Деформация и прогиб при давлении босса
            const deform = barrier.bossPresure ? Math.sin(progress * Math.PI * 12) * 4 : 0;
            const bulge = barrier.bossPresure ? 6 + Math.sin(progress * Math.PI * 6) * 2 : 0;

            // Координаты начала и конца линии барьера
            // isHorizontal = true → барьер горизонтальный (канал вертикальный)
            // isHorizontal = false → барьер вертикальный (канал горизонтальный)
            const isH = barrier.isHorizontal;

            // Для горизонтального: линия по X, смещение по Y
            // Для вертикального: линия по Y, смещение по X
            const lineStart = {
              x: isH ? barrier.x - membraneLength / 2 : barrier.x + deform + bulge,
              y: isH ? barrier.y + deform + bulge : barrier.y - membraneLength / 2
            };
            const lineEnd = {
              x: isH ? barrier.x + membraneLength / 2 : barrier.x + deform + bulge,
              y: isH ? barrier.y + deform + bulge : barrier.y + membraneLength / 2
            };

            // Кромки-фиксаторы (золотые)
            const fixtureColor = barrier.bossPresure ? '#FF9F43' : '#FFD166';
            const fixture1 = { x: lineStart.x, y: lineStart.y };
            const fixture2 = { x: lineEnd.x, y: lineEnd.y };

            return (
              <g key={barrier.id} opacity={fadeOut}>
                {/* Мягкий glow по контуру */}
                <line
                  x1={lineStart.x} y1={lineStart.y}
                  x2={lineEnd.x} y2={lineEnd.y}
                  stroke={glowColor}
                  strokeWidth={10 + breathe * 1}
                  strokeLinecap="butt"
                />

                {/* Основная плёнка (серо-голубая) */}
                <line
                  x1={lineStart.x} y1={lineStart.y}
                  x2={lineEnd.x} y2={lineEnd.y}
                  stroke={membraneColor}
                  strokeWidth={8}
                  strokeLinecap="butt"
                  opacity={membraneOpacity}
                />

                {/* Центральная линия плёнки */}
                <line
                  x1={lineStart.x} y1={lineStart.y}
                  x2={lineEnd.x} y2={lineEnd.y}
                  stroke={membraneColor}
                  strokeWidth={3}
                  strokeLinecap="butt"
                  opacity={0.9}
                />

                {/* Линии течения внутри плёнки — симметрично по длине */}
                {[0.2, 0.4, 0.6, 0.8].map((pos, i) => {
                  const fx = isH
                    ? lineStart.x + membraneLength * pos
                    : barrier.x + deform + bulge;
                  const fy = isH
                    ? barrier.y + deform + bulge
                    : lineStart.y + membraneLength * pos;
                  return (
                    <line
                      key={i}
                      x1={isH ? fx : fx - 3}
                      y1={isH ? fy - 3 : fy}
                      x2={isH ? fx : fx + 3}
                      y2={isH ? fy + 3 : fy}
                      stroke={flowColor}
                      strokeWidth={1.5}
                      opacity={0.4}
                      strokeLinecap="round"
                    />
                  );
                })}

                {/* Индикатор давления босса: shear bands */}
                {barrier.bossPresure && (
                  <g>
                    {[0.25, 0.5, 0.75].map((pos, i) => {
                      const shearPos = pos * membraneLength;
                      return (
                        <line
                          key={i}
                          x1={isH ? lineStart.x + shearPos - 4 : barrier.x + deform - 4}
                          y1={isH ? barrier.y + deform - 4 : lineStart.y + shearPos - 4}
                          x2={isH ? lineStart.x + shearPos + bulge + 8 : barrier.x + deform + bulge + 8}
                          y2={isH ? barrier.y + deform + bulge + 4 : lineStart.y + shearPos + 4}
                          stroke="#FFEEEE"
                          strokeWidth={1.5}
                          opacity={0.5 + Math.sin(progress * Math.PI * 15 + i) * 0.3}
                        />
                      );
                    })}
                  </g>
                )}

                {/* Скан-линия при появлении */}
                {materializeProgress < 1 && (
                  <line
                    x1={isH ? lineStart.x + membraneLength * materializeProgress - 5 : barrier.x + deform - 5}
                    y1={isH ? barrier.y + deform : lineStart.y + membraneLength * materializeProgress}
                    x2={isH ? lineStart.x + membraneLength * materializeProgress + 5 : barrier.x + deform + 5}
                    y2={isH ? barrier.y + deform : lineStart.y + membraneLength * materializeProgress}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    opacity={0.8}
                  />
                )}

                {/* Кромки-фиксаторы */}
                <rect
                  x={fixture1.x - (isH ? 3 : 6)}
                  y={fixture1.y - (isH ? 6 : 3)}
                  width={isH ? 6 : 12}
                  height={isH ? 12 : 6}
                  rx={2}
                  fill={fixtureColor}
                  opacity={materializeProgress}
                />
                <rect
                  x={fixture2.x - (isH ? 3 : 6)}
                  y={fixture2.y - (isH ? 6 : 3)}
                  width={isH ? 6 : 12}
                  height={isH ? 12 : 6}
                  rx={2}
                  fill={fixtureColor}
                  opacity={materializeProgress}
                />
              </g>
            );
          })}

          {/* ═══════════════════════════════════════════════════════════════
              ЭФФЕКТЫ СМЕРТИ ВРАГОВ
              ═══════════════════════════════════════════════════════════════ */}
          {deathEffects.map(effect => {
            const now = performance.now();
            const elapsed = now - effect.startTime;
            const progress = Math.min(1, elapsed / effect.duration);

            // Easing: ease-out (быстро в начале, замедляется к концу)
            const eased = 1 - Math.pow(1 - progress, 2);

            // Параметры из эффекта
            const { particleCount, particleSpeed, ringCount } = effect;
            const particles = [];

            for (let i = 0; i < particleCount; i++) {
              // Псевдослучайные значения на основе индекса
              const seed = i * 137.5;
              const angleOffset = (Math.sin(seed) * 0.5) * Math.PI / 3;  // ±30°
              const speedVariation = particleSpeed * (0.8 + (Math.cos(seed) * 0.5 + 0.5) * 0.4);  // ±20%
              const particleSize = 2 + (Math.sin(seed * 2) * 0.5 + 0.5) * 2;  // 2-4px

              const angle = effect.direction + angleOffset;
              const distance = speedVariation * eased;

              particles.push({
                x: effect.x + Math.cos(angle) * distance,
                y: effect.y + Math.sin(angle) * distance,
                r: particleSize * (1 - eased * 0.5),  // уменьшается
                opacity: 0.6 * (1 - eased),
              });
            }

            return (
              <g key={effect.id}>
                {/* Кольца рассеивания */}
                {Array.from({ length: ringCount }).map((_, ringIndex) => (
                  <circle
                    key={`ring-${ringIndex}`}
                    cx={effect.x}
                    cy={effect.y}
                    r={effect.size * (1 + eased * (0.5 + ringIndex * 0.3))}
                    fill="none"
                    stroke={effect.color}
                    strokeWidth={1.5 - ringIndex * 0.4}
                    opacity={0.3 * (1 - eased) * (1 - ringIndex * 0.3)}
                  />
                ))}

                {/* Частицы */}
                {particles.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={p.r}
                    fill={effect.color}
                    opacity={p.opacity}
                  />
                ))}
              </g>
            );
          })}
        </svg>

        {/* Магазин — внутри контейнера поля */}
        <div
          className="absolute flex justify-center gap-4"
          style={{
            left: 20,
            right: 20,
            top: totalHeight + 15,
          }}
        >
          {shop.map((moduleType, index) => {
            const config = MODULES[moduleType];
            const canAfford = gold >= config.basePrice;
            const isDraggingThis = dragState?.type === 'shop' && dragState.shopIndex === index;

            return (
              <ModuleCard
                key={index}
                type={moduleType}
                compact={true}
                canAfford={canAfford}
                isDragging={isDraggingThis}
                onMouseDown={(e) => handleShopDragStart(e, index)}
                onTouchStart={(e) => handleShopDragStart(e, index)}
              />
            );
          })}
        </div>

        {/* Game Over */}
        {gamePhase === 'defeat' && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-3xl"
            style={{ zIndex: 100 }}
          >
            <div className="text-center">
              <h2 className="text-4xl font-bold text-red-500 mb-4">💀 ПОРАЖЕНИЕ</h2>
              <p className="text-xl text-gray-300 mb-6">Волна: {wave}</p>
              <button
                onClick={() => {
                  setWave(1);
                  setLives(INITIAL_LIVES);
                  setGold(INITIAL_GOLD);
                  setModules([]);
                  setEnemies([]);
                  setSpawnQueue([]);
                  activeBarriersRef.current = [];
                  setActiveBarriers([]);
                  // Магазин: тестовая колода → меню колода → fallback
                  if (testDeck) {
                    setShop([...testDeck]);
                  } else if (menuDeck) {
                    setShop([...menuDeck]);
                  } else {
                    setShop(FALLBACK_SHOP);
                  }
                  setGameStarted(false);
                  setNextWaveCountdown(0);
                  spawnedIdsRef.current.clear();
                  waveEndingRef.current = false;
                  setGamePhase('preparing');
                }}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors"
              >
                Начать заново
              </button>
            </div>
          </div>
        )}

        {/* Панель подготовки — на горизонтальном участке канала */}
        {gamePhase === 'preparing' && gameStarted && nextWaveCountdown > 0 && (
          <PrepPhase
            prepTime={nextWaveCountdown}
            nextWave={wave}
            onStart={startWave}
            onUIClick={playUIClick}
            totalWidth={totalWidth}
            conveyorWidth={conveyorWidth}
          />
        )}

        {/* Оверлей "ВОЛНА N" — внутри поля, по центру сетки карточек */}
        {gamePhase === 'intro_wave' && (
          <WaveOverlay
            wave={wave}
            mode={gameMode}
            labStandId={labStandId.current}
            onComplete={startWaveActual}
            gridX={gridStartX}
            gridY={gridStartY}
            gridWidth={gridWidth}
            gridHeight={gridHeight}
          />
        )}
      </div>

      {/* Перетаскиваемый модуль */}
      {dragState && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: dragState.currentX - cellSize / 2,
            top: dragState.currentY - cellSize / 2,
            width: cellSize,
            height: cellSize,
          }}
        >
          <FieldTile
            type={dragState.moduleType}
            level={dragState.type === 'field'
              ? modules.find(m => m.id === dragState.moduleId)?.level || 1
              : 1
            }
            isDragging
            size={cellSize}
          />
        </div>
      )}

      {/* Подсказка */}
      <p className="text-gray-500 text-sm text-center max-w-lg mt-2">
        Перетащи модуль из магазина на поле. Два одинаковых модуля одного уровня можно объединить.
        <span className="text-gray-600 ml-2">(D — dev-панель)</span>
      </p>

      {/* ═══════════════════════════════════════════════════════════════
          DEV-ПАНЕЛЬ
          ═══════════════════════════════════════════════════════════════ */}
      {devMode && (
        <div
          className="fixed right-4 top-4 bg-black/90 border border-cyan-500/30 rounded-xl p-4 z-[200] max-h-[90vh] overflow-y-auto"
          style={{ width: 320 }}
        >
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-cyan-400 font-bold text-lg flex items-center gap-2">
              🔧 DEV MODE
            </h3>
            <button
              onClick={() => setDevMode(false)}
              className="text-gray-500 hover:text-white text-xl leading-none"
            >
              ✕
            </button>
          </div>

          {/* ═══════════════ МОДУЛИ ═══════════════ */}
          <div className="mb-4">
            <h4 className="text-gray-400 text-sm mb-2 uppercase tracking-wider">Модули</h4>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(MODULES) as ModuleType[]).map(type => {
                const isSelected = selectedDevModule === type;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedDevModule(isSelected ? null : type)}
                    className={`
                      p-2 rounded-lg text-xs font-bold transition-all
                      ${isSelected
                        ? 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-300'
                        : 'bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white'
                      }
                    `}
                    title={MODULES[type].name}
                  >
                    {DEV_MODULE_CODES_RU[type]}
                  </button>
                );
              })}
            </div>
            {selectedDevModule && (
              <p className="text-cyan-300 text-xs mt-2">
                Выбран: <span className="font-bold">{MODULES[selectedDevModule].name}</span>
                <br />
                <span className="text-gray-500">Кликни на пустую ячейку чтобы поставить</span>
              </p>
            )}
          </div>

          {/* ═══════════════ ВРАГИ ═══════════════ */}
          <div className="mb-4">
            <h4 className="text-gray-400 text-sm mb-2 uppercase tracking-wider">Враги</h4>
            <div className="grid grid-cols-3 gap-2">
              {(['dust', 'abrasive', 'heat', 'metal', 'corrosion', 'moisture', 'static', 'boss_wear', 'boss_pitting'] as EnemyType[]).map(type => {
                const config = ENEMIES[type];
                const icons: Record<string, string> = {
                  dust: '💨',
                  abrasive: '🪨',
                  heat: '🔥',
                  metal: '⚙️',
                  corrosion: '🦠',
                  moisture: '💧',
                  static: '⚡',
                  boss_wear: '👑',
                  boss_pitting: '💀',
                };
                return (
                  <button
                    key={type}
                    onClick={(e) => {
                      const count = e.shiftKey ? 5 : e.ctrlKey ? 10 : 1;
                      devSpawnEnemy(type, count);
                    }}
                    className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:bg-red-900/50 hover:border-red-500/50 hover:text-white transition-all text-center"
                    title={`${config.name} (Shift=5, Ctrl=10)`}
                  >
                    <div className="text-lg">{icons[type]}</div>
                    <div className="text-[10px] truncate">{config.name}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-gray-500 text-xs mt-2">
              Shift+клик = 5 врагов, Ctrl+клик = 10 врагов
            </p>
          </div>

          {/* ═══════════════ ИНСТРУМЕНТЫ ═══════════════ */}
          <div className="mb-2">
            <h4 className="text-gray-400 text-sm mb-2 uppercase tracking-wider">Инструменты</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setGold(g => g + 100)}
                className="p-2 rounded-lg bg-yellow-900/30 border border-yellow-600/30 text-yellow-400 hover:bg-yellow-800/50 transition-all text-sm"
              >
                💰 +100
              </button>
              <button
                onClick={() => setGold(g => g + 500)}
                className="p-2 rounded-lg bg-yellow-900/30 border border-yellow-600/30 text-yellow-400 hover:bg-yellow-800/50 transition-all text-sm"
              >
                💰 +500
              </button>
              <button
                onClick={() => setLives(l => l + 5)}
                className="p-2 rounded-lg bg-red-900/30 border border-red-600/30 text-red-400 hover:bg-red-800/50 transition-all text-sm"
              >
                ❤️ +5 HP
              </button>
              <button
                onClick={() => {
                  setEnemies([]);
                  enemiesRef.current = [];
                }}
                className="p-2 rounded-lg bg-purple-900/30 border border-purple-600/30 text-purple-400 hover:bg-purple-800/50 transition-all text-sm"
              >
                ☠️ Убить всех
              </button>
              <button
                onClick={() => setModules([])}
                className="p-2 rounded-lg bg-gray-800 border border-gray-600 text-gray-400 hover:bg-gray-700 transition-all text-sm"
              >
                🗑️ Очистить поле
              </button>
              <button
                onClick={() => {
                  if (isPaused) {
                    setShowPauseModal(false);
                    setIsPaused(false);
                  } else {
                    setIsPaused(true);
                    setShowPauseModal(true);
                  }
                }}
                className={`p-2 rounded-lg border transition-all text-sm ${
                  isPaused
                    ? 'bg-green-900/30 border-green-600/30 text-green-400'
                    : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {isPaused ? '▶️ Продолжить' : '⏸️ Пауза'}
              </button>
            </div>
          </div>

          {/* Скорость игры */}
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Скорость игры: {gameSpeed}x</span>
              <div className="flex gap-1">
                {[1, 2, 5, 10].map(speed => (
                  <button
                    key={speed}
                    onClick={() => setGameSpeed(speed)}
                    className={`px-2 py-1 rounded text-xs ${
                      gameSpeed === speed
                        ? 'bg-cyan-500/30 text-cyan-300'
                        : 'bg-gray-800 text-gray-500 hover:text-white'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Кнопка активации DEV-панели */}
      {!devMode && (
        <button
          onClick={() => setDevMode(true)}
          className="fixed right-4 bottom-4 w-10 h-10 rounded-full bg-gray-800/50 border border-gray-700 text-gray-500 hover:text-cyan-400 hover:border-cyan-500/50 transition-all z-50 flex items-center justify-center"
          title="Dev Mode (D)"
        >
          🔧
        </button>
      )}

      {/* Модальное окно выхода */}
      {showExitModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)' }}
          onClick={handleCloseExitModal}
        >
          <div
            className="relative"
            style={{
              width: 'min(320px, 90vw)',
              maxWidth: 360,
              background: '#161b22',
              border: '1px solid #30363d',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Иконка */}
            <div className="text-center mb-4">
              <span className="text-5xl">⚠️</span>
            </div>

            {/* Заголовок */}
            <h2
              className="text-center mb-3"
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#e6edf3',
              }}
            >
              Покинуть стенд?
            </h2>

            {/* Описание */}
            <p
              className="text-center mb-6"
              style={{
                fontSize: 14,
                color: '#8b949e',
                lineHeight: 1.5,
              }}
            >
              Прогресс текущей попытки будет потерян. Выйти в меню?
            </p>

            {/* Кнопки */}
            <div className="flex gap-3">
              <button
                onClick={handleCloseExitModal}
                className="flex-1 h-12 rounded-lg font-semibold transition-all"
                style={{
                  background: 'transparent',
                  border: '1px solid #30363d',
                  color: '#8b949e',
                  fontSize: 15,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#22d3ee';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#30363d';
                }}
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 h-12 rounded-lg font-semibold transition-all hover:opacity-90"
                style={{
                  background: '#da3633',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: 15,
                }}
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause модалка */}
      <PauseModal
        isOpen={showPauseModal}
        onResume={handlePauseResume}
        onMainMenu={handlePauseMainMenu}
        onHandbook={() => {
          setShowPauseModal(false);
          setShowHandbookFromPause(true);
        }}
      />

      {/* Справочник из паузы */}
      {showHandbookFromPause && (
        <Handbook
          onClose={() => {
            setShowHandbookFromPause(false);
            setShowPauseModal(true);
          }}
          closeLabel="← Назад"
        />
      )}

      {/* Game Over модалка */}
      <GameOverModal
        isOpen={showGameOver}
        wave={wave}
        time={gameOverTime}
        kills={totalKills}
        leaks={INITIAL_LIVES}
        gold={totalGoldEarned}
        nickname={playerNickname}
        onNicknameChange={(value) => {
          setPlayerNicknameState(value);
          setPlayerNickname(value);
        }}
        onRestart={handleGameOverRestart}
        onMainMenu={handleGameOverMainMenu}
        onShowLeaderboard={() => setShowLeaderboard(true)}
      />

      {/* Лидерборд модалка */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        currentDeck={testDeck || menuDeck || undefined}
        highlightPlayerId={playerId}
      />

    </div>
  );
}
