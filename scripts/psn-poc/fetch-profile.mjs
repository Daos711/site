import { runPsnStage } from "./errors.mjs";
import { collectPaginated } from "./paginate.mjs";
import { defaultPsnClient } from "./psn-client.mjs";

const TITLE_PAGE_LIMIT = 800;
const TROPHY_PAGE_LIMIT = 100;
const ENGLISH_HEADERS = Object.freeze({ "Accept-Language": "en-US" });

export function fetchProfileSummary(
  authorization,
  targetAccountId,
  client = defaultPsnClient,
) {
  return runPsnStage("target profile summary", () =>
    client.getUserTrophyProfileSummary(authorization, targetAccountId),
    { code: "TARGET_PROFILE_REQUEST_FAILED" },
  );
}

export function fetchAllTitles(
  authorization,
  targetAccountId,
  client = defaultPsnClient,
) {
  return runPsnStage(
    "target title list",
    () =>
      collectPaginated({
        fetchPage: ({ limit, offset }) =>
          client.getUserTitles(authorization, targetAccountId, {
            headerOverrides: ENGLISH_HEADERS,
            limit,
            offset,
          }),
        getKey: (title) => title.npCommunicationId,
        itemsKey: "trophyTitles",
        limit: TITLE_PAGE_LIMIT,
      }),
    { code: "TARGET_TITLES_REQUEST_FAILED" },
  );
}

function fetchAllTitleTrophyMetadata(authorization, title, client) {
  return runPsnStage(
    "individual trophy metadata",
    () =>
      collectPaginated({
        fetchPage: ({ limit, offset }) =>
          client.getTitleTrophies(
            authorization,
            title.npCommunicationId,
            "all",
            {
              headerOverrides: ENGLISH_HEADERS,
              limit,
              offset,
              npServiceName: title.npServiceName,
            },
          ),
        getKey: (trophy) => trophy.trophyId,
        itemsKey: "trophies",
        limit: TROPHY_PAGE_LIMIT,
      }),
    { code: "TROPHY_METADATA_REQUEST_FAILED" },
  );
}

function fetchAllTitleTrophyEarnings(
  authorization,
  targetAccountId,
  title,
  client,
) {
  return runPsnStage(
    "individual trophy earned state",
    () =>
      collectPaginated({
        fetchPage: ({ limit, offset }) =>
          client.getUserTrophiesEarnedForTitle(
            authorization,
            targetAccountId,
            title.npCommunicationId,
            "all",
            {
              headerOverrides: ENGLISH_HEADERS,
              limit,
              offset,
              npServiceName: title.npServiceName,
            },
          ),
        getKey: (trophy) => trophy.trophyId,
        itemsKey: "trophies",
        limit: TROPHY_PAGE_LIMIT,
      }),
    { code: "TROPHY_EARNINGS_REQUEST_FAILED" },
  );
}

export async function fetchTitleDetails(
  authorization,
  targetAccountId,
  title,
  client = defaultPsnClient,
) {
  const options = {
    headerOverrides: ENGLISH_HEADERS,
    npServiceName: title.npServiceName,
  };
  const [groups, groupEarnings, trophyMetadata, trophyEarnings] =
    await Promise.all([
      runPsnStage("trophy groups", () =>
        client.getTitleTrophyGroups(
          authorization,
          title.npCommunicationId,
          options,
        ),
        { code: "TROPHY_GROUPS_REQUEST_FAILED" },
      ),
      runPsnStage("trophy group earned state", () =>
        client.getUserTrophyGroupEarningsForTitle(
          authorization,
          targetAccountId,
          title.npCommunicationId,
          options,
        ),
        { code: "TROPHY_GROUP_EARNINGS_REQUEST_FAILED" },
      ),
      fetchAllTitleTrophyMetadata(authorization, title, client),
      fetchAllTitleTrophyEarnings(
        authorization,
        targetAccountId,
        title,
        client,
      ),
    ]);

  return { groupEarnings, groups, trophyEarnings, trophyMetadata };
}
