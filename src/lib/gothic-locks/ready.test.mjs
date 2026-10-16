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
const jsonModule = (value) => `data:text/javascript;base64,${Buffer.from('export default ' + JSON.stringify(value)).toString('base64')}`;
const copy = (value) => JSON.parse(JSON.stringify(value));
const simulatorUrl = await compile('./simulator.ts');
async function loadReady(ready, guides) {
  return import(await compile('./ready-solutions.ts', {
    './simulator': simulatorUrl,
    './data/ready-solutions.json': jsonModule(ready),
    './data/solution-guides.json': jsonModule(guides),
  }));
}
const rawReady = JSON.parse(await readFile(new URL('./data/ready-solutions.json', import.meta.url), 'utf8'));
const rawGuides = JSON.parse(await readFile(new URL('./data/solution-guides.json', import.meta.url), 'utf8'));
const production = await loadReady(rawReady, rawGuides);
const { LOCK_CATALOG: catalog } = await import(await compile('./catalog.ts'));

// Entirely synthetic fixtures, not extracted game data. The third pin starts
// off-centre so merely accepting the first two commands cannot pass the goal.
const config = {
  positions: [2, 4, 5, 4],
  links: Array.from({ length: 4 }, () => [0, 0, 0, 0]),
  direction: 'right-decreases',
};
const none = {
  id: 'synthetic-a-none', entryId: 'entry-a', skill: 'none', variantName: 'Synthetic none',
  config, plateCount: 4,
  moves: [{ plate: 0, direction: 1 }, { plate: 0, direction: 1 }, { plate: 2, direction: -1 }],
  direction: 'right-decreases', verification: 'simulated', gameVersion: null,
  source: { name: 'Synthetic unit-test fixture', url: 'https://example.test/fixture', license: 'CC0-1.0' },
  evidence: [], notes: ['Synthetic fixture; no game identity asserted.'],
};
const master = { ...copy(none), id: 'synthetic-a-master', skill: 'master', variantName: 'Synthetic master' };
master.config.positions[0] = 3;
master.moves.shift();
const published = { ...copy(none), id: 'synthetic-a2-trained', entryId: 'entry-a2', skill: 'trained', config: null, plateCount: null, verification: 'published' };
const bad = { ...copy(none), id: 'invalid-missing-graph', entryId: 'entry-d', config: null };
// Both mechanisms open after the same commands, while their intermediate
// positions differ. The second mechanism couples the third plate to the first.
const alternativeA = { ...copy(config), positions: [2, 4, 7, 4] };
const alternativeB = { ...copy(config), positions: [5, 4, 7, 4] };
alternativeB.links[2][0] = 1;
const universal = {
  ...copy(none), id: 'synthetic-universal', config: null,
  configAlternatives: [alternativeA, alternativeB], derivation: 'universal',
  moves: [
    { plate: 0, direction: 1 }, { plate: 0, direction: 1 },
    { plate: 2, direction: -1 }, { plate: 2, direction: -1 }, { plate: 2, direction: -1 },
  ],
};
const fixtureGuides = [
  { entryId: 'entry-a', skill: 'unknown', name: 'A external', url: 'https://example.test/a', section: 'a' },
  { entryId: 'entry-a2', skill: 'none', name: 'A2 novice', url: 'https://example.test/a2', section: 'a2' },
  { entryId: 'entry-b', skill: 'master', name: 'B master', url: 'https://example.test/b', section: 'b' },
  { entryId: 'entry-c', skill: 'unknown', name: 'C unknown', url: 'https://example.test/c', section: 'c' },
];
const fixtures = await loadReady([none, master, published, bad], fixtureGuides);
const fixtureEntries = [
  { id: 'entry-a', type: 'chest' }, { id: 'entry-a2', type: 'underwater' },
  { id: 'entry-b', type: 'door' }, { id: 'entry-c', type: 'chest' }, { id: 'entry-d', type: 'unknown' },
];

function replayEveryPress(solution, mechanism) {
  const configs = mechanism ? [mechanism] : [solution.config, ...(solution.configAlternatives ?? [])].filter(Boolean);
  assert.ok(configs.length, solution.id + ' lacks a graph');
  for (const [variant, config] of configs.entries()) replayConfig(solution, config, variant);
}

function replayConfig(solution, config, variant) {
  const label = `${solution.id}, configuration ${variant + 1}`;
  const { positions, links } = config;
  let state = positions.slice();
  assert.ok(state.every(value => Number.isInteger(value) && value >= 1 && value <= 7));
  for (const [index, move] of solution.moves.entries()) {
    assert.ok(Number.isInteger(move.plate) && move.plate >= 0 && move.plate < state.length);
    assert.ok(move.direction === -1 || move.direction === 1);
    state = state.map((value, target) => value + move.direction * (target === move.plate ? 1 : links[move.plate][target]));
    assert.ok(state.every(value => value >= 1 && value <= 7), `${label}: wall collision on atomic press ${index + 1}`);
  }
  assert.deepEqual(state, state.map(() => 4), label + ' does not open the lock');
}

