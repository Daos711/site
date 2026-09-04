import assert from "node:assert/strict";
import test from "node:test";

import { PsnPocError } from "./errors.mjs";
import { readFixture } from "./test-helpers.mjs";
import {
  normalizeAndValidateGroups,
  validateAndMergeTrophies,
} from "./validate.mjs";

function hasCode(code) {
  return (error) => error instanceof PsnPocError && error.code === code;
}

function earnedVersion(trophy, index) {
  return {
    ...trophy,
    earned: true,
    earnedDateTime: `2026-02-0${index + 1}T12:00:00Z`,
  };
}

test("equal trophy ID sets pass even when raw order differs", async () => {
  const fixture = await readFixture("trophy-details.json");
  const result = validateAndMergeTrophies(
    fixture.metadata,
    [...fixture.earned].reverse(),
    50,
  );

  assert.deepEqual(result.trophies.map((trophy) => trophy.trophyId), [1, 2, 3]);
  assert.equal(result.validation.trophyIdSetsEqual, true);
  assert.equal(result.validation.hasEarnedTrophies, true);
  assert.equal(result.validation.hasUnearnedTrophies, true);
});

test("a missing metadata trophy ID is rejected", async () => {
  const fixture = await readFixture("trophy-details.json");
  assert.throws(
    () => validateAndMergeTrophies(fixture.metadata.slice(1), fixture.earned, 50),
    hasCode("TROPHY_ID_SET_MISMATCH"),
  );
});

test("a missing earned-state trophy ID is rejected", async () => {
  const fixture = await readFixture("trophy-details.json");
  assert.throws(
    () => validateAndMergeTrophies(fixture.metadata, fixture.earned.slice(1), 50),
    hasCode("TROPHY_ID_SET_MISMATCH"),
  );
});

test("a duplicate trophy ID is rejected", async () => {
  const fixture = await readFixture("trophy-details.json");
  assert.throws(
    () =>
      validateAndMergeTrophies(
        fixture.metadata,
        [...fixture.earned, fixture.earned[0]],
        50,
      ),
    hasCode("TROPHY_ID_SET_MISMATCH"),
  );
});

test("non-integer trophy IDs in either source are rejected", async () => {
  const fixture = await readFixture("trophy-details.json");
  const invalidMetadata = fixture.metadata.map((trophy) => ({ ...trophy }));
  invalidMetadata[0].trophyId = "3";
  const invalidEarned = fixture.earned.map((trophy) => ({ ...trophy }));
  invalidEarned[0].trophyId = 2.5;

  assert.throws(
    () => validateAndMergeTrophies(invalidMetadata, fixture.earned, 50),
    hasCode("TROPHY_ID_SET_MISMATCH"),
  );
  assert.throws(
    () => validateAndMergeTrophies(fixture.metadata, invalidEarned, 50),
    hasCode("TROPHY_ID_SET_MISMATCH"),
  );
});

test("mixed earned and unearned trophies pass below 100 percent", async () => {
  const fixture = await readFixture("trophy-details.json");
  const result = validateAndMergeTrophies(fixture.metadata, fixture.earned, 50);

  assert.equal(result.validation.hasEarnedTrophies, true);
  assert.equal(result.validation.hasUnearnedTrophies, true);
});

test("an entirely earned set passes at 100 percent", async () => {
  const fixture = await readFixture("trophy-details.json");
  const earned = fixture.earned.map(earnedVersion);
  const result = validateAndMergeTrophies(fixture.metadata, earned, 100);

  assert.equal(result.validation.hasEarnedTrophies, true);
  assert.equal(result.validation.hasUnearnedTrophies, false);
});

test("an entirely earned set below 100 percent is rejected", async () => {
  const fixture = await readFixture("trophy-details.json");
  const earned = fixture.earned.map(earnedVersion);

  assert.throws(
    () => validateAndMergeTrophies(fixture.metadata, earned, 99),
    hasCode("NO_UNEARNED_TROPHIES"),
  );
});

test("an unearned trophy at 100 percent is rejected", async () => {
  const fixture = await readFixture("trophy-details.json");
  assert.throws(
    () => validateAndMergeTrophies(fixture.metadata, fixture.earned, 100),
    hasCode("PROGRESS_TROPHY_STATE_MISMATCH"),
  );
});

test("an entirely unearned set is rejected", async () => {
  const fixture = await readFixture("trophy-details.json");
  const unearned = fixture.earned.map((trophy) => ({
    ...trophy,
    earned: false,
    earnedDateTime: undefined,
  }));

  assert.throws(
    () => validateAndMergeTrophies(fixture.metadata, unearned, 0),
    hasCode("NO_EARNED_TROPHIES"),
  );
});

test("an earned trophy without a valid timestamp is rejected", async () => {
  const fixture = await readFixture("trophy-details.json");
  const earned = fixture.earned.map((trophy) => ({ ...trophy }));
  earned.find((trophy) => trophy.earned).earnedDateTime = "not-an-iso-date";

  assert.throws(
    () => validateAndMergeTrophies(fixture.metadata, earned, 50),
    hasCode("INVALID_EARNED_TIMESTAMP"),
  );
});

test("an unearned trophy with a timestamp is rejected", async () => {
  const fixture = await readFixture("trophy-details.json");
  const earned = fixture.earned.map((trophy) => ({ ...trophy }));
  earned.find((trophy) => !trophy.earned).earnedDateTime =
    "2026-02-04T12:00:00Z";

  assert.throws(
    () => validateAndMergeTrophies(fixture.metadata, earned, 50),
    hasCode("UNEXPECTED_UNEARNED_TIMESTAMP"),
  );
});

test("matching trophy group metadata and earnings are normalized", async () => {
  const fixture = await readFixture("trophy-details.json");
  const groups = normalizeAndValidateGroups(fixture.groups, fixture.groupEarnings);

  assert.deepEqual(groups.map((group) => group.groupId), ["default", "001", "002"]);
});

test("Separate Ways retains normalized metadata and earned progress", async () => {
  const fixture = await readFixture("trophy-details.json");
  const groupsResponse = {
    ...fixture.groups,
    trophyGroups: fixture.groups.trophyGroups.map((group) =>
      group.trophyGroupId === "001"
        ? { ...group, trophyGroupName: "Separate Ways" }
        : group,
    ),
  };
  const groups = normalizeAndValidateGroups(
    groupsResponse,
    fixture.groupEarnings,
  );
  const separateWays = groups.find((group) => group.name === "Separate Ways");

  assert.deepEqual(separateWays, {
    classification: "additional",
    definedTrophies: { bronze: 0, silver: 0, gold: 1, platinum: 0 },
    earnedTrophies: { bronze: 0, silver: 0, gold: 1, platinum: 0 },
    groupId: "001",
    iconUrl: "https://example.invalid/group-001.png",
    lastUpdatedDateTime: "2026-02-02T12:00:00Z",
    name: "Separate Ways",
    progress: 100,
  });
});

test("mismatched trophy group IDs are rejected", async () => {
  const fixture = await readFixture("trophy-details.json");
  const groupEarnings = {
    ...fixture.groupEarnings,
    trophyGroups: fixture.groupEarnings.trophyGroups.slice(1),
  };

  assert.throws(
    () => normalizeAndValidateGroups(fixture.groups, groupEarnings),
    hasCode("TROPHY_GROUP_SET_MISMATCH"),
  );
});
