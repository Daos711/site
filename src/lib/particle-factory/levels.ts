import type { Level } from './types';

export const LEVELS: Level[] = [
  {
    id: 1,
    name: 'Введение',
    hint: 'Направь песок в сборщик с помощью конвейеров',
    goals: [{ type: 'sand', amount: 10 }],
    fixedMachines: [
      { type: 'spawner_sand', x: 4, y: 0, fixed: true },
      { type: 'collector', x: 12, y: 11, fixed: true },
    ],
    availableMachines: [
      { type: 'conveyor_right', count: -1 },
      { type: 'conveyor_down', count: -1 },
    ],
  },
  {
    id: 2,
    name: 'Трансформация',
    hint: 'Преврати песок в стекло через нагреватель',
    goals: [{ type: 'glass', amount: 10 }],
    fixedMachines: [
      { type: 'spawner_sand', x: 2, y: 0, fixed: true },
      { type: 'collector', x: 13, y: 11, fixed: true },
    ],
    availableMachines: [
      { type: 'conveyor_right', count: -1 },
      { type: 'conveyor_down', count: -1 },
      { type: 'conveyor_left', count: -1 },
      { type: 'heater', count: 1 },
    ],
  },
  {
    id: 3,
    name: 'Два потока',
    hint: 'Собери стекло и пар одновременно',
    goals: [
      { type: 'glass', amount: 8 },
      { type: 'steam', amount: 8 },
    ],
    fixedMachines: [
      { type: 'spawner_sand', x: 2, y: 0, fixed: true },
      { type: 'spawner_water', x: 8, y: 0, fixed: true },
      { type: 'collector', x: 13, y: 11, fixed: true },
    ],
    availableMachines: [
      { type: 'conveyor_right', count: -1 },
      { type: 'conveyor_down', count: -1 },
      { type: 'conveyor_left', count: -1 },
      { type: 'conveyor_up', count: 4 },
      { type: 'heater', count: 2 },
    ],
  },
];
