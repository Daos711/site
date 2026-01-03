'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ModuleType } from '../types';
import { ModuleDeckIcons, ModuleDeckIconsLarge } from './ModuleDeckIcons';
import {
  LeaderboardEntry,
  TribolabRun,
  getDailyLeaderboard,
  getRandomLeaderboard,
  getRandomLeaderboardByDeck,
  getPlayerRuns,
  getDailyDeck,
  formatTimeMs,
  generateDeckKey,
  getOrCreatePlayerId,
} from '../supabase';

type TabType = 'daily' | 'random' | 'my_records';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDeck?: ModuleType[];
  highlightPlayerId?: string;
}

export function LeaderboardModal({
  isOpen,
  onClose,
  currentDeck,
  highlightPlayerId,
}: LeaderboardModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [dailyEntries, setDailyEntries] = useState<LeaderboardEntry[]>([]);
  const [randomEntries, setRandomEntries] = useState<LeaderboardEntry[]>([]);
  const [myRuns, setMyRuns] = useState<TribolabRun[]>([]);
  const [dailyDeck, setDailyDeck] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterByDeck, setFilterByDeck] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState('');

  const playerId = typeof window !== 'undefined' ? getOrCreatePlayerId() : '';
  const effectiveHighlightId = highlightPlayerId || playerId;

  // Таймер до сброса Daily
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeUntilReset(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Загрузка ВСЕХ данных при открытии (параллельно)
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      // Загружаем всё параллельно
      const [dailyData, dailyDeckData, randomData, myData] = await Promise.all([
        getDailyLeaderboard(),
        getDailyDeck(),
        getRandomLeaderboard(),
        playerId ? getPlayerRuns(playerId) : Promise.resolve([]),
      ]);

      setDailyEntries(dailyData);
      setDailyDeck(dailyDeckData);
      setRandomEntries(randomData);
      setMyRuns(myData);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  // Загрузка по набору (только для фильтра Random)
  const loadByDeck = useCallback(async () => {
    if (!currentDeck) return;
    setLoading(true);
    try {
      const deckKey = generateDeckKey(currentDeck);
      const entries = await getRandomLeaderboardByDeck(deckKey);
      setRandomEntries(entries);
    } finally {
      setLoading(false);
    }
  }, [currentDeck]);

  // При открытии — загружаем всё
  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen, loadAllData]);

  // При включении фильтра по набору — догружаем
  useEffect(() => {
    if (isOpen && filterByDeck && currentDeck) {
      loadByDeck();
    } else if (isOpen && !filterByDeck && activeTab === 'random') {
      // Если фильтр выключили — показываем общий Random (уже загружен)
    }
  }, [isOpen, filterByDeck, currentDeck, activeTab, loadByDeck]);

  if (!isOpen) return null;

  const today = new Date().toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 700,
          maxHeight: '90vh',
          margin: 16,
          background: 'linear-gradient(180deg, #1A2332 0%, #0D1219 100%)',
          border: '2px solid #32D6FF',
          borderRadius: 16,
          boxShadow: '0 0 40px rgba(50, 214, 255, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #2D3748',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: '#32D6FF',
              textShadow: '0 0 10px rgba(50, 214, 255, 0.5)',
            }}
          >
            ЖУРНАЛ ИСПЫТАНИЙ
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              background: 'transparent',
              border: '1px solid #4A5568',
              borderRadius: 6,
              color: '#9CA3AF',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              paddingBottom: 2,
            }}
          >
            ×
          </button>
        </div>

        {/* Вкладки */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #2D3748',
            padding: '0 16px',
          }}
        >
          {[
            { id: 'daily' as TabType, label: 'Daily' },
            { id: 'random' as TabType, label: 'Random' },
            { id: 'my_records' as TabType, label: 'Мои рекорды' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setFilterByDeck(false);
              }}
              style={{
                padding: '12px 20px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #32D6FF' : '2px solid transparent',
                color: activeTab === tab.id ? '#32D6FF' : '#9CA3AF',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Контент */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 16,
          }}
        >
          {loading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 40,
                color: '#9CA3AF',
              }}
            >
              Загрузка...
            </div>
          ) : (
            <>
              {activeTab === 'daily' && (
                <DailyTab
                  entries={dailyEntries}
                  dailyDeck={dailyDeck}
                  today={today}
                  timeUntilReset={timeUntilReset}
                  highlightPlayerId={effectiveHighlightId}
                />
              )}
              {activeTab === 'random' && (
                <RandomTab
                  entries={randomEntries}
                  highlightPlayerId={effectiveHighlightId}
                  filterByDeck={filterByDeck}
                  setFilterByDeck={setFilterByDeck}
                  currentDeck={currentDeck}
                />
              )}
              {activeTab === 'my_records' && (
                <MyRecordsTab runs={myRuns} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== ВКЛАДКА DAILY ====================

function DailyTab({
  entries,
  dailyDeck,
  today,
  timeUntilReset,
  highlightPlayerId,
}: {
  entries: LeaderboardEntry[];
  dailyDeck: string[] | null;
  today: string;
  timeUntilReset: string;
  highlightPlayerId: string;
}) {
  return (
    <div>
      {/* Заголовок с колодой дня */}
      <div
        style={{
          marginBottom: 16,
          padding: 12,
          background: 'rgba(50, 214, 255, 0.1)',
          border: '1px solid rgba(50, 214, 255, 0.3)',
          borderRadius: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: dailyDeck ? 8 : 0,
          }}
        >
          <span style={{ color: '#C5D1DE', fontSize: 14, lineHeight: 1.4 }}>
            Ежедневное испытание — {today}
          </span>
          <span style={{ color: '#F59E0B', fontSize: 13, lineHeight: 1.4 }}>
            До смены: {timeUntilReset}
          </span>
        </div>
        {dailyDeck && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#9CA3AF', fontSize: 12 }}>Набор дня:</span>
            <ModuleDeckIconsLarge modules={dailyDeck} />
          </div>
        )}
      </div>

      {/* Таблица */}
      <LeaderboardTable
        entries={entries}
        highlightPlayerId={highlightPlayerId}
        showDeck={true}
      />
    </div>
  );
}

// ==================== ВКЛАДКА RANDOM ====================

function RandomTab({
  entries,
  highlightPlayerId,
  filterByDeck,
  setFilterByDeck,
  currentDeck,
}: {
  entries: LeaderboardEntry[];
  highlightPlayerId: string;
  filterByDeck: boolean;
  setFilterByDeck: (v: boolean) => void;
  currentDeck?: ModuleType[];
}) {
  return (
    <div>
      {/* Фильтр */}
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span style={{ color: '#9CA3AF', fontSize: 13 }}>Фильтр:</span>
        <button
          onClick={() => setFilterByDeck(false)}
          style={{
            padding: '6px 12px',
            background: !filterByDeck ? 'rgba(50, 214, 255, 0.2)' : 'transparent',
            border: `1px solid ${!filterByDeck ? '#32D6FF' : '#4A5568'}`,
            borderRadius: 6,
            color: !filterByDeck ? '#32D6FF' : '#9CA3AF',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Все колоды
        </button>
        {currentDeck && (
          <button
            onClick={() => setFilterByDeck(true)}
            style={{
              padding: '6px 12px',
              background: filterByDeck ? 'rgba(50, 214, 255, 0.2)' : 'transparent',
              border: `1px solid ${filterByDeck ? '#32D6FF' : '#4A5568'}`,
              borderRadius: 6,
              color: filterByDeck ? '#32D6FF' : '#9CA3AF',
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>Мой набор</span>
            <ModuleDeckIcons modules={currentDeck} size={14} gap={2} showTooltip={false} />
          </button>
        )}
      </div>

      {/* Заголовок фильтрованной колоды */}
      {filterByDeck && currentDeck && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: 'rgba(50, 214, 255, 0.1)',
            border: '1px solid rgba(50, 214, 255, 0.3)',
            borderRadius: 8,
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: '#C5D1DE', fontSize: 14 }}>Результаты для колоды:</span>
          </div>
          <ModuleDeckIconsLarge modules={currentDeck} showNames />
          <div style={{ marginTop: 8, color: '#9CA3AF', fontSize: 12 }}>
            Рекордов: {entries.length} игроков
          </div>
        </div>
      )}

      {/* Таблица */}
      <LeaderboardTable
        entries={entries}
        highlightPlayerId={highlightPlayerId}
        showDeck={!filterByDeck}
      />
    </div>
  );
}

// ==================== ВКЛАДКА МОИ РЕКОРДЫ ====================

type SortField = 'date' | 'kills' | 'wave';
type SortOrder = 'asc' | 'desc';

function MyRecordsTab({ runs }: { runs: TribolabRun[] }) {
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const PAGE_SIZE = 10;

  if (runs.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: 40,
          color: '#9CA3AF',
        }}
      >
        <p>У вас пока нет записанных забегов.</p>
        <p style={{ fontSize: 13, marginTop: 8 }}>
          Пройдите испытание, чтобы ваш результат появился здесь!
        </p>
      </div>
    );
  }

  // Сортировка
  const sortedRuns = [...runs].sort((a, b) => {
    let diff = 0;
    if (sortField === 'date') {
      diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else if (sortField === 'kills') {
      diff = a.kills - b.kills;
    } else if (sortField === 'wave') {
      diff = a.wave_reached - b.wave_reached;
    }
    return sortOrder === 'asc' ? diff : -diff;
  });

  // Пагинация
  const totalPages = Math.ceil(sortedRuns.length / PAGE_SIZE);
  const pageRuns = sortedRuns.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Переключатель сортировки
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setPage(0);
  };

  // Иконка сортировки
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span style={{ opacity: 0.3 }}>↕</span>;
    return <span>{sortOrder === 'desc' ? '↓' : '↑'}</span>;
  };

  // Статистика
  const bestWave = Math.max(...runs.map((r) => r.wave_reached));
  const avgWave = (runs.reduce((sum, r) => sum + r.wave_reached, 0) / runs.length).toFixed(1);

  return (
    <div>
      {/* Статистика */}
      <div
        style={{
          marginBottom: 16,
          padding: 12,
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: 8,
          display: 'flex',
          gap: 24,
        }}
      >
        <div>
          <div style={{ color: '#9CA3AF', fontSize: 11 }}>Лучший результат</div>
          <div style={{ color: '#22C55E', fontSize: 20, fontWeight: 700 }}>
            Волна {bestWave}
          </div>
        </div>
        <div>
          <div style={{ color: '#9CA3AF', fontSize: 11 }}>Всего забегов</div>
          <div style={{ color: '#E5E7EB', fontSize: 20, fontWeight: 700 }}>
            {runs.length}
          </div>
        </div>
        <div>
          <div style={{ color: '#9CA3AF', fontSize: 11 }}>Средняя волна</div>
          <div style={{ color: '#E5E7EB', fontSize: 20, fontWeight: 700 }}>
            {avgWave}
          </div>
        </div>
      </div>

      {/* История забегов */}
      <div
        style={{
          background: '#0D1219',
          border: '1px solid #2D3748',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {/* Заголовок с сортировкой */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '100px 80px 1fr 70px 70px',
            padding: '10px 12px',
            background: '#1A202C',
            borderBottom: '1px solid #2D3748',
            color: '#9CA3AF',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          <div
            onClick={() => toggleSort('date')}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            Дата <SortIcon field="date" />
          </div>
          <div>Режим</div>
          <div style={{ textAlign: 'center' }}>Набор</div>
          <div
            onClick={() => toggleSort('kills')}
            style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
          >
            Убито <SortIcon field="kills" />
          </div>
          <div
            onClick={() => toggleSort('wave')}
            style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
          >
            Волна <SortIcon field="wave" />
          </div>
        </div>

        {/* Строки */}
        {pageRuns.map((run) => (
          <div
            key={run.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '100px 80px 1fr 70px 70px',
              padding: '10px 12px',
              borderBottom: '1px solid #1A202C',
              alignItems: 'center',
            }}
          >
            <div style={{ color: '#9CA3AF', fontSize: 12 }}>
              {new Date(run.created_at).toLocaleDateString('ru-RU')}
            </div>
            <div
              style={{
                fontSize: 11,
                padding: '2px 6px',
                borderRadius: 4,
                background: run.mode === 'daily' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                color: run.mode === 'daily' ? '#F59E0B' : '#3B82F6',
                display: 'inline-block',
                width: 'fit-content',
              }}
            >
              {run.mode === 'daily' ? 'Daily' : 'Random'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ModuleDeckIcons
                modules={run.deck_modules}
                size={18}
                gap={3}
                showTooltip={true}
              />
            </div>
            <div style={{ textAlign: 'center', color: '#E5E7EB' }}>
              {run.kills}
            </div>
            <div
              style={{
                textAlign: 'right',
                color: '#22C55E',
                fontWeight: 600,
              }}
            >
              {run.wave_reached}
            </div>
          </div>
        ))}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
            marginTop: 12,
          }}
        >
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            style={{
              padding: '6px 12px',
              background: page === 0 ? '#1A202C' : '#2D3748',
              border: '1px solid #4A5568',
              borderRadius: 6,
              color: page === 0 ? '#4A5568' : '#E5E7EB',
              cursor: page === 0 ? 'not-allowed' : 'pointer',
              fontSize: 12,
            }}
          >
            ← Назад
          </button>
          <span style={{ color: '#9CA3AF', fontSize: 12 }}>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            style={{
              padding: '6px 12px',
              background: page >= totalPages - 1 ? '#1A202C' : '#2D3748',
              border: '1px solid #4A5568',
              borderRadius: 6,
              color: page >= totalPages - 1 ? '#4A5568' : '#E5E7EB',
              cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
              fontSize: 12,
            }}
          >
            Вперёд →
          </button>
        </div>
      )}
    </div>
  );
}

