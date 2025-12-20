// Логика игры "Цифры" - перенос с Python

export interface Tile {
  id: number;
  number: number;
  row: number;
  col: number;
  visible: boolean; // для анимации появления
}

export interface ScorePopup {
  id: number;
  value: number;
  row: number;
  col: number;
  negative: boolean;
  createdAt: number;
  movingTileId?: number; // ID движущейся плитки (для удаления при коллизии)
}

// Информация о движущейся плитке
export interface MovingTile {
  id: number; // уникальный ID для отслеживания
  tile: Tile;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  startTime: number;
  duration: number; // мс на всё движение
  penalty: number; // штраф за перемещение
  direction: Direction;
  // Для динамического создания попапов (как в Python)
  lastCellRow: number; // последняя целая ячейка
  lastCellCol: number;
  cellsLeftCount: number; // сколько ячеек покинуто
}

// Фазы прогресс-бара спавна
export type SpawnBarPhase = 'emptying' | 'filling' | 'waiting';

export interface GameState {
  board: (Tile | null)[][];
  score: number;
  timeLeft: number;
  selectedTile: Tile | null;
  gameStatus: 'filling' | 'playing' | 'won' | 'lost' | 'paused';
  tilesCount: number;
  visibleTilesCount: number;
  // Новая система прогресс-бара
  spawnBarPhase: SpawnBarPhase;
  spawnBarPhaseStart: number; // timestamp начала фазы
  spawnTimerRunning: boolean; // запущен ли таймер спавна
  popups: ScorePopup[]; // анимации очков
  movingTiles: MovingTile[]; // все движущиеся плитки
}

export const BOARD_SIZE = 10;
const GAME_TIME = 300; // 5 минут

// Тайминги прогресс-бара (как в Python)
export const SPAWN_BAR_EMPTY_DURATION = 9800; // 9.8 секунд - бар пустеет
export const SPAWN_BAR_FILL_DURATION = 500;   // 0.5 секунд - бар заполняется

// Цвета плиток (RGB)
export const TILE_COLORS: Record<number, string> = {
  1: 'rgb(250, 130, 124)', // розовый/красный
  2: 'rgb(98, 120, 255)',  // синий
  3: 'rgb(249, 204, 122)', // жёлтый
  4: 'rgb(127, 254, 138)', // зелёный
  5: 'rgb(251, 94, 223)',  // пурпурный
  6: 'rgb(126, 253, 205)', // бирюзовый
  7: 'rgb(239, 255, 127)', // жёлто-зелёный
  8: 'rgb(174, 121, 251)', // фиолетовый
  9: 'rgb(255, 152, 123)', // оранжевый
};

// RGB компоненты для bevel эффекта
export const TILE_RGB: Record<number, [number, number, number]> = {
  1: [250, 130, 124],
  2: [98, 120, 255],
  3: [249, 204, 122],
  4: [127, 254, 138],
  5: [251, 94, 223],
  6: [126, 253, 205],
  7: [239, 255, 127],
  8: [174, 121, 251],
  9: [255, 152, 123],
};

export function getTileRGB(num: number): [number, number, number] {
  return TILE_RGB[num] || [200, 200, 200];
}

let tileIdCounter = 0;
let popupIdCounter = 0;
let movingTileIdCounter = 0;

// Создать новую плитку
function createTile(row: number, col: number, visible = true): Tile {
  return {
    id: tileIdCounter++,
    number: Math.floor(Math.random() * 9) + 1, // 1-9
    row,
    col,
    visible,
  };
}

// Инициализация игры с полным заполнением
export function initGame(pattern: [number, number][]): GameState {
  tileIdCounter = 0;
  popupIdCounter = 0;
  movingTileIdCounter = 0;
  const board: (Tile | null)[][] = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));

  // Заполняем все клетки (но плитки пока невидимы)
  let tilesCount = 0;
  for (const [row, col] of pattern) {
    board[row][col] = createTile(row, col, false);
    tilesCount++;
  }

  return {
    board,
    score: 0,
    timeLeft: GAME_TIME,
    selectedTile: null,
    gameStatus: 'filling', // начинаем с анимации заполнения
    tilesCount,
    visibleTilesCount: 0,
    // Прогресс-бар спавна
    spawnBarPhase: 'emptying' as SpawnBarPhase,
    spawnBarPhaseStart: 0,
    spawnTimerRunning: false,
    popups: [],
    movingTiles: [],
  };
}

