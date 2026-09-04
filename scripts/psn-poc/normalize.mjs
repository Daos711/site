const TROPHY_TYPES = new Set(["bronze", "silver", "gold", "platinum"]);

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function nullableNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function normalizeTrophyCounts(counts = {}) {
  return {
    bronze: numberOrZero(counts.bronze),
    silver: numberOrZero(counts.silver),
    gold: numberOrZero(counts.gold),
    platinum: numberOrZero(counts.platinum),
  };
}

export function normalizeProfile(rawProfile) {
  return {
    trophyLevel: numberOrZero(rawProfile?.trophyLevel),
    progress: numberOrZero(rawProfile?.progress),
    earnedTrophies: normalizeTrophyCounts(rawProfile?.earnedTrophies),
  };
}

export function deriveTitleStatus({
  definedTrophies = {},
  earnedTrophies = {},
  progress = 0,
}) {
  return {
    hasPlatinum: numberOrZero(definedTrophies.platinum) > 0,
    platinumEarned: numberOrZero(earnedTrophies.platinum) > 0,
    is100Percent: numberOrZero(progress) === 100,
  };
}

function normalizePlatforms(value) {
  if (Array.isArray(value)) {
    return value.map(String).map((platform) => platform.trim()).filter(Boolean);
  }
  if (typeof value !== "string") return [];
  return value.split(",").map((platform) => platform.trim()).filter(Boolean);
}

export function normalizeTitle(rawTitle) {
  if (!rawTitle?.npCommunicationId) {
    throw new Error("A title is missing npCommunicationId.");
  }
  if (!new Set(["trophy", "trophy2"]).has(rawTitle.npServiceName)) {
    throw new Error("A title has an unsupported npServiceName.");
  }

  const title = {
    npCommunicationId: String(rawTitle.npCommunicationId),
    npServiceName: rawTitle.npServiceName,
    titleName: String(rawTitle.trophyTitleName ?? ""),
    titleIconUrl: String(rawTitle.trophyTitleIconUrl ?? ""),
    platforms: normalizePlatforms(rawTitle.trophyTitlePlatform),
    progress: numberOrZero(rawTitle.progress),
    definedTrophies: normalizeTrophyCounts(rawTitle.definedTrophies),
    earnedTrophies: normalizeTrophyCounts(rawTitle.earnedTrophies),
    lastUpdatedDateTime: String(rawTitle.lastUpdatedDateTime ?? ""),
  };
  return { ...title, ...deriveTitleStatus(title) };
}

function updatedAt(title) {
  const timestamp = Date.parse(title.lastUpdatedDateTime);
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}

export function selectSampleTitle(titles, requestedNpCommunicationId = "") {
  if (requestedNpCommunicationId) {
    return (
      titles.find(
        (title) => title.npCommunicationId === requestedNpCommunicationId,
      ) ?? null
    );
  }

  const newestFirst = [...titles].sort((left, right) =>
    updatedAt(right) - updatedAt(left),
  );
  return (
    newestFirst.find((title) => numberOrZero(title.progress) < 100) ??
    newestFirst[0] ??
    null
  );
}

export function normalizeGroups(rawGroups, rawGroupEarnings) {
  const earningsById = new Map(
    (rawGroupEarnings?.trophyGroups ?? []).map((group) => [
      String(group.trophyGroupId),
      group,
    ]),
  );

  return [...(rawGroups?.trophyGroups ?? [])]
    .sort((left, right) => {
      if (left.trophyGroupId === "default") return -1;
      if (right.trophyGroupId === "default") return 1;
      return String(left.trophyGroupId).localeCompare(String(right.trophyGroupId));
    })
    .map((group) => {
      const groupId = String(group.trophyGroupId);
      const earnings = earningsById.get(groupId);
      return {
        groupId,
        classification: groupId === "default" ? "base" : "additional",
        name: String(group.trophyGroupName ?? ""),
        iconUrl: String(group.trophyGroupIconUrl ?? ""),
        definedTrophies: normalizeTrophyCounts(group.definedTrophies),
        progress: numberOrZero(earnings?.progress),
        earnedTrophies: normalizeTrophyCounts(earnings?.earnedTrophies),
        lastUpdatedDateTime: earnings?.lastUpdatedDateTime ?? null,
      };
    });
}

export function mergeTrophies(metadata, earnedState) {
  const earnedById = new Map(
    earnedState.map((trophy) => [Number(trophy.trophyId), trophy]),
  );

  return metadata
    .map((trophy) => {
      const trophyId = Number(trophy.trophyId);
      const earned = earnedById.get(trophyId);
      const type = trophy.trophyType ?? earned?.trophyType;
      if (!Number.isInteger(trophyId) || !TROPHY_TYPES.has(type)) {
        throw new Error("Trophy metadata is missing a stable ID or type.");
      }

      const wasEarned = Boolean(earned?.earned);
      return {
        trophyId,
        groupId: String(trophy.trophyGroupId ?? "default"),
        type,
        name: trophy.trophyName ?? null,
        detail: trophy.trophyDetail ?? null,
        hidden: Boolean(trophy.trophyHidden),
        earned: wasEarned,
        earnedAt: wasEarned ? (earned?.earnedDateTime ?? null) : null,
        rarity: nullableNumber(earned?.trophyRare),
        earnedRate: nullableNumber(earned?.trophyEarnedRate),
        iconUrl: trophy.trophyIconUrl ?? null,
      };
    })
    .sort((left, right) => left.trophyId - right.trophyId);
}

export function buildNormalizedReport({
  generatedAt,
  groupEarnings,
  normalizedGroups,
  profile,
  selectedTitle,
  titles,
  trophies,
  validation,
}) {
  const summary = {
    ...selectedTitle,
    progress: numberOrZero(groupEarnings?.progress),
    earnedTrophies: normalizeTrophyCounts(groupEarnings?.earnedTrophies),
    lastUpdatedDateTime:
      groupEarnings?.lastUpdatedDateTime ?? selectedTitle.lastUpdatedDateTime,
  };

  return {
    generatedAt,
    target: {
      mode: "cross-account",
      resolution: "universal-search",
      exactOnlineIdMatch: true,
    },
    profile: normalizeProfile(profile),
    titles: titles.map(normalizeTitle),
    selectedTitle: {
      summary: { ...summary, ...deriveTitleStatus(summary) },
      groups: normalizedGroups,
      trophies,
    },
    validation,
  };
}
