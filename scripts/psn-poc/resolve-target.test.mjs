import assert from "node:assert/strict";
import test from "node:test";

import { PsnPocError } from "./errors.mjs";
import {
  resolveTargetAccountId,
  resolveTargetFromSearchResponse,
} from "./resolve-target.mjs";

function result(onlineId, accountId = "9000000000000000001") {
  return { socialMetadata: { accountId, onlineId } };
}

function response(results, domain = "SocialAllAccounts") {
  return { domainResponses: [{ domain, results }] };
}

function hasCode(code) {
  return (error) => error instanceof PsnPocError && error.code === code;
}

test("exact onlineId is selected among fuzzy search results", () => {
  const accountId = resolveTargetFromSearchResponse(
    response([
      result("fixture-player-extended", "9000000000000000002"),
      result("fixture-player"),
    ]),
    "fixture-player",
  );

  assert.equal(accountId, "9000000000000000001");
});

test("onlineId comparison is case-insensitive and NFKC-normalized", () => {
  const accountId = resolveTargetFromSearchResponse(
    response([result("fixture-player")]),
    "  ＦＩＸＴＵＲＥ－ＰＬＡＹＥＲ  ",
  );

  assert.equal(accountId, "9000000000000000001");
});

test("the first fuzzy result is never used without an exact match", () => {
  assert.throws(
    () =>
      resolveTargetFromSearchResponse(
        response([result("fixture-player-extra")]),
        "fixture-player",
      ),
    hasCode("TARGET_NOT_FOUND"),
  );
});

test("missing exact result is rejected", () => {
  assert.throws(
    () => resolveTargetFromSearchResponse(response([]), "fixture-player"),
    hasCode("TARGET_NOT_FOUND"),
  );
});

test("multiple exact results are rejected as ambiguous", () => {
  assert.throws(
    () =>
      resolveTargetFromSearchResponse(
        response([
          result("fixture-player"),
          result("FIXTURE-PLAYER", "9000000000000000002"),
        ]),
        "fixture-player",
      ),
    hasCode("TARGET_AMBIGUOUS"),
  );
});

test("an exact result without a numeric accountId is rejected", () => {
  assert.throws(
    () =>
      resolveTargetFromSearchResponse(
        response([result("fixture-player", "not-numeric")]),
        "fixture-player",
      ),
    hasCode("TARGET_RESULT_MALFORMED"),
  );
});

test("unexpected domainResponses are handled without using another domain", () => {
  assert.throws(
    () =>
      resolveTargetFromSearchResponse(
        { domainResponses: null },
        "fixture-player",
      ),
    hasCode("TARGET_NOT_FOUND"),
  );
  assert.throws(
    () =>
      resolveTargetFromSearchResponse(
        response([result("fixture-player")], "AnotherDomain"),
        "fixture-player",
      ),
    hasCode("TARGET_NOT_FOUND"),
  );
});

test("search request failures use a controlled error code", async () => {
  await assert.rejects(
    resolveTargetAccountId({}, "fixture-player", {
      makeUniversalSearch: async () => {
        const error = new Error("raw response must stay hidden");
        error.response = { status: 503 };
        throw error;
      },
    }),
    (error) =>
      hasCode("TARGET_SEARCH_FAILED")(error) && error.status === 503,
  );
});

test("target resolution calls only the SocialAllAccounts search domain", async () => {
  const calls = [];
  const authorization = { accessToken: "sanitised-access-value" };
  const accountId = await resolveTargetAccountId(
    authorization,
    "fixture-player",
    {
      makeUniversalSearch: async (...args) => {
        calls.push(args);
        return response([result("fixture-player")]);
      },
    },
  );

  assert.equal(accountId, "9000000000000000001");
  assert.deepEqual(calls, [
    [authorization, "fixture-player", "SocialAllAccounts"],
  ]);
});
