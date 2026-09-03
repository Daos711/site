import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { authenticateWithNpsso } from "./auth.mjs";
import { PsnPocError, formatSafeError } from "./errors.mjs";
import {
  fetchAllTitles,
  fetchProfileSummary,
  fetchTitleDetails,
} from "./fetch-profile.mjs";
import {
  buildNormalizedReport,
  normalizeTitle,
  selectSampleTitle,
} from "./normalize.mjs";
import { assertReportSafe } from "./redact.mjs";

const REPORT_PATH = path.join(".tmp", "psn-poc", "report.json");

async function main() {
  const npsso = process.env.PSN_NPSSO?.trim();
  if (!npsso) {
    console.error(
      "PSN_NPSSO is required in the environment; no PSN request was made.",
    );
    process.exitCode = 1;
    return;
  }

  try {
    const requestedTitle =
      process.env.PSN_POC_NP_COMMUNICATION_ID?.trim() ?? "";
    const { authorization, secretValues } = await authenticateWithNpsso(npsso);
    const [profile, rawTitles] = await Promise.all([
      fetchProfileSummary(authorization),
      fetchAllTitles(authorization),
    ]);
    const titles = rawTitles.map(normalizeTitle);
    const selectedTitle = selectSampleTitle(titles, requestedTitle);

    if (!selectedTitle) {
      throw new PsnPocError("sample title selection", {
        code: requestedTitle ? "TITLE_NOT_FOUND" : "NO_TROPHY_TITLES",
      });
    }

    const details = await fetchTitleDetails(authorization, selectedTitle);
    const report = buildNormalizedReport({
      generatedAt: new Date().toISOString(),
      profile,
      selectedTitle,
      titles: rawTitles,
      ...details,
    });

    assertReportSafe(report, { secretValues });
    await mkdir(path.dirname(REPORT_PATH), { recursive: true });
    await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });

    const earnedCount = report.selectedTitle.trophies.filter(
      (trophy) => trophy.earned,
    ).length;
    const summary = {
      trophyLevel: report.profile.trophyLevel,
      titleCount: report.titles.length,
      selectedTitle: report.selectedTitle.summary.titleName,
      npServiceName: report.selectedTitle.summary.npServiceName,
      groupCount: report.selectedTitle.groups.length,
      trophyCount: report.selectedTitle.trophies.length,
      earnedCount,
      unearnedCount: report.selectedTitle.trophies.length - earnedCount,
      additionalGroupCount: report.selectedTitle.groups.filter(
        (group) => group.classification === "additional",
      ).length,
      reportPath: REPORT_PATH,
    };
    assertReportSafe(summary, { secretValues });

    console.log(`Trophy level: ${summary.trophyLevel}`);
    console.log(`Trophy titles: ${summary.titleCount}`);
    console.log(`Selected title: ${summary.selectedTitle}`);
    console.log(`Service: ${summary.npServiceName}`);
    console.log(`Trophy groups: ${summary.groupCount}`);
    console.log(`Individual trophies: ${summary.trophyCount}`);
    console.log(
      `Earned / unearned: ${summary.earnedCount} / ${summary.unearnedCount}`,
    );
    console.log(`Additional trophy groups: ${summary.additionalGroupCount}`);
    console.log(`Report: ${summary.reportPath}`);
  } catch (error) {
    console.error(formatSafeError(error));
    process.exitCode = 1;
  }
}

await main();