// Показать следующую плитку (для анимации заполнения)
export function revealNextTile(state: GameState, pattern: [number, number][]): GameState {
  const nextIndex = state.visibleTilesCount;

  if (nextIndex >= pattern.length) {
    // Все плитки показаны, начинаем игру
    return {
      ...state,
      gameStatus: 'playing',
    };
  }

  const [row, col] = pattern[nextIndex];
  const newBoard = state.board.map(r => r.map(t => t ? { ...t } : null));

  if (newBoard[row][col]) {
    newBoard[row][col]!.visible = true;
  }

  return {
    ...state,
    board: newBoard,
    visibleTilesCount: state.visibleTilesCount + 1,
  };
}

// Проверка, движется ли плитка
export function isTileMoving(state: GameState, tileId: number): boolean {
  return state.movingTiles.some(mt => mt.tile.id === tileId);
}

// Получить текущую позицию движущейся плитки (в ячейках, дробное)
export function getMovingTilePosition(mt: MovingTile, now: number): { row: number; col: number } {
  const elapsed = now - mt.startTime;
  const progress = Math.min(1, elapsed / mt.duration);

  return {
    row: mt.fromRow + (mt.toRow - mt.fromRow) * progress,
    col: mt.fromCol + (mt.toCol - mt.fromCol) * progress,
  };
}

// Получить ячейки, занятые движущимися плитками (для стрелок и коллизий)
export function getOccupiedByMoving(state: GameState, now: number): Set<string> {
  const occupied = new Set<string>();

  for (const mt of state.movingTiles) {
    const pos = getMovingTilePosition(mt, now);

    // Плитка может занимать 1-2 ячейки (когда на границе)
    const minRow = Math.floor(pos.row);
    const maxRow = Math.ceil(pos.row);
    const minCol = Math.floor(pos.col);
    const maxCol = Math.ceil(pos.col);

    for (let r = minRow; r <= maxRow && r < BOARD_SIZE; r++) {
      for (let c = minCol; c <= maxCol && c < BOARD_SIZE; c++) {
        if (r >= 0 && c >= 0) {
          // Исключаем стартовую позицию - плитка оттуда уезжает
          if (r !== mt.fromRow || c !== mt.fromCol) {
            occupied.add(`${r},${c}`);
          }
        }
      }
    }
  }

  return occupied;
}

// Проверка, можно ли убрать две плитки
export function canRemoveTiles(
  board: (Tile | null)[][],
  tile1: Tile,
  tile2: Tile,
  movingTiles: MovingTile[] = []
): boolean {
  // Нельзя удалять движущиеся плитки
  if (movingTiles.some(mt => mt.tile.id === tile1.id || mt.tile.id === tile2.id)) {
    return false;
  }

  // Проверка чисел: одинаковые или сумма = 10
  const numbersMatch =
    tile1.number === tile2.number || tile1.number + tile2.number === 10;

  if (!numbersMatch) return false;

  // Проверка позиции: на одной линии без преград
  const { row: r1, col: c1 } = tile1;
  const { row: r2, col: c2 } = tile2;

  // Одна и та же плитка
  if (r1 === r2 && c1 === c2) return false;

  // На одной строке
  if (r1 === r2) {
    const minCol = Math.min(c1, c2);
    const maxCol = Math.max(c1, c2);
    for (let c = minCol + 1; c < maxCol; c++) {
      if (board[r1][c] !== null) return false;
    }
    return true;
  }

  // На одном столбце
  if (c1 === c2) {
    const minRow = Math.min(r1, r2);
    const maxRow = Math.max(r1, r2);
    for (let r = minRow + 1; r < maxRow; r++) {
      if (board[r][c1] !== null) return false;
    }
    return true;
  }

  // Не на одной линии
  return false;
}

// Вычисление очков за удаление
export function calculateScore(tile1: Tile, tile2: Tile): number {
  const distance =
    Math.abs(tile1.row - tile2.row) + Math.abs(tile1.col - tile2.col);
  return ((distance + 1) * (distance + 2)) / 2;
}

