import assert from "node:assert/strict";
import test from "node:test";

import { PsnPocError } from "./errors.mjs";
import { selectResidentEvil4Title } from "./select-re4.mjs";
import { readFixture } from "./test-helpers.mjs";

function hasCode(code) {
  return (error) => error instanceof PsnPocError && error.code === code;
}

async function fixtureSelection(overrides = {}) {
  const fixture = await readFixture("re4-selection.json");
  const calls = [];
  const result = await selectResidentEvil4Title({
    fetchDetails: async (title) => {
      calls.push(title.npCommunicationId);
      return fixture.detailsById[title.npCommunicationId] ?? { groups: {} };
    },
    titles: fixture.titles,
    ...overrides,
  });
  return { calls, result };
}

test("exact Resident Evil 4 with Separate Ways is selected sequentially", async () => {
  const { calls, result } = await fixtureSelection();

  assert.deepEqual(calls, ["NPWR91002_00", "NPWR91001_00"]);
  assert.equal(result.selectedTitle.npCommunicationId, "NPWR91001_00");
  assert.equal(calls.includes("NPWR91003_00"), false);
});

test("an explicit trophy set must belong to the target title list", async () => {
  await assert.rejects(
    fixtureSelection({ requestedNpCommunicationId: "NPWR99999_00" }),
    hasCode("RE4_TROPHY_SET_NOT_FOUND"),
  );
});

test("an explicit Resident Evil 4 set without Separate Ways is rejected", async () => {
  await assert.rejects(
    fixtureSelection({ requestedNpCommunicationId: "NPWR91002_00" }),
    hasCode("SEPARATE_WAYS_GROUP_NOT_FOUND"),
  );
});

test("an explicit similar title is not accepted as Resident Evil 4", async () => {
  await assert.rejects(
    fixtureSelection({ requestedNpCommunicationId: "NPWR91003_00" }),
    hasCode("RE4_TROPHY_SET_NOT_FOUND"),
  );
});

test("absence of an exact Resident Evil 4 title is rejected", async () => {
  await assert.rejects(
    selectResidentEvil4Title({
      fetchDetails: async () => ({ groups: {} }),
      titles: [
        {
          npCommunicationId: "NPWR91003_00",
          titleName: "Resident Evil 4 Gold Edition",
        },
      ],
    }),
    hasCode("RE4_TITLE_NOT_FOUND"),
  );
});

test("Resident Evil 4 without a Separate Ways group is rejected", async () => {
  const fixture = await readFixture("re4-selection.json");
  await assert.rejects(
    selectResidentEvil4Title({
      fetchDetails: async () => fixture.detailsById.NPWR91002_00,
      titles: [fixture.titles[1]],
    }),
    hasCode("SEPARATE_WAYS_GROUP_NOT_FOUND"),
  );
});

test("an empty target title list is rejected", async () => {
  await assert.rejects(
    selectResidentEvil4Title({
      fetchDetails: async () => ({ groups: {} }),
      titles: [],
    }),
    hasCode("TARGET_TITLES_EMPTY"),
  );
});
