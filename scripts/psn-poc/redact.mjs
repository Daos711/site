const FORBIDDEN_KEYS = new Set([
  "npsso",
  "accesstoken",
  "refreshtoken",
  "accesscode",
  "idtoken",
  "authorization",
  "accountid",
  "onlineid",
  "cookie",
  "cookies",
  "setcookie",
  "secret",
  "clientsecret",
]);

function normalizedKey(key) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export class UnsafeReportError extends Error {
  constructor() {
    super("Report validation failed: sensitive authentication data was detected.");
    this.name = "UnsafeReportError";
  }
}

export function assertReportSafe(
  value,
  { identifierValues = [], secretValues = [] } = {},
) {
  const secrets = secretValues.filter(
    (candidate) => typeof candidate === "string" && candidate.length > 0,
  );
  const normalizedIdentifiers = identifierValues
    .filter(
      (candidate) => typeof candidate === "string" && candidate.length > 0,
    )
    .map((candidate) => candidate.normalize("NFKC").toLocaleLowerCase("en-US"));
  const visited = new Set();

  function visit(current) {
    if (typeof current === "string") {
      const normalizedCurrent = current
        .normalize("NFKC")
        .toLocaleLowerCase("en-US");
      if (
        secrets.some((secret) => current.includes(secret)) ||
        normalizedIdentifiers.some((identifier) =>
          normalizedCurrent.includes(identifier),
        )
      ) {
        throw new UnsafeReportError();
      }
      return;
    }
    if (current === null || typeof current !== "object") return;
    if (visited.has(current)) return;
    visited.add(current);

    for (const [key, child] of Object.entries(current)) {
      if (FORBIDDEN_KEYS.has(normalizedKey(key))) {
        throw new UnsafeReportError();
      }
      visit(child);
    }
  }

  visit(value);
}