// Получить путь между двумя плитками
function getPath(tile1: Tile, tile2: Tile): { row: number; col: number }[] {
  const path: { row: number; col: number }[] = [];
  const { row: r1, col: c1 } = tile1;
  const { row: r2, col: c2 } = tile2;

  if (r1 === r2) {
    // Горизонтальный путь
    const step = c2 > c1 ? 1 : -1;
    for (let c = c1; c !== c2 + step; c += step) {
      path.push({ row: r1, col: c });
    }
  } else if (c1 === c2) {
    // Вертикальный путь
    const step = r2 > r1 ? 1 : -1;
    for (let r = r1; r !== r2 + step; r += step) {
      path.push({ row: r, col: c1 });
    }
  }

  return path;
}

// Удалить плитки
export function removeTiles(state: GameState, tile1: Tile, tile2: Tile): GameState {
  if (!canRemoveTiles(state.board, tile1, tile2, state.movingTiles)) {
    return { ...state, selectedTile: null };
  }

  const newBoard = state.board.map((row) => [...row]);
  newBoard[tile1.row][tile1.col] = null;
  newBoard[tile2.row][tile2.col] = null;

  const points = calculateScore(tile1, tile2);
  const newTilesCount = state.tilesCount - 2;

  // Создаём попапы вдоль пути
  const path = getPath(tile1, tile2);
  const now = Date.now();
  const newPopups: ScorePopup[] = path.map((pos, index) => ({
    id: popupIdCounter++,
    value: index + 1,
    row: pos.row,
    col: pos.col,
    negative: false,
    createdAt: now + index * 80, // 80ms задержка между появлениями
  }));

  // Логика таймера спавна:
  // 1. Если таймер не запущен - запускаем (первое удаление)
  // 2. Если бар был в 'waiting' (ждал места для спавна) - сбрасываем на полный
  const shouldStartTimer = !state.spawnTimerRunning;
  const shouldResetBar = state.spawnBarPhase === 'waiting';

  return {
    ...state,
    board: newBoard,
    score: state.score + points,
    selectedTile: null,
    tilesCount: newTilesCount,
    gameStatus: newTilesCount === 0 ? 'won' : state.gameStatus,
    popups: [...state.popups, ...newPopups],
    // Запускаем/сбрасываем таймер спавна
    spawnTimerRunning: true,
    spawnBarPhase: (shouldStartTimer || shouldResetBar) ? 'emptying' : state.spawnBarPhase,
    spawnBarPhaseStart: (shouldStartTimer || shouldResetBar) ? Date.now() : state.spawnBarPhaseStart,
  };
}

// Выбор плитки
export function selectTile(state: GameState, tile: Tile): GameState {
  if (state.gameStatus !== 'playing') return state;

  // Нельзя выбирать движущуюся плитку
  if (isTileMoving(state, tile.id)) return state;

  // Если ничего не выбрано — выбираем
  if (!state.selectedTile) {
    return { ...state, selectedTile: tile };
  }

  // Если кликнули на ту же плитку — ничего не делаем (выделение остаётся)
  if (state.selectedTile.id === tile.id) {
    return state;
  }

  // Пробуем удалить пару
  if (canRemoveTiles(state.board, state.selectedTile, tile, state.movingTiles)) {
    return removeTiles(state, state.selectedTile, tile);
  }

  // Если не удалось удалить — просто выбираем новую плитку
  return { ...state, selectedTile: tile };
}

// Добавить новую плитку (спавн)
export function spawnTile(state: GameState): GameState {
  if (state.gameStatus !== 'playing') return state;

  // Найти пустые клетки (учитывая движущиеся плитки)
  const now = Date.now();
  const occupiedByMoving = getOccupiedByMoving(state, now);

  const emptyCells: { row: number; col: number }[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (state.board[row][col] === null && !occupiedByMoving.has(`${row},${col}`)) {
        emptyCells.push({ row, col });
      }
    }
  }

  if (emptyCells.length === 0) return state;

  // Выбрать случайную пустую клетку
  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const newTile = createTile(randomCell.row, randomCell.col, true);

  const newBoard = state.board.map((row) => [...row]);
  newBoard[randomCell.row][randomCell.col] = newTile;

  return {
    ...state,
    board: newBoard,
    tilesCount: state.tilesCount + 1,
    // После спавна бар начинает заполняться
    spawnBarPhase: 'filling' as SpawnBarPhase,
    spawnBarPhaseStart: Date.now(),
  };
}

