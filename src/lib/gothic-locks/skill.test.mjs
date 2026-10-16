import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

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
const { simulateMove } = await import(simulatorUrl);
const { solveLock } = await import(await compile('./solver.ts', { './simulator': simulatorUrl }));
const { resolveSkillConfig, configForPrecision, SKILLS, PRECISION_BY_SKILL } = await import(
  await compile('./skill.ts', { './simulator': simulatorUrl }),
);
const copy = (value) => JSON.parse(JSON.stringify(value));
// Deliberately synthetic: never taken from a game's extracted lock array.
const base = {
  positions: [2, 3, 4, 5],
  links: [[0, 1, 0, 0], [0, 0, -1, 0], [0, 0, 0, 1], [0, 0, 0, 0]],
  direction: 'right-increases',
};
const order = [[1, 2, -1], [0, 1, 1], [2, 3, 1]];

function independentlyReplay(config, moves) {
  let positions = config.positions.slice();
  for (const move of moves) {
    const next = positions.slice();
    for (let target = 0; target < next.length; target++) {
      next[target] += move.direction * (target === move.plate ? 1 : config.links[move.plate][target]);
    }
    assert.ok(next.every((position) => position >= 1 && position <= 7));
    positions = next;
  }
  assert.deepEqual(positions, positions.map(() => 4));
}

for (const skill of SKILLS) {
  test(`synthetic ${skill} profile removes only the authored prefix and solves safely`, () => {
    const before = copy(base);
    const config = configForPrecision(base, order, PRECISION_BY_SKILL[skill]);
    assert.ok(config);
    for (let index = 0; index < order.length; index++) {
      const [from, to, sign] = order[index];
      assert.equal(config.links[from][to], index < PRECISION_BY_SKILL[skill] ? 0 : sign);
    }
    assert.deepEqual(base, before);
    const result = solveLock(config);
    assert.equal(result.status, 'solved', result.reason);
    independentlyReplay(config, result.moves);
  });
}

test('profiles use author order rather than the matrix row order', () => {
  const trained = configForPrecision(base, order, 1);
  assert.equal(trained.links[1][2], 0);
  assert.equal(trained.links[0][1], 1);
  const differentOrder = configForPrecision(base, [order[1], order[0], order[2]], 1);
  assert.equal(differentOrder.links[0][1], 0);
  assert.equal(differentOrder.links[1][2], -1);
});

test('skills retain directed, non-transitive effects and atomic wall rejection', () => {
  const full = configForPrecision(base, order, 0);
  assert.deepEqual(simulateMove(full, [4, 4, 4, 4], { plate: 0, direction: 1 }), [5, 5, 4, 4]);
  assert.deepEqual(simulateMove(full, [4, 4, 4, 4], { plate: 1, direction: 1 }), [4, 5, 3, 4]);
  assert.equal(simulateMove(full, [4, 7, 4, 4], { plate: 0, direction: 1 }), null);
  assert.equal(simulateMove(full, [4, 1, 4, 4], { plate: 0, direction: -1 }), null);
  const master = configForPrecision(base, order, 2);
  assert.deepEqual(simulateMove(master, [4, 7, 4, 4], { plate: 0, direction: 1 }), [5, 7, 4, 4]);
  assert.equal(simulateMove(master, [4, 4, 4, 7], { plate: 2, direction: 1 }), null);
  assert.equal(simulateMove(master, [7, 4, 4, 4], { plate: 0, direction: 1 }), null);
});

test('precision rounds half upward, clamps removal and rejects invalid values', () => {
  assert.deepEqual(configForPrecision(base, order, 0.49).links, base.links);
  assert.deepEqual(configForPrecision(base, order, 0.5), configForPrecision(base, order, 1));
  assert.deepEqual(configForPrecision(base, order, 1.49), configForPrecision(base, order, 1));
  assert.deepEqual(configForPrecision(base, order, 1.5), configForPrecision(base, order, 2));
  assert.ok(configForPrecision(base, order, 100).links.every((row) => row.every((value) => value === 0)));
  for (const value of [-1, NaN, Infinity, -Infinity, undefined, null, '1']) {
    assert.equal(configForPrecision(base, order, value), null);
  }
});

test('incomplete, duplicated, reversed, wrong-sign and malformed edge orders are rejected', () => {
  const badOrders = [
    order.slice(1), [...order, order[0]], [order[0], order[0], order[2]],
    [[2, 1, -1], order[1], order[2]], [[1, 2, 1], order[1], order[2]],
    [[1, 1, -1], order[1], order[2]], [[1, 4, -1], order[1], order[2]],
    [[-1, 2, -1], order[1], order[2]], [[1.5, 2, -1], order[1], order[2]],
    [[1, 2, 0], order[1], order[2]], [[1, 2, -1, 0], order[1], order[2]],
    [undefined, order[1], order[2]], new Array(3), null, {},
  ];
  for (const invalid of badOrders) assert.equal(configForPrecision(base, invalid, 0), null);
  assert.equal(configForPrecision({ ...base, positions: [8, 3, 4, 5] }, order, 1), null);
});

test('empty confirmed edge order is valid only for an independent-plate lock', () => {
  const independent = { ...base, links: base.links.map((row) => row.map(() => 0)) };
  assert.deepEqual(configForPrecision(independent, [], 2), independent);
  assert.equal(configForPrecision(base, [], 2), null);
});

test('priority observations never silently become none/trained/master profiles', () => {
  const priorityIds = [
    'OC_Chest_Scatty_Lock', 'SC_Chest_CorKalom_01_Lock', 'SC_Chest_CorKalom_03_Lock',
    'OC_Fisk_Hut_Door_Lock', 'OC_Fisk_Storage_Door_Lock',
    ...Array.from({ length: 8 }, (_, index) => `OC_Chest_Fisk_${String(index + 1).padStart(2, '0')}_Lock`),
  ];
  for (const id of priorityIds) for (const skill of SKILLS) {
    assert.equal(resolveSkillConfig(base, undefined, skill), null, `${id}/${skill}`);
    assert.equal(resolveSkillConfig(base, {}, skill), null, `${id}/${skill}`);
  }
});

test('only an explicitly supplied valid profile resolves; its mutable state is isolated', () => {
  const trained = configForPrecision(base, order, 1);
  const profiles = { trained };
  const result = resolveSkillConfig(null, profiles, 'trained');
  assert.deepEqual(result, trained);
  assert.equal(resolveSkillConfig(base, profiles, 'none'), null);
  assert.equal(resolveSkillConfig(base, profiles, 'master'), null);
  assert.equal(resolveSkillConfig(base, profiles, 'unknown'), null);
  assert.equal(resolveSkillConfig(base, { trained: { ...base, positions: [] } }, 'trained'), null);
  result.positions[0] = 7;
  result.links[0][1] = 0;
  assert.equal(trained.positions[0], 2);
  assert.equal(trained.links[0][1], 1);
  assert.equal(resolveSkillConfig(base, Object.create({ trained }), 'trained'), null);
});
