import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  DISTRIBUTION_VERSION,
  PACKAGE_BASENAME,
  PACKAGE_TIMESTAMP,
  canonicalJson,
  containsCjk,
  isSafeRelativePath,
  renderStaticIndex,
  verifyPackageDirectory,
} from "../scripts/package-curator-review.mjs";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

test("locks the candidate 2.8 private distribution identity", () => {
  assert.equal(DISTRIBUTION_VERSION, "2.8.0-curator.1");
  assert.equal(PACKAGE_BASENAME, "OHRI-Mouse-Interneuron-Atlas-2.8.0-curator.1");
  assert.equal(PACKAGE_TIMESTAMP, "2026-08-26T00:00:00.000Z");
});

async function makeFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "ohri-curator-package-"));
  const content = Buffer.from("English-only review fixture\n");
  await writeFile(path.join(root, "README.txt"), content);
  const body = {
    packageManifestVersion: "1.0.0",
    distributionVersion: "fixture",
    packageTimestamp: "2026-08-17T00:00:00.000Z",
    scientificRelease: {
      releaseId: "fixture",
      schemaVersion: "0.2.0",
      releaseManifestContentSha256: "a".repeat(64),
      registrationCount: 0,
    },
    distributionScope: "private_named_curator_review_only",
    publicDeploymentAuthorized: false,
    automaticExternalRequests: false,
    requiredRuntime: "fixture",
    files: [{ path: "README.txt", bytes: content.length, sha256: sha256(content) }],
  };
  const manifest = { ...body, manifestContentSha256: sha256(Buffer.from(canonicalJson(body))) };
  await writeFile(path.join(root, "PACKAGE_MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n");
  return root;
}

test("rejects package path traversal and ambiguous paths", () => {
  for (const value of ["../escape", "a/../b", "/absolute", "C:\\absolute", "./file", "a//b", ""]) {
    assert.equal(isSafeRelativePath(value), false, value);
  }
  for (const value of ["README.txt", "site/index.html", "docs/CURATOR_REVIEW_GUIDE.md"]) {
    assert.equal(isSafeRelativePath(value), true, value);
  }
});

test("detects CJK text while allowing scientific English and symbols", () => {
  assert.equal(containsCjk("Mouse spinal interneuron atlas · OBS / INF / SCH / SYN / REG"), false);
  assert.equal(containsCjk("For research visualization only."), false);
  assert.equal(containsCjk("科研可视化"), true);
});

test("renders an English static curator index from the production build", async () => {
  const html = await renderStaticIndex();
  assert.match(html, /<html lang="en">/);
  assert.match(html, /Mouse Spinal Interneuron Atlas/);
  assert.match(html, /For research visualization only/);
  assert.doesNotMatch(html, /[\u3400-\u9fff]/u);
});

