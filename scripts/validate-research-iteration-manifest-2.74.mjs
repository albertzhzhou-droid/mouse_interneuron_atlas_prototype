#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { INPUTS_274, MANIFEST_274_PATH, buildResearchIterationManifest274 } from "../tools/build_research_iteration_manifest_2_74.mjs";
import { SNAPSHOT_273, validateResearchIterationManifest273Snapshot } from "./validate-research-iteration-manifest-2.73-snapshot.mjs";

export async function validateResearchIterationManifest274(override = null) {
  const built = await buildResearchIterationManifest274();
  const bytes = await readFile(MANIFEST_274_PATH);
  const manifest = override ?? JSON.parse(bytes.toString("utf8"));
  if (override === null && !bytes.equals(built.bytes)) throw new Error("On-disk 2.74 manifest differs from verified rebuild");
  if (JSON.stringify(manifest) !== JSON.stringify(built.manifest)) throw new Error("2.74 evidence or input receipts differ from verified rebuild");
  const ids = new Set(manifest.authoritativeInputs.map((input) => input.path));
  if (ids.size !== manifest.integrity.inputCount || manifest.integrity.inputPathsUnique !== true) throw new Error("Duplicate 2.74 input receipt");
  for (const inputPath of INPUTS_274) {
    if (!ids.has(inputPath)) throw new Error(`2.74 exact input receipt missing: ${inputPath}`);
  }
  const parent = await validateResearchIterationManifest273Snapshot();
  if (manifest.parentIterationManifest.path !== SNAPSHOT_273.path
    || manifest.parentIterationManifest.releaseId !== parent.releaseId
    || manifest.parentIterationManifest.bytes !== SNAPSHOT_273.bytes
    || manifest.parentIterationManifest.fileSha256 !== SNAPSHOT_273.fileSha256
    || manifest.parentIterationManifest.contentSha256 !== SNAPSHOT_273.contentSha256) throw new Error("2.74 rollback parent must remain the immutable 2.73 manifest");
  const counts = manifest.registrySummary;
  if (counts.canonicalSourceCount !== 30 || counts.canonicalRecordSetCount !== 39
    || counts.bundledExactCellProfileRosterCount !== 13 || counts.bundledExactSourceObjectSetCount !== 4
    || counts.sourceProfileCount !== 387 || counts.researchUpgradeCount !== 231
    || counts.completedResearchUpgradeCount !== 69 || counts.displayedResearchUpgradeCount !== 39
    || counts.staleCanonicalDenominatorLiteralCount !== 0) throw new Error("2.74 source or upgrade registry denominators changed");
  const route = manifest.exactReferences.bancV888IN14A018MorphologyRoute;
  if (route.rootId !== "720575941350424112" || route.nucleusId !== "73044750394982464"
    || route.nodeCount !== 7451 || route.segmentCount !== 7450 || route.renderedSurfaces !== 0
    || route.renderedMitochondria !== 0 || route.mouseJoins !== 0 || route.atlasRegistrations !== 0) throw new Error("2.74 BANC source geometry gate changed");
  if (manifest.exactReferences.mouseCensusExpansionCount !== 0
    || manifest.exactReferences.projectAtlasRegistrations !== 0
    || manifest.exactReferences.sourceReportedMitochondriaCountIsGeometry !== false) throw new Error("2.74 mouse/source-object boundary changed");
  const layout = manifest.exactReferences.layout;
  if (layout.fullProjectCopyCount !== 0 || layout.rollbackParent !== SNAPSHOT_273.path
    || layout.distinctTimelinePath !== "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_74.md") throw new Error("2.74 rollback or no-copy receipt changed");
  return {
    releaseId: manifest.releaseId,
    version: manifest.application.version,
    inputCount: ids.size,
    parentReleaseId: parent.releaseId,
    sourceCount: counts.canonicalSourceCount,
    recordSetCount: counts.canonicalRecordSetCount,
    exactRosterCount: counts.bundledExactCellProfileRosterCount,
    sourceObjectSetCount: counts.bundledExactSourceObjectSetCount,
    routeNodeCount: route.nodeCount,
    internalSurfaceCount: route.renderedSurfaces,
    mouseJoinCount: route.mouseJoins,
    fullProjectCopyCount: layout.fullProjectCopyCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest274()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
