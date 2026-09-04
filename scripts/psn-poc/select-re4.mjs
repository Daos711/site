import { PsnPocError } from "./errors.mjs";

const RE4_NAME = "resident evil 4";
const SEPARATE_WAYS_NAME = "separate ways";

export function normalizeDisplayName(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFKC")
    .replace(/\s+/gu, " ")
    .toLocaleLowerCase("en-US");
}

function updatedAt(title) {
  const timestamp = Date.parse(title.lastUpdatedDateTime);
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}

export function hasSeparateWaysGroup(details) {
  const groups = Array.isArray(details?.groups?.trophyGroups)
    ? details.groups.trophyGroups
    : [];
  return groups.some(
    (group) =>
      normalizeDisplayName(group?.trophyGroupName) === SEPARATE_WAYS_NAME,
  );
}

export async function selectResidentEvil4Title({
  fetchDetails,
  requestedNpCommunicationId = "",
  titles,
}) {
  if (!Array.isArray(titles) || titles.length === 0) {
    throw new PsnPocError("target title selection", {
      code: "TARGET_TITLES_EMPTY",
    });
  }

  if (requestedNpCommunicationId) {
    const selectedTitle = titles.find(
      (title) => title.npCommunicationId === requestedNpCommunicationId,
    );
    if (
      !selectedTitle ||
      normalizeDisplayName(selectedTitle.titleName) !== RE4_NAME
    ) {
      throw new PsnPocError("Resident Evil 4 trophy set selection", {
        code: "RE4_TROPHY_SET_NOT_FOUND",
      });
    }

    const details = await fetchDetails(selectedTitle);
    if (!hasSeparateWaysGroup(details)) {
      throw new PsnPocError("Resident Evil 4 trophy set selection", {
        code: "SEPARATE_WAYS_GROUP_NOT_FOUND",
      });
    }
    return { details, selectedTitle };
  }

  const candidates = titles
    .filter((title) => normalizeDisplayName(title.titleName) === RE4_NAME)
    .sort((left, right) => updatedAt(right) - updatedAt(left));
  if (candidates.length === 0) {
    throw new PsnPocError("Resident Evil 4 title selection", {
      code: "RE4_TITLE_NOT_FOUND",
    });
  }

  for (const selectedTitle of candidates) {
    const details = await fetchDetails(selectedTitle);
    if (hasSeparateWaysGroup(details)) {
      return { details, selectedTitle };
    }
  }

  throw new PsnPocError("Resident Evil 4 trophy set selection", {
    code: "SEPARATE_WAYS_GROUP_NOT_FOUND",
  });
}
