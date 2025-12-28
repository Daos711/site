import {
  Particle,
  ParticleType,
  Machine,
  PARTICLE_PROPERTIES,
  GRID_WIDTH,
  GRID_HEIGHT,
  CELL_SIZE,
  MAX_PARTICLES,
} from './types';

let particleIdCounter = 0;

export function createParticle(type: ParticleType, x: number, y: number): Particle {
  return {
    id: `p${particleIdCounter++}`,
    type,
    x,
    y,
    vx: (Math.random() - 0.5) * 0.5,
    vy: 0,
  };
}

export function updateParticles(
  particles: Particle[],
  machines: Machine[]
): { particles: Particle[]; collected: Partial<Record<ParticleType, number>> } {
  const collected: Partial<Record<ParticleType, number>> = {};
  const toRemove = new Set<string>();

  // Обновляем каждую частицу
  for (const particle of particles) {
    const props = PARTICLE_PROPERTIES[particle.type];

    // Гравитация
    particle.vy += props.density * 0.08;

    // Трение воздуха
    particle.vx *= 0.98;
    particle.vy *= 0.98;

    // Применяем воздействие машин
    const cellX = Math.floor(particle.x / CELL_SIZE);
    const cellY = Math.floor(particle.y / CELL_SIZE);

    for (const machine of machines) {
      if (machine.x === cellX && machine.y === cellY) {
        applyMachineEffect(particle, machine, toRemove, collected);
      }
    }

    // Обновляем позицию
    particle.x += particle.vx;
    particle.y += particle.vy;

    // Границы поля
    const radius = 6;
    const minX = radius;
    const maxX = GRID_WIDTH * CELL_SIZE - radius;
    const minY = radius;
    const maxY = GRID_HEIGHT * CELL_SIZE - radius;

    if (particle.x < minX) {
      particle.x = minX;
      particle.vx *= -0.5;
    }
    if (particle.x > maxX) {
      particle.x = maxX;
      particle.vx *= -0.5;
    }
    if (particle.y < minY) {
      particle.y = minY;
      particle.vy *= -0.5;
    }
    if (particle.y > maxY) {
      particle.y = maxY;
      particle.vy *= -0.3;
    }
  }

  // Удаляем собранные частицы
  const remainingParticles = particles.filter((p) => !toRemove.has(p.id));

  return { particles: remainingParticles, collected };
}

function applyMachineEffect(
  particle: Particle,
  machine: Machine,
  toRemove: Set<string>,
  collected: Partial<Record<ParticleType, number>>
): void {
  const force = 1.2;

  switch (machine.type) {
    case 'conveyor_up':
      particle.vy -= force;
      break;
    case 'conveyor_down':
      particle.vy += force;
      break;
    case 'conveyor_left':
      particle.vx -= force;
      break;
    case 'conveyor_right':
      particle.vx += force;
      break;
    case 'heater':
      if (particle.type === 'sand') {
        particle.type = 'glass';
      } else if (particle.type === 'water') {
        particle.type = 'steam';
      }
      break;
    case 'collector':
      toRemove.add(particle.id);
      collected[particle.type] = (collected[particle.type] || 0) + 1;
      break;
  }
}

export function spawnParticles(
  particles: Particle[],
  machines: Machine[],
  frameCount: number,
  spawnInterval: number
): Particle[] {
  if (particles.length >= MAX_PARTICLES) return particles;
  if (frameCount % spawnInterval !== 0) return particles;

  const newParticles = [...particles];

  for (const machine of machines) {
    if (machine.type === 'spawner_sand' || machine.type === 'spawner_water') {
      const type: ParticleType = machine.type === 'spawner_sand' ? 'sand' : 'water';
      const x = machine.x * CELL_SIZE + CELL_SIZE / 2;
      const y = machine.y * CELL_SIZE + CELL_SIZE / 2;
      newParticles.push(createParticle(type, x, y));
    }
  }

  return newParticles;
}

export function getMachineAt(machines: Machine[], cellX: number, cellY: number): Machine | undefined {
  return machines.find((m) => m.x === cellX && m.y === cellY);
}

export function canPlaceMachine(
  machines: Machine[],
  cellX: number,
  cellY: number
): boolean {
  if (cellX < 0 || cellX >= GRID_WIDTH || cellY < 0 || cellY >= GRID_HEIGHT) {
    return false;
  }
  return !getMachineAt(machines, cellX, cellY);
}
