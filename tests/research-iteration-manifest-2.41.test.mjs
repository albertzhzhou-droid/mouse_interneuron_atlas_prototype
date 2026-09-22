import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest241 } from "../scripts/validate-research-iteration-manifest-2.41.mjs";
import {
  RESEARCH_ITERATION_241_ADDITIONAL_INPUTS,
  RESEARCH_ITERATION_241_EXPECTED_INPUT_COUNT,
  RESEARCH_ITERATION_241_PARENT,
  RESEARCH_ITERATION_241_PURPOSE_OVERRIDES,
  RESEARCH_ITERATION_241_RECEIPT_INPUT_IDS,
  buildResearchIterationManifest241,
} from "../tools/build_research_iteration_manifest_2_41.mjs";

const manifestBytes = await readFile(new URL("../data/research-iteration-manifest-2.41.json", import.meta.url));
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const parentBytes = await readFile(new URL("../data/research-iteration-manifest-2.40.json", import.meta.url));
const parent = JSON.parse(parentBytes.toString("utf8"));

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function mutated(update) {
  const copy = structuredClone(manifest);
  update(copy);
  copy.manifestContentSha256 = computeManifestContentSha256(copy);
  return copy;
}

test("validates the deterministic 2.41 active-record, registry, Todd and Cano-Gomez closure", async () => {
  const report = await validateResearchIterationManifest241();
  assert.deepEqual(report, {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.41.0",
    fileBytes: manifestBytes.byteLength,
    fileSha256: sha256(manifestBytes),
    manifestContentSha256: manifest.manifestContentSha256,
    inputCount: 230,
    researchUpgradeCount: 186,
    lastResearchUpgradeId: "UPG-204",
    canonicalSourceCount: 27,
    canonicalRecordSetCount: 34,
    bundledExactRosterCount: 10,
    bundledExactObjectSetCount: 1,
    researchExplorerRecordCount: 641,
    molecularProfileCount: 387,
    sourceNamespaceCount: 10,
    admittedContourObjectCount: 48,
    admittedVertexCount: 2379,
    canoSourceNucleusCount: 169345,
    canoConfirmedInterneuronNucleusCount: 923,
    canoConfirmedInterneuronProfileCount: 11,
    admittedSurfaceCount: 0,
    admittedInternalStructureCount: 0,
    registrationCount: 0,
  });
});

test("rebuilds byte-identically from the immutable 2.40 parent and exact 230-input roster", async () => {
  const built = await buildResearchIterationManifest241();
  assert.deepEqual(built.bytes, manifestBytes);
  assert.deepEqual(manifest.parentIterationManifest, RESEARCH_ITERATION_241_PARENT);
  assert.equal(parentBytes.byteLength, RESEARCH_ITERATION_241_PARENT.bytes);
  assert.equal(sha256(parentBytes), RESEARCH_ITERATION_241_PARENT.fileSha256);
  assert.equal(parent.manifestContentSha256, RESEARCH_ITERATION_241_PARENT.contentSha256);
  assert.equal(parent.authoritativeInputs.length, 187);
  assert.equal(RESEARCH_ITERATION_241_ADDITIONAL_INPUTS.length, 43);
  assert.equal(RESEARCH_ITERATION_241_EXPECTED_INPUT_COUNT, 230);
  assert.equal(manifest.authoritativeInputs.length, 230);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.id)).size, 230);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.path)).size, 230);
  assert.deepEqual(
    manifest.authoritativeInputs.slice(0, 187).map(({ id, scope, path }) => ({ id, scope, path })),
    parent.authoritativeInputs.map(({ id, scope, path }) => ({ id, scope, path })),
  );
  for (const [id, purpose] of Object.entries(RESEARCH_ITERATION_241_PURPOSE_OVERRIDES)) {
    assert.equal(manifest.authoritativeInputs.find((input) => input.id === id)?.purpose, purpose);
  }
  assert.deepEqual(
    manifest.authoritativeInputs.slice(187).map((input) => input.id),
    RESEARCH_ITERATION_241_ADDITIONAL_INPUTS.map((input) => input.id),
  );
});

test("receipts every 2.41 implementation, evidence and envelope input without hard-coded final hashes", () => {
  const exact = manifest.exactReferences.activeRecordRegistrySelectionDeltaToddAndCanoIntegrity;
  assert.equal(RESEARCH_ITERATION_241_RECEIPT_INPUT_IDS.length, 77);
  assert.deepEqual(Object.keys(exact.receipts), RESEARCH_ITERATION_241_RECEIPT_INPUT_IDS);
  for (const id of RESEARCH_ITERATION_241_RECEIPT_INPUT_IDS) {
    const input = manifest.authoritativeInputs.find((candidate) => candidate.id === id);
    assert.ok(input, `missing authoritative input ${id}`);
    assert.deepEqual(exact.receipts[id], {
      path: input.path,
      bytes: input.bytes,
      sha256: input.sha256,
    });
  }
  for (const id of [
    "researchActiveRecordProvider",
    "researchSourceRegistryDenominatorValidator",
    "researchSelectionDeltaRuntime",
    "nativeContourAdmissionCatalog03",
    "nmo50424MbfCellBodyGeometry",
    "nmo50394MbfCellBodyGeometry",
    "nmo50408MbfCellBodyGeometry",
    "canoGomezAllNucleusAudit",
    "canoGomezConfirmedNucleusRoster",
    "canoGomezInterneuronRegistry",
    "researchIteration240SnapshotValidator",
  ]) {
    assert.ok(exact.receipts[id], `missing 2.41 receipt ${id}`);
  }
});

