#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MANIFEST_291_PATH, buildResearchIterationManifest291 } from "../tools/build_research_iteration_manifest_2_91.mjs";
import { computeManifestContentSha256 } from "./build-release-manifest.mjs";
export function compareResearchIteration291Bytes(actualBytes, expectedBytes) {
  const actual = JSON.parse(actualBytes.toString("utf8")), expected = JSON.parse(expectedBytes.toString("utf8"));
  if (actual.manifestContentSha256 !== computeManifestContentSha256(actual) || !actualBytes.equals(expectedBytes)) throw new Error("2.91 current manifest is stale or changed; regenerate only after reviewing current authoritative input changes");
  if (actual.integrity.currentInputByteReplayRequired !== true || actual.implementationScope.fullGoalComplete !== false || actual.implementationScope.mouseSpinalInterneuronSameCellInternalObjectCount !== 0 || actual.implementationScope.bilSectionLinkedCellNucleusGeometryCount !== 0) throw new Error("2.91 current replay or scientific boundary changed");
  return { releaseId: expected.releaseId, version: expected.application.version, inputCount: expected.integrity.inputCount, parentReleaseId: expected.parentIterationManifest.releaseId, ...expected.registrySummary, ...expected.implementationScope };
}
export async function validateResearchIterationManifest291() {
  const [actual, current] = await Promise.all([readFile(MANIFEST_291_PATH), buildResearchIterationManifest291()]);
  return compareResearchIteration291Bytes(actual, current.bytes);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) validateResearchIterationManifest291().then((receipt) => console.log(JSON.stringify(receipt))).catch((error) => { console.error(error.message); process.exitCode = 1; });