// Обновление таймера (только время, спавн-бар теперь отдельно)
export function tick(state: GameState): GameState {
  if (state.gameStatus !== 'playing') return state;

  const newTimeLeft = state.timeLeft - 1;

  if (newTimeLeft <= 0) {
    return {
      ...state,
      timeLeft: 0,
      gameStatus: 'lost',
    };
  }

  return {
    ...state,
    timeLeft: newTimeLeft,
  };
}

// Запустить таймер спавна (после первого удаления плиток)
export function startSpawnTimer(state: GameState): GameState {
  if (state.spawnTimerRunning) return state;

  return {
    ...state,
    spawnTimerRunning: true,
    spawnBarPhase: 'emptying',
    spawnBarPhaseStart: Date.now(),
  };
}

// Получить прогресс бара (0-1, где 1 = полный)
export function getSpawnBarProgress(state: GameState, now: number): number {
  if (!state.spawnTimerRunning) return 1;

  const elapsed = now - state.spawnBarPhaseStart;

  if (state.spawnBarPhase === 'emptying') {
    // Бар пустеет: 1 → 0 за 9.8 секунд
    return Math.max(0, 1 - elapsed / SPAWN_BAR_EMPTY_DURATION);
  } else if (state.spawnBarPhase === 'filling') {
    // Бар заполняется: 0 → 1 за 0.5 секунд
    return Math.min(1, elapsed / SPAWN_BAR_FILL_DURATION);
  } else {
    // waiting - бар на нуле
    return 0;
  }
}

// Обновить фазу спавн-бара (вызывать в игровом цикле)
export function updateSpawnBar(state: GameState, now: number): { state: GameState; shouldSpawn: boolean } {
  if (!state.spawnTimerRunning || state.gameStatus !== 'playing') {
    return { state, shouldSpawn: false };
  }

  const elapsed = now - state.spawnBarPhaseStart;

  if (state.spawnBarPhase === 'emptying') {
    if (elapsed >= SPAWN_BAR_EMPTY_DURATION) {
      // Бар опустел - переходим в waiting и сигнализируем о спавне
      return {
        state: {
          ...state,
          spawnBarPhase: 'waiting',
        },
        shouldSpawn: true,
      };
    }
  } else if (state.spawnBarPhase === 'filling') {
    if (elapsed >= SPAWN_BAR_FILL_DURATION) {
      // Бар заполнился - начинаем снова пустеть
      return {
        state: {
          ...state,
          spawnBarPhase: 'emptying',
          spawnBarPhaseStart: now,
        },
        shouldSpawn: false,
      };
    }
  }

  return { state, shouldSpawn: false };
}

// После успешного спавна - начать заполнение бара
export function onSpawnComplete(state: GameState): GameState {
  return {
    ...state,
    spawnBarPhase: 'filling',
    spawnBarPhaseStart: Date.now(),
  };
}

// Форматирование времени
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Очистка старых попапов (старше 500мс после появления)
export function cleanupPopups(state: GameState): GameState {
  const now = Date.now();
  const fadeTime = 400; // время затухания
  const newPopups = state.popups.filter(p => now - p.createdAt < fadeTime);

  if (newPopups.length === state.popups.length) {
    return state;
  }

  return { ...state, popups: newPopups };
}

// Направления движения
export type Direction = 'up' | 'down' | 'left' | 'right';

// Проверка, можно ли двигаться в направлении (учитывает движущиеся плитки)
export function canMove(
  board: (Tile | null)[][],
  tile: Tile,
  direction: Direction,
  movingTiles: MovingTile[] = []
): boolean {
  const { row, col } = tile;

  let newRow = row;
  let newCol = col;

  if (direction === 'up') newRow = row - 1;
  else if (direction === 'down') newRow = row + 1;
  else if (direction === 'left') newCol = col - 1;
  else if (direction === 'right') newCol = col + 1;

  // Проверяем границы
  if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) {
    return false;
  }

  const cell = board[newRow][newCol];

  // Ячейка свободна или занята движущейся плиткой (она уезжает)
  if (cell === null) return true;

  // Если ячейка занята движущейся плиткой - можно двигаться (она уезжает)
  if (movingTiles.some(mt => mt.tile.id === cell.id)) return true;

  return false;
}

