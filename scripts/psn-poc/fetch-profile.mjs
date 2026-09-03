import {
  getTitleTrophies,
  getTitleTrophyGroups,
  getUserTitles,
  getUserTrophiesEarnedForTitle,
  getUserTrophyGroupEarningsForTitle,
  getUserTrophyProfileSummary,
} from "psn-api";

import { runPsnStage } from "./errors.mjs";
import { collectPaginated } from "./paginate.mjs";

const TITLE_PAGE_LIMIT = 800;
const TROPHY_PAGE_LIMIT = 100;

export function fetchProfileSummary(authorization) {
  return runPsnStage("profile summary", () =>
    getUserTrophyProfileSummary(authorization, "me"),
  );
}

export function fetchAllTitles(authorization) {
  return runPsnStage("title list", () =>
    collectPaginated({
      fetchPage: ({ limit, offset }) =>
        getUserTitles(authorization, "me", { limit, offset }),
      getKey: (title) => title.npCommunicationId,
      itemsKey: "trophyTitles",
      limit: TITLE_PAGE_LIMIT,
    }),
  );
}

function fetchAllTitleTrophyMetadata(authorization, title) {
  return runPsnStage("individual trophy metadata", () =>
    collectPaginated({
      fetchPage: ({ limit, offset }) =>
        getTitleTrophies(
          authorization,
          title.npCommunicationId,
          "all",
          { limit, offset, npServiceName: title.npServiceName },
        ),
      getKey: (trophy) => trophy.trophyId,
      itemsKey: "trophies",
      limit: TROPHY_PAGE_LIMIT,
    }),
  );
}

function fetchAllTitleTrophyEarnings(authorization, title) {
  return runPsnStage("individual trophy earned state", () =>
    collectPaginated({
      fetchPage: ({ limit, offset }) =>
        getUserTrophiesEarnedForTitle(
          authorization,
          "me",
          title.npCommunicationId,
          "all",
          { limit, offset, npServiceName: title.npServiceName },
        ),
      getKey: (trophy) => trophy.trophyId,
      itemsKey: "trophies",
      limit: TROPHY_PAGE_LIMIT,
    }),
  );
}

export async function fetchTitleDetails(authorization, title) {
  const options = { npServiceName: title.npServiceName };
  const [groups, groupEarnings, trophyMetadata, trophyEarnings] =
    await Promise.all([
      runPsnStage("trophy groups", () =>
        getTitleTrophyGroups(
          authorization,
          title.npCommunicationId,
          options,
        ),
      ),
      runPsnStage("trophy group earned state", () =>
        getUserTrophyGroupEarningsForTitle(
          authorization,
          "me",
          title.npCommunicationId,
          options,
        ),
      ),
      fetchAllTitleTrophyMetadata(authorization, title),
      fetchAllTitleTrophyEarnings(authorization, title),
    ]);

  return { groupEarnings, groups, trophyEarnings, trophyMetadata };
}
