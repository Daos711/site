// Паттерны появления плиток - перенос с Python

const BOARD_SIZE = 10;

type Position = [number, number]; // [row, col]

// Змейка по строкам
function snakeByRows(reverseStart = false): Position[] {
  const positions: Position[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    const leftToRight = (row % 2 === 0) !== reverseStart;
    for (let col = 0; col < BOARD_SIZE; col++) {
      const actualCol = leftToRight ? col : BOARD_SIZE - 1 - col;
      positions.push([row, actualCol]);
    }
  }
  return positions;
}

// Змейка по строкам снизу
function snakeByRowsReverse(): Position[] {
  const positions: Position[] = [];
  for (let row = BOARD_SIZE - 1; row >= 0; row--) {
    const leftToRight = (BOARD_SIZE - 1 - row) % 2 === 0;
    for (let col = 0; col < BOARD_SIZE; col++) {
      const actualCol = leftToRight ? col : BOARD_SIZE - 1 - col;
      positions.push([row, actualCol]);
    }
  }
  return positions;
}

// Змейка по столбцам
function snakeByCols(reverseStart = false): Position[] {
  const positions: Position[] = [];
  for (let col = 0; col < BOARD_SIZE; col++) {
    const topToBottom = (col % 2 === 0) !== reverseStart;
    for (let row = 0; row < BOARD_SIZE; row++) {
      const actualRow = topToBottom ? row : BOARD_SIZE - 1 - row;
      positions.push([actualRow, col]);
    }
  }
  return positions;
}

// Змейка по столбцам справа
function snakeByColsReverse(): Position[] {
  const positions: Position[] = [];
  for (let col = BOARD_SIZE - 1; col >= 0; col--) {
    const topToBottom = (BOARD_SIZE - 1 - col) % 2 === 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
      const actualRow = topToBottom ? row : BOARD_SIZE - 1 - row;
      positions.push([actualRow, col]);
    }
  }
  return positions;
}

// Спираль по часовой стрелке
function spiralClockwise(startCorner: string): Position[] {
  const positions: Position[] = [];
  const visited: boolean[][] = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(false));

  const directions: Position[] = [[0, 1], [1, 0], [0, -1], [-1, 0]]; // right, down, left, up

  const corners: Record<string, [number, number, number]> = {
    "top_left": [0, 0, 0],
    "top_right": [0, BOARD_SIZE - 1, 1],
    "bottom_right": [BOARD_SIZE - 1, BOARD_SIZE - 1, 2],
    "bottom_left": [BOARD_SIZE - 1, 0, 3],
  };

  let [row, col, dirIdx] = corners[startCorner];

  for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
    positions.push([row, col]);
    visited[row][col] = true;

    let [dr, dc] = directions[dirIdx];
    let newRow = row + dr;
    let newCol = col + dc;

    if (!(newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE && !visited[newRow][newCol])) {
      dirIdx = (dirIdx + 1) % 4;
      [dr, dc] = directions[dirIdx];
      newRow = row + dr;
      newCol = col + dc;
    }

    row = newRow;
    col = newCol;
  }

  return positions;
}

// Спираль против часовой стрелки
function spiralCounterClockwise(startCorner: string): Position[] {
  const positions: Position[] = [];
  const visited: boolean[][] = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(false));

  const directionsMap: Record<string, Position[]> = {
    "top_left": [[1, 0], [0, 1], [-1, 0], [0, -1]],
    "top_right": [[0, -1], [1, 0], [0, 1], [-1, 0]],
    "bottom_right": [[-1, 0], [0, -1], [1, 0], [0, 1]],
    "bottom_left": [[0, 1], [-1, 0], [0, -1], [1, 0]],
  };

  const corners: Record<string, Position> = {
    "top_left": [0, 0],
    "top_right": [0, BOARD_SIZE - 1],
    "bottom_right": [BOARD_SIZE - 1, BOARD_SIZE - 1],
    "bottom_left": [BOARD_SIZE - 1, 0],
  };

  let [row, col] = corners[startCorner];
  const directions = directionsMap[startCorner];
  let dirIdx = 0;

  for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
    positions.push([row, col]);
    visited[row][col] = true;

    let [dr, dc] = directions[dirIdx];
    let newRow = row + dr;
    let newCol = col + dc;

    if (!(newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE && !visited[newRow][newCol])) {
      dirIdx = (dirIdx + 1) % 4;
      [dr, dc] = directions[dirIdx];
      newRow = row + dr;
      newCol = col + dc;
    }

    row = newRow;
    col = newCol;
  }

  return positions;
}