test('ready unit: safe atomic route passes, a wall crossing fails even when the final state would be solved', () => {
  assert.deepEqual(fixtures.solutionIssues(none), []);
  replayEveryPress(none);
  const collision = copy(none);
  collision.moves.unshift({ plate: 0, direction: -1 }, { plate: 0, direction: -1 }, { plate: 0, direction: 1 }, { plate: 0, direction: 1 });
  assert.ok(fixtures.solutionIssues(collision).length);
  assert.throws(() => replayEveryPress(collision), /wall collision/);
  const unfinished = copy(none);
  unfinished.moves.pop();
  assert.ok(fixtures.solutionIssues(unfinished).length);
});

test('ready unit: a universal route is verified against every distinct candidate without selecting a graph', async () => {
  assert.deepEqual(fixtures.solutionIssues(universal), []);
  assert.notDeepEqual(alternativeA, alternativeB);
  replayEveryPress(universal);
  const loaded = await loadReady([universal], []);
  const [retained] = loaded.readyFor('entry-a', 'none');
  assert.equal(retained.config, null);
  assert.equal(retained.derivation, 'universal');
  assert.deepEqual(retained.configAlternatives, [alternativeA, alternativeB]);
  assert.equal(retained.verification, 'simulated');
});

test('ready unit: one unsafe alternative rejects the whole route even when it would reach the goal', async () => {
  const unsafe = copy(universal);
  // This cancelling excursion reaches 5 in A and 8 in B. An endpoint-only
  // check would incorrectly accept both, since the excursion has zero net move.
  unsafe.moves.unshift(
    { plate: 0, direction: 1 }, { plate: 0, direction: 1 }, { plate: 0, direction: 1 },
    { plate: 0, direction: -1 }, { plate: 0, direction: -1 }, { plate: 0, direction: -1 },
  );
  replayEveryPress(unsafe, alternativeA);
  assert.throws(() => replayEveryPress(unsafe, alternativeB), /wall collision on atomic press 3/);
  assert.ok(fixtures.solutionIssues(unsafe).length);
  assert.ok(fixtures.solutionIssues({ ...unsafe, configAlternatives: [...unsafe.configAlternatives].reverse() }).length);
  assert.ok(fixtures.solutionIssues({ ...unsafe, config: alternativeA }).length, 'A safe primary graph must not hide an unsafe alternative');
  const loaded = await loadReady([unsafe], []);
  assert.deepEqual(loaded.READY_SOLUTIONS, []);
  assert.equal(loaded.solutionCoverage([{ id: 'entry-a', type: 'chest' }]).ready, 0);
});

test('ready unit: incomplete, malformed, mismatched and non-solving alternative sets are rejected', () => {
  const changes = [
    s => { s.configAlternatives = []; },
    s => { s.configAlternatives.pop(); },
    s => { s.configAlternatives = {}; },
    s => { s.configAlternatives[1].direction = 'right-increases'; },
    s => { s.configAlternatives[1].positions[0] = 8; },
    s => { s.configAlternatives[1].positions[0] = 4; },
    s => { s.configAlternatives[1].links[2][0] = 0; },
    s => { s.configAlternatives[1].links[2][0] = 2; },
    s => { s.configAlternatives[1].links[0][0] = 1; },
    s => { s.configAlternatives[1].positions.pop(); },
    s => { s.plateCount = null; },
    s => { s.plateCount = 5; },
  ];
  for (const change of changes) {
    const candidate = copy(universal);
    change(candidate);
    assert.ok(fixtures.solutionIssues(candidate).length, String(change));
  }
});

test('ready unit: malformed coordinates, profile metadata and missing per-source license are rejected', () => {
  const changes = [
    s => { s.moves[0].plate = -1; }, s => { s.moves[0].plate = 4; },
    s => { s.moves[0].plate = 0.5; }, s => { s.moves[0].direction = 0; },
    s => { s.moves[0].direction = 2; }, s => { s.moves = []; },
    s => { s.plateCount = 5; }, s => { s.plateCount = 3; },
    s => { s.skill = 'unknown'; }, s => { s.direction = 'right-increases'; },
    s => { s.config.positions[0] = 8; }, s => { s.config.links[0][1] = 1; },
    s => { s.source.license = ''; }, s => { s.source.url = 'http://example.test/a'; },
    s => { s.id = ''; }, s => { s.entryId = ''; }, s => { s.verification = 'verified-in-game'; },
  ];
  for (const change of changes) {
    const candidate = copy(none);
    change(candidate);
    assert.ok(fixtures.solutionIssues(candidate).length, String(change));
  }
});