test("locks the five completed upgrades and keeps delta interpretation non-biological", () => {
  const exact = manifest.exactReferences.activeRecordRegistrySelectionDeltaToddAndCanoIntegrity;
  assert.deepEqual(exact.completedUpgradeIds, ["UPG-200", "UPG-201", "UPG-202", "UPG-203", "UPG-204"]);
  assert.equal(exact.sharedVerifiedActiveRecord, true);
  assert.equal(exact.activeRecordLoaderInvocationCount, 1);
  assert.equal(exact.independentConsumerLookupCount, 0);
  assert.equal(exact.selectionDeltaPresentationAuditOnly, true);
  assert.equal(exact.selectionDeltaBiologicalTransitionClaimCount, 0);
  assert.equal(exact.selectionDeltaRelationshipAdmissionCount, 0);
});

test("locks registry-derived UI denominators and exact Explorer 1.13 scope", () => {
  const exact = manifest.exactReferences.activeRecordRegistrySelectionDeltaToddAndCanoIntegrity;
  assert.equal(exact.staleDenominatorLiteralCount, 0);
  assert.deepEqual(
    [exact.canonicalSourceCount, exact.canonicalRecordSetCount, exact.bundledExactRosterCount, exact.bundledExactObjectSetCount],
    [27, 34, 10, 1],
  );
  assert.deepEqual(
    [exact.explorerSourceFileCount, exact.researchExplorerRecordCount, exact.molecularProfileCount, exact.sourceNamespaceCount],
    [21, 641, 387, 10],
  );
});

test("locks Todd MBF line evidence without promoting it to a surface or internal model", () => {
  const exact = manifest.exactReferences.activeRecordRegistrySelectionDeltaToddAndCanoIntegrity;
  assert.deepEqual(
    [exact.admittedRecordCount, exact.admittedContourObjectCount, exact.admittedVertexCount],
    [5, 48, 2379],
  );
  assert.deepEqual(
    [exact.toddRawFalseClosureFlagContourCount, exact.toddMbfCellBodyPresencePropertyCount, exact.toddIndependentParserSomaContourCount, exact.toddAdmittedContourObjectCount, exact.toddAdmittedVertexCount],
    [33, 33, 33, 33, 1904],
  );
  assert.equal(exact.sourceClosureFlagUsedAsSoleToddAuthority, false);
  assert.equal(exact.admittedSurfaceCount, 0);
  assert.equal(exact.admittedInternalStructureCount, 0);
});

test("locks Cano-Gomez source-local CHOL_IN scope and preserves excluded or unresolved rows", () => {
  const exact = manifest.exactReferences.activeRecordRegistrySelectionDeltaToddAndCanoIntegrity;
  assert.equal(exact.canoSourceNucleusCount, 169345);
  assert.equal(exact.canoSourceScopedGroupCount, 57);
  assert.equal(exact.canoConfirmedInterneuronNucleusCount, 923);
  assert.equal(exact.canoConfirmedInterneuronProfileCount, 11);
  assert.equal(exact.canoExcludedMotorNucleusCount, 2276);
  assert.equal(exact.canoPaperReportedNeuronTypeCount, 516);
  assert.equal(exact.canoPaperReportedTypeCountUsedAsInterneuronDenominator, false);
  assert.equal(exact.canoPerNucleusNonNeuronalExcludedCount, null);
  assert.equal(exact.canoCrossAssayCellIdentityVerified, false);
  assert.equal(exact.canoSourceRdsBundleCount, 0);
  assert.equal(
    exact.canoConfirmedInterneuronNucleusCount
      + exact.canoExcludedMotorNucleusCount
      + exact.canoExcludedSensoryScopeNucleusCount
      + exact.canoExcludedProjectionLocalStatusUnresolvedNucleusCount
      + exact.canoExcludedAmbiguousOrProjectionExceptionUnresolvedNucleusCount,
    169345,
  );
});

test("rejects parent, ownership, denominator, Todd, Cano, zero-authority and registration mutations", async () => {
  const reference = (value) => value.exactReferences.activeRecordRegistrySelectionDeltaToddAndCanoIntegrity;
  const cases = [
    mutated((value) => { value.application.version = "2.42.0-research.1"; }),
    mutated((value) => { value.parentIterationManifest.bytes = 1; }),
    mutated((value) => { reference(value).independentConsumerLookupCount = 1; }),
    mutated((value) => { reference(value).selectionDeltaBiologicalTransitionClaimCount = 1; }),
    mutated((value) => { reference(value).canonicalRecordSetCount = 33; }),
    mutated((value) => { reference(value).staleDenominatorLiteralCount = 1; }),
    mutated((value) => { reference(value).researchExplorerRecordCount = 630; }),
    mutated((value) => { reference(value).toddAdmittedContourObjectCount = 32; }),
    mutated((value) => { reference(value).sourceClosureFlagUsedAsSoleToddAuthority = true; }),
    mutated((value) => { reference(value).canoConfirmedInterneuronProfileCount = 516; }),
    mutated((value) => { reference(value).canoPaperReportedTypeCountUsedAsInterneuronDenominator = true; }),
    mutated((value) => { reference(value).canoInternalStructureObjectCount = 1; }),
    mutated((value) => { value.registrations.count = 1; }),
  ];
  for (const value of cases) {
    await assert.rejects(
      () => validateResearchIterationManifest241(value),
      /schema|content receipt|release identity|parent|active-record|selection-delta|denominator|Explorer|Todd|Cano-Gomez|must remain zero|registration/i,
    );
  }
});