// Диагональная волна
function diagonalWave(startCorner: string): Position[] {
  const positions: Position[] = [];

  if (startCorner === "top_left") {
    for (let diag = 0; diag < 2 * BOARD_SIZE - 1; diag++) {
      for (let row = 0; row < BOARD_SIZE; row++) {
        const col = diag - row;
        if (col >= 0 && col < BOARD_SIZE) {
          positions.push([row, col]);
        }
      }
    }
  } else if (startCorner === "top_right") {
    for (let diag = 0; diag < 2 * BOARD_SIZE - 1; diag++) {
      for (let row = 0; row < BOARD_SIZE; row++) {
        const col = BOARD_SIZE - 1 - diag + row;
        if (col >= 0 && col < BOARD_SIZE) {
          positions.push([row, col]);
        }
      }
    }
  } else if (startCorner === "bottom_left") {
    for (let diag = 0; diag < 2 * BOARD_SIZE - 1; diag++) {
      for (let row = BOARD_SIZE - 1; row >= 0; row--) {
        const col = diag - (BOARD_SIZE - 1 - row);
        if (col >= 0 && col < BOARD_SIZE) {
          positions.push([row, col]);
        }
      }
    }
  } else if (startCorner === "bottom_right") {
    for (let diag = 0; diag < 2 * BOARD_SIZE - 1; diag++) {
      for (let row = BOARD_SIZE - 1; row >= 0; row--) {
        const col = BOARD_SIZE - 1 - diag + (BOARD_SIZE - 1 - row);
        if (col >= 0 && col < BOARD_SIZE) {
          positions.push([row, col]);
        }
      }
    }
  }

  return positions;
}

// Из центра
function fromCenter(): Position[] {
  const positions: Position[] = [];
  const center = BOARD_SIZE / 2;
  const added = new Set<string>();

  // Центральные 4 плитки
  const centerTiles: Position[] = [
    [center - 1, center - 1],
    [center - 1, center],
    [center, center - 1],
    [center, center],
  ];

  centerTiles.forEach(([r, c]) => {
    positions.push([r, c]);
    added.add(`${r},${c}`);
  });

  // Расширяем наружу
  for (let ring = 1; ring <= center; ring++) {
    const ringPositions: Position[] = [];
    for (let row = center - 1 - ring; row < center + 1 + ring; row++) {
      for (let col = center - 1 - ring; col < center + 1 + ring; col++) {
        if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
          const key = `${row},${col}`;
          if (!added.has(key)) {
            ringPositions.push([row, col]);
            added.add(key);
          }
        }
      }
    }
    ringPositions.sort((a, b) => {
      const distA = Math.abs(a[0] - center + 0.5) + Math.abs(a[1] - center + 0.5);
      const distB = Math.abs(b[0] - center + 0.5) + Math.abs(b[1] - center + 0.5);
      return distA - distB;
    });
    positions.push(...ringPositions);
  }

  return positions;
}

// К центру
function toCenter(): Position[] {
  return fromCenter().reverse();
}

// Случайный порядок
function randomOrder(): Position[] {
  const positions: Position[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      positions.push([row, col]);
    }
  }
  // Fisher-Yates shuffle
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  return positions;
}

// Все паттерны
export const ALL_PATTERNS: [string, () => Position[]][] = [
  ["snake_rows", () => snakeByRows()],
  ["snake_rows_reverse", snakeByRowsReverse],
  ["snake_rows_alt", () => snakeByRows(true)],
  ["snake_cols", () => snakeByCols()],
  ["snake_cols_reverse", snakeByColsReverse],
  ["snake_cols_alt", () => snakeByCols(true)],
  ["spiral_cw_top_left", () => spiralClockwise("top_left")],
  ["spiral_cw_top_right", () => spiralClockwise("top_right")],
  ["spiral_cw_bottom_right", () => spiralClockwise("bottom_right")],
  ["spiral_cw_bottom_left", () => spiralClockwise("bottom_left")],
  ["spiral_ccw_top_left", () => spiralCounterClockwise("top_left")],
  ["spiral_ccw_top_right", () => spiralCounterClockwise("top_right")],
  ["spiral_ccw_bottom_right", () => spiralCounterClockwise("bottom_right")],
  ["spiral_ccw_bottom_left", () => spiralCounterClockwise("bottom_left")],
  ["diagonal_top_left", () => diagonalWave("top_left")],
  ["diagonal_top_right", () => diagonalWave("top_right")],
  ["diagonal_bottom_left", () => diagonalWave("bottom_left")],
  ["diagonal_bottom_right", () => diagonalWave("bottom_right")],
  ["from_center", fromCenter],
  ["to_center", toCenter],
  ["random", randomOrder],
];

// Получить случайный паттерн
export function getRandomPattern(): { name: string; positions: Position[] } {
  const [name, patternFunc] = ALL_PATTERNS[Math.floor(Math.random() * ALL_PATTERNS.length)];
  return { name, positions: patternFunc() };
}