// Получить позиции для стрелок (с учётом движущихся плиток)
export function getArrowPositions(
  board: (Tile | null)[][],
  tile: Tile,
  movingTiles: MovingTile[] = [],
  now: number = Date.now()
): { direction: Direction; row: number; col: number }[] {
  const arrows: { direction: Direction; row: number; col: number }[] = [];
  const directions: Direction[] = ['up', 'down', 'left', 'right'];

  // Получаем ячейки, занятые движущимися плитками прямо сейчас
  const occupiedByMoving = getOccupiedByMoving({ movingTiles } as GameState, now);

  for (const direction of directions) {
    if (canMove(board, tile, direction, movingTiles)) {
      let arrowRow = tile.row;
      let arrowCol = tile.col;

      if (direction === 'up') arrowRow--;
      else if (direction === 'down') arrowRow++;
      else if (direction === 'left') arrowCol--;
      else if (direction === 'right') arrowCol++;

      // Стрелка не появляется где физически находится движущаяся плитка
      if (!occupiedByMoving.has(`${arrowRow},${arrowCol}`)) {
        arrows.push({ direction, row: arrowRow, col: arrowCol });
      }
    }
  }

  return arrows;
}

// Вычислить целевую позицию для движения (учитывает движущиеся плитки)
export function getTargetPosition(
  board: (Tile | null)[][],
  tile: Tile,
  direction: Direction,
  movingTiles: MovingTile[] = []
): { row: number; col: number } {
  let { row, col } = tile;

  const cellIsPassable = (r: number, c: number): boolean => {
    const cell = board[r][c];
    // Ячейка проходима если пуста или занята движущейся плиткой (она уезжает)
    if (cell === null) return true;
    if (movingTiles.some(mt => mt.tile.id === cell.id)) return true;
    return false;
  };

  if (direction === 'up') {
    while (row > 0 && cellIsPassable(row - 1, col)) row--;
  } else if (direction === 'down') {
    while (row < BOARD_SIZE - 1 && cellIsPassable(row + 1, col)) row++;
  } else if (direction === 'left') {
    while (col > 0 && cellIsPassable(row, col - 1)) col--;
  } else if (direction === 'right') {
    while (col < BOARD_SIZE - 1 && cellIsPassable(row, col + 1)) col++;
  }

  return { row, col };
}

// Константы анимации
const MS_PER_CELL = 100; // миллисекунд на одну ячейку

// Запустить движение плитки (начало анимации)
export function startMoveTile(state: GameState, tile: Tile, direction: Direction): GameState {
  if (state.gameStatus !== 'playing') return state;

  // Нельзя запустить плитку которая уже движется
  if (isTileMoving(state, tile.id)) return state;

  const target = getTargetPosition(state.board, tile, direction, state.movingTiles);

  // Не двигаться если остаёмся на месте
  if (target.row === tile.row && target.col === tile.col) {
    return state;
  }

  const cellsMoved = Math.abs(target.row - tile.row) + Math.abs(target.col - tile.col);
  const duration = cellsMoved * MS_PER_CELL;
  const penalty = (cellsMoved * (cellsMoved + 1)) / 2;

  // Убираем плитку с доски (она теперь "летит")
  const newBoard = state.board.map(r => r.map(t => t ? { ...t } : null));
  newBoard[tile.row][tile.col] = null;

  const now = Date.now();
  const movingTileId = movingTileIdCounter++;

  // Попапы создаются динамически в updateMovingTiles когда плитка пересекает ячейку
  const newMovingTile: MovingTile = {
    id: movingTileId,
    tile,
    fromRow: tile.row,
    fromCol: tile.col,
    toRow: target.row,
    toCol: target.col,
    startTime: now,
    duration,
    penalty,
    direction,
    // Инициализация для динамических попапов
    lastCellRow: tile.row,
    lastCellCol: tile.col,
    cellsLeftCount: 0,
  };

  // Сбрасываем выделение только если это была выбранная плитка
  const newSelectedTile = state.selectedTile?.id === tile.id ? null : state.selectedTile;

  return {
    ...state,
    board: newBoard,
    selectedTile: newSelectedTile,
    movingTiles: [...state.movingTiles, newMovingTile],
  };
}

