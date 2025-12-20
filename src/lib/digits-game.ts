// Логика игры "Цифры" - перенос с Python

export interface Tile {
  id: number;
  number: number;
  row: number;
  col: number;
}

export interface GameState {
  board: (Tile | null)[][];
  score: number;
  timeLeft: number;
  selectedTile: Tile | null;
  gameStatus: 'idle' | 'playing' | 'won' | 'lost';
  tilesCount: number;
}

const BOARD_SIZE = 10;
const GAME_TIME = 300; // 5 минут

let tileIdCounter = 0;

// Создать новую плитку
function createTile(row: number, col: number): Tile {
  return {
    id: tileIdCounter++,
    number: Math.floor(Math.random() * 9) + 1, // 1-9
    row,
    col,
  };
}

// Инициализация игры
export function initGame(): GameState {
  tileIdCounter = 0;
  const board: (Tile | null)[][] = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));

  // Заполняем начальными плитками (примерно 30-40%)
  let tilesCount = 0;
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (Math.random() < 0.35) {
        board[row][col] = createTile(row, col);
        tilesCount++;
      }
    }
  }

  return {
    board,
    score: 0,
    timeLeft: GAME_TIME,
    selectedTile: null,
    gameStatus: 'playing',
    tilesCount,
  };
}

// Проверка, можно ли убрать две плитки
export function canRemoveTiles(
  board: (Tile | null)[][],
  tile1: Tile,
  tile2: Tile
): boolean {
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

// Удалить плитки
export function removeTiles(state: GameState, tile1: Tile, tile2: Tile): GameState {
  if (!canRemoveTiles(state.board, tile1, tile2)) {
    return { ...state, selectedTile: null };
  }

  const newBoard = state.board.map((row) => [...row]);
  newBoard[tile1.row][tile1.col] = null;
  newBoard[tile2.row][tile2.col] = null;

  const points = calculateScore(tile1, tile2);
  const newTilesCount = state.tilesCount - 2;

  return {
    ...state,
    board: newBoard,
    score: state.score + points,
    selectedTile: null,
    tilesCount: newTilesCount,
    gameStatus: newTilesCount === 0 ? 'won' : state.gameStatus,
  };
}

// Выбор плитки
export function selectTile(state: GameState, tile: Tile): GameState {
  if (state.gameStatus !== 'playing') return state;

  // Если ничего не выбрано — выбираем
  if (!state.selectedTile) {
    return { ...state, selectedTile: tile };
  }

  // Если кликнули на ту же плитку — снимаем выбор
  if (state.selectedTile.id === tile.id) {
    return { ...state, selectedTile: null };
  }

  // Пробуем удалить пару
  return removeTiles(state, state.selectedTile, tile);
}

// Добавить новую плитку (спавн)
export function spawnTile(state: GameState): GameState {
  if (state.gameStatus !== 'playing') return state;

  // Найти пустые клетки
  const emptyCells: { row: number; col: number }[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (state.board[row][col] === null) {
        emptyCells.push({ row, col });
      }
    }
  }

  if (emptyCells.length === 0) return state;

  // Выбрать случайную пустую клетку
  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const newTile = createTile(randomCell.row, randomCell.col);

  const newBoard = state.board.map((row) => [...row]);
  newBoard[randomCell.row][randomCell.col] = newTile;

  return {
    ...state,
    board: newBoard,
    tilesCount: state.tilesCount + 1,
  };
}

// Обновление таймера
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

// Форматирование времени
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
