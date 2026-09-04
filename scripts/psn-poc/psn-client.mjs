import {
  exchangeAccessCodeForAuthTokens,
  exchangeNpssoForAccessCode,
  getTitleTrophies,
  getTitleTrophyGroups,
  getUserTitles,
  getUserTrophiesEarnedForTitle,
  getUserTrophyGroupEarningsForTitle,
  getUserTrophyProfileSummary,
  makeUniversalSearch,
} from "psn-api";

const defaultImplementation = {
  exchangeAccessCodeForAuthTokens,
  exchangeNpssoForAccessCode,
  getTitleTrophies,
  getTitleTrophyGroups,
  getUserTitles,
  getUserTrophiesEarnedForTitle,
  getUserTrophyGroupEarningsForTitle,
  getUserTrophyProfileSummary,
  makeUniversalSearch,
};

export function createPsnClient(implementation = defaultImplementation) {
  return Object.freeze({
    exchangeAccessCodeForAuthTokens: (...args) =>
      implementation.exchangeAccessCodeForAuthTokens(...args),
    exchangeNpssoForAccessCode: (...args) =>
      implementation.exchangeNpssoForAccessCode(...args),
    getTitleTrophies: (...args) => implementation.getTitleTrophies(...args),
    getTitleTrophyGroups: (...args) =>
      implementation.getTitleTrophyGroups(...args),
    getUserTitles: (...args) => implementation.getUserTitles(...args),
    getUserTrophiesEarnedForTitle: (...args) =>
      implementation.getUserTrophiesEarnedForTitle(...args),
    getUserTrophyGroupEarningsForTitle: (...args) =>
      implementation.getUserTrophyGroupEarningsForTitle(...args),
    getUserTrophyProfileSummary: (...args) =>
      implementation.getUserTrophyProfileSummary(...args),
    makeUniversalSearch: (...args) =>
      implementation.makeUniversalSearch(...args),
  });
}

export const defaultPsnClient = createPsnClient();
