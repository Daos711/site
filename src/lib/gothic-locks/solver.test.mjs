import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

// Use the repository's TypeScript compiler: this also runs under Node 20 in CI.
async function compile(relative, imports = {}) {
  const source = await readFile(new URL(relative, import.meta.url), 'utf8');
  let { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  });
  for (const [name, target] of Object.entries(imports)) {
    outputText = outputText.replaceAll(`'${name}'`, `'${target}'`).replaceAll(`"${name}"`, `"${target}"`);
  }
  return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
}
const simulatorUrl = await compile('./simulator.ts');
const { solveLock, simulateMove, verifySolution, validateConfig, groupMoves, physicalDirection } = await import(
  await compile('./solver.ts', { './simulator': simulatorUrl })
);
const independent = (positions) => ({ positions, links: positions.map(() => positions.map(() => 0)), direction: 'right-increases' });
const copy = (value) => JSON.parse(JSON.stringify(value));
const switches = (moves) => moves.reduce((sum, move, index) => sum + Number(index > 0 && moves[index - 1].plate !== move.plate), 0);

// Independent transition oracle: deliberately does not import the production simulator.
function transition(config, positions, plate, direction) {
  const result = positions.slice();
  for (let target = 0; target < result.length; target++) {
    result[target] += direction * (target === plate ? 1 : config.links[plate][target]);
  }
  return result.every((position) => position >= 1 && position <= 7) ? result : null;
}
function replay(config, moves) {
  let state = config.positions.slice();
  for (const move of moves) {
    state = transition(config, state, move.plate, move.direction);
    assert.ok(state, 'every intermediate move must fit within the lock');
  }
  assert.deepEqual(state, state.map(() => 4));
}
function oracle(config) {
  const start = config.positions.join(',');
  const target = config.positions.map(() => 4).join(',');
  const distance = new Map([[start, 0]]);
  const queue = [config.positions];
  const edges = new Map();
  for (let head = 0; head < queue.length; head++) {
    const state = queue[head];
    const key = state.join(',');
    if (key === target) break;
    const adjacent = [];
    for (let plate = 0; plate < state.length; plate++) for (const direction of [-1, 1]) {
      const next = transition(config, state, plate, direction);
      if (!next) continue;
      const nextKey = next.join(',');
      if (!distance.has(nextKey)) { distance.set(nextKey, distance.get(key) + 1); queue.push(next); }
      if (distance.get(nextKey) === distance.get(key) + 1) adjacent.push({ nextKey, plate });
    }
    edges.set(key, adjacent);
  }
  if (!distance.has(target)) return null;
  const costs = new Map([[start, new Map([[-1, 0]])]]);
  for (const state of queue) {
    const key = state.join(',');
    if (key === target) break;
    const current = costs.get(key);
    if (!current) continue;
    for (const edge of edges.get(key) ?? []) {
      let nextCosts = costs.get(edge.nextKey);
      if (!nextCosts) { nextCosts = new Map(); costs.set(edge.nextKey, nextCosts); }
      for (const [last, count] of current) {
        const candidate = count + Number(last !== -1 && last !== edge.plate);
        nextCosts.set(edge.plate, Math.min(nextCosts.get(edge.plate) ?? Infinity, candidate));
      }
    }
  }
  return { length: distance.get(target), switches: Math.min(...costs.get(target).values()) };
}

test('directed links are not symmetric, and plate index 0 is the bottom plate', () => {
  const config = independent([3, 4, 4, 4]);
  config.links[0][1] = -1;
  assert.deepEqual(simulateMove(config, config.positions, { plate: 0, direction: 1 }), [4, 3, 4, 4]);
  assert.deepEqual(simulateMove(config, config.positions, { plate: 1, direction: 1 }), [3, 5, 4, 4]);
  assert.deepEqual(simulateMove(config, config.positions, { plate: 0, direction: -1 }), [2, 5, 4, 4]);
});

test('a linked plate at either wall rejects the entire move without mutation', () => {
  for (const direction of [-1, 1]) for (const coupling of [-1, 1]) {
    const config = independent([4, direction * coupling === 1 ? 7 : 1, 4, 4]);
    config.links[0][1] = coupling;
    const before = copy(config);
    assert.equal(simulateMove(config, config.positions, { plate: 0, direction }), null);
    assert.deepEqual(config, before);
  }
  const pressedAtWall = independent([7, 4, 4, 4]);
  assert.equal(simulateMove(pressedAtWall, pressedAtWall.positions, { plate: 0, direction: 1 }), null);
});

test('validates incomplete, nonintegral, sparse, wrong-size and invalid-direction input', () => {
  const invalid = [null, {}, independent([4, 4, 4]), independent(Array(8).fill(4)), independent([4, 4, NaN, 4]), independent([4, 4, 2.5, 4]), { ...independent([4, 4, 4, 4]), direction: 'unknown' }];
  const sparsePositions = independent([4, 4, 4, 4]); delete sparsePositions.positions[1]; invalid.push(sparsePositions);
  const sparseRows = independent([4, 4, 4, 4]); delete sparseRows.links[1]; invalid.push(sparseRows);
  const sparseCells = independent([4, 4, 4, 4]); delete sparseCells.links[1][2]; invalid.push(sparseCells);
  const badLinks = independent([4, 4, 4, 4]); badLinks.links[0][2] = 2; invalid.push(badLinks);
  const diagonal = independent([4, 4, 4, 4]); diagonal.links[0][0] = 1; invalid.push(diagonal);
  for (const config of invalid) {
    assert.ok(validateConfig(config).length);
    assert.equal(solveLock(config).status, 'invalid');
  }
});

