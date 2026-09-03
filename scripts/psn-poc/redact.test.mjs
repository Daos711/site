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
