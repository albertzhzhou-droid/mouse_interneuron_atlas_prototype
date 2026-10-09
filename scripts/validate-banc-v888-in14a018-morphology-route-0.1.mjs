#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeBancV888SwcBounds, parseBancV888IN14A018Swc } from "../app/banc-v888-in14a018-morphology-route.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROUTE_PATH = path.join(ROOT, "data/banc-v888-in14a018-morphology-route-0.1.json");

export async function validateBancV888IN14A018MorphologyRoute() {
  const route = JSON.parse(await readFile(ROUTE_PATH, "utf8"));
  const swcBytes = await readFile(path.join(ROOT, route.skeleton.projectPath));
  const digest = createHash("sha256").update(swcBytes).digest("hex");
  assert.equal(route.researchUpgradeId, "UPG-248");
  assert.equal(route.sourceId, "SRC-BANC-V888-IN14A018");
  assert.equal(route.recordSetId, "RS-BANC-V888-IN14A018-MORPHOLOGY");
  assert.equal(route.identity.rootId, "720575941350424112");
  assert.equal(route.identity.nucleusId, "73044750394982464");
  assert.deepEqual(route.identity.rootIdStableAcrossMaterializations, ["v626", "v850", "v888", "v890"]);
  assert.equal(route.biologicalScope.species, "Drosophila melanogaster");
  assert.equal(route.biologicalScope.comparisonOnly, true);
  assert.equal(route.biologicalScope.mouseIdentityOrHomologyEstablished, false);
  assert.equal(swcBytes.byteLength, route.skeleton.bytes);
  assert.equal(digest, route.skeleton.sha256);
  const parsed = parseBancV888IN14A018Swc(swcBytes.toString("utf8"));
  assert.equal(parsed.nodes.length, 7451);
  assert.equal(parsed.edges.length, 7450);
  assert.equal(parsed.root.parentId, -1);
  assert.deepEqual(parsed.nodeTypeCodes, [2]);
  const bounds = computeBancV888SwcBounds(parsed.nodes);
  assert.deepEqual(bounds, route.skeleton.coordinates.boundsNanometres);
  assert.deepEqual(route.skeleton.nodeTypeCodes, [2]);
  assert.equal(route.skeleton.nodeTypeInterpretation, "uninterpreted_source_type_2");
  assert.equal(route.skeleton.coordinates.frame, "BANC native source frame");
  assert.equal(route.skeleton.coordinates.unit, "nanometre");
  assert.equal(route.skeleton.coordinates.atlasRegistration, false);
  assert.equal(route.skeleton.radiusValues.presentInFile, true);
  assert.equal(route.skeleton.radiusValues.rendered, false);
  assert.equal(route.nucleusAnnotation.exactAnnotationRowCount, 1);
  assert.deepEqual(route.nucleusAnnotation.positionNanometres, [461824, 954944, 188415]);
  assert.equal(route.nucleusAnnotation.withinSkeletonBounds, true);
  assert.equal(route.nucleusAnnotation.surfaceOrVolumeAdmitted, false);
  assert.equal(route.displayAuthority.sourceReportedMitochondriaCount, 31);
  assert.equal(route.displayAuthority.mitochondriaCountIsGeometry, false);
  assert.equal(route.displayAuthority.mitochondriaCoordinatesOrGeometry, false);
  assert.equal(route.displayAuthority.synapseCoordinatesOrGeometry, false);
  assert.equal(route.displayAuthority.includedInMouseInterneuronCounts, false);
  assert.equal(route.displayAuthority.crossSourceIdentityJoin, false);
  assert.equal(route.displayAuthority.atlasRegistration, false);
  assert.equal(route.displayAuthority.measurementAuthorized, false);
  assert.equal(route.rights.license, "CC BY 4.0");

  const [panel, queue] = await Promise.all([
    readFile(path.join(ROOT, "app/InternalStructureReferencePanel.tsx"), "utf8"),
    readFile(path.join(ROOT, "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md"), "utf8"),
  ]);
  assert.match(panel, /<BancV888IN14A018MorphologyReference\s*\/>/);
  assert.match(panel, /only admitted candidate geometry/);
  assert.match(queue, /UPG-248[^\n]*completed/);
  assert.match(queue, /UPG-249[^\n]*partially completed/);
  return {
    routeId: route.routeId,
    rootId: route.identity.rootId,
    nucleusId: route.identity.nucleusId,
    bytes: swcBytes.byteLength,
    sha256: digest,
    nodeCount: parsed.nodes.length,
    segmentCount: parsed.edges.length,
    sourceNodeTypes: parsed.nodeTypeCodes,
    renderedSurfaces: 0,
    renderedMitochondria: 0,
    mouseJoins: 0,
    atlasRegistrations: 0,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateBancV888IN14A018MorphologyRoute()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
