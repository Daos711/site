// Типы частиц
export type ParticleType = 'sand' | 'water' | 'glass' | 'steam';

export interface Particle {
  id: string;
  type: ParticleType;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface ParticleProperties {
  color: string;
  density: number;
  name: string;
  glow?: string;
}

export const PARTICLE_PROPERTIES: Record<ParticleType, ParticleProperties> = {
  sand: { color: '#e6c86e', density: 3, name: 'Песок', glow: '#d4a84a' },
  water: { color: '#4a9eff', density: 1, name: 'Вода', glow: '#2178dd' },
  glass: { color: '#88ddff', density: 2, name: 'Стекло', glow: '#66bbdd' },
  steam: { color: '#cccccc', density: -1, name: 'Пар', glow: '#aaaaaa' },
};

// Типы машин
export type MachineType =
  | 'spawner_sand'
  | 'spawner_water'
  | 'conveyor_up'
  | 'conveyor_down'
  | 'conveyor_left'
  | 'conveyor_right'
  | 'heater'
  | 'collector';

export interface Machine {
  id: string;
  type: MachineType;
  x: number;
  y: number;
  fixed?: boolean;
}

export interface MachineProperties {
  name: string;
  icon: string;
  color: string;
  description: string;
}

export const MACHINE_PROPERTIES: Record<MachineType, MachineProperties> = {
  spawner_sand: {
    name: 'Источник песка',
    icon: '⏬',
    color: '#e6c86e',
    description: 'Создаёт частицы песка',
  },
  spawner_water: {
    name: 'Источник воды',
    icon: '💧',
    color: '#4a9eff',
    description: 'Создаёт частицы воды',
  },
  conveyor_up: {
    name: 'Конвейер ↑',
    icon: '⬆️',
    color: '#666666',
    description: 'Толкает частицы вверх',
  },
  conveyor_down: {
    name: 'Конвейер ↓',
    icon: '⬇️',
    color: '#666666',
    description: 'Толкает частицы вниз',
  },
  conveyor_left: {
    name: 'Конвейер ←',
    icon: '⬅️',
    color: '#666666',
    description: 'Толкает частицы влево',
  },
  conveyor_right: {
    name: 'Конвейер →',
    icon: '➡️',
    color: '#666666',
    description: 'Толкает частицы вправо',
  },
  heater: {
    name: 'Нагреватель',
    icon: '🔥',
    color: '#ff6633',
    description: 'Песок → Стекло, Вода → Пар',
  },
  collector: {
    name: 'Сборщик',
    icon: '📦',
    color: '#44aa44',
    description: 'Собирает частицы',
  },
};

// Уровни
export interface LevelGoal {
  type: ParticleType;
  amount: number;
}

export interface AvailableMachine {
  type: MachineType;
  count: number; // -1 = бесконечно
}

export interface Level {
  id: number;
  name: string;
  hint: string;
  goals: LevelGoal[];
  fixedMachines: Omit<Machine, 'id'>[];
  availableMachines: AvailableMachine[];
}

// Состояние игры
export interface GameState {
  particles: Particle[];
  machines: Machine[];
  collected: Record<ParticleType, number>;
  selectedMachine: MachineType | null;
  isRunning: boolean;
  isComplete: boolean;
  currentLevel: number;
  placedMachines: Partial<Record<MachineType, number>>;
}

// Константы
export const GRID_WIDTH = 20;
export const GRID_HEIGHT = 16;
export const CELL_SIZE = 25;
export const CANVAS_WIDTH = GRID_WIDTH * CELL_SIZE;
export const CANVAS_HEIGHT = GRID_HEIGHT * CELL_SIZE;
export const MAX_PARTICLES = 200;
export const SPAWN_INTERVAL = 30; // кадров между спавном