// ==================== КОМПОНЕНТ ТАБЛИЦЫ ====================

function LeaderboardTable({
  entries,
  highlightPlayerId,
  showDeck,
}: {
  entries: LeaderboardEntry[];
  highlightPlayerId: string;
  showDeck: boolean;
}) {
  if (entries.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: 40,
          color: '#9CA3AF',
        }}
      >
        Пока нет записей. Будьте первым!
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#0D1219',
        border: '1px solid #2D3748',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* Заголовок таблицы */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: showDeck
            ? '40px 1fr 120px 60px 60px 70px'
            : '40px 1fr 60px 60px 70px',
          padding: '10px 12px',
          background: '#1A202C',
          borderBottom: '1px solid #2D3748',
          color: '#9CA3AF',
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        <div>#</div>
        <div>Игрок</div>
        {showDeck && <div style={{ textAlign: 'center' }}>Набор</div>}
        <div style={{ textAlign: 'center' }}>Волна</div>
        <div style={{ textAlign: 'center' }}>Убито</div>
        <div style={{ textAlign: 'right' }}>Время</div>
      </div>

      {/* Строки */}
      {entries.map((entry, index) => {
        const isHighlighted = entry.player_id === highlightPlayerId;
        const rank = index + 1;

        return (
          <div
            key={entry.id}
            style={{
              display: 'grid',
              gridTemplateColumns: showDeck
                ? '40px 1fr 120px 60px 60px 70px'
                : '40px 1fr 60px 60px 70px',
              padding: '10px 12px',
              borderBottom: '1px solid #1A202C',
              alignItems: 'center',
              background: isHighlighted ? 'rgba(50, 214, 255, 0.1)' : 'transparent',
            }}
          >
            {/* Ранг */}
            <div
              style={{
                fontWeight: 700,
                color:
                  rank === 1
                    ? '#FFD700'
                    : rank === 2
                      ? '#C0C0C0'
                      : rank === 3
                        ? '#CD7F32'
                        : '#9CA3AF',
                fontSize: rank <= 3 ? 14 : 13,
              }}
            >
              {rank}
            </div>

            {/* Игрок */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  color: isHighlighted ? '#32D6FF' : '#E5E7EB',
                  fontWeight: isHighlighted ? 600 : 400,
                }}
              >
                {entry.nickname}
              </span>
              {isHighlighted && (
                <span style={{ color: '#32D6FF', fontSize: 10, marginTop: 2 }}>(вы)</span>
              )}
            </div>

            {/* Набор */}
            {showDeck && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ModuleDeckIcons
                  modules={entry.deck_modules}
                  size={18}
                  gap={2}
                  showTooltip={true}
                />
              </div>
            )}

            {/* Волна */}
            <div
              style={{
                textAlign: 'center',
                color: '#22C55E',
                fontWeight: 600,
              }}
            >
              {entry.wave_reached}
            </div>

            {/* Убито */}
            <div style={{ textAlign: 'center', color: '#E5E7EB' }}>
              {entry.kills}
            </div>

            {/* Время */}
            <div style={{ textAlign: 'right', color: '#9CA3AF', fontSize: 12 }}>
              {formatTimeMs(entry.run_time_ms)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
