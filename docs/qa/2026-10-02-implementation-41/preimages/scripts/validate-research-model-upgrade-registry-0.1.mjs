#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  BLOCKER_CODES,
  QUEUE_PATH,
  REGISTRY_PATH,
  RESEARCH_LANES,
  buildResearchUpgradeRegistry,
  parseUpgradeId,
  stableJson,
} from "../tools/build_research_upgrade_registry.mjs";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_URL = new URL(`../${REGISTRY_PATH}`, import.meta.url);
const QUEUE_URL = new URL(`../${QUEUE_PATH}`, import.meta.url);
const APP_ROOT = resolve(PROJECT_ROOT, "app");
const APP_SOURCE_EXTENSION = /\.(?:js|jsx|ts|tsx)$/;
const UPGRADE_ID_PATTERN = /UPG-\d{3}[A-Z]?/g;
const EXPECTED_UPGRADE_COUNT = 243;
const EXPECTED_COMPLETED_COUNT = 79;
const EXPECTED_LAST_INCLUDED_ID = "UPG-261";

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

async function listAppSourceFiles(directory = APP_ROOT) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listAppSourceFiles(path));
    else if (entry.isFile() && APP_SOURCE_EXTENSION.test(entry.name)) files.push(path);
  }
  return files.toSorted();
}

export async function collectDisplayedResearchUpgradeIds() {
  const ids = new Set();
  for (const path of await listAppSourceFiles()) {
    const source = await readFile(path, "utf8");
    for (const id of source.match(UPGRADE_ID_PATTERN) ?? []) {
      if (parseUpgradeId(id).number >= 22) ids.add(id);
    }
  }
  return [...ids].toSorted((left, right) => {
    const a = parseUpgradeId(left);
    const b = parseUpgradeId(right);
    return a.number - b.number || a.suffix.localeCompare(b.suffix);
  });
}

