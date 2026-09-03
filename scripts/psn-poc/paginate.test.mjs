import assert from "node:assert/strict";
import test from "node:test";

import { collectPaginated } from "./paginate.mjs";
import { readFixture } from "./test-helpers.mjs";

test("collectPaginated reads every page, stops, and removes duplicates", async () => {
  const fixture = await readFixture("titles-pages.json");
  const calls = [];

  const titles = await collectPaginated({
    fetchPage: async ({ limit, offset }) => {
      calls.push({ limit, offset });
      return fixture.pages[offset === 0 ? 0 : 1];
    },
    getKey: (title) => title.npCommunicationId,
    itemsKey: "trophyTitles",
    limit: 2,
  });

  assert.deepEqual(calls, [
    { limit: 2, offset: 0 },
    { limit: 2, offset: 2 },
  ]);
  assert.deepEqual(
    titles.map((title) => title.npCommunicationId),
    ["NPWR90001_00", "NPWR90002_00", "NPWR90003_00"],
  );
});

test("collectPaginated rejects a repeated next offset", async () => {
  await assert.rejects(
    collectPaginated({
      fetchPage: async () => ({
        trophyTitles: [],
        totalItemCount: 2,
        nextOffset: 1,
      }),
      getKey: (title) => title.npCommunicationId,
      itemsKey: "trophyTitles",
      limit: 1,
    }),
    /repeated offset/,
  );
});
