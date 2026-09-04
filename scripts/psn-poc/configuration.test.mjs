import assert from "node:assert/strict";
import { access, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
const reportPath = path.join(repositoryRoot, ".tmp", "psn-poc", "report.json");
const scriptPath = path.join(repositoryRoot, "scripts", "psn-poc", "index.mjs");

async function runWithMissingEnvironment({ includeNpsso, includeTarget }) {
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, "stale report", "utf8");

  const environment = { ...process.env };
  delete environment.PSN_NPSSO;
  delete environment.PSN_TARGET_ONLINE_ID;
  if (includeNpsso) environment.PSN_NPSSO = "sanitised-service-npsso";
  if (includeTarget) environment.PSN_TARGET_ONLINE_ID = "fixture-target-player";

  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: environment,
  });

  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(
    result.stderr,
    /^PSN_NPSSO and PSN_TARGET_ONLINE_ID are required[^\r\n]*\r?\n$/u,
  );
  assert.doesNotMatch(result.stderr, /\bat\s+.+:\d+:\d+/u);
  await assert.rejects(access(reportPath), { code: "ENOENT" });
}

test("missing service-account NPSSO fails before network and removes stale report", async () => {
  await runWithMissingEnvironment({ includeNpsso: false, includeTarget: true });
});

test("missing target onlineId fails before network and removes stale report", async () => {
  await runWithMissingEnvironment({ includeNpsso: true, includeTarget: false });
});
