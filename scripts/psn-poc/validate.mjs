import { PsnPocError } from "./errors.mjs";
import { mergeTrophies, normalizeGroups } from "./normalize.mjs";

const ISO_DATE_TIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u;

function fail(stage, code) {
  throw new PsnPocError(stage, { code });
}

function collectUniqueIds(items, getId, code) {
  if (!Array.isArray(items) || items.length === 0) {
    fail("trophy data validation", code);
  }

  const ids = new Set();
  for (const item of items) {
    const id = getId(item);
    if (id === null || ids.has(id)) {
      fail("trophy data validation", code);
    }
    ids.add(id);
  }
  return ids;
}

function sameSet(left, right) {
  return left.size === right.size && [...left].every((id) => right.has(id));
}

function trophyId(item) {
  const id = item?.trophyId;
  return typeof id === "number" && Number.isInteger(id) && id >= 0 ? id : null;
}

function groupId(item) {
  const id = item?.trophyGroupId;
  return typeof id === "string" && id.length > 0 ? id : null;
}

function validIsoDateTime(value) {
  return (
    typeof value === "string" &&
    ISO_DATE_TIME.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

export function validateTargetProfileSummary(profile) {
  if (
    profile === null ||
    typeof profile !== "object" ||
    String(profile.trophyLevel ?? "").trim() === "" ||
    !Number.isFinite(Number(profile.progress)) ||
    profile.earnedTrophies === null ||
    typeof profile.earnedTrophies !== "object"
  ) {
    fail("target profile validation", "TARGET_PROFILE_EMPTY");
  }
}

export function normalizeAndValidateGroups(rawGroups, rawGroupEarnings) {
  const metadata = rawGroups?.trophyGroups;
  const earnings = rawGroupEarnings?.trophyGroups;
  const metadataIds = collectUniqueIds(
    metadata,
    groupId,
    "TROPHY_GROUP_SET_MISMATCH",
  );
  const earningsIds = collectUniqueIds(
    earnings,
    groupId,
    "TROPHY_GROUP_SET_MISMATCH",
  );

  if (!sameSet(metadataIds, earningsIds)) {
    fail("trophy group validation", "TROPHY_GROUP_SET_MISMATCH");
  }

  return normalizeGroups(rawGroups, rawGroupEarnings);
}

export function validateAndMergeTrophies(metadata, earnedState, progress) {
  const metadataIds = collectUniqueIds(
    metadata,
    trophyId,
    "TROPHY_ID_SET_MISMATCH",
  );
  const earnedIds = collectUniqueIds(
    earnedState,
    trophyId,
    "TROPHY_ID_SET_MISMATCH",
  );
  if (!sameSet(metadataIds, earnedIds)) {
    fail("individual trophy validation", "TROPHY_ID_SET_MISMATCH");
  }

  for (const trophy of earnedState) {
    if (trophy.earned === true) {
      if (!validIsoDateTime(trophy.earnedDateTime)) {
        fail("individual trophy validation", "INVALID_EARNED_TIMESTAMP");
      }
    } else if (
      trophy.earnedDateTime !== null &&
      trophy.earnedDateTime !== undefined
    ) {
      fail("individual trophy validation", "UNEXPECTED_UNEARNED_TIMESTAMP");
    }
  }

  const trophies = mergeTrophies(metadata, earnedState);
  if (
    trophies.length !== metadata.length ||
    trophies.length !== earnedState.length
  ) {
    fail("individual trophy validation", "TROPHY_ID_SET_MISMATCH");
  }

  const hasEarnedTrophies = trophies.some((trophy) => trophy.earned);
  const hasUnearnedTrophies = trophies.some((trophy) => !trophy.earned);
  if (!hasEarnedTrophies) {
    fail("individual trophy validation", "NO_EARNED_TROPHIES");
  }

  const normalizedProgress = Number(progress);
  if (
    !Number.isFinite(normalizedProgress) ||
    normalizedProgress < 0 ||
    normalizedProgress > 100
  ) {
    fail(
      "individual trophy validation",
      "PROGRESS_TROPHY_STATE_MISMATCH",
    );
  }
  if (normalizedProgress === 100 && hasUnearnedTrophies) {
    fail(
      "individual trophy validation",
      "PROGRESS_TROPHY_STATE_MISMATCH",
    );
  }
  if (normalizedProgress < 100 && !hasUnearnedTrophies) {
    fail("individual trophy validation", "NO_UNEARNED_TROPHIES");
  }

  return {
    trophies,
    validation: {
      earnedTimestampsValid: true,
      hasEarnedTrophies,
      hasUnearnedTrophies,
      trophyIdSetsEqual: true,
      trophyStateConsistentWithProgress: true,
      unearnedTimestampsNull: true,
    },
  };
}
