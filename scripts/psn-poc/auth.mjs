import {
  exchangeAccessCodeForAuthTokens,
  exchangeNpssoForAccessCode,
} from "psn-api";

import { runPsnStage } from "./errors.mjs";

export async function authenticateWithNpsso(npsso) {
  const accessCode = await runPsnStage("NPSSO exchange", () =>
    exchangeNpssoForAccessCode(npsso),
  );
  const tokens = await runPsnStage("access-token exchange", () =>
    exchangeAccessCodeForAuthTokens(accessCode),
  );

  return {
    authorization: { accessToken: tokens.accessToken },
    secretValues: [
      npsso,
      accessCode,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.idToken,
    ].filter((value) => typeof value === "string" && value.length > 0),
  };
}
