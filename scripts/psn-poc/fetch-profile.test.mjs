import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

import {
  fetchAllTitles,
  fetchProfileSummary,
  fetchTitleDetails,
} from "./fetch-profile.mjs";
import { createPsnClient } from "./psn-client.mjs";

const authorization = { accessToken: "sanitised-access-value" };
const targetAccountId = "9000000000000000001";
const title = {
  npCommunicationId: "NPWR91001_00",
  npServiceName: "trophy2",
};

function createRecordingClient() {
  const calls = [];
  const record = (name, value) => async (...args) => {
    calls.push({ args, name });
    return value;
  };
  const client = createPsnClient({
    getTitleTrophies: record("getTitleTrophies", {
      totalItemCount: 0,
      trophies: [],
    }),
    getTitleTrophyGroups: record("getTitleTrophyGroups", {
      trophyGroups: [],
    }),
    getUserTitles: record("getUserTitles", {
      totalItemCount: 0,
      trophyTitles: [],
    }),
    getUserTrophiesEarnedForTitle: record(
      "getUserTrophiesEarnedForTitle",
      { totalItemCount: 0, trophies: [] },
    ),
    getUserTrophyGroupEarningsForTitle: record(
      "getUserTrophyGroupEarningsForTitle",
      { trophyGroups: [] },
    ),
    getUserTrophyProfileSummary: record("getUserTrophyProfileSummary", {
      earnedTrophies: {},
      progress: 0,
      trophyLevel: "1",
    }),
  });
  return { calls, client };
}

function callNamed(calls, name) {
  return calls.find((call) => call.name === name);
}

test("all user-specific trophy calls receive the same target accountId", async () => {
  const { calls, client } = createRecordingClient();

  await fetchProfileSummary(authorization, targetAccountId, client);
  await fetchAllTitles(authorization, targetAccountId, client);
  await fetchTitleDetails(authorization, targetAccountId, title, client);

  assert.equal(
    callNamed(calls, "getUserTrophyProfileSummary").args[1],
    targetAccountId,
  );
  assert.equal(callNamed(calls, "getUserTitles").args[1], targetAccountId);
  assert.equal(
    callNamed(calls, "getUserTrophiesEarnedForTitle").args[1],
    targetAccountId,
  );
  assert.equal(
    callNamed(calls, "getUserTrophyGroupEarningsForTitle").args[1],
    targetAccountId,
  );

  assert.equal(
    callNamed(calls, "getTitleTrophies").args.includes(targetAccountId),
    false,
  );
  assert.equal(
    callNamed(calls, "getTitleTrophyGroups").args.includes(targetAccountId),
    false,
  );
});

test("localized calls preserve pagination and service options", async () => {
  const { calls, client } = createRecordingClient();

  await fetchAllTitles(authorization, targetAccountId, client);
  await fetchTitleDetails(authorization, targetAccountId, title, client);

  assert.deepEqual(callNamed(calls, "getUserTitles").args[2], {
    headerOverrides: { "Accept-Language": "en-US" },
    limit: 800,
    offset: 0,
  });
  assert.deepEqual(callNamed(calls, "getTitleTrophies").args[3], {
    headerOverrides: { "Accept-Language": "en-US" },
    limit: 100,
    offset: 0,
    npServiceName: "trophy2",
  });
  assert.deepEqual(
    callNamed(calls, "getUserTrophiesEarnedForTitle").args[4],
    {
      headerOverrides: { "Accept-Language": "en-US" },
      limit: 100,
      offset: 0,
      npServiceName: "trophy2",
    },
  );
  assert.deepEqual(callNamed(calls, "getTitleTrophyGroups").args[2], {
    headerOverrides: { "Accept-Language": "en-US" },
    npServiceName: "trophy2",
  });
  assert.deepEqual(
    callNamed(calls, "getUserTrophyGroupEarningsForTitle").args[3],
    {
      headerOverrides: { "Accept-Language": "en-US" },
      npServiceName: "trophy2",
    },
  );
});

test("live PoC modules contain no literal me account fallback", async () => {
  const directory = new URL("./", import.meta.url);
  const files = (await readdir(directory)).filter(
    (name) => name.endsWith(".mjs") && !name.endsWith(".test.mjs"),
  );

  for (const file of files) {
    const source = await readFile(new URL(file, directory), "utf8");
    assert.doesNotMatch(source, /["']me["']/u, file);
  }
});
