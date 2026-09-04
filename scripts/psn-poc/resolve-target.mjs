import { PsnPocError, runPsnStage } from "./errors.mjs";
import { defaultPsnClient } from "./psn-client.mjs";

function normalizeOnlineId(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFKC")
    .toLocaleLowerCase("en-US");
}

export function resolveTargetFromSearchResponse(response, targetOnlineId) {
  const expected = normalizeOnlineId(targetOnlineId);
  const domainResponses = Array.isArray(response?.domainResponses)
    ? response.domainResponses
    : [];
  const exactMatches = [];

  for (const domainResponse of domainResponses) {
    if (domainResponse?.domain !== "SocialAllAccounts") continue;
    const results = Array.isArray(domainResponse.results)
      ? domainResponse.results
      : [];
    for (const result of results) {
      const onlineId = result?.socialMetadata?.onlineId;
      if (normalizeOnlineId(onlineId) === expected) {
        exactMatches.push(result);
      }
    }
  }

  if (exactMatches.length === 0) {
    throw new PsnPocError("target account resolution", {
      code: "TARGET_NOT_FOUND",
    });
  }
  if (exactMatches.length !== 1) {
    throw new PsnPocError("target account resolution", {
      code: "TARGET_AMBIGUOUS",
    });
  }

  const accountId = exactMatches[0]?.socialMetadata?.accountId;
  if (typeof accountId !== "string" || !/^\d+$/u.test(accountId)) {
    throw new PsnPocError("target account resolution", {
      code: "TARGET_RESULT_MALFORMED",
    });
  }

  return accountId;
}

export async function resolveTargetAccountId(
  authorization,
  targetOnlineId,
  client = defaultPsnClient,
) {
  const response = await runPsnStage(
    "target account search",
    () =>
      client.makeUniversalSearch(
        authorization,
        targetOnlineId,
        "SocialAllAccounts",
      ),
    { code: "TARGET_SEARCH_FAILED" },
  );

  return resolveTargetFromSearchResponse(response, targetOnlineId);
}
