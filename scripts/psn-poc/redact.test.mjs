import assert from "node:assert/strict";
import test from "node:test";

import { UnsafeReportError, assertReportSafe } from "./redact.mjs";

const secretValues = [
  "fixture-npsso-value",
  "fixture-access-token",
  "fixture-refresh-token",
  "fixture-access-code",
];

test("secret-like key names are rejected case-insensitively at any depth", () => {
  const forbiddenKeys = [
    "NPSSO",
    "accessToken",
    "refresh_token",
    "Access-Code",
    "cookie",
    "set-cookie",
    "authorization",
    "accountId",
    "onlineId",
    "secret",
  ];

  for (const key of forbiddenKeys) {
    assert.throws(
      () => assertReportSafe({ outer: { [key]: "redacted fixture" } }),
      UnsafeReportError,
    );
  }
});

test("known secret values are rejected under neutral key names", () => {
  for (const secret of secretValues) {
    assert.throws(
      () => assertReportSafe({ note: `prefix-${secret}-suffix` }, { secretValues }),
      UnsafeReportError,
    );
  }
});

test("an NPSSO value cannot enter a report", () => {
  assert.throws(
    () =>
      assertReportSafe(
        { profile: { description: secretValues[0] } },
        { secretValues },
      ),
    UnsafeReportError,
  );
});

test("ordinary trophy text containing token or auth is allowed", () => {
  assert.doesNotThrow(() =>
    assertReportSafe({
      trophies: [
        { name: "Token Collector", detail: "Find the authentic game token." },
      ],
    }),
  );
});

test("validation errors never include the detected secret", () => {
  let caught;
  try {
    assertReportSafe(
      { harmlessLabel: secretValues[1] },
      { secretValues },
    );
  } catch (error) {
    caught = error;
  }

  assert.ok(caught instanceof UnsafeReportError);
  assert.equal(caught.message.includes(secretValues[1]), false);
});

test("a nested raw authorization object is rejected", () => {
  assert.throws(
    () =>
      assertReportSafe({
        nested: { authorization: { accessToken: "sanitised-value" } },
      }),
    UnsafeReportError,
  );
});

test("known target identifiers are rejected under neutral keys", () => {
  const identifierValues = [
    "9000000000000000001",
    "fixture-target-player",
  ];

  for (const identifier of identifierValues) {
    assert.throws(
      () =>
        assertReportSafe(
          { neutral: `prefix-${identifier}-suffix` },
          { identifierValues },
        ),
      UnsafeReportError,
    );
  }

  assert.throws(
    () =>
      assertReportSafe(
        { neutral: "ＦＩＸＴＵＲＥ－ＴＡＲＧＥＴ－ＰＬＡＹＥＲ" },
        { identifierValues },
      ),
    UnsafeReportError,
  );
});

test("a raw universal search response is rejected", () => {
  assert.throws(
    () =>
      assertReportSafe({
        domainResponses: [
          {
            domain: "SocialAllAccounts",
            results: [
              {
                socialMetadata: {
                  accountId: "9000000000000000001",
                  onlineId: "fixture-target-player",
                },
              },
            ],
          },
        ],
      }),
    UnsafeReportError,
  );
});