test('ready unit: published commands remain published, and missing graphs cannot be called simulated', () => {
  assert.deepEqual(fixtures.solutionIssues(published), []);
  const found = fixtures.readyFor('entry-a2', 'trained');
  assert.equal(found.length, 1);
  assert.equal(found[0].verification, 'published');
  assert.equal(found[0].config, null);
  assert.equal(found[0].plateCount, null);
  assert.ok(fixtures.solutionIssues({ ...published, verification: 'simulated' }).length);
  assert.equal(fixtures.READY_SOLUTIONS.some(solution => solution.id === bad.id), false);
});

test('ready unit: skill selection is exact and never falls back to another skill or similar ID', () => {
  assert.deepEqual(fixtures.readyFor('entry-a', 'none').map(s => s.id), [none.id]);
  assert.deepEqual(fixtures.readyFor('entry-a', 'master').map(s => s.id), [master.id]);
  assert.deepEqual(fixtures.readyFor('entry-a', 'trained'), []);
  assert.deepEqual(fixtures.readyFor('entry-a2', 'none'), []);
  assert.deepEqual(fixtures.readyFor('entry-a2', 'master'), []);
  assert.deepEqual(fixtures.readyFor('entry-a', 'unknown'), []);
  for (const id of ['entry-', 'entry-a ', 'ENTRY-A', 'missing']) assert.deepEqual(fixtures.readyFor(id), []);
  assert.equal(fixtures.readyFor('entry-a').length, 2);
});

test('ready unit: explicit guide skills stay restricted while genuinely unknown guides remain marked unknown', () => {
  assert.deepEqual(fixtures.guidesFor('entry-b', 'none'), []);
  assert.deepEqual(fixtures.guidesFor('entry-b', 'trained'), []);
  assert.equal(fixtures.guidesFor('entry-b', 'master').length, 1);
  for (const skill of ['none', 'trained', 'master']) {
    assert.equal(fixtures.guidesFor('entry-c', skill)[0].skill, 'unknown');
  }
  assert.deepEqual(fixtures.guidesFor('entry-'), []);
});

test('ready unit: ready, external and missing coverage are disjoint, skill-specific and count objects rather than variants', () => {
  assert.deepEqual(fixtures.solutionCoverage(fixtureEntries), { total: 5, chests: 3, ready: 2, external: 2, missing: 1 });
  for (const skill of ['none', 'trained', 'master']) {
    assert.deepEqual(fixtures.solutionCoverage(fixtureEntries, skill), { total: 5, chests: 3, ready: 1, external: 2, missing: 2 });
  }
  assert.deepEqual(fixtures.solutionCoverage([]), { total: 0, chests: 0, ready: 0, external: 0, missing: 0 });
});

test('ready unit: resume uses grouped-command index, accepts completion and rejects stale or corrupt steps', () => {
  const signature = fixtures.solutionSignature(none);
  assert.equal(fixtures.restoredReadyStep(none), 0);
  assert.equal(fixtures.restoredReadyStep(none, { signature, step: 1 }), 1);
  assert.equal(fixtures.restoredReadyStep(none, { signature, step: 2 }), 2);
  for (const step of [-1, 0.5, 3, NaN, Infinity, '1', null]) {
    assert.equal(fixtures.restoredReadyStep(none, { signature, step }), 0);
  }
  assert.equal(fixtures.restoredReadyStep(none, { signature: 'old', step: 1 }), 0);
});

test('ready unit: changing a profile, combination, direction, skill or variant invalidates saved progress', () => {
  const signature = fixtures.solutionSignature(none);
  assert.equal(fixtures.solutionSignature(copy(none)), signature);
  const changes = [
    s => { s.id += '-different'; }, s => { s.skill = 'master'; },
    s => { s.config.positions[0] = 3; }, s => { s.config.links[0][1] = 1; },
    s => { s.moves[0].direction = -1; }, s => { s.moves[0].plate = 1; },
    s => { s.direction = 'right-increases'; }, s => { s.config = null; },
  ];
  for (const change of changes) {
    const changed = copy(none);
    change(changed);
    assert.notEqual(fixtures.solutionSignature(changed), signature);
    assert.equal(fixtures.restoredReadyStep(changed, { signature, step: 1 }), 0);
  }
  assert.equal(fixtures.restoredReadyStep(master, { signature, step: 1 }), 0);
});