test("verifies a checksum-locked package and rejects content tampering", async () => {
  const root = await makeFixture();
  try {
    const manifest = await verifyPackageDirectory(root);
    assert.equal(manifest.scientificRelease.registrationCount, 0);
    await writeFile(path.join(root, "README.txt"), "tampered\n");
    await assert.rejects(() => verifyPackageDirectory(root), /byte-count mismatch|SHA-256 mismatch/i);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects undeclared files and symbolic links in a package", async () => {
  const extraRoot = await makeFixture();
  try {
    await writeFile(path.join(extraRoot, "undeclared.txt"), "extra\n");
    await assert.rejects(() => verifyPackageDirectory(extraRoot), /file set differs/i);
  } finally {
    await rm(extraRoot, { recursive: true, force: true });
  }

  const linkRoot = await makeFixture();
  try {
    await symlink(path.join(linkRoot, "README.txt"), path.join(linkRoot, "linked.txt"));
    await assert.rejects(() => verifyPackageDirectory(linkRoot), /symbol(?:ic|) links? (?:are )?forbidden/i);
  } finally {
    await rm(linkRoot, { recursive: true, force: true });
  }
});

test("freezes private curator distribution while tracking post-2.8 research docs separately", async () => {
  const [script, guide, form, notes, checklist, validationReport, adr, comparisonAdr, composerAdr, crateAdr, plannerAdr, traceAdr, relationshipAdr, sourceAdmissionAdr, assertionProvenanceAdr, authorizationPlanAdr, independentEvidenceAdr, referenceLaneAdr, researchQueue] = await Promise.all([
    readFile(new URL("../scripts/package-curator-review.mjs", import.meta.url), "utf8"),
    readFile(new URL("../docs/CURATOR_REVIEW_GUIDE.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/CURATOR_REVIEW_FORM.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/CURATOR_RELEASE_NOTES_2.8.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/CURATOR_DISTRIBUTION_CHECKLIST.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/CURATOR_PACKAGE_VALIDATION_REPORT_2.8.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/ADR-001-TABULAE-LOCAL-SPATIAL-SESSION.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/ADR-002-TABULAE-LOCAL-COMPARISON-BOARD.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/ADR-003-LOCAL-ADMISSION-MANIFEST-COMPOSER.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/ADR-004-DETACHED-RO-CRATE-PROVENANCE.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/ADR-005-PUBLIC-SOURCE-FEASIBILITY-PLANNER.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/ADR-006-TWO-LANE-PROVENANCE-TRACE.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/ADR-007-CROSS-LANE-RELATIONSHIP-ADMISSION.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/ADR-008-PUBLIC-SOURCE-RELEASE-ADMISSION.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/ADR-009-ASSERTION-PROVENANCE-BEFORE-OBJECT-ADMISSION.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/ADR-010-AUTHORIZATION-PLAN-BEFORE-EXECUTION.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/ADR-011-INDEPENDENT-AUTHORIZATION-EVIDENCE-PACKET.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/ADR-012-REFERENCE-ANATOMY-AND-TYPE-LANES.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/RESEARCH_MODEL_UPGRADE_QUEUE.md", import.meta.url), "utf8"),
  ]);
  assert.match(script, /127\.0\.0\.1/);
  assert.match(script, /publicDeploymentAuthorized: false/);
  assert.match(script, /private_named_curator_review_only/);
  assert.match(script, /START_MACOS\.command/);
  assert.match(script, /START_WINDOWS\.cmd/);
  assert.match(script, /START_LINUX\.sh/);
  assert.match(script, /CURATOR_FEEDBACK_FORM\.html/);
  assert.match(script, /public-data-catalog-0\.4\.json/);
  assert.match(script, /russ-harmonized-taxonomy-crosswalk-0\.1\.json/);
  assert.match(script, /russ-reconciliation-dossier-0\.1\.json/);
  assert.match(script, /tabulae-condition-catalog-0\.1\.json/);
  assert.match(script, /tabulae-spatial-local-session-0\.1\.json/);
  assert.match(script, /tabulae-spatial-local-comparison-0\.1\.json/);
  assert.match(script, /spinalj-processed-metadata-audit-0\.4\.json/);
  assert.match(script, /public-source-intake-registry-0\.7\.json/);
  assert.match(script, /file-admission-preflight-0\.7\.json/);
  assert.match(script, /file-admission-preflight-0\.8\.json/);
  assert.match(script, /public-file-admission-manifest-0\.7\.schema\.json/);
  assert.match(script, /public-file-admission-manifest-0\.8\.schema\.json/);
  assert.match(script, /tabulae-spatial-local-session-0\.1\.schema\.json/);
  assert.match(script, /tabulae-spatial-local-comparison-0\.1\.schema\.json/);
  assert.match(script, /public-file-admission-composer-0\.1\.json/);
  assert.match(script, /public-file-admission-composer-0\.1\.schema\.json/);
  assert.match(script, /public-provenance-crate-0\.1\.json/);
  assert.match(script, /public-provenance-crate-0\.1\.schema\.json/);
  assert.match(script, /evidence-feasibility-planner-0\.1\.json/);
  assert.match(script, /evidence-feasibility-planner-0\.1\.schema\.json/);
  assert.match(script, /evidence-provenance-trace-0\.1\.json/);
  assert.match(script, /evidence-provenance-trace-0\.1\.schema\.json/);
  assert.match(script, /cross-lane-relationship-admission-0\.1\.json/);
  assert.match(script, /cross-lane-relationship-admission-0\.1\.schema\.json/);
  assert.match(script, /public-source-release-admission-service-0\.1\.json/);
  assert.match(script, /public-source-release-admission-service-0\.1\.schema\.json/);
  assert.match(script, /public-source-assertion-provenance-0\.1\.json/);
  assert.match(script, /public-source-assertion-provenance-0\.1\.schema\.json/);
  assert.match(script, /public-source-authorization-plan-0\.1\.json/);
  assert.match(script, /public-source-authorization-plan-0\.1\.schema\.json/);
  assert.match(script, /public-source-independent-authorization-evidence-0\.1\.json/);
  assert.match(script, /public-source-independent-authorization-evidence-0\.1\.schema\.json/);
  assert.match(script, /interneuron-knowledge-coverage-0\.1\.json/);
  assert.match(script, /interneuron-knowledge-coverage-0\.1\.schema\.json/);
  assert.match(script, /atlas-internal-compartments\.json/);
  assert.match(script, /SITE_REQUIRED_ASSET_ALLOWLIST/);
  assert.match(script, /ADR-012-REFERENCE-ANATOMY-AND-TYPE-LANES\.md/);
  assert.match(script, /RESEARCH_MODEL_UPGRADE_QUEUE\.md/);
  assert.match(script, /curator-feedback-contract-2\.8\.json/);
  assert.match(script, /curator-feedback-contract-2\.8\.schema\.json/);
  assert.match(script, /curator-adjudication-contract-2\.8\.json/);
  assert.match(script, /curator-adjudication-contract-2\.8\.schema\.json/);
  assert.match(script, /release-manifest-2\.8\.json/);
  assert.match(script, /Curator feedback contract does not match the current package identity/);
  assert.match(script, /Curator adjudication contract does not match the current package identity/);
  assert.match(script, /releaseId: manifest\.releaseId/);
  for (const document of [guide, form, notes, checklist, validationReport, adr, comparisonAdr, composerAdr, crateAdr, plannerAdr, traceAdr, relationshipAdr, sourceAdmissionAdr, assertionProvenanceAdr, authorizationPlanAdr, independentEvidenceAdr]) {
    assert.doesNotMatch(document, /[\u3400-\u9fff]/u);
    assert.match(document, /0 registrations|zero registrations|registration count is \*\*0\*\*|0 .REG.|zero .REG./i);
    assert.match(document, /public deployment|publicly host|public release/i);
  }
  for (const document of [referenceLaneAdr, researchQueue]) assert.doesNotMatch(document, /[\u3400-\u9fff]/u);
  assert.match(guide, /Task 1/);
  assert.match(guide, /Task 6/);
  assert.match(guide, /Task 7/);
  assert.match(guide, /Task 8/);
  assert.match(guide, /Task 9/);
  assert.match(guide, /Task 10/);
  assert.match(guide, /Task 11/);
  assert.match(guide, /Task 12/);
  assert.match(guide, /Task 13/);
  assert.match(form, /ACCEPT/);
  assert.match(form, /REJECT/);
  assert.match(form, /UNCERTAIN/);
  assert.match(notes, /0 registrations/i);
  assert.match(notes, /15 checksum-locked native.*contour planes/i);
  assert.match(notes, /INF.*display derivative/i);
  assert.match(notes, /measurement is forbidden/i);
  assert.match(notes, /coarse gray-matter row-envelope.*not a full gray boundary/i);
  assert.match(notes, /seven atlas-source-ID major structures/i);
  assert.match(notes, /408 separate 4-connected components.*408 exact mask-edge polygons/i);
  assert.match(notes, /dorsal funiculus ID 74 at z1470.*one explicit missing plane/i);
  assert.match(notes, /renders internal anatomy only as plane-local line segments using a seven-color project display-only palette keyed to preserved source IDs/i);
  assert.match(notes, /display colors carry no source\/anatomical authority.*exact source color is retained in `userData`/i);
  assert.match(notes, /never lofts, fills, joins, manually bridges.*cross-plane-corresponded objects/i);
  assert.match(notes, /65 Russ 2021 non-motoneuron interneuron\/projection-neuron candidates.*TYPE_LEVEL.*unplaced/i);
  assert.match(notes, /not 65 confirmed interneurons/i);
  assert.match(notes, /five-source by seven-axis/i);
  assert.match(notes, /35 source-by-axis judgments retains? a publication locator.*seven audited locator corrections/i);
  assert.match(notes, /cross-study mapping remains `not_established`/i);
  assert.match(notes, /morphology remains `not_measured`/i);
  assert.match(notes, /Tabulae alone retains a source-bounded `direct` causal entry/i);
  assert.match(notes, /AAV-DTR was delivered two weeks before complete crush SCI.*diphtheria toxin was administered at eight weeks.*ablate thoracic Vsx2ON neurons.*preventing natural walking recovery/i);
  assert.match(notes, /does not transfer to every source label, a Russ population, or a project entity/i);
  assert.match(notes, /same-cell.*same-specimen.*morphology.*coordinate.*causal join/i);
  assert.match(validationReport, /distributable only after both write-mode package verification and the independent package validator pass/i);
  assert.match(validationReport, /77da24a7a7bba373023b2c4f5a654bc0657fa27f8c021e000765ad9545ac45ed/i);
  assert.match(validationReport, /bf43b0fb45fc51e7811cb551820c310c3a1468b1e175fbdb30625faf4893eb85/i);
  assert.match(validationReport, /57 declared inputs/i);
  assert.match(validationReport, /no manual geometry, no manual bridging, no cross-plane component correspondence or interpolation/i);
  assert.match(validationReport, /only plane-local line-segment rendering with a seven-color project display-only palette keyed to preserved source IDs/i);
  assert.match(validationReport, /display colors carry no source\/anatomical authority.*exact source color remains in `userData`/i);
  assert.match(validationReport, /never be lofted, filled, or joined/i);
  assert.match(validationReport, /five primary-source lanes against seven precision axes/i);
  assert.match(validationReport, /All 35 source-by-axis judgments retain publication locators.*seven audited locator corrections/i);
  assert.match(validationReport, /crossStudyMappingStatus: not_established/i);
  assert.match(validationReport, /Tabulae is the only lane permitted to retain `causal_mechanism: direct`/i);
  assert.match(validationReport, /ZIP must not be distributed if either write-mode verification or the independent package validator fails/i);
  assert.match(adr, /browser-local 2D session/i);
  assert.match(adr, /no remote request, upload, persistence, automatic acquisition/i);
  assert.match(comparisonAdr, /up to four/i);
  assert.match(comparisonAdr, /not establish an inter-section physical frame/i);
  assert.match(comparisonAdr, /no remote acquisition, upload, persistence, source-file bundling/i);
  assert.match(composerAdr, /browser-local/i);
  assert.match(composerAdr, /does not fetch, upload, persist, inspect, decompress, hash, acquire, bundle, transform or register/i);
  assert.match(composerAdr, /RO-Crate/i);
  assert.match(crateAdr, /detached RO-Crate/i);
  assert.match(crateAdr, /0 registrations/i);
  assert.match(plannerAdr, /single declared source-specific route/i);
  assert.match(plannerAdr, /package-coverage result/i);
  assert.match(plannerAdr, /does not acquire.*create no `REG`|creates no `REG`/i);
  assert.match(traceAdr, /NO CROSS-LANE EDGE/);
  assert.match(traceAdr, /does not.*source object.*zero `REG`/i);
  assert.match(relationshipAdr, /not-admitted relationship proposal composer/i);
  assert.match(relationshipAdr, /sourceObjectsAcquired: false/);
  assert.match(sourceAdmissionAdr, /Entity–Activity–Agent/i);
  assert.match(sourceAdmissionAdr, /not_admitted_pending_curator_object_and_rights_review/);
  assert.match(sourceAdmissionAdr, /does not acquire or inspect a source object/i);
  assert.match(assertionProvenanceAdr, /assertion-level provenance/i);
  assert.match(assertionProvenanceAdr, /not_locally_verified/);
  assert.match(assertionProvenanceAdr, /UPG-019/);
  assert.match(authorizationPlanAdr, /authorization-and-local-verification plan composer/i);
  assert.match(authorizationPlanAdr, /UPG-020/);
  assert.match(authorizationPlanAdr, /not authorized by the plan/i);
  assert.match(independentEvidenceAdr, /independent authorization-evidence packet/i);
  assert.match(independentEvidenceAdr, /not_authenticated_by_this_packet/);
  assert.match(independentEvidenceAdr, /UPG-021/);
  assert.match(referenceLaneAdr, /three deliberately separate lanes/i);
  assert.match(referenceLaneAdr, /Reference anatomy \(`INF`\)/i);
  assert.match(referenceLaneAdr, /Molecular type landscape \(`TYPE_LEVEL`\)/i);
  assert.match(referenceLaneAdr, /SCI evidence entities \(`SYN` geometry, `SCH` pathways\)/i);
  assert.match(referenceLaneAdr, /measurement is forbidden|measurement-forbidden/i);
  assert.match(referenceLaneAdr, /65 Russ non-motoneuron interneuron\/projection-neuron candidates/i);
  assert.match(referenceLaneAdr, /not 65 confirmed interneurons/i);
  assert.match(referenceLaneAdr, /plane-local line segments using a seven-color project display-only palette keyed to preserved source IDs/i);
  assert.match(referenceLaneAdr, /display colors carry no source\/anatomical authority.*exact source color is retained in `userData`/i);
  assert.match(referenceLaneAdr, /never lofted, filled, joined, manually bridged.*cross-plane-corresponded/i);
  assert.match(researchQueue, /UPG-022/);
  assert.match(researchQueue, /UPG-028/);
  assert.match(researchQueue, /UPG-022 \| P0 \| completed/i);
  assert.match(researchQueue, /UPG-023 \| P0 \| completed/i);
  assert.match(researchQueue, /UPG-024 \| P0 \| completed/i);
  assert.match(researchQueue, /973 separate 4-connected components and 975 mask-edge rings exact relative to the sampled native annotation pixels/i);
  assert.match(researchQueue, /73 direct leaves.*37 selectable browser labels.*three structural-context labels.*33 motor-context labels/i);
  assert.match(researchQueue, /37-label browser.*14 laminae, 17 nuclei\/columns, and 6 tracts/i);
  assert.match(researchQueue, /2,431 four-connected components, 2,511 simple closed sampled-mask rings, and 670 explicit missing structure-plane pairs/i);
  assert.match(researchQueue, /full-native-volume exact masks and voxel-face surfaces for all 73 represented direct labels/i);
  assert.match(researchQueue, /independent set oracle.*zero missing.*extra faces/i);
  assert.match(researchQueue, /computational fidelity check.*not a genuinely independent biological benchmark/i);
  assert.match(researchQueue, /32\/32.*does \*\*not\*\* increase native voxel resolution.*provide independent validation/i);
  assert.match(researchQueue, /project display colors keyed to preserved source IDs.*display colors carry no source\/anatomical authority/i);
  assert.match(researchQueue, /never lofts, fills, joins, manually bridges.*cross-plane-corresponded/i);
  assert.match(researchQueue, /source annotation value\/identifier/i);
  assert.match(researchQueue, /must reject color-based reverse engineering/i);
});
