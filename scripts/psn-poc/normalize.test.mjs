import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveTitleStatus,
  mergeTrophies,
  normalizeGroups,
  normalizeTitle,
  selectSampleTitle,
} from "./normalize.mjs";
import { readFixture } from "./test-helpers.mjs";

test("normalizeTitle preserves PS5 trophy2 identity and platform", async () => {
  const fixture = await readFixture("titles-pages.json");
  const title = normalizeTitle(fixture.pages[0].trophyTitles[0]);

  assert.equal(title.npCommunicationId, "NPWR90001_00");
  assert.equal(title.npServiceName, "trophy2");
  assert.deepEqual(title.platforms, ["PS5"]);
  assert.equal(title.hasPlatinum, true);
  assert.equal(title.platinumEarned, false);
  assert.equal(title.is100Percent, false);
});

test("normalizeTitle preserves legacy trophy identity and shared platforms", async () => {
  const fixture = await readFixture("titles-pages.json");
  const title = normalizeTitle(fixture.pages[0].trophyTitles[1]);

  assert.equal(title.npCommunicationId, "NPWR90002_00");
  assert.equal(title.npServiceName, "trophy");
  assert.deepEqual(title.platforms, ["PS4", "PSVITA"]);
  assert.equal(title.hasPlatinum, true);
  assert.equal(title.platinumEarned, true);
  assert.equal(title.is100Percent, true);
});

test("mergeTrophies joins by trophyId regardless of raw array order", async () => {
  const fixture = await readFixture("trophy-details.json");
  const trophies = mergeTrophies(fixture.metadata, [...fixture.earned].reverse());

  assert.deepEqual(trophies.map((trophy) => trophy.trophyId), [1, 2, 3]);
  assert.equal(trophies[0].earned, true);
  assert.equal(trophies[0].earnedAt, "2026-02-03T12:00:00Z");
  assert.equal(trophies[0].groupId, "default");
  assert.equal(trophies[1].earned, false);
  assert.equal(trophies[1].earnedAt, null);
  assert.equal(trophies[2].groupId, "001");
});

test("normalizeGroups separates base and additional groups without a DLC claim", async () => {
  const fixture = await readFixture("trophy-details.json");
  const groups = normalizeGroups(fixture.groups, fixture.groupEarnings);

  assert.deepEqual(groups.map((group) => group.groupId), ["default", "001", "002"]);
  assert.deepEqual(
    groups.map((group) => group.classification),
    ["base", "additional", "additional"],
  );
  for (const group of groups) {
    assert.equal(Object.hasOwn(group, "dlc"), false);
    assert.equal(Object.hasOwn(group, "isDlc"), false);
  }
});

test("selectSampleTitle honors an explicit npCommunicationId", async () => {
  const fixture = await readFixture("titles-pages.json");
  const titles = fixture.pages[0].trophyTitles.map(normalizeTitle);

  assert.equal(
    selectSampleTitle(titles, "NPWR90002_00")?.npCommunicationId,
    "NPWR90002_00",
  );
});

test("selectSampleTitle chooses the newest incomplete title by default", () => {
  const titles = [
    { npCommunicationId: "old", progress: 20, lastUpdatedDateTime: "2024-01-01T00:00:00Z" },
    { npCommunicationId: "complete", progress: 100, lastUpdatedDateTime: "2026-01-01T00:00:00Z" },
    { npCommunicationId: "new", progress: 80, lastUpdatedDateTime: "2025-01-01T00:00:00Z" },
  ];

  assert.equal(selectSampleTitle(titles)?.npCommunicationId, "new");
});

test("selectSampleTitle falls back to the newest completed title", () => {
  const titles = [
    { npCommunicationId: "older", progress: 100, lastUpdatedDateTime: "2025-01-01T00:00:00Z" },
    { npCommunicationId: "newer", progress: 100, lastUpdatedDateTime: "2026-01-01T00:00:00Z" },
  ];

  assert.equal(selectSampleTitle(titles)?.npCommunicationId, "newer");
});

test("derived platinum and completion statuses remain independent", () => {
  assert.deepEqual(
    deriveTitleStatus({
      definedTrophies: { platinum: 1 },
      earnedTrophies: { platinum: 1 },
      progress: 100,
    }),
    { hasPlatinum: true, platinumEarned: true, is100Percent: true },
  );
  assert.deepEqual(
    deriveTitleStatus({
      definedTrophies: { platinum: 1 },
      earnedTrophies: { platinum: 0 },
      progress: 75,
    }),
    { hasPlatinum: true, platinumEarned: false, is100Percent: false },
  );
  assert.deepEqual(
    deriveTitleStatus({
      definedTrophies: { platinum: 0 },
      earnedTrophies: { platinum: 0 },
      progress: 100,
    }),
    { hasPlatinum: false, platinumEarned: false, is100Percent: true },
  );
});