test('ready unit: universal progress survives exact reloads and resets when any candidate mechanism changes', () => {
  const signature = fixtures.solutionSignature(universal);
  assert.equal(fixtures.solutionSignature(copy(universal)), signature);
  assert.equal(fixtures.restoredReadyStep(copy(universal), { signature, step: 1 }), 1);
  assert.equal(fixtures.restoredReadyStep(copy(universal), { signature, step: 2 }), 2);
  const changes = [
    s => { s.configAlternatives[0].positions[0] = 3; },
    s => { s.configAlternatives[1].positions[0] = 4; },
    s => { s.configAlternatives[1].links[2][0] = 0; },
    s => { s.configAlternatives[1].direction = 'right-increases'; },
    s => { s.configAlternatives.pop(); },
    s => { s.configAlternatives.push(copy(config)); },
    s => { s.configAlternatives.reverse(); },
    s => { s.configAlternatives = undefined; },
    s => { s.config = s.configAlternatives[0]; },
    s => { s.skill = 'trained'; },
  ];
  for (const change of changes) {
    const changed = copy(universal);
    change(changed);
    assert.notEqual(fixtures.solutionSignature(changed), signature, String(change));
    assert.equal(fixtures.restoredReadyStep(changed, { signature, step: 1 }), 0, String(change));
  }
});

test('ready data: initialized data is admitted completely, with unique IDs, exact catalog targets and a license on every source', () => {
  assert.ok(rawReady.length > 0, 'Ready JSON must be populated before releasing');
  assert.equal(new Set(rawReady.map(s => s.id)).size, rawReady.length);
  assert.equal(production.READY_SOLUTIONS.length, rawReady.length, 'Do not silently ship rows dropped by the runtime validator');
  const catalogIds = new Set(catalog.map(entry => entry.id));
  for (const solution of rawReady) {
    assert.deepEqual(production.solutionIssues(solution), [], solution.id);
    assert.ok(catalogIds.has(solution.entryId), `${solution.id}: exact catalog ID missing`);
    assert.ok(solution.source.name && solution.source.url.startsWith('https://') && solution.source.license?.trim(), solution.id);
    assert.ok(Array.isArray(solution.notes) && Array.isArray(solution.evidence), solution.id);
    for (const evidence of solution.evidence) assert.ok(evidence.name && evidence.url.startsWith('https://'), solution.id);
    if (solution.derivation !== undefined) assert.ok(['observed', 'inferred', 'universal'].includes(solution.derivation), solution.id);
    if (solution.derivation === 'universal') {
      assert.equal(solution.config, null, solution.id + ' must not present one alternative as the selected mechanism');
      assert.ok(solution.configAlternatives?.length >= 2, solution.id);
      assert.equal(new Set(solution.configAlternatives.map(config => JSON.stringify(config))).size, solution.configAlternatives.length, solution.id + ' repeats the same alternative');
    }
    if (solution.verification === 'simulated') replayEveryPress(solution);
    else assert.equal(solution.verification, 'published');
  }
});

test('ready data: all external guides target actual catalog objects and keep explicit known or unknown skill', () => {
  const catalogIds = new Set(catalog.map(entry => entry.id));
  const guideKeys = rawGuides.map(guide => JSON.stringify([guide.entryId, guide.skill, guide.url, guide.section]));
  assert.equal(new Set(guideKeys).size, guideKeys.length, 'Duplicate external guide');
  for (const guide of rawGuides) {
    assert.ok(catalogIds.has(guide.entryId), guide.entryId);
    assert.ok(['none', 'trained', 'master', 'unknown'].includes(guide.skill));
    assert.ok(guide.name && guide.url.startsWith('https://') && guide.section, guide.entryId);
  }
});

test('ready data: exported choices and coverage preserve every catalog object without skill fallback or overlap', () => {
  for (const skill of ['none', 'trained', 'master']) {
    const selected = new Set();
    const external = new Set();
    const missing = new Set();
    for (const entry of catalog) {
      const solutions = production.readyFor(entry.id, skill);
      const guides = production.guidesFor(entry.id, skill);
      for (const solution of solutions) {
        assert.equal(solution.entryId, entry.id);
        assert.equal(solution.skill, skill);
      }
      for (const guide of guides) {
        assert.equal(guide.entryId, entry.id);
        assert.ok(guide.skill === skill || guide.skill === 'unknown');
      }
      if (solutions.length) selected.add(entry.id);
      else if (guides.length) external.add(entry.id);
      else missing.add(entry.id);
    }
    const counts = production.solutionCoverage(catalog, skill);
    assert.equal(counts.ready, selected.size);
    assert.equal(counts.external, external.size);
    assert.equal(counts.missing, missing.size);
    assert.equal(counts.ready + counts.external + counts.missing, catalog.length);
    assert.equal(new Set([...selected, ...external, ...missing]).size, catalog.length);
  }
});
