import assert from "node:assert/strict";
import test from "node:test";

import {
  buildNormalizedReport,
  mergeTrophies,
  normalizeGroups,
  normalizeTitle,
} from "./normalize.mjs";
import { assertReportSafe } from "./redact.mjs";
import { readFixture } from "./test-helpers.mjs";

test("cross-account report contains only normalized data and validation flags", async () => {
  const titleFixture = await readFixture("titles-pages.json");
  const detailFixture = await readFixture("trophy-details.json");
  const targetAccountId = "9000000000000000001";
  const targetOnlineId = "fixture-target-player";
  const validation = {
    earnedTimestampsValid: true,
    hasEarnedTrophies: true,
    hasUnearnedTrophies: true,
    residentEvil4Found: true,
    separateWaysGroupFound: true,
    targetResolved: true,
    titleListNonEmpty: true,
    trophyIdSetsEqual: true,
    trophyStateConsistentWithProgress: true,
    unearnedTimestampsNull: true,
  };
  const report = buildNormalizedReport({
    generatedAt: "2026-02-04T12:00:00Z",
    groupEarnings: detailFixture.groupEarnings,
    normalizedGroups: normalizeGroups(
      detailFixture.groups,
      detailFixture.groupEarnings,
    ),
    profile: {
      accountId: targetAccountId,
      earnedTrophies: { bronze: 2, silver: 1, gold: 1, platinum: 0 },
      progress: 10,
      trophyLevel: "12",
    },
    selectedTitle: normalizeTitle(titleFixture.pages[0].trophyTitles[0]),
    titles: titleFixture.pages[0].trophyTitles,
    trophies: mergeTrophies(detailFixture.metadata, detailFixture.earned),
    validation,
  });

  assert.deepEqual(report.target, {
    exactOnlineIdMatch: true,
    mode: "cross-account",
    resolution: "universal-search",
  });
  assert.equal(Object.hasOwn(report.profile, "accountId"), false);
  assert.equal(report.titles[0].hasPlatinum, true);
  assert.deepEqual(report.validation, validation);
  assert.doesNotThrow(() =>
    assertReportSafe(report, {
      identifierValues: [targetAccountId, targetOnlineId],
    }),
  );
});