// Завершить движение одной плитки (после окончания анимации)
// justPlacedPositions - позиции только что размещённых плиток (для коллизий в одном кадре)
export function finishMoveTile(
  state: GameState,
  movingTileId: number,
  justPlacedPositions: Set<string> = new Set()
): GameState {
  const mtIndex = state.movingTiles.findIndex(mt => mt.id === movingTileId);
  if (mtIndex === -1) return state;

  const mt = state.movingTiles[mtIndex];

  // Проверяем, свободна ли целевая ячейка
  let finalRow = mt.toRow;
  let finalCol = mt.toCol;

  const targetOccupied =
    state.board[mt.toRow][mt.toCol] !== null ||
    justPlacedPositions.has(`${mt.toRow},${mt.toCol}`);

  if (targetOccupied) {
    // Целевая ячейка занята - ищем безопасную позицию
    const now = Date.now();
    const currentPos = { row: mt.toRow, col: mt.toCol };
    const otherTiles = state.movingTiles.filter(m => m.id !== movingTileId);
    const safePos = findSafeStopPosition(mt, currentPos, state.board, otherTiles, now);
    finalRow = safePos.row;
    finalCol = safePos.col;
  }

  // Вычисляем реальный штраф (сколько ячеек прошли)
  const cellsMoved = Math.abs(finalRow - mt.fromRow) + Math.abs(finalCol - mt.fromCol);
  const actualPenalty = (cellsMoved * (cellsMoved + 1)) / 2;

  // Создаём обновлённую плитку с новой позицией
  const movedTile: Tile = {
    ...mt.tile,
    row: finalRow,
    col: finalCol,
  };

  // Ставим плитку на новую позицию
  const newBoard = state.board.map(r => r.map(t => t ? { ...t } : null));
  newBoard[finalRow][finalCol] = movedTile;

  // Убираем завершённую плитку из списка движущихся
  const newMovingTiles = state.movingTiles.filter(m => m.id !== movingTileId);

  return {
    ...state,
    board: newBoard,
    score: Math.max(0, state.score - actualPenalty),
    movingTiles: newMovingTiles,
  };
}

// Проверка пересечения двух прямоугольников (плиток)
function tilesOverlap(pos1: { row: number; col: number }, pos2: { row: number; col: number }): boolean {
  // Плитки пересекаются если их центры ближе чем 1 ячейка
  const threshold = 0.9; // чуть меньше 1 для точности
  return Math.abs(pos1.row - pos2.row) < threshold && Math.abs(pos1.col - pos2.col) < threshold;
}

// Округление до ближайшей ячейки
function snapToGrid(pos: { row: number; col: number }): { row: number; col: number } {
  return {
    row: Math.round(pos.row),
    col: Math.round(pos.col),
  };
}

