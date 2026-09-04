import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowUrl = new URL(
  "../../.github/workflows/psn-poc.yml",
  import.meta.url,
);

test("PSN workflow is manual, read-only, Node 20, and does not publish reports", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  assert.match(workflow, /^on:\s*\r?\n\s+workflow_dispatch:/m);
  assert.doesNotMatch(workflow, /^\s+(push|pull_request|pull_request_target|schedule):/m);
  assert.match(workflow, /permissions:\s*\r?\n\s+contents: read/);
  assert.match(workflow, /runs-on: ubuntu-latest/);
  assert.match(workflow, /node-version: "20"/);
  assert.match(workflow, /run: npm ci/);
  assert.match(workflow, /run: npm run psn:poc:test/);
  assert.match(workflow, /PSN_NPSSO: \$\{\{ secrets\.PSN_NPSSO \}\}/);
  assert.doesNotMatch(workflow, /PSN_NPSSO: \$\{\{ (?:vars|inputs)\./);
  assert.match(
    workflow,
    /PSN_TARGET_ONLINE_ID: \$\{\{ vars\.PSN_TARGET_ONLINE_ID \}\}/,
  );
  assert.doesNotMatch(
    workflow,
    /PSN_TARGET_ONLINE_ID: \$\{\{ (?:secrets|inputs)\./,
  );
  assert.match(
    workflow,
    /PSN_POC_NP_COMMUNICATION_ID: \$\{\{ inputs\.np_communication_id \}\}/,
  );
  assert.match(workflow, /run: npm run psn:poc/);
  assert.ok(
    workflow.indexOf("run: npm run psn:poc:test") <
      workflow.lastIndexOf("run: npm run psn:poc"),
  );
  assert.doesNotMatch(workflow, /upload-artifact|git push|deploy/i);
});
