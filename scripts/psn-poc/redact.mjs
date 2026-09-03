const FORBIDDEN_KEYS = new Set([
  "npsso",
  "accesstoken",
  "refreshtoken",
  "accesscode",
  "idtoken",
  "authorization",
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

export function assertReportSafe(value, { secretValues = [] } = {}) {
  const secrets = secretValues.filter(
    (secret) => typeof secret === "string" && secret.length > 0,
  );
  const visited = new Set();

  function visit(current) {
    if (typeof current === "string") {
      if (secrets.some((secret) => current.includes(secret))) {
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
