import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { authenticateWithNpsso } from "./auth.mjs";
import { PsnPocError, formatSafeError } from "./errors.mjs";
import {
  fetchAllTitles,
  fetchProfileSummary,
  fetchTitleDetails,
} from "./fetch-profile.mjs";
import { buildNormalizedReport, normalizeTitle } from "./normalize.mjs";
import { defaultPsnClient } from "./psn-client.mjs";
import { assertReportSafe } from "./redact.mjs";
import { resolveTargetAccountId } from "./resolve-target.mjs";
import { selectResidentEvil4Title } from "./select-re4.mjs";
import {
  normalizeAndValidateGroups,
  validateAndMergeTrophies,
  validateTargetProfileSummary,
} from "./validate.mjs";

const REPORT_PATH = path.join(".tmp", "psn-poc", "report.json");

async function removePreviousReport() {
  try {
    await rm(REPORT_PATH, { force: true });
    return true;
  } catch {
    console.error(
      "PSN PoC failed during local report cleanup (code REPORT_CLEANUP_FAILED).",
    );
    process.exitCode = 1;
    return false;
  }
}

async function main() {
  if (!(await removePreviousReport())) return;

  const npsso = process.env.PSN_NPSSO?.trim();
  const targetOnlineId = process.env.PSN_TARGET_ONLINE_ID?.trim();
  if (!npsso || !targetOnlineId) {
    console.error(
      "PSN_NPSSO and PSN_TARGET_ONLINE_ID are required in the environment; no PSN request was made (code MISSING_REQUIRED_ENV).",
    );
    process.exitCode = 1;
    return;
  }

  try {
    const requestedTitle =
      process.env.PSN_POC_NP_COMMUNICATION_ID?.trim() ?? "";
    const client = defaultPsnClient;
    const { authorization, secretValues } = await authenticateWithNpsso(
      npsso,
      client,
    );
    const targetAccountId = await resolveTargetAccountId(
      authorization,
      targetOnlineId,
      client,
    );
    const [profile, rawTitles] = await Promise.all([
      fetchProfileSummary(authorization, targetAccountId, client),
      fetchAllTitles(authorization, targetAccountId, client),
    ]);
    validateTargetProfileSummary(profile);

    const titles = rawTitles.map(normalizeTitle);
    const { details, selectedTitle } = await selectResidentEvil4Title({
      fetchDetails: (title) =>
        fetchTitleDetails(authorization, targetAccountId, title, client),
      requestedNpCommunicationId: requestedTitle,
      titles,
    });

    const normalizedGroups = normalizeAndValidateGroups(
      details.groups,
      details.groupEarnings,
    );
    const trophyResult = validateAndMergeTrophies(
      details.trophyMetadata,
      details.trophyEarnings,
      details.groupEarnings?.progress,
    );
    const validation = {
      targetResolved: true,
      titleListNonEmpty: true,
      residentEvil4Found: true,
      separateWaysGroupFound: true,
      trophyGroupSetsEqual: true,
      ...trophyResult.validation,
    };
    const report = buildNormalizedReport({
      generatedAt: new Date().toISOString(),
      groupEarnings: details.groupEarnings,
      normalizedGroups,
      profile,
      selectedTitle,
      titles: rawTitles,
      trophies: trophyResult.trophies,
      validation,
    });
    const safetyOptions = {
      identifierValues: [targetAccountId, targetOnlineId],
      secretValues,
    };

    assertReportSafe(report, safetyOptions);
    try {
      await mkdir(path.dirname(REPORT_PATH), { recursive: true });
      await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, {
        encoding: "utf8",
        mode: 0o600,
      });
    } catch {
      throw new PsnPocError("local report write", {
        code: "REPORT_WRITE_FAILED",
      });
    }

    const earnedCount = report.selectedTitle.trophies.filter(
      (trophy) => trophy.earned,
    ).length;
    const summary = {
      trophyLevel: report.profile.trophyLevel,
      titleCount: report.titles.length,
      selectedTitle: report.selectedTitle.summary.titleName,
      npServiceName: report.selectedTitle.summary.npServiceName,
      platforms: report.selectedTitle.summary.platforms.join(", "),
      progress: report.selectedTitle.summary.progress,
      hasPlatinum: report.selectedTitle.summary.hasPlatinum,
      platinumEarned: report.selectedTitle.summary.platinumEarned,
      is100Percent: report.selectedTitle.summary.is100Percent,
      groupCount: report.selectedTitle.groups.length,
      trophyCount: report.selectedTitle.trophies.length,
      earnedCount,
      unearnedCount: report.selectedTitle.trophies.length - earnedCount,
      reportPath: REPORT_PATH,
    };
    assertReportSafe(summary, safetyOptions);

    console.log("Target resolved: yes");
    console.log(`Trophy level: ${summary.trophyLevel}`);
    console.log(`Trophy titles: ${summary.titleCount}`);
    console.log(`Selected title: ${summary.selectedTitle}`);
    console.log(`Service: ${summary.npServiceName}`);
    console.log(`Platforms: ${summary.platforms}`);
    console.log(`Title progress: ${summary.progress}`);
    console.log(`Has platinum: ${summary.hasPlatinum}`);
    console.log(`Platinum earned: ${summary.platinumEarned}`);
    console.log(`Is 100 percent: ${summary.is100Percent}`);
    console.log(`Trophy groups: ${summary.groupCount}`);
    console.log("Separate Ways: found");
    console.log(`Individual trophies: ${summary.trophyCount}`);
    console.log(
      `Earned / unearned: ${summary.earnedCount} / ${summary.unearnedCount}`,
    );
    console.log(`Report: ${summary.reportPath}`);
  } catch (error) {
    console.error(formatSafeError(error));
    process.exitCode = 1;
  }
}

await main();