test('already solved yields no moves; independent plates yield a minimal solution', () => {
  assert.deepEqual(solveLock(independent([4, 4, 4, 4])).moves, []);
  const config = independent([1, 7, 2, 6]);
  const before = copy(config);
  const result = solveLock(config);
  assert.equal(result.status, 'solved');
  assert.equal(result.moves.length, 10);
  assert.equal(switches(result.moves), 3);
  replay(config, result.moves);
  assert.deepEqual(config, before);
});

test('exhaustion proves unsolvable while state/time limits do not', () => {
  const impossible = independent([3, 5, 4, 4]);
  impossible.links[0][1] = 1; impossible.links[1][0] = 1;
  assert.equal(solveLock(impossible).status, 'unsolvable');
  assert.equal(solveLock(impossible, { maxStates: 1 }).status, 'limit');
  assert.equal(solveLock(impossible, { maxMilliseconds: 0 }).status, 'limit');
  assert.equal(solveLock(impossible, { maxStates: 0 }).status, 'invalid');
  assert.equal(solveLock(impossible, { maxMilliseconds: Infinity }).status, 'invalid');
});

test('grouped playback preserves every intermediate move and physical direction', () => {
  const config = independent([1, 7, 4, 4]);
  const result = solveLock(config);
  const grouped = groupMoves(result.moves);
  assert.equal(grouped.length, 2);
  const expanded = grouped.flatMap(({ plate, direction, count }) => Array.from({ length: count }, () => ({ plate, direction })));
  assert.deepEqual(expanded, result.moves);
  assert.equal(verifySolution(config, expanded), true);
  assert.equal(verifySolution(config, [{ plate: 1, direction: 1 }]), false);
  assert.equal(physicalDirection({ plate: 0, direction: 1 }, 'right-increases'), 'right');
  assert.equal(physicalDirection({ plate: 0, direction: 1 }, 'right-decreases'), 'left');
  assert.deepEqual(solveLock({ ...config, direction: 'right-decreases' }).moves, result.moves);
});

test('independent oracle agrees on shortest moves and minimal switches for a seeded corpus', () => {
  let seed = 31;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  let solved = 0;
  for (let iteration = 0; iteration < 20; iteration++) {
    const config = independent(Array.from({ length: 4 }, () => 1 + Math.floor(random() * 7)));
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      if (i !== j && random() < 0.32) config.links[i][j] = random() < 0.5 ? -1 : 1;
    }
    const expected = oracle(config);
    const result = solveLock(config);
    if (!expected) assert.equal(result.status, 'unsolvable');
    else {
      solved++;
      assert.equal(result.status, 'solved');
      assert.equal(result.moves.length, expected.length);
      assert.equal(switches(result.moves), expected.switches);
      replay(config, result.moves);
    }
  }
  assert.ok(solved > 0);
});

function upstreamFixture() {
  const bytes = Buffer.from('GgiECjKooqkyqqg', 'base64url');
  let cursor = 0;
  const bits = (width) => {
    let value = 0;
    for (let i = 0; i < width; i++, cursor++) value = value * 2 + ((bytes[cursor >> 3] >> (7 - (cursor % 8))) & 1);
    return value;
  };
  assert.equal(bits(4), 1);
  const count = bits(2) + 4;
  const direction = bits(1) === 0 ? 'right-increases' : 'right-decreases';
  const positions = Array.from({ length: count }, () => bits(3) + 1);
  const config = { ...independent(positions), direction };
  for (let i = 0; i < count; i++) for (let j = 0; j < count; j++) if (i !== j) config.links[i][j] = bits(2) - 1;
  return config;
}

test('MIT upstream benchmark: 30 moves, 8 switches (not an identified in-game chest)', () => {
  const config = upstreamFixture();
  const result = solveLock(config);
  assert.equal(result.status, 'solved');
  assert.equal(result.moves.length, 30);
  assert.equal(switches(result.moves), 8);
  replay(config, result.moves);
  assert.deepEqual(solveLock(config).moves, result.moves);
});

test('seven-plate corpus regression stays within bounds and replays to target', () => {
  // MIT upstream deterministic random fixture, not a named chest or game version.
  const config = {
    positions: [6, 5, 6, 7, 4, 5, 3], direction: 'right-increases',
    links: [[0,0,0,0,-1,-1,1],[0,0,0,0,1,0,0],[0,0,0,0,0,0,0],[0,-1,-1,0,-1,0,0],[1,0,0,0,0,0,0],[0,-1,-1,0,0,0,0],[0,0,-1,0,0,0,0]],
  };
  const result = solveLock(config);
  assert.equal(result.status, 'solved');
  replay(config, result.moves);
});