export function validateResearchUpgradeRegistry(registry, {
  queueMarkdown,
  displayedUpgradeIds = [],
  requireDeterministicMatch = true,
} = {}) {
  check(isRecord(registry), "Research/model upgrade registry must be an object");
  check(registry.schemaVersion === "0.1.0", "Research/model upgrade registry schemaVersion must be 0.1.0");
  check(registry.registryId === "ohri-research-model-upgrade-registry-0.1.0", "Research/model upgrade registry id changed");
  check(registry.registryKind === "research_model_only", "Registry must remain research/model-only");
  check(isRecord(registry.sourceQueue), "Registry sourceQueue is required");
  check(registry.sourceQueue.path === QUEUE_PATH, "Registry source queue path changed");
  check(registry.sourceQueue.firstIncludedId === "UPG-022", "Registry must begin at UPG-022");
  check(registry.sourceQueue.governanceAdmissionQueueIncluded === false, "Governance/admission queue must remain excluded");
  check(registry.sourceQueue.excludedGovernanceAdmissionRange === "UPG-001-UPG-021", "Excluded governance/admission range changed");
  check(isIsoDate(registry.sourceQueue.snapshotDate), "Registry queue snapshot date must be ISO YYYY-MM-DD");
  check(isRecord(registry.verificationPolicy), "Registry verification policy is required");
  check(nonEmpty(registry.verificationPolicy.lastVerificationMeaning), "Registry must explain lastVerification semantics");
  check(nonEmpty(registry.verificationPolicy.acceptanceBoundaryMeaning), "Registry must explain acceptanceBoundary semantics");
  check(isRecord(registry.controlledVocabularies), "Registry controlled vocabularies are required");
  check(stableJson(registry.controlledVocabularies.lanes) === stableJson(RESEARCH_LANES), "Research lane vocabulary changed");
  check(stableJson(registry.controlledVocabularies.blockerCodes) === stableJson(BLOCKER_CODES), "Blocker-code vocabulary changed");
  check(Array.isArray(registry.upgrades) && registry.upgrades.length > 0, "Registry upgrades must be a non-empty array");
  check(registry.upgrades.length === EXPECTED_UPGRADE_COUNT, `Registry must contain exactly ${EXPECTED_UPGRADE_COUNT} research/model upgrades`);

  const ids = new Set();
  for (const [index, upgrade] of registry.upgrades.entries()) {
    check(isRecord(upgrade), `upgrades[${index}] must be an object`);
    const parsedId = parseUpgradeId(upgrade.id);
    check(parsedId.number >= 22, `${upgrade.id} belongs to the excluded governance/admission queue`);
    check(!ids.has(upgrade.id), `Duplicate research/model upgrade id: ${upgrade.id}`);
    ids.add(upgrade.id);
    check(/^P[0-2]$/.test(upgrade.priority), `${upgrade.id}.priority is invalid`);
    for (const field of ["status", "lane", "description", "acceptanceBoundary"]) {
      check(nonEmpty(upgrade[field]), `${upgrade.id}.${field} is required`);
    }
    check(RESEARCH_LANES.includes(upgrade.lane), `${upgrade.id}.lane is not controlled`);
    check(isRecord(upgrade.blocker), `${upgrade.id}.blocker is required`);
    check(BLOCKER_CODES.includes(upgrade.blocker.code), `${upgrade.id}.blocker.code is not controlled`);
    check(nonEmpty(upgrade.blocker.detail), `${upgrade.id}.blocker.detail is required`);
    check(isRecord(upgrade.evidenceBasis), `${upgrade.id}.evidenceBasis is required`);
    check(nonEmpty(upgrade.evidenceBasis.markdown), `${upgrade.id}.evidenceBasis.markdown is required`);
    check(nonEmpty(upgrade.evidenceBasis.unlinkedText), `${upgrade.id}.evidenceBasis.unlinkedText is required`);
    check(Array.isArray(upgrade.evidenceBasis.references), `${upgrade.id}.evidenceBasis.references must be an array`);
    for (const [referenceIndex, reference] of upgrade.evidenceBasis.references.entries()) {
      check(isRecord(reference) && nonEmpty(reference.label), `${upgrade.id}.evidenceBasis.references[${referenceIndex}].label is required`);
      check(/^https:\/\//.test(reference.url), `${upgrade.id}.evidenceBasis.references[${referenceIndex}].url must use HTTPS`);
    }
    check(isRecord(upgrade.lastVerification), `${upgrade.id}.lastVerification is required`);
    check(upgrade.lastVerification.date === registry.sourceQueue.snapshotDate, `${upgrade.id}.lastVerification.date must match the queue snapshot`);
    check(upgrade.lastVerification.scope === "queue_row_and_registry_derivation", `${upgrade.id}.lastVerification.scope changed`);
    check(upgrade.lastVerification.independentEvidenceRecheck === false, `${upgrade.id} must not imply an independent evidence recheck`);
    check(new RegExp(`^${QUEUE_PATH.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}#L[1-9][0-9]*$`).test(upgrade.lastVerification.sourcePath), `${upgrade.id}.lastVerification.sourcePath is invalid`);
  }

  check(ids.has("UPG-113"), "UPG-113 must resolve in its own research/model registry");
  const upgradeById = new Map(registry.upgrades.map((upgrade) => [upgrade.id, upgrade]));
  for (const id of ["UPG-197", "UPG-198", "UPG-199"]) {
    check(upgradeById.get(id)?.status === "completed", `${id} must remain a completed 2.40 increment`);
  }
  for (const id of ["UPG-200", "UPG-201", "UPG-202", "UPG-203", "UPG-204"]) {
    const upgrade = upgradeById.get(id);
    check(upgrade?.status === "completed", `${id} must remain a completed 2.41 increment`);
    check(upgrade?.blocker?.code === "none_for_declared_increment", `${id} must retain the completed-increment blocker receipt`);
  }
  for (const id of ["UPG-207", "UPG-208", "UPG-211", "UPG-212", "UPG-216"]) {
    const upgrade = upgradeById.get(id);
    check(upgrade?.status === "completed", `${id} must be a completed research increment`);
    check(upgrade?.blocker?.code === "none_for_declared_increment", `${id} must retain the completed-increment blocker receipt`);
  }
  check(/seven explicitly source-closed.*200 vertices/i.test(upgradeById.get("UPG-197")?.description ?? ""), "UPG-197 exact NMO 45674 admission drifted");
  check(/15 source-native line loops and 475 vertices/i.test(upgradeById.get("UPG-198")?.description ?? ""), "UPG-198 five-file DAT audit denominator drifted");
  check(/eight-slot completeness selector.*376 molecular profiles.*nine exact source namespaces/i.test(upgradeById.get("UPG-199")?.description ?? ""), "UPG-199 fixed-slot completeness scope drifted");

  const activeRecordText = `${upgradeById.get("UPG-200")?.description ?? ""} ${upgradeById.get("UPG-200")?.acceptanceBoundary ?? ""}`;
  check(/deep-freezes? the full nested record graph/i.test(activeRecordText), "UPG-200 deep-frozen active-record receipt drifted");
  check(/same immutable object identity/i.test(activeRecordText), "UPG-200 shared immutable record identity drifted");

  const selectionDeltaText = `${upgradeById.get("UPG-201")?.description ?? ""} ${upgradeById.get("UPG-201")?.acceptanceBoundary ?? ""}`;
  for (const [recordId, loops, vertices] of [["50424", 8, 427], ["50394", 14, 768], ["50408", 11, 709]]) {
    check(new RegExp(`NMO[ _]${recordId}\\s*=\\s*${loops}\\s*\\/\\s*${vertices}`, "i").test(selectionDeltaText), `UPG-201 NMO ${recordId} selection-delta receipt drifted`);
  }
  check(/not evidence of developmental or biological transition/i.test(selectionDeltaText), "UPG-201 non-biological delta boundary drifted");

  const denominatorText = `${upgradeById.get("UPG-202")?.description ?? ""} ${upgradeById.get("UPG-202")?.acceptanceBoundary ?? ""}`;
  check(/derive every live research-facing[^.]*denominator from the checksum-verified canonical source registry/i.test(denominatorText), "UPG-202 dynamic registry-derivation boundary drifted");
  check(/historical implementation baseline was 27 sources, 33 record sets, 9 exact cell\/profile rosters and 1 exact source-object set/i.test(denominatorText), "UPG-202 historical denominator baseline drifted");
  check(/later validated source additions have changed the live totals; .*read current values dynamically from the canonical registry/i.test(denominatorText), "UPG-202 current denominator source drifted");

  const toddText = `${upgradeById.get("UPG-203")?.description ?? ""} ${upgradeById.get("UPG-203")?.acceptanceBoundary ?? ""}`;
  check(/33 retained objects and 1,904 vertices/i.test(toddText), "UPG-203 Todd 33/1,904 source-object receipt drifted");
  check(/48 ordered line loops\s*\/\s*2,379 vertices/i.test(toddText), "UPG-203 five-record 48/2,379 aggregate receipt drifted");
  check(/zero fill, triangles, loft, surface, membrane, volume, internal object/i.test(toddText), "UPG-203 zero-surface/internal boundary drifted");

  const canoText = `${upgradeById.get("UPG-204")?.description ?? ""} ${upgradeById.get("UPG-204")?.acceptanceBoundary ?? ""}`;
  check(/169,345 (?:source-scoped )?neuronal nuclei/i.test(canoText), "UPG-204 169,345-nucleus denominator drifted");
  check(/57 source-scoped groups/i.test(canoText), "UPG-204 57-group denominator drifted");
  check(/11 exact[^.]{0,80}`?CHOL_IN`? profiles/i.test(canoText), "UPG-204 exact 11-profile CHOL_IN admission drifted");
  check(/923 (?:admitted |confirmed )?(?:`?CHOL_IN`? )?nuclei/i.test(canoText), "UPG-204 923-nucleus admission drifted");
  check(/explicit(?:ly)?[^.]{0,160}(?:exclud|boundary)/i.test(canoText), "UPG-204 explicit exclusion-partition boundary drifted");
  for (const [label, pattern] of [["motor", "(?:motor|motoneuron)"], ["sensory", "sensory"], ["projection", "projection"], ["ambiguous", "ambiguous"], ["non-neuronal", "non[- ]?neuronal"]]) {
    check(new RegExp(`\\b${pattern}\\b`, "i").test(canoText), `UPG-204 ${label} exclusion boundary drifted`);
  }
  check(/516[^.]{0,180}(?:is|as|be|become|used)[^.]{0,80}(?:not|never)[^.]{0,120}interneuron denominator|516[^.]{0,180}(?:not|never)[^.]{0,120}interneuron denominator|(?:not|never)[^.]{0,120}516[^.]{0,120}interneuron denominator/i.test(canoText), "UPG-204 must state that paper total 516 is not the interneuron denominator");
  for (const [label, pattern] of [["geometry", "geometry"], ["internal-object", "internal objects?"], ["join", "(?:cross-source |same-cell )?joins?"], ["registration", "registrations?"]]) {
    check(new RegExp(`zero[^.]{0,160}\\b${pattern}\\b`, "i").test(canoText), `UPG-204 zero-${label} boundary drifted`);
  }
  check(/12 source-open `Cell Body` line loops \/ 2,614 vertices/i.test(upgradeById.get("UPG-207")?.description ?? ""), "UPG-207 NMO 108978 receipt drifted");
  check(/12 `CellBody` line loops \/ 156 vertices/i.test(upgradeById.get("UPG-208")?.description ?? ""), "UPG-208 NMO 249676 receipt drifted");
  const glutText = `${upgradeById.get("UPG-211")?.description ?? ""} ${upgradeById.get("UPG-211")?.acceptanceBoundary ?? ""}`;
  check(/92,782/.test(glutText) && /277/.test(glutText), "UPG-211 source-slot denominator drifted");
  check(/`meta\.data\$neuron_types` remains absent/i.test(glutText), "UPG-211 absent metadata boundary drifted");
  check(/not (?:confirmed )?interneuron identities/i.test(glutText), "UPG-211 label interpretation boundary drifted");
  const informationText = `${upgradeById.get("UPG-212")?.description ?? ""} ${upgradeById.get("UPG-212")?.acceptanceBoundary ?? ""}`;
  check(/277 unresolved labels outside the 387 source-profile denominator/i.test(informationText), "UPG-212 277/387 denominator boundary drifted");
  const publishedEmText = `${upgradeById.get("UPG-216")?.description ?? ""} ${upgradeById.get("UPG-216")?.acceptanceBoundary ?? ""}`;
  check(/35 × 24 × 2 μm/.test(publishedEmText), "UPG-216 published volume size drifted");
  check(/not the selected atlas cell or a named subtype/i.test(publishedEmText), "UPG-216 independent-reference boundary drifted");
  check(/zero project geometry/i.test(publishedEmText), "UPG-216 zero-project-geometry boundary drifted");
  const futureEmAudit = upgradeById.get("UPG-217");
  check(futureEmAudit?.status === "completed", "UPG-217 listed-public-file availability audit should be closed");
  check(/does not list a downloadable raw serial-image stack/i.test(futureEmAudit?.description ?? ""), "UPG-217 raw-stack availability finding drifted");
  check(/does not claim that no copy exists in any external repository/i.test(futureEmAudit?.description ?? ""), "UPG-217 audit scope boundary drifted");
  const davisFigure = upgradeById.get("UPG-213");
  check(davisFigure?.status === "completed", "UPG-213 source-figure viewer should be complete");
  check(/caption links panel d to EM panels e–g/i.test(davisFigure?.description ?? ""), "UPG-213 same-cell panel boundary drifted");
  check(/no .*project geometry/i.test(davisFigure?.description ?? ""), "UPG-213 figure must remain non-geometric");
  const micronsSynapse = upgradeById.get("UPG-218");
  check(micronsSynapse?.status.startsWith("partially completed"), "UPG-218 must preserve the source/schema audit while exact-cell extraction remains pending");
  check(/388,781,071 bytes/i.test(micronsSynapse?.description ?? "") && /19073f4b5cbae60d7f92d73f204940ed/i.test(micronsSynapse?.description ?? ""), "UPG-218 exact table file receipt drifted");
  check(/3\.2 million putative automated detections/i.test(micronsSynapse?.description ?? ""), "UPG-218 automated-detection boundary drifted");
  check(/v185\.3/i.test(micronsSynapse?.description ?? "") && /v185\.4/i.test(micronsSynapse?.description ?? ""), "UPG-218 table-to-mesh version boundary drifted");
  check(/configured token/i.test(micronsSynapse?.description ?? "") && /nor full-table download was attempted/i.test(micronsSynapse?.description ?? ""), "UPG-218 source-access boundary drifted");
  const banc = upgradeById.get("UPG-219");
  check(banc?.status.startsWith("partially completed"), "UPG-219 release-level BANC audit should remain partial until exact-cell admission");
  check(/distinct fly-comparison lane/i.test(banc?.description ?? ""), "UPG-219 cross-species boundary drifted");
  check(/188,508 rows × 81 columns/i.test(banc?.description ?? "") && /documentation reports 188,162 × 79/i.test(banc?.description ?? ""), "UPG-219 archive/documentation metadata discrepancy drifted");
  check(/neither count is an interneuron denominator/i.test(banc?.description ?? ""), "UPG-219 metadata counts must not become an interneuron denominator");
  check(/banc_888_mitochondria_v1_human_readable\.csv\.gz/i.test(banc?.description ?? ""), "UPG-219 per-mitochondrion archive filename drifted");
  check(/detected-mitochondria product `MISSING`/i.test(banc?.description ?? ""), "UPG-219 source-map discrepancy must remain visible");
  const bancCell = upgradeById.get("UPG-221");
  check(bancCell?.status.startsWith("partially completed"), "UPG-221 must record only its exact candidate/nucleus/SWC evidence increment");
  check(bancCell?.lane === "internal_microdetail", "UPG-221 must remain in the internal-microdetail lane");
  check(/source-classified VNC-local interneuron candidates/i.test(bancCell?.description ?? ""), "UPG-221 exact candidate gate drifted");
  check(/720575941350424112/.test(bancCell?.description ?? "") && /12,571 candidate rows/i.test(bancCell?.description ?? ""), "UPG-221 candidate identity/filter receipt drifted");
  check(/7,451-node full-resolution SWC member/i.test(bancCell?.description ?? ""), "UPG-221 exact skeleton-member receipt drifted");
  check(/UPG-248 admits only those checksum-pinned parent-child centerline segments plus the same-root nucleus annotation point/i.test(bancCell?.description ?? "")
    && /Continue the exact source-version\/object\/coordinate\/rights chain before any surface, mitochondrial or synaptic geometry/i.test(bancCell?.description ?? ""), "UPG-221 source-local geometry and internal-object boundary drifted");
  const contourSurface = upgradeById.get("UPG-194");
  check(contourSurface?.status.startsWith("completed"), "UPG-194 must record the NMO 50394 source-gated shell completion");
  check(/NMO 50394 only/i.test(contourSurface?.status ?? ""), "UPG-194 must stay record-scoped");
  check(/1,792 vertices \/ 3,328 triangles/i.test(contourSurface?.description ?? ""), "UPG-194 derived mesh denominator drifted");
  check(/not an observed membrane/i.test(contourSurface?.description ?? ""), "UPG-194 open-shell evidence boundary drifted");
  const contourAudit = upgradeById.get("UPG-220");
  check(contourAudit?.status.startsWith("partially completed"), "UPG-220 must retain its measured topology increment with surface admission held");
  check(contourAudit?.lane === "morphology", "UPG-220 must remain in the morphology lane");
  check(/two self-intersecting source loops/i.test(contourAudit?.description ?? "") && /one zero-length source edge/i.test(contourAudit?.description ?? ""), "UPG-220 NMO 50408 topology blocker drifted");
  const merfishVersionAudit = upgradeById.get("UPG-222");
  check(merfishVersionAudit?.status.startsWith("partially completed"), "UPG-222 must preserve the incomplete version-audit boundary");
  check(merfishVersionAudit?.priority === "P0" && merfishVersionAudit?.lane === "provenance_and_identity", "UPG-222 priority or lane drifted");
  check(/18039571/.test(merfishVersionAudit?.description ?? "") && /20533289/.test(merfishVersionAudit?.description ?? ""), "UPG-222 exact Zenodo record IDs drifted");
  check(/ce06f62c0ec4973581dae17bb76f0cd9/.test(merfishVersionAudit?.description ?? "") && /e7328d8bda2fb4b390cb107340ac4c83/.test(merfishVersionAudit?.description ?? ""), "UPG-222 healthy H5AD checksum boundary drifted");
  check(/H5AD schema, observation keys, sample and section IDs/i.test(merfishVersionAudit?.description ?? ""), "UPG-222 exact data-delta gate drifted");
  check(/no H5AD payload or inferred cross-version join/i.test(merfishVersionAudit?.description ?? ""), "UPG-222 no-import and no-join boundary drifted");
  const micronsMitochondria = upgradeById.get("UPG-223");
  check(micronsMitochondria?.priority === "P1" && micronsMitochondria?.lane === "internal_microdetail", "UPG-223 must remain a P1 internal-detail route");
  check(micronsMitochondria?.status.startsWith("closed for this exact target under the documented nominal grid"), "UPG-223 must retain the scoped negative result");
  check(/mit_new\/info/.test(micronsMitochondria?.description ?? ""), "UPG-223 official MICrONS mitochondria metadata audit drifted");
  check(/do not intersect on X or Y/i.test(micronsMitochondria?.description ?? ""), "UPG-223 nominal spatial no-go drifted");
  check(/not proof the biological cell lacks mitochondria/i.test(micronsMitochondria?.description ?? ""), "UPG-223 absence boundary drifted");
  check(/import\/render zero mitochondria/i.test(micronsMitochondria?.description ?? ""), "UPG-223 no-geometry boundary drifted");
  const connectomicCensus = upgradeById.get("UPG-224");
  check(connectomicCensus?.priority === "P1" && connectomicCensus?.lane === "connectivity", "UPG-224 must remain a P1 comparative connectome audit");
  check(connectomicCensus?.status.startsWith("planned"), "UPG-224 must remain planned until versioned source objects are audited");
  check(/1,352-neuron column/.test(connectomicCensus?.description ?? "") && /163 interneurons/.test(connectomicCensus?.description ?? ""), "UPG-224 study-specific denominators drifted");
  check(/not a spinal census or molecular subtype roster/i.test(connectomicCensus?.description ?? ""), "UPG-224 cross-region boundary drifted");
  const fishX = upgradeById.get("UPG-225");
  check(fishX?.priority === "P1" && fishX?.lane === "internal_microdetail", "UPG-225 must remain a P1 comparative source-access audit");
  check(fishX?.status.startsWith("planned"), "UPG-225 must remain planned pending a public object-level export and rights audit");
  check(/available upon request/i.test(fishX?.description ?? ""), "UPG-225 access limitation drifted");
  check(/Never transfer larval-fish geometry, organelles, cell types, counts or coordinates into the mouse spinal model/i.test(fishX?.description ?? ""), "UPG-225 cross-species boundary drifted");
  const nmo108978 = upgradeById.get("UPG-226");
  check(nmo108978?.priority === "P0" && nmo108978?.lane === "morphology" && nmo108978?.status === "completed", "UPG-226 must record the completed NMO 108978 morphology route");
  check(/1,817-node \/ 1,816-segment standardized SWC/.test(nmo108978?.description ?? "") && /12 `Cell Body` line loops \/ 2,614 ordered vertices/.test(nmo108978?.description ?? ""), "UPG-226 exact morphology evidence drifted");
  check(/zero census records, biological cell types.*registrations.*internal primitives/i.test(nmo108978?.description ?? ""), "UPG-226 denominator or internal-detail boundary drifted");
  const completeSelectableCensus = upgradeById.get("UPG-227");
  check(completeSelectableCensus?.priority === "P0" && completeSelectableCensus?.lane === "morphology" && completeSelectableCensus?.status === "completed", "UPG-227 must complete the pinned census main-scene selection increment");
  check(/149 selectable source objects total/.test(completeSelectableCensus?.description ?? "") && /140 3D, 2 planar/.test(completeSelectableCensus?.description ?? ""), "UPG-227 geometry denominators drifted");
  check(/125 Excitatory, 15 Inhibitory, 2 Not Reported/.test(completeSelectableCensus?.description ?? "") && /not a biological type or independent-animal census/.test(completeSelectableCensus?.description ?? ""), "UPG-227 source-label or census boundary drifted");
  const nextRepositoryRelease = upgradeById.get("UPG-228");
  check(nextRepositoryRelease?.priority === "P0" && nextRepositoryRelease?.lane === "morphology" && nextRepositoryRelease?.status.startsWith("partially completed"), "UPG-228 must retain its metadata-only 8.6.125 delta status");
  check(/8\.6\.125/.test(nextRepositoryRelease?.description ?? "") && /8\.6\.124/.test(nextRepositoryRelease?.description ?? ""), "UPG-228 pinned repository releases drifted");
  check(/142 stable IDs/.test(nextRepositoryRelease?.description ?? "") && /raw response is not retained/.test(nextRepositoryRelease?.description ?? ""), "UPG-228 exact-query metadata receipt or reproduction boundary drifted");
  check(/Geometry-file hashes.*not rechecked/.test(nextRepositoryRelease?.description ?? "") && /file-specific hashes and rights are audited/.test(nextRepositoryRelease?.description ?? ""), "UPG-228 geometry or rights gate drifted");
  const kellyTaxonomy = upgradeById.get("UPG-229");
  check(kellyTaxonomy?.priority === "P1" && kellyTaxonomy?.lane === "molecular_taxonomy" && kellyTaxonomy?.status.startsWith("partially completed"), "UPG-229 comparative zebrafish taxonomy admission status changed");
  check(/ten article-reported interneuron labels/.test(kellyTaxonomy?.description ?? "") && /928\.5 MB neuronal RDS remains link-only/.test(kellyTaxonomy?.description ?? ""), "UPG-229 exact roster or raw-data/right boundary drifted");
  const bundleBudget = upgradeById.get("UPG-230");
  check(bundleBudget?.priority === "P2" && bundleBudget?.lane === "research_experience"
    && (bundleBudget?.status.startsWith("planned") || bundleBudget?.status.startsWith("partially completed")), "UPG-230 must retain its partial performance scope; whole-App completion is not established");
  if (bundleBudget?.status.startsWith("partially completed")) check(/10,682,233 decoded bytes \/ 269,594 encoded bytes/.test(bundleBudget.description)
    && /same decoded SHA-256\/schema/.test(bundleBudget.description) && /exclude full application JS execution and scene readiness/.test(bundleBudget.description), "UPG-230 partial transport receipt or performance measurement boundary drifted");
  check(/minified client chunk exceeds 500 kB/.test(bundleBudget?.description ?? "") && /Do not hide or remove features/i.test(bundleBudget?.description ?? ""), "UPG-230 build evidence or full-feature boundary drifted");
  const toddTopology = upgradeById.get("UPG-220");
  check(toddTopology?.priority === "P1" && toddTopology?.lane === "morphology" && toddTopology?.status.startsWith("partially completed"), "UPG-220 must reflect the completed source-local topology audit and held shell gate");
  check(/5\/7 intervals/.test(toddTopology?.description ?? "") && /4\/10 within/.test(toddTopology?.description ?? "") && /0 admitted shells\/triangles/.test(toddTopology?.description ?? ""), "UPG-220 record-level topology results or shell boundary drifted");
  const screenCalibration = upgradeById.get("UPG-231");
  check(screenCalibration?.priority === "P1" && screenCalibration?.lane === "morphology" && screenCalibration?.status.startsWith("planned"), "UPG-231 must remain an independent contour-screen calibration candidate");
  check(/single NMO 50394 software screen/.test(screenCalibration?.description ?? "") && /not independently validated as a biological tolerance/.test(screenCalibration?.description ?? ""), "UPG-231 must preserve the exploratory-threshold boundary");
  const bancMitochondriaRoute = upgradeById.get("UPG-232");
  check(bancMitochondriaRoute?.priority === "P1" && bancMitochondriaRoute?.lane === "internal_microdetail" && bancMitochondriaRoute?.status.startsWith("partially completed"), "UPG-232 must remain a partially completed BANC internal-detail route audit");
  check(/pinned per-neuron row reports a count metric of 31/.test(bancMitochondriaRoute?.description ?? "") && /pt_root_id/.test(bancMitochondriaRoute?.description ?? "") && /zero markers, surfaces/.test(bancMitochondriaRoute?.description ?? ""), "UPG-232 must preserve the count-only, root-filter and no-geometry boundaries");
  const pkd2l1PopulationContext = upgradeById.get("UPG-234");
  check(pkd2l1PopulationContext?.priority === "P1" && pkd2l1PopulationContext?.lane === "spatial_context" && pkd2l1PopulationContext?.status === "completed", "UPG-234 must record the completed aggregate PKD2L1 population-context card");
  check(/eight mean±SD\/range summaries/.test(pkd2l1PopulationContext?.description ?? "") && /18-mouse \/ 811 nested-section frame/.test(pkd2l1PopulationContext?.description ?? ""), "UPG-234 study denominator or Table 5 scope drifted");
  check(/no interneuron denominator.*per-cell coordinates.*morphology.*Crozat record merge/i.test(pkd2l1PopulationContext?.description ?? ""), "UPG-234 aggregate/no-join boundary drifted");
  const pkd2l1RawImageWatch = upgradeById.get("UPG-235");
  check(pkd2l1RawImageWatch?.priority === "P1" && pkd2l1RawImageWatch?.lane === "morphology" && pkd2l1RawImageWatch?.status.startsWith("planned"), "UPG-235 must remain a planned public raw-image deposit audit");
  check(/promises raw data from authors but identifies no public deposit/i.test(pkd2l1RawImageWatch?.description ?? ""), "UPG-235 public availability boundary drifted");
  check(/do not contact authors or use unpublished files/i.test(pkd2l1RawImageWatch?.description ?? ""), "UPG-235 public-data-only acquisition boundary drifted");
  const sourceCellTypeFacet = upgradeById.get("UPG-236");
  check(sourceCellTypeFacet?.priority === "P1" && sourceCellTypeFacet?.lane === "morphology" && sourceCellTypeFacet?.status === "completed", "UPG-236 exact source cell-type facet must remain complete in the morphology lane");
  check(/1,097 exact records and 27 non-missing raw labels/.test(sourceCellTypeFacet?.description ?? "") && /2,735 record-label memberships/.test(sourceCellTypeFacet?.description ?? ""), "UPG-236 source label denominators drifted");
  check(/counts intentionally overlap/.test(sourceCellTypeFacet?.description ?? "") && /first result into a representative neuron/.test(sourceCellTypeFacet?.description ?? ""), "UPG-236 overlap or non-representative boundary drifted");
  const labelPaperCrossTab = upgradeById.get("UPG-237");
  check(labelPaperCrossTab?.priority === "P1" && labelPaperCrossTab?.lane === "morphology" && labelPaperCrossTab?.status === "completed", "UPG-237 paper-by-label cross-tab must remain complete in the morphology lane");
  check(/1,097 exact NMO IDs across 12 DOIs/.test(labelPaperCrossTab?.description ?? "") && /2,735 DOI × raw-label memberships/.test(labelPaperCrossTab?.description ?? ""), "UPG-237 pinned source cross-tab denominators drifted");
  check(/0 DOI-unreported and 0 multi-DOI records/.test(labelPaperCrossTab?.description ?? "") && /figure membership is unassessable for all 1,097 records/.test(labelPaperCrossTab?.description ?? ""), "UPG-237 missing DOI/figure or multi-membership boundary drifted");
  const fish1Audit = upgradeById.get("UPG-238");
  check(fish1Audit?.priority === "P1" && fish1Audit?.lane === "provenance_and_identity" && fish1Audit?.status.startsWith("planned"), "UPG-238 must remain a planned, separate Fish1 identity/object audit");
  check(/7-dpf EM plus confocal LM from the same specimen/.test(fish1Audit?.description ?? "") && /gad1b\+`\/inhibitory is not by itself a named spinal interneuron subtype/.test(fish1Audit?.description ?? ""), "UPG-238 species, specimen or subtype boundary drifted");
  const microStructAudit = upgradeById.get("UPG-239");
  check(microStructAudit?.priority === "P1" && microStructAudit?.lane === "internal_microdetail" && microStructAudit?.status.startsWith("completed"), "UPG-239 public ultrastructure package audit must be complete");
  check(/540 paired `image`\/`label` rows/.test(microStructAudit?.description ?? "") && /3964 × 3964 pixels/.test(microStructAudit?.description ?? ""), "UPG-239 pinned dataset scope or pixel-only scale boundary drifted");
  check(/CC BY-NC-SA 4\.0/.test(microStructAudit?.description ?? "") && /zero extrusion/.test(microStructAudit?.description ?? ""), "UPG-239 license or no-extrusion boundary drifted");
  const svaraAudit = upgradeById.get("UPG-240");
  check(svaraAudit?.priority === "P1" && svaraAudit?.lane === "morphology" && svaraAudit?.status.startsWith("partially completed"), "UPG-240 must retain its partial metadata-and-route audit status");
  check(/39 morphologically consistent CiDs among 170 completely traced cells/.test(svaraAudit?.description ?? "")
    && /three exact official ZIPs and 212 catalogue pages audited/.test(svaraAudit?.status ?? "")
    && /explicit publisher supplementary-data policy/.test(svaraAudit?.description ?? "")
    && /zero editable skeletons, meshes, raw volumes or endpoint tables/.test(svaraAudit?.description ?? "")
    && /Never substitute this zebrafish circuit for mouse morphology/.test(svaraAudit?.description ?? ""), "UPG-240 source counts, archive discovery or cross-species boundary drifted");
  const independentMorphologyHandoff = upgradeById.get("UPG-241");
  check(independentMorphologyHandoff?.priority === "P0" && independentMorphologyHandoff?.lane === "morphology" && independentMorphologyHandoff?.status === "completed", "UPG-241 must be the completed exact-label morphology handoff");
  check(/literal text search/.test(independentMorphologyHandoff?.description ?? "") && /require explicit selection/.test(independentMorphologyHandoff?.description ?? "") && /No new cell-type relationship/.test(independentMorphologyHandoff?.description ?? ""), "UPG-241 must retain its search-only and no-identity boundary");
  const nakamuraSbemAudit = upgradeById.get("UPG-242");
  check(nakamuraSbemAudit?.priority === "P1" && nakamuraSbemAudit?.lane === "internal_microdetail" && nakamuraSbemAudit?.status === "completed", "UPG-242 bounded Nakamura SBEM availability audit must be complete");
  check(/71 CSF-cNs/.test(nakamuraSbemAudit?.description ?? "") && /Figures 2 and 7/.test(nakamuraSbemAudit?.description ?? "") && /not a voxel stack/.test(nakamuraSbemAudit?.description ?? "") && /not establish independent asset-specific reuse rights/.test(nakamuraSbemAudit?.description ?? "") && /Keep UPG-188's separate raw-object acquisition gate open/.test(nakamuraSbemAudit?.description ?? ""), "UPG-242 must preserve the bounded public-availability and no-geometry boundary");
  const mouseSpinalEmAudit = upgradeById.get("UPG-243");
  check(mouseSpinalEmAudit?.priority === "P1" && mouseSpinalEmAudit?.lane === "internal_microdetail" && mouseSpinalEmAudit?.status === "completed", "UPG-243 bounded open-volume and segmentation screen must be closed for its declared increment");
  check(/3,119 displayed entries/.test(mouseSpinalEmAudit?.description ?? "") && /first 20 visible results/.test(mouseSpinalEmAudit?.description ?? "") && /not a universal absence claim/.test(mouseSpinalEmAudit?.description ?? "") && /No payload was downloaded/.test(mouseSpinalEmAudit?.description ?? ""), "UPG-243 must preserve its exact bounded-search and no-admission boundary");
  const xeniumSpatialAudit = upgradeById.get("UPG-244");
  check(xeniumSpatialAudit?.priority === "P1" && xeniumSpatialAudit?.lane === "spatial_context" && xeniumSpatialAudit?.status.startsWith("partially completed"), "UPG-244 must retain the partial source-local Xenium metadata audit and geometry gates");
  check(/523 sections.*14 eight-week C57BL\/6J mice/s.test(xeniumSpatialAudit?.description ?? "") && /not an interneuron denominator/.test(xeniumSpatialAudit?.description ?? "") && /repository-review notice/.test(xeniumSpatialAudit?.description ?? "") && /do not extrude to 3D/.test(xeniumSpatialAudit?.description ?? ""), "UPG-244 must preserve its preprint, rights, identity and non-extrusion boundaries");
  const neuromorphoReleaseAudit = upgradeById.get("UPG-245");
  check(neuromorphoReleaseAudit?.priority === "P0" && neuromorphoReleaseAudit?.lane === "morphology" && neuromorphoReleaseAudit?.status.startsWith("completed"), "UPG-245 must record the bounded 8.6.126 supplementary SWC admission");
  check(/339 unique Todd mouse spinal-cord interneuron IDs/.test(neuromorphoReleaseAudit?.description ?? "") && /24,209 nodes; 24,179 segments/.test(neuromorphoReleaseAudit?.description ?? "") && /Ten have source-reported radii/.test(neuromorphoReleaseAudit?.description ?? "") && /20 have no diameter/.test(neuromorphoReleaseAudit?.description ?? "") && /zero census contribution/.test(neuromorphoReleaseAudit?.description ?? "") && /Original Neurolucida files and standardization logs were not available/.test(neuromorphoReleaseAudit?.description ?? ""), "UPG-245 source roster, morphology, denominator or missingness boundary changed");
  const taxonomyMorphologyCoverage = upgradeById.get("UPG-246");
  check(taxonomyMorphologyCoverage?.priority === "P1" && taxonomyMorphologyCoverage?.lane === "morphology" && taxonomyMorphologyCoverage?.status === "completed", "UPG-246 must record only the completed DOI-level morphology coverage and UI increment");
  check(/10 displayed interneuron taxonomy namespaces/.test(taxonomyMorphologyCoverage?.description ?? "") && /387 source profiles/.test(taxonomyMorphologyCoverage?.description ?? "") && /0\/10 taxonomy-source publication DOI overlaps and 0\/1,097 morphology records/.test(taxonomyMorphologyCoverage?.description ?? ""), "UPG-246 source and exact-DOI denominators changed");
  check(/zero matches do not establish that relevant morphology is absent/.test(taxonomyMorphologyCoverage?.description ?? "") && /literal label search/.test(taxonomyMorphologyCoverage?.description ?? "") && /Do not infer subtype equivalence, same specimen\/cell, or geometry/.test(taxonomyMorphologyCoverage?.description ?? ""), "UPG-246 publication-only coverage and no-identity boundary changed");
  const paperCrosswalk = upgradeById.get("UPG-247");
  check(paperCrosswalk?.priority === "P1" && paperCrosswalk?.lane === "provenance_and_identity" && paperCrosswalk?.status.startsWith("planned"), "UPG-247 must remain an open object-level publication crosswalk");
  check(/NMO 322379–322408/.test(paperCrosswalk?.description ?? "") && /reference_doi.*blank/.test(paperCrosswalk?.description ?? "") && /candidate context only/.test(paperCrosswalk?.description ?? "") && /Do not contact authors/.test(paperCrosswalk?.description ?? "") && /lamina assignments and cross-source cell identity unresolved/.test(paperCrosswalk?.description ?? ""), "UPG-247 must preserve unresolved per-record context and non-inference boundary");
  const bancRoute = upgradeById.get("UPG-248");
  check(bancRoute?.priority === "P1" && bancRoute?.lane === "internal_microdetail" && bancRoute?.status === "completed", "UPG-248 must be the completed exact BANC centerline route");
  check(/7,451 nodes \/ 7,450 parent-child edges/.test(bancRoute?.description ?? "") && /one verified same-root nucleus annotation point/.test(bancRoute?.description ?? "")
    && /outside every mouse identity, mouse denominator, atlas registration and measurement/.test(bancRoute?.description ?? "")
    && /zero cell\/nucleus surfaces, mitochondrial or synapse positions/.test(bancRoute?.description ?? ""), "UPG-248 exact route or species/geometry limits changed");
  const bancInternals = upgradeById.get("UPG-249");
  check(bancInternals?.priority === "P0" && bancInternals?.lane === "internal_microdetail" && bancInternals?.status.startsWith("partially completed"), "UPG-249 must remain open after the public route audit");
  check(/public v888 sources include a per-mitochondrion annotation table/.test(bancInternals?.description ?? "")
    && /configured, CAVE-registered token/.test(bancInternals?.description ?? "")
    && /neither candidate payload was fetched, hashed, bound to v888, or cleared/.test(bancInternals?.description ?? "")
    && /two CC BY 4\.0 adult-mouse dorsal corticospinal-tract FIB-SEM volumes/.test(bancInternals?.description ?? "")
    && /not interneuron objects or normal interneuron templates/.test(bancInternals?.description ?? "")
    && /openly licensed adult mouse spinal interneuron EM volume/.test(bancInternals?.description ?? ""), "UPG-249 route findings or object-level gates changed");
  const svaraObjectAdmission = upgradeById.get("UPG-250");
  check(svaraObjectAdmission?.priority === "P1" && svaraObjectAdmission?.lane === "morphology" && svaraObjectAdmission?.status.startsWith("partially completed"), "UPG-250 must retain its source-page progress and unresolved reconstruction gate");
  check(/stable source neuron key/.test(svaraObjectAdmission?.description ?? "") && /file-specific reuse conditions/.test(svaraObjectAdmission?.description ?? "")
    && /212 exact publication entries/.test(svaraObjectAdmission?.description ?? "")
    && /physical parent IDs, coordinate frame, segment\/hemisegment mapping and reconstruction completeness remain unestablished/.test(svaraObjectAdmission?.description ?? "")
    && /No inferred V2a assignment, mouse transfer/.test(svaraObjectAdmission?.description ?? ""), "UPG-250 object, permission or cross-species gate drifted");
  const microdetailCoverage = upgradeById.get("UPG-251");
  check(microdetailCoverage?.priority === "P1" && microdetailCoverage?.lane === "internal_microdetail" && microdetailCoverage?.status.startsWith("partially completed"), "UPG-251 must remain open for non-Explorer source-object registries");
  check(/verified-present, derived display, source-reported-absent, not assessed, unavailable, not established and rights-held/.test(microdetailCoverage?.description ?? "")
    && /type averages, neighboring records, another species, or representative shapes/.test(microdetailCoverage?.description ?? "")
    && /not an interneuron census or geometry-admission shortcut/.test(microdetailCoverage?.description ?? ""), "UPG-251 coverage states or no-proxy boundary drifted");
  const externalObjectMatrix = upgradeById.get("UPG-252");
  check(externalObjectMatrix?.priority === "P1" && externalObjectMatrix?.lane === "internal_microdetail" && externalObjectMatrix?.status === "completed", "UPG-252 must complete only the five pinned typed per-object adapters");
  check(/MICrONS, BANC, Super-CLEM, MicroStructFormer and native-contour/.test(externalObjectMatrix?.description ?? "")
    && /source-scoped denominator/.test(externalObjectMatrix?.description ?? "")
    && /exact identity\/scope, source-specific counts, coordinate and scale caveats/.test(externalObjectMatrix?.description ?? "")
    && /never merge source rows into a shared cell count/.test(externalObjectMatrix?.description ?? ""), "UPG-252 scope or non-merging boundary drifted");
  const publicationObjectCrosswalk = upgradeById.get("UPG-253");
  check(publicationObjectCrosswalk?.priority === "P1" && publicationObjectCrosswalk?.lane === "provenance_and_identity" && publicationObjectCrosswalk?.status.startsWith("partially completed"), "UPG-253 must retain the bounded discovery results and open exact publication-to-object gate");
  check(/beyond DOI equality/.test(publicationObjectCrosswalk?.description ?? "")
    && /exact source-object ID, publication record, animal\/specimen and figure or supplement assignment/.test(publicationObjectCrosswalk?.description ?? "")
    && /paper-level candidate is not an object match/.test(publicationObjectCrosswalk?.description ?? ""), "UPG-253 crosswalk requirements drifted");
  const trevisanAgeAtlas = upgradeById.get("UPG-040");
  check(trevisanAgeAtlas?.priority === "P1" && trevisanAgeAtlas?.lane === "molecular_taxonomy"
    && trevisanAgeAtlas?.status.startsWith("partially completed"), "UPG-040 must retain the article-derived V1 browser with source roster and region gates open");
  check(/14 reported clusters.*P0\/P14\/P28\/P56/.test(trevisanAgeAtlas?.description ?? "")
    && /separate from the canonical 387-profile denominator/.test(trevisanAgeAtlas?.description ?? "")
    && /main 3D scene/.test(trevisanAgeAtlas?.description ?? ""), "UPG-040 source-only and no-merge boundaries drifted");
  const trevisanRosterAudit = upgradeById.get("UPG-254");
  check(trevisanRosterAudit?.priority === "P1" && trevisanRosterAudit?.lane === "molecular_taxonomy"
    && trevisanRosterAudit?.status.startsWith("partially completed"), "UPG-254 must remain open for exact V1 source objects and denominators after the source-availability audit");
  check(/per-nucleus age\/cluster\/region joins/.test(trevisanRosterAudit?.description ?? "")
    && /assess each file's reuse terms/.test(trevisanRosterAudit?.description ?? "")
    && /do not infer individual morphology/.test(trevisanRosterAudit?.description ?? ""), "UPG-254 source-access or no-inference boundary drifted");
  const xeniumSectionViewer = upgradeById.get("UPG-255");
  check(xeniumSectionViewer?.priority === "P1" && xeniumSectionViewer?.lane === "spatial_context"
    && xeniumSectionViewer?.status.startsWith("planned"), "UPG-255 must remain gated on the BIL Xenium exact-object and rights audit");
  check(/source-deposited stable cell ID/.test(xeniumSectionViewer?.description ?? "")
    && /Never extrude 2D contours into 3D/.test(xeniumSectionViewer?.description ?? "")
    && /not an interneuron count/.test(xeniumSectionViewer?.description ?? ""), "UPG-255 lost its cell-identity, species/label and 2D-only boundaries");
  const neuromorphoCandidateQuery = upgradeById.get("UPG-256");
  check(neuromorphoCandidateQuery?.priority === "P1" && neuromorphoCandidateQuery?.lane === "morphology"
    && neuromorphoCandidateQuery?.status.startsWith("research watch"), "UPG-256 must keep official API discovery gated on exact source objects and rights");
  check(/complete query syntax, API retrieval date, pagination, returned stable IDs and count/.test(neuromorphoCandidateQuery?.description ?? "")
    && /Dynamic API result counts are not a release snapshot or an interneuron denominator/.test(neuromorphoCandidateQuery?.description ?? "")
    && /applicable reuse terms/.test(neuromorphoCandidateQuery?.description ?? ""), "UPG-256 discovery, snapshot or rights boundary drifted");
  const kohSpinalSupplement = upgradeById.get("UPG-257");
  check(kohSpinalSupplement?.priority === "P1" && kohSpinalSupplement?.lane === "connectivity"
    && kohSpinalSupplement?.status === "completed", "UPG-257 must record the bounded zebrafish supplement audit");
  check(/all 31 figure-named worksheets/.test(kohSpinalSupplement?.description ?? "")
    && /no stable Knossos object IDs, XYZ coordinate columns/.test(kohSpinalSupplement?.description ?? "")
    && /CC BY-NC-ND/.test(kohSpinalSupplement?.description ?? "")
    && /Zenodo code\/package route remains open under UPG-259/.test(kohSpinalSupplement?.description ?? ""), "UPG-257 lost its workbook findings, licence boundary, or follow-up route");
  const internalDetailDeduplication = upgradeById.get("UPG-258");
  check(internalDetailDeduplication?.priority === "P1" && internalDetailDeduplication?.lane === "internal_microdetail"
    && internalDetailDeduplication?.status === "completed", "UPG-258 internal-detail presentation normalization must remain complete");
  check(/165 of 641 records/.test(internalDetailDeduplication?.description ?? "")
    && /shared boundary once/.test(internalDetailDeduplication?.description ?? "")
    && /admits no object, anatomy, identity join or geometry/.test(internalDetailDeduplication?.description ?? ""), "UPG-258 denominator or no-admission boundary drifted");
  const kohZenodoCodeAudit = upgradeById.get("UPG-259");
  check(kohZenodoCodeAudit?.priority === "P1" && kohZenodoCodeAudit?.lane === "connectivity"
    && kohZenodoCodeAudit?.status === "completed", "UPG-259 must record the bounded Zenodo code-package audit");
  check(/version record `10\.5281\/zenodo\.17475613`/.test(kohZenodoCodeAudit?.description ?? "")
    && /9,289 bytes/.test(kohZenodoCodeAudit?.description ?? "")
    && /does not contain the paper-described list values or reconstruction geometry/.test(kohZenodoCodeAudit?.description ?? ""), "UPG-259 lost its versioned-file findings or no-data boundary");
  const kohRequiredInputs = upgradeById.get("UPG-260");
  check(kohRequiredInputs?.priority === "P1" && kohRequiredInputs?.lane === "connectivity"
    && kohRequiredInputs?.status.startsWith("partially completed"), "UPG-260 must preserve the bounded direct-route result and unresolved upstream archive gate");
  check(/1A.*1B.*2A.*2B.*3A.*4C.*6A.*6B IN to IN/.test(kohRequiredInputs?.description ?? "")
    && /same two Python scripts and no data file/.test(kohRequiredInputs?.description ?? "")
    && /three upstream ZIP supplements/.test(kohRequiredInputs?.description ?? "")
    && /Continue that exact archive gate under UPG-250/.test(kohRequiredInputs?.description ?? "")
    && /Do not contact authors or request gated material/.test(kohRequiredInputs?.description ?? "")
    && /no object\/geometry import/.test(kohRequiredInputs?.description ?? ""), "UPG-260 lost its exact-input and no-contact/no-admission gates");
  const nmoDatSwcCrosswalk = upgradeById.get("UPG-192");
  check(nmoDatSwcCrosswalk?.priority === "P1" && nmoDatSwcCrosswalk?.lane === "provenance_and_identity"
    && nmoDatSwcCrosswalk?.status === "completed" && nmoDatSwcCrosswalk?.blocker?.code === "none_for_declared_increment",
  "UPG-192 must be completed only for its exact NMO 45718 crosswalk increment");
  check(/seven source-closed `Soma 1` contours \(252 vertices/.test(nmoDatSwcCrosswalk?.description ?? "")
    && /maximum held-out residual 0\.00593 µm/.test(nmoDatSwcCrosswalk?.description ?? "")
    && /alternating 4\/3 split has maximum held-out residual 0\.00922 µm/.test(nmoDatSwcCrosswalk?.description ?? "")
    && /exclude the source-open legacy `Cell Body` contour/.test(nmoDatSwcCrosswalk?.description ?? "")
    && /do not reuse this transform for another record/.test(nmoDatSwcCrosswalk?.description ?? ""),
  "UPG-192 source scope, independent fit receipt or no-generalization boundary drifted");
  const datSwcFollowUp = upgradeById.get("UPG-261");
  check(datSwcFollowUp?.priority === "P2" && datSwcFollowUp?.lane === "internal_microdetail"
    && datSwcFollowUp?.status.startsWith("planned") && /neither the NMO 45718 coefficients nor its fit threshold may be reused/.test(datSwcFollowUp?.description ?? ""),
  "UPG-261 future DAT↔SWC crosswalk discovery guard drifted");
  check(registry.sourceQueue.lastIncludedId === EXPECTED_LAST_INCLUDED_ID, `Registry must end at ${EXPECTED_LAST_INCLUDED_ID}`);
  check(registry.sourceQueue.lastIncludedId === registry.upgrades.at(-1).id, "lastIncludedId does not match the final registry row");
  check(registry.summary?.upgradeCount === registry.upgrades.length, "Registry summary upgradeCount drifted");
  check(registry.summary?.byStatus?.completed === EXPECTED_COMPLETED_COUNT, `Registry must contain exactly ${EXPECTED_COMPLETED_COUNT} completed rows`);
  for (const id of displayedUpgradeIds) {
    check(parseUpgradeId(id).number >= 22, `${id} is not a research/model upgrade id`);
    check(ids.has(id), `Research-facing UI displays unresolved upgrade id ${id}`);
  }

  if (requireDeterministicMatch) {
    check(typeof queueMarkdown === "string", "Queue Markdown is required for deterministic validation");
    const expected = buildResearchUpgradeRegistry(queueMarkdown);
    check(stableJson(registry) === stableJson(expected), `${REGISTRY_PATH} is stale or was edited outside the deterministic builder`);
  }
  return registry;
}

export function summarizeResearchUpgradeRegistry(registry, displayedUpgradeIds = []) {
  return {
    registryId: registry.registryId,
    upgradeCount: registry.upgrades.length,
    firstIncludedId: registry.sourceQueue.firstIncludedId,
    lastIncludedId: registry.sourceQueue.lastIncludedId,
    displayedUpgradeCount: displayedUpgradeIds.length,
    unresolvedDisplayedUpgradeCount: displayedUpgradeIds.filter((id) => !registry.upgrades.some((upgrade) => upgrade.id === id)).length,
    governanceAdmissionQueueIncluded: registry.sourceQueue.governanceAdmissionQueueIncluded,
  };
}

export async function validateCanonicalResearchUpgradeRegistry() {
  const [registry, queueMarkdown, displayedUpgradeIds] = await Promise.all([
    readFile(REGISTRY_URL, "utf8").then(JSON.parse),
    readFile(QUEUE_URL, "utf8"),
    collectDisplayedResearchUpgradeIds(),
  ]);
  validateResearchUpgradeRegistry(registry, { queueMarkdown, displayedUpgradeIds });
  return summarizeResearchUpgradeRegistry(registry, displayedUpgradeIds);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateCanonicalResearchUpgradeRegistry().then((summary) => {
    console.log(`Research/model upgrade registry validation passed: ${summary.registryId}`);
    console.log(`${summary.upgradeCount} queue rows (${summary.firstIncludedId}–${summary.lastIncludedId}); ${summary.displayedUpgradeCount} research-facing UI ids resolved; governance/admission queue excluded`);
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
