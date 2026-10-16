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
const { LOCK_CATALOG } = await import(await compile('./catalog.ts'));
const simulatorUrl = await compile('./simulator.ts');
const { solveLock, validateConfig } = await import(await compile('./solver.ts', { './simulator': simulatorUrl }));

test('catalog reports its limited provenance and preserves distinct Cor Galom records', () => {
  assert.equal(LOCK_CATALOG.length, 20);
  assert.equal(new Set(LOCK_CATALOG.map(entry => entry.id)).size, LOCK_CATALOG.length);
  for (const entry of LOCK_CATALOG) {
    assert.equal(entry.verification, 'source');
    assert.equal(entry.gameVersion, null);
    assert.equal(entry.source.license, 'MIT');
    assert.match(entry.source.url, /98739a78084a1506530c4081a83e30bc0ca1c526/);
    assert.deepEqual(validateConfig(entry.config), []);
  }
  const first = LOCK_CATALOG.find(entry => entry.id === 'cor-galom-recipe');
  const second = LOCK_CATALOG.find(entry => entry.id === 'cor-galom-second-variant');
  assert.deepEqual(first.config.positions, [7, 7, 6, 1]);
  assert.deepEqual(second.config.positions, [6, 5, 5, 7, 1, 4]);
  assert.equal(second.floor, null);
  assert.equal(second.route, null);
  assert.ok(second.warnings.some(warning => warning.includes('6, 6, 5, 7, 1, 4')));
});

for (const entry of LOCK_CATALOG) {
  test(`catalog config can be solved and independently replayed: ${entry.id}`, () => {
    const result = solveLock(entry.config, { maxMilliseconds: 15000 });
    assert.equal(result.status, 'solved', result.reason);
    // Independent replay catches changed matrix orientation, invalid edges and bad imports.
    let state = entry.config.positions.slice();
    for (const move of result.moves) {
      state = state.map((position, target) => position + move.direction * (target === move.plate ? 1 : entry.config.links[move.plate][target]));
      assert.ok(state.every(position => position >= 1 && position <= 7));
    }
    assert.deepEqual(state, state.map(() => 4));
    const knownLengths = { 'scatty-chest': 31, 'cor-galom-recipe': 15, 'cor-galom-second-variant': 59 };
    if (entry.id in knownLengths) assert.equal(result.moves.length, knownLengths[entry.id]);
  });
}
