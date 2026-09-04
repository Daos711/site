import { runPsnStage } from "./errors.mjs";
import { defaultPsnClient } from "./psn-client.mjs";

export async function authenticateWithNpsso(npsso, client = defaultPsnClient) {
  const accessCode = await runPsnStage("NPSSO exchange", () =>
    client.exchangeNpssoForAccessCode(npsso),
    { code: "NPSSO_EXCHANGE_FAILED" },
  );
  const tokens = await runPsnStage("access-token exchange", () =>
    client.exchangeAccessCodeForAuthTokens(accessCode),
    { code: "TOKEN_EXCHANGE_FAILED" },
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