// Найти безопасную позицию для остановки (ближайшую свободную ячейку)
function findSafeStopPosition(
  mt: MovingTile,
  currentPos: { row: number; col: number },
  board: (Tile | null)[][],
  otherMovingTiles: MovingTile[],
  now: number
): { row: number; col: number } {
  const snapped = snapToGrid(currentPos);

  // Проверяем что ячейка свободна
  if (snapped.row >= 0 && snapped.row < BOARD_SIZE &&
      snapped.col >= 0 && snapped.col < BOARD_SIZE &&
      board[snapped.row][snapped.col] === null) {
    // Проверяем что другие плитки не занимают эту ячейку
    const otherOccupied = otherMovingTiles.some(other => {
      const otherPos = getMovingTilePosition(other, now);
      const otherSnapped = snapToGrid(otherPos);
      return otherSnapped.row === snapped.row && otherSnapped.col === snapped.col;
    });
    if (!otherOccupied) {
      return snapped;
    }
  }

  // Если ячейка занята, ищем свободную в обратном направлении
  const direction = mt.direction;
  let searchRow = snapped.row;
  let searchCol = snapped.col;

  // Ищем в обратном направлении до стартовой позиции
  while (true) {
    if (direction === 'up') searchRow++;
    else if (direction === 'down') searchRow--;
    else if (direction === 'left') searchCol++;
    else if (direction === 'right') searchCol--;

    // Достигли стартовой позиции
    if ((direction === 'up' && searchRow > mt.fromRow) ||
        (direction === 'down' && searchRow < mt.fromRow) ||
        (direction === 'left' && searchCol > mt.fromCol) ||
        (direction === 'right' && searchCol < mt.fromCol)) {
      return { row: mt.fromRow, col: mt.fromCol };
    }

    // Проверяем границы
    if (searchRow < 0 || searchRow >= BOARD_SIZE || searchCol < 0 || searchCol >= BOARD_SIZE) {
      return { row: mt.fromRow, col: mt.fromCol };
    }

    // Проверяем свободна ли ячейка
    if (board[searchRow][searchCol] === null) {
      const otherOccupied = otherMovingTiles.some(other => {
        const otherPos = getMovingTilePosition(other, now);
        const otherSnapped = snapToGrid(otherPos);
        return otherSnapped.row === searchRow && otherSnapped.col === searchCol;
      });
      if (!otherOccupied) {
        return { row: searchRow, col: searchCol };
      }
    }
  }
}

// Остановить плитку немедленно на указанной позиции
function stopMovingTile(state: GameState, mtId: number, stopPos: { row: number; col: number }): GameState {
  const mtIndex = state.movingTiles.findIndex(m => m.id === mtId);
  if (mtIndex === -1) return state;

  const mt = state.movingTiles[mtIndex];
  const now = Date.now();

  // Вычисляем реальный штраф (сколько ячеек прошли)
  const cellsMoved = Math.abs(stopPos.row - mt.fromRow) + Math.abs(stopPos.col - mt.fromCol);
  const penalty = (cellsMoved * (cellsMoved + 1)) / 2;

  // Создаём плитку на новой позиции
  const stoppedTile: Tile = {
    ...mt.tile,
    row: stopPos.row,
    col: stopPos.col,
  };

  const newBoard = state.board.map(r => r.map(t => t ? { ...t } : null));
  newBoard[stopPos.row][stopPos.col] = stoppedTile;

  const newMovingTiles = state.movingTiles.filter(m => m.id !== mtId);

  // Попапы теперь создаются динамически, поэтому ничего удалять не нужно

  return {
    ...state,
    board: newBoard,
    score: Math.max(0, state.score - penalty),
    movingTiles: newMovingTiles,
  };
}

// Проверить и завершить все плитки, которые доехали или столкнулись
export function updateMovingTiles(state: GameState): GameState {
  const now = Date.now();
  let newState = state;
  const newPopups: ScorePopup[] = [];

  // Динамическое создание попапов когда плитка покидает ячейку
  const updatedMovingTiles = newState.movingTiles.map(mt => {
    const pos = getMovingTilePosition(mt, now);
    const currentCellRow = Math.floor(pos.row);
    const currentCellCol = Math.floor(pos.col);

    // Проверяем, покинула ли плитка свою последнюю ячейку
    if (currentCellRow !== mt.lastCellRow || currentCellCol !== mt.lastCellCol) {
      // Плитка покинула ячейку - создаём popup там
      const newCellsLeftCount = mt.cellsLeftCount + 1;

      newPopups.push({
        id: popupIdCounter++,
        value: newCellsLeftCount,
        row: mt.lastCellRow,
        col: mt.lastCellCol,
        negative: true,
        createdAt: now,
        movingTileId: mt.id,
      });

      return {
        ...mt,
        lastCellRow: currentCellRow,
        lastCellCol: currentCellCol,
        cellsLeftCount: newCellsLeftCount,
      };
    }
    return mt;
  });

  newState = {
    ...newState,
    movingTiles: updatedMovingTiles,
    popups: [...newState.popups, ...newPopups],
  };

  // Сначала проверяем столкновения между движущимися плитками
  const movingPositions = newState.movingTiles.map(mt => ({
    mt,
    pos: getMovingTilePosition(mt, now),
  }));

  const stoppedIds = new Set<number>();

  // Проверяем каждую пару
  for (let i = 0; i < movingPositions.length; i++) {
    for (let j = i + 1; j < movingPositions.length; j++) {
      const { mt: mt1, pos: pos1 } = movingPositions[i];
      const { mt: mt2, pos: pos2 } = movingPositions[j];

      if (stoppedIds.has(mt1.id) || stoppedIds.has(mt2.id)) continue;

      if (tilesOverlap(pos1, pos2)) {
        // Столкновение! Останавливаем обе плитки
        const otherTiles1 = newState.movingTiles.filter(m => m.id !== mt1.id && m.id !== mt2.id);
        const otherTiles2 = newState.movingTiles.filter(m => m.id !== mt1.id && m.id !== mt2.id);

        const stopPos1 = findSafeStopPosition(mt1, pos1, newState.board, otherTiles1, now);
        newState = stopMovingTile(newState, mt1.id, stopPos1);
        stoppedIds.add(mt1.id);

        const stopPos2 = findSafeStopPosition(mt2, pos2, newState.board, otherTiles2, now);
        newState = stopMovingTile(newState, mt2.id, stopPos2);
        stoppedIds.add(mt2.id);
      }
    }
  }

  // Проверяем столкновение со статичными плитками
  for (const { mt, pos } of movingPositions) {
    if (stoppedIds.has(mt.id)) continue;

    // Проверяем ячейки которые плитка сейчас занимает
    const minRow = Math.floor(pos.row);
    const maxRow = Math.ceil(pos.row);
    const minCol = Math.floor(pos.col);
    const maxCol = Math.ceil(pos.col);

    let hasStaticCollision = false;
    for (let r = minRow; r <= maxRow && r < BOARD_SIZE; r++) {
      for (let c = minCol; c <= maxCol && c < BOARD_SIZE; c++) {
        // Исключаем ТОЛЬКО стартовую ячейку (откуда плитка уехала)
        // Было: r !== mt.fromRow && c !== mt.fromCol - это исключало всю строку/столбец!
        if (r >= 0 && c >= 0 && !(r === mt.fromRow && c === mt.fromCol)) {
          const cell = newState.board[r][c];
          if (cell !== null) {
            hasStaticCollision = true;
            break;
          }
        }
      }
      if (hasStaticCollision) break;
    }

    if (hasStaticCollision) {
      const otherTiles = newState.movingTiles.filter(m => m.id !== mt.id);
      const stopPos = findSafeStopPosition(mt, pos, newState.board, otherTiles, now);
      newState = stopMovingTile(newState, mt.id, stopPos);
      stoppedIds.add(mt.id);
    }
  }

  // Завершаем плитки которые доехали до цели
  // Отслеживаем только что размещённые позиции для коллизий в одном кадре
  const justPlacedPositions = new Set<string>();

  for (const mt of newState.movingTiles) {
    if (stoppedIds.has(mt.id)) continue;

    const elapsed = now - mt.startTime;
    if (elapsed >= mt.duration) {
      // Определяем финальную позицию до вызова finishMoveTile
      let finalRow = mt.toRow;
      let finalCol = mt.toCol;
      const targetOccupied =
        newState.board[mt.toRow][mt.toCol] !== null ||
        justPlacedPositions.has(`${mt.toRow},${mt.toCol}`);

      if (targetOccupied) {
        const currentPos = { row: mt.toRow, col: mt.toCol };
        const otherTiles = newState.movingTiles.filter(m => m.id !== mt.id);
        const safePos = findSafeStopPosition(mt, currentPos, newState.board, otherTiles, now);
        finalRow = safePos.row;
        finalCol = safePos.col;
      }

      justPlacedPositions.add(`${finalRow},${finalCol}`);
      newState = finishMoveTile(newState, mt.id, justPlacedPositions);
    }
  }

  return newState;
}

// Для обратной совместимости
export function moveTile(state: GameState, tile: Tile, direction: Direction): GameState {
  return startMoveTile(state, tile, direction);
}

// Legacy - для совместимости с page.tsx (будет удалено)
export function finishMoveTileLegacy(state: GameState): GameState {
  if (state.movingTiles.length === 0) return state;
  return finishMoveTile(state, state.movingTiles[0].id);
}
