import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import {
  BLOCKER_CODES,
  RESEARCH_LANES,
  buildResearchUpgradeRegistry,
  parseResearchUpgradeQueue,
  stableJson,
} from "../tools/build_research_upgrade_registry.mjs";
import {
  collectDisplayedResearchUpgradeIds,
  summarizeResearchUpgradeRegistry,
  validateResearchUpgradeRegistry,
} from "../scripts/validate-research-model-upgrade-registry-0.1.mjs";

const [registry, queueMarkdown, schema] = await Promise.all([
  readFile(new URL("../data/research-model-upgrade-registry-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../docs/RESEARCH_MODEL_UPGRADE_QUEUE.md", import.meta.url), "utf8"),
  readFile(new URL("../schemas/research-model-upgrade-registry-0.1.schema.json", import.meta.url), "utf8").then(JSON.parse),
]);

function upgrade(id, value = registry) {
  return value.upgrades.find((item) => item.id === id);
}

test("an index transport increment cannot promote UPG-230 to whole-App performance completion", () => {
  assert.equal(upgrade("UPG-230").status, "partially completed");
  const changed = queueMarkdown.replace(/\| UPG-230 \| P2 \| partially completed \|/, "| UPG-230 | P2 | completed |");
  assert.notEqual(changed, queueMarkdown);
  assert.throws(() => validateResearchUpgradeRegistry(buildResearchUpgradeRegistry(changed)), /whole-App completion/);
});

test("generated registry is byte-deterministic from every UPG-022-or-later queue row", () => {
  const generated = buildResearchUpgradeRegistry(queueMarkdown);
  assert.equal(stableJson(generated), stableJson(registry));
  const parsed = parseResearchUpgradeQueue(queueMarkdown);
  assert.equal(registry.upgrades.length, parsed.rows.length);
  assert.equal(registry.upgrades.length, 243);
  assert.equal(registry.upgrades[0].id, "UPG-022");
  assert.equal(registry.upgrades.at(-1).id, parsed.rows.at(-1).id);
  assert.equal(registry.upgrades.at(-1).id, "UPG-261");
  assert.equal(registry.summary.byStatus.completed, 83);
  assert.equal(upgrade("UPG-138").status, "completed");
  assert.match(upgrade("UPG-138").evidenceBasis.unlinkedText, /pv-independent-morphology-routes-0\.1\.json/);
  assert.equal(upgrade("UPG-140").status, "completed");
  assert.match(upgrade("UPG-140").evidenceBasis.unlinkedText, /chen-dai-planar-morphology-routes-0\.1\.json/);
  assert.equal(upgrade("UPG-217").status, "completed");
  assert.match(upgrade("UPG-217").description, /does not claim that no copy exists in any external repository/);
  assert.equal(upgrade("UPG-213").status, "completed");
  assert.match(upgrade("UPG-218").status, /^partially completed/);
  assert.match(upgrade("UPG-218").description, /388,781,071 bytes/);
  assert.match(upgrade("UPG-218").description, /configured token/);
  assert.match(upgrade("UPG-219").status, /^partially completed/);
  assert.match(upgrade("UPG-220").status, /^partially completed/);
  assert.match(upgrade("UPG-220").description, /5\/7 intervals/);
  assert.match(upgrade("UPG-220").description, /4\/10 within/);
  assert.match(upgrade("UPG-220").description, /0 admitted shells\/triangles/);
  assert.match(upgrade("UPG-221").status, /^partially completed/);
  assert.match(upgrade("UPG-222").status, /^partially completed/);
  assert.equal(upgrade("UPG-222").priority, "P0");
  assert.equal(upgrade("UPG-222").lane, "provenance_and_identity");
  assert.match(upgrade("UPG-222").description, /published as Zenodo v2/i);
  assert.match(upgrade("UPG-223").status, /^closed for this exact target/);
  assert.equal(upgrade("UPG-223").lane, "internal_microdetail");
  assert.match(upgrade("UPG-223").description, /do not intersect on X or Y/);
  assert.equal(upgrade("UPG-224").priority, "P1");
  assert.equal(upgrade("UPG-224").lane, "connectivity");
  assert.match(upgrade("UPG-224").description, /1,352-neuron column.*163 interneurons/);
  assert.equal(upgrade("UPG-225").priority, "P1");
  assert.equal(upgrade("UPG-225").lane, "internal_microdetail");
  assert.match(upgrade("UPG-225").status, /^planned/);
  assert.match(upgrade("UPG-225").description, /available upon request/);
  assert.equal(upgrade("UPG-226").status, "completed");
  assert.equal(upgrade("UPG-226").lane, "morphology");
  assert.match(upgrade("UPG-226").description, /zero census records, biological cell types/);
  assert.equal(upgrade("UPG-227").status, "completed");
  assert.equal(upgrade("UPG-227").priority, "P0");
  assert.equal(upgrade("UPG-227").lane, "morphology");
  assert.match(upgrade("UPG-227").description, /149 selectable source objects total/);
  assert.match(upgrade("UPG-227").description, /140 3D, 2 planar/);
  assert.equal(upgrade("UPG-228").priority, "P0");
  assert.equal(upgrade("UPG-228").lane, "morphology");
  assert.match(upgrade("UPG-228").status, /^partially completed/);
  assert.match(upgrade("UPG-228").description, /8\.6\.124.*8\.6\.125|8\.6\.125.*8\.6\.124/);
  assert.match(upgrade("UPG-228").description, /Keep the active geometry\/source-object corpus at 8\.6\.124/i);
  assert.equal(upgrade("UPG-229").lane, "molecular_taxonomy");
  assert.match(upgrade("UPG-229").description, /ten article-reported interneuron labels/);
  assert.equal(upgrade("UPG-230").priority, "P2");
  assert.equal(upgrade("UPG-230").lane, "research_experience");
  assert.match(upgrade("UPG-230").description, /at least one minified client chunk exceeds 500 kB/);
  assert.equal(upgrade("UPG-231").priority, "P1");
  assert.equal(upgrade("UPG-231").lane, "morphology");
  assert.match(upgrade("UPG-231").status, /^planned/);
  assert.match(upgrade("UPG-231").description, /single NMO 50394 software screen/);
  assert.equal(upgrade("UPG-232").priority, "P1");
  assert.equal(upgrade("UPG-232").lane, "internal_microdetail");
  assert.match(upgrade("UPG-232").status, /^partially completed/);
  assert.match(upgrade("UPG-232").description, /pinned per-neuron row reports a count metric of 31/);
  assert.match(upgrade("UPG-232").description, /pt_root_id/);
  assert.match(upgrade("UPG-232").description, /zero markers, surfaces/);
  assert.equal(upgrade("UPG-234").status, "completed");
  assert.equal(upgrade("UPG-234").lane, "spatial_context");
  assert.match(upgrade("UPG-234").description, /18-mouse \/ 811 nested-section frame/);
  assert.equal(upgrade("UPG-235").lane, "morphology");
  assert.match(upgrade("UPG-235").status, /^planned/);
  assert.match(upgrade("UPG-235").description, /no public deposit/);
  assert.equal(upgrade("UPG-236").lane, "morphology");
  assert.equal(upgrade("UPG-236").status, "completed");
  assert.match(upgrade("UPG-236").description, /2,735 record-label memberships/);
  assert.equal(upgrade("UPG-237").lane, "morphology");
  assert.equal(upgrade("UPG-237").status, "completed");
  assert.match(upgrade("UPG-237").description, /2,735 DOI × raw-label memberships/);
  assert.match(upgrade("UPG-237").description, /figure membership is unassessable for all 1,097 records/);
  assert.equal(upgrade("UPG-238").lane, "provenance_and_identity");
  assert.match(upgrade("UPG-238").status, /^planned/);
  assert.equal(upgrade("UPG-239").lane, "internal_microdetail");
  assert.match(upgrade("UPG-239").status, /^completed/);
  assert.match(upgrade("UPG-239").description, /540 paired `image`\s*\/\s*`label` rows/);
  assert.equal(upgrade("UPG-240").lane, "morphology");
  assert.match(upgrade("UPG-240").status, /^partially completed/);
  assert.equal(upgrade("UPG-250").lane, "morphology");
  assert.match(upgrade("UPG-250").status, /^partially completed/);
  assert.match(upgrade("UPG-250").description, /file-specific reuse conditions.*stable source neuron key/s);
  assert.match(upgrade("UPG-250").description, /212 exact publication entries/);
  assert.match(upgrade("UPG-250").description, /physical parent IDs, coordinate frame, segment\/hemisegment mapping and reconstruction completeness remain unestablished/);
  assert.equal(upgrade("UPG-251").lane, "internal_microdetail");
  assert.match(upgrade("UPG-251").status, /^partially completed/);
  assert.match(upgrade("UPG-251").description, /verified-present, derived display, source-reported-absent, not assessed, unavailable, not established and rights-held/);
  assert.equal(upgrade("UPG-252").lane, "internal_microdetail");
  assert.equal(upgrade("UPG-252").status, "completed");
  assert.match(upgrade("UPG-252").description, /never merge source rows into a shared cell count/);
  assert.equal(upgrade("UPG-253").lane, "provenance_and_identity");
  assert.match(upgrade("UPG-253").status, /^partially completed/);
  assert.match(upgrade("UPG-253").description, /paper-level candidate is not an object match/);
  assert.equal(upgrade("UPG-040").lane, "molecular_taxonomy");
  assert.match(upgrade("UPG-040").status, /^partially completed/);
  assert.match(upgrade("UPG-040").description, /14 reported clusters.*P0\/P14\/P28\/P56/);
  assert.equal(upgrade("UPG-254").lane, "molecular_taxonomy");
  assert.match(upgrade("UPG-254").status, /^partially completed/);
  assert.match(upgrade("UPG-254").description, /per-nucleus age\/cluster\/region joins/);
  assert.equal(upgrade("UPG-255").lane, "spatial_context");
  assert.match(upgrade("UPG-255").status, /^planned/);
  assert.match(upgrade("UPG-255").description, /source-deposited stable cell ID/);
  assert.match(upgrade("UPG-255").description, /Never extrude 2D contours into 3D/);
  assert.equal(upgrade("UPG-256").lane, "morphology");
  assert.match(upgrade("UPG-256").status, /^research watch/);
  assert.match(upgrade("UPG-256").description, /complete query syntax, API retrieval date, pagination, returned stable IDs and count/);
  assert.match(upgrade("UPG-256").description, /Dynamic API result counts are not a release snapshot/);
  assert.equal(upgrade("UPG-257").lane, "connectivity");
  assert.equal(upgrade("UPG-257").status, "completed");
  assert.match(upgrade("UPG-257").description, /all 31 figure-named worksheets/);
  assert.match(upgrade("UPG-257").description, /no stable Knossos object IDs, XYZ coordinate columns/);
  assert.match(upgrade("UPG-257").description, /CC BY-NC-ND/);
  assert.equal(upgrade("UPG-258").lane, "internal_microdetail");
  assert.equal(upgrade("UPG-258").status, "completed");
  assert.match(upgrade("UPG-258").description, /165 of 641 records.*shared boundary once/s);
  assert.equal(upgrade("UPG-259").lane, "connectivity");
  assert.equal(upgrade("UPG-259").status, "completed");
  assert.match(upgrade("UPG-259").description, /version record `10\.5281\/zenodo\.17475613`/);
  assert.match(upgrade("UPG-259").description, /deposit does not contain the paper-described list values or reconstruction geometry/);
  assert.equal(upgrade("UPG-260").lane, "connectivity");
  assert.match(upgrade("UPG-260").status, /^partially completed/);
  assert.match(upgrade("UPG-260").description, /three upstream ZIP supplements.*Continue that exact archive gate under UPG-250/s);
  assert.match(upgrade("UPG-260").description, /Do not contact authors or request gated material/);
  assert.equal(upgrade("UPG-192").status, "completed");
  assert.equal(upgrade("UPG-192").lane, "provenance_and_identity");
  assert.match(upgrade("UPG-192").description, /5 pairs with 2 held out.*0\.00593 µm\)/s);
  assert.match(upgrade("UPG-192").description, /not biological tolerance or accuracy evidence/);
  assert.equal(upgrade("UPG-261").status.startsWith("planned"), true);
  assert.equal(upgrade("UPG-241").priority, "P0");
  assert.equal(upgrade("UPG-241").lane, "morphology");
  assert.equal(upgrade("UPG-241").status, "completed");
  assert.match(upgrade("UPG-241").description, /literal text search.*require explicit selection/s);
  assert.equal(upgrade("UPG-242").priority, "P1");
  assert.equal(upgrade("UPG-242").lane, "internal_microdetail");
  assert.equal(upgrade("UPG-242").status, "completed");
  assert.equal(upgrade("UPG-242").blocker.code, "none_for_declared_increment");
  assert.match(upgrade("UPG-242").description, /Figures 2 and 7.*not a voxel stack/s);
  assert.match(upgrade("UPG-242").description, /Keep UPG-188's separate raw-object acquisition gate open/);
  assert.equal(upgrade("UPG-243").priority, "P1");
  assert.equal(upgrade("UPG-243").lane, "internal_microdetail");
  assert.equal(upgrade("UPG-243").status, "completed");
  assert.match(upgrade("UPG-243").description, /bounded query-and-candidate screen/i);
  assert.equal(upgrade("UPG-244").priority, "P1");
  assert.equal(upgrade("UPG-244").lane, "spatial_context");
  assert.match(upgrade("UPG-244").status, /^partially completed/);
  assert.match(upgrade("UPG-244").description, /523 sections.*not an interneuron denominator/s);
  assert.match(upgrade("UPG-244").description, /link-only.*do not extrude to 3D/s);
  assert.equal(upgrade("UPG-243").status, "completed");
  assert.equal(upgrade("UPG-243").lane, "internal_microdetail");
  assert.match(upgrade("UPG-243").description, /3,119 displayed entries.*not a universal absence claim/s);
  assert.equal(upgrade("UPG-245").priority, "P0");
  assert.equal(upgrade("UPG-245").lane, "morphology");
  assert.match(upgrade("UPG-245").status, /^completed/);
  assert.match(upgrade("UPG-245").description, /339 unique Todd mouse spinal-cord interneuron IDs.*30 are added.*24,209 nodes; 24,179 segments/s);
  assert.match(upgrade("UPG-245").description, /Ten have source-reported radii.*20 have no diameter.*zero census contribution/s);
  assert.equal(upgrade("UPG-246").lane, "morphology");
  assert.equal(upgrade("UPG-246").status, "completed");
  assert.match(upgrade("UPG-246").description, /0\/10 taxonomy-source publication DOI overlaps and 0\/1,097 morphology records/);
  assert.equal(upgrade("UPG-247").lane, "provenance_and_identity");
  assert.match(upgrade("UPG-247").status, /^planned/);
  assert.match(upgrade("UPG-247").description, /NMO 322379–322408.*reference_doi.*blank.*candidate context only/s);
  assert.equal(upgrade("UPG-248").status, "completed");
  assert.equal(upgrade("UPG-248").lane, "internal_microdetail");
  assert.match(upgrade("UPG-248").description, /7,451 nodes.*7,450 parent-child edges/);
  assert.equal(upgrade("UPG-249").priority, "P0");
  assert.match(upgrade("UPG-249").status, /^partially completed/);
  assert.equal(registry.sourceQueue.governanceAdmissionQueueIncluded, false);
  assert.equal(registry.sourceQueue.excludedGovernanceAdmissionRange, "UPG-001-UPG-021");
  assert.ok(registry.upgrades.every((item) => Number(item.id.slice(4, 7)) >= 22));
});

test("UPG-180 through UPG-182 preserve the 2.37 molecular, workspace, and planned morphology boundaries", () => {
  const roome = upgrade("UPG-180");
  assert.ok(roome);
  assert.equal(roome.priority, "P0");
  assert.equal(roome.status, "completed");
  assert.equal(roome.lane, "molecular_taxonomy");
  assert.equal(roome.blocker.code, "none_for_declared_increment");
  for (const fact of [
    "exact 157 refined dIL types in Table S6",
    "all 15,900 Table S7 differential-expression rows",
    "157 types and two immature labels",
    "26 Table S7 gene cells serialized as Excel dates",
    "source workbooks, RDS and Xenium objects remain link-only",
    "creates no cell geometry",
    "scRNA–Xenium same-cell join",
  ]) assert.ok(roome.description.includes(fact), `UPG-180 missing evidence boundary: ${fact}`);
  assert.match(roome.acceptanceBoundary, /no cell geometry/);

  const recordWorkspace = upgrade("UPG-181");
  assert.ok(recordWorkspace);
  assert.equal(recordWorkspace.priority, "P0");
  assert.equal(recordWorkspace.status, "completed");
  assert.equal(recordWorkspace.lane, "research_experience");
  assert.equal(recordWorkspace.blocker.code, "none_for_declared_increment");
  assert.match(recordWorkspace.description, /one atomic workspace transition/);
  assert.match(recordWorkspace.description, /selection-specific evidence and explicit missing fields/);
  assert.match(recordWorkspace.description, /shared limitations are consolidated/);
  assert.match(recordWorkspace.acceptanceBoundary, /no proxy geometry/);

  const zexplorer = upgrade("UPG-182");
  assert.ok(zexplorer);
  assert.equal(zexplorer.priority, "P1");
  assert.match(zexplorer.status, /^planned/);
  assert.equal(zexplorer.lane, "morphology");
  assert.equal(zexplorer.blocker.code, "rights_or_permission");
  assert.match(zexplorer.description, /source-local ZExplorer larval-zebrafish spinal E\/I SWC adapter/);
  assert.match(zexplorer.description, /SWC node type 7 as source-unknown neurite/);
  assert.match(zexplorer.description, /source SWCs remain link-only/);
  assert.match(zexplorer.acceptanceBoundary, /no mouse type mapping/);
});

test("UPG-183 through UPG-189 preserve the 2.38 record-presentation, Delile, publication-video, and future-object gates", () => {
  const presentation = upgrade("UPG-183");
  assert.equal(presentation?.status, "completed");
  assert.equal(presentation?.lane, "research_experience");
  assert.equal(presentation?.blocker.code, "none_for_declared_increment");
  assert.match(presentation.description, /source-record evidence model/);
  assert.match(presentation.description, /five modeling-readiness axes/);
  assert.match(presentation.acceptanceBoundary, /never substitutes a representative morphology/);

  const pkd2l1Video = upgrade("UPG-184");
  assert.equal(pkd2l1Video?.status, "completed");
  assert.equal(pkd2l1Video?.lane, "internal_microdetail");
  assert.equal(pkd2l1Video?.blocker.code, "none_for_declared_increment");
  assert.match(pkd2l1Video.description, /Video 5/);
  assert.match(pkd2l1Video.description, /zero geometry or internal objects/);

  const delile = upgrade("UPG-185");
  assert.equal(delile?.status, "completed");
  assert.equal(delile?.lane, "molecular_taxonomy");
  assert.equal(delile?.blocker.code, "none_for_declared_increment");
  assert.match(delile.description, /15,217 cells across 51 exact source-local fine subtypes/);
  assert.match(delile.description, /source spelling `dl`/);
  assert.match(delile.acceptanceBoundary, /zero morphology/);

  const datContour = upgrade("UPG-186");
  assert.equal(datContour?.status, "completed");
  assert.equal(datContour?.lane, "morphology");
  assert.equal(datContour?.blocker.code, "none_for_declared_increment");
  assert.match(datContour.description, /line loops only/);
  assert.match(datContour.acceptanceBoundary, /overlay remains disabled/);

  const adultRds = upgrade("UPG-187");
  assert.match(adultRds?.status ?? "", /^planned/);
  assert.equal(adultRds?.lane, "molecular_taxonomy");
  assert.equal(adultRds?.blocker.code, "rights_or_permission");
  assert.match(adultRds.description, /516 type labels/);

  const pkd2l1Raw = upgrade("UPG-188");
  assert.match(pkd2l1Raw?.status ?? "", /^planned/);
  assert.equal(pkd2l1Raw?.lane, "internal_microdetail");
  assert.equal(pkd2l1Raw?.blocker.code, "implementation");
  assert.match(pkd2l1Raw.acceptanceBoundary, /zero reconstructable geometry/);

  const fish1 = upgrade("UPG-189");
  assert.match(fish1?.status ?? "", /^planned/);
  assert.equal(fish1?.lane, "internal_microdetail");
  assert.equal(fish1?.blocker.code, "rights_or_permission");
  assert.match(fish1.description, /larval-zebrafish/);
  assert.match(fish1.acceptanceBoundary, /never a mouse cell/);
});

test("UPG-190 through UPG-196 separate exact source acquisition, identity, coordinate, surface, and internal-detail gates", () => {
  const cano = upgrade("UPG-190");
  assert.equal(cano?.priority, "P0");
  assert.equal(cano?.lane, "molecular_taxonomy");
  assert.match(cano?.status ?? "", /^planned/);
  assert.match(cano.description, /531 type-like rows, 518 exact unique strings, 13 duplicate extras/);
  assert.match(cano.description, /zero admitted type records, interneuron classifications, coordinates, morphology, same-cell joins or registrations/);

  const bil = upgrade("UPG-191");
  assert.equal(bil?.lane, "provenance_and_identity");
  assert.match(bil?.status ?? "", /^planned/);
  assert.match(bil.description, /maps each admitted BIL raw `cell_id` to the final curated `groups_manual` and `neuron_types`/);
  assert.match(bil.acceptanceBoundary, /cannot become a serial 3D cell/);

  const crosswalk = upgrade("UPG-192");
  assert.equal(crosswalk?.lane, "provenance_and_identity");
  assert.match(crosswalk.description, /original DAT.*standardized SWC/);
  assert.match(crosswalk.acceptanceBoundary, /do not reuse this transform for another record/);

  const perFile = upgrade("UPG-193");
  assert.equal(perFile?.lane, "morphology");
  assert.match(perFile.description, /explicit per-file manifest/);
  assert.match(perFile.acceptanceBoundary, /creates no DAT-to-SWC transform, surface, membrane, volume, internal detail/);

  const surface = upgrade("UPG-194");
  assert.equal(surface?.lane, "morphology");
  assert.match(surface.status, /^completed/);
  assert.match(surface.status, /NMO 50394 only/);
  assert.match(surface.description, /1,792 vertices \/ 3,328 triangles/);
  assert.match(surface.description, /not an observed membrane/);
  assert.match(surface.description, /must never be fused/);

  const pendingContourAudit = upgrade("UPG-220");
  assert.equal(pendingContourAudit?.lane, "morphology");
  assert.match(pendingContourAudit?.status ?? "", /^partially completed/);
  assert.match(pendingContourAudit?.description ?? "", /two self-intersecting source loops/);
  const screenCalibration = upgrade("UPG-231");
  assert.equal(screenCalibration?.lane, "morphology");
  assert.match(screenCalibration?.status ?? "", /^planned/);
  assert.match(screenCalibration?.description ?? "", /not independently validated as a biological tolerance/);

  const bancSourceAudit = upgrade("UPG-219");
  assert.equal(bancSourceAudit?.lane, "internal_microdetail");
  assert.match(bancSourceAudit?.status ?? "", /^partially completed/);
  assert.match(bancSourceAudit?.description ?? "", /mitochondria_v1_human_readable\.csv\.gz/);
  assert.match(bancSourceAudit?.description ?? "", /detected-mitochondria product `MISSING`/);
  assert.match(bancSourceAudit?.description ?? "", /banc_888_mitochondria_v1_human_readable\.csv\.gz/);

  const bancExactCell = upgrade("UPG-221");
  assert.equal(bancExactCell?.lane, "internal_microdetail");
  assert.match(bancExactCell?.status ?? "", /^partially completed/);
  assert.match(bancExactCell?.description ?? "", /source-classified VNC-local interneuron candidates/);
  assert.match(bancExactCell?.description ?? "", /720575941350424112/);
  assert.match(bancExactCell?.description ?? "", /7,451-node full-resolution SWC member/);
  assert.match(bancExactCell?.description ?? "", /12,571 candidate rows/);
  assert.match(bancExactCell?.description ?? "", /object-level reuse/);
  assert.match(bancExactCell?.description ?? "", /UPG-248 admits only those checksum-pinned parent-child centerline segments plus the same-root nucleus annotation point/);
  assert.match(bancExactCell?.description ?? "", /before any surface, mitochondrial or synaptic geometry/);

  const janelia = upgrade("UPG-195");
  assert.equal(janelia?.lane, "internal_microdetail");
  assert.match(janelia.description, /1,376,848-byte 6 nm raw-EM chunk/);
  assert.match(janelia.description, /manual nucleus instance 2; cell class unknown/);
  assert.equal(janelia.status, "completed");
  assert.equal(janelia.blocker.code, "none_for_declared_increment");
  assert.match(janelia.acceptanceBoundary, /zero selected-cell join/);

  const ariadne = upgrade("UPG-196");
  assert.equal(ariadne?.lane, "internal_microdetail");
  assert.match(ariadne.description, /zero-byte link records/);
  assert.match(ariadne.description, /S3 prefixes expose no keys/);
  assert.match(ariadne.acceptanceBoundary, /cannot be joined to the NMO/);
});

test("UPG-197 through UPG-204 preserve the 2.40 inputs and completed 2.41 active-record, denominator, Todd and Cano receipts", () => {
  const renshaw = upgrade("UPG-197");
  assert.equal(renshaw?.priority, "P0");
  assert.equal(renshaw?.status, "completed");
  assert.equal(renshaw?.lane, "morphology");
  assert.equal(renshaw?.blocker.code, "none_for_declared_increment");
  assert.match(renshaw.description, /seven explicitly source-closed `CellBody` loops/);
  assert.match(renshaw.description, /exact 200 vertices/);
  assert.match(renshaw.description, /35,842-byte derivative/);
  assert.match(renshaw.acceptanceBoundary, /no fill, triangles, loft, surface, membrane, volume, internal object/);

  const datAudit = upgrade("UPG-198");
  assert.equal(datAudit?.status, "completed");
  assert.equal(datAudit?.lane, "morphology");
  assert.equal(datAudit?.blocker.code, "none_for_declared_increment");
  assert.match(datAudit.description, /five locally bundled Neurolucida DAT files/);
  assert.match(datAudit.description, /Exactly two records are admitted/);
  assert.match(datAudit.description, /Three Todd records remain held with zero primitives/);
  assert.match(datAudit.description, /15 source-native line loops and 475 vertices/);
  assert.match(datAudit.acceptanceBoundary, /No legacy closure exception/);

  const completeness = upgrade("UPG-199");
  assert.equal(completeness?.status, "completed");
  assert.equal(completeness?.lane, "research_experience");
  assert.equal(completeness?.blocker.code, "none_for_declared_increment");
  assert.match(completeness.description, /eight-slot completeness selector/);
  assert.match(completeness.description, /all 376 molecular profiles in nine exact source namespaces/);
  assert.match(completeness.description, /visualization authority only/);
  assert.match(completeness.acceptanceBoundary, /without representative geometry or inherited content/);

  const activeRecord = upgrade("UPG-200");
  assert.equal(activeRecord?.status, "completed");
  assert.equal(activeRecord?.lane, "research_experience");
  assert.equal(activeRecord?.blocker.code, "none_for_declared_increment");
  assert.match(activeRecord.description, /one tree-scoped active-record provider/);
  assert.match(activeRecord.description, /checksum-pinned Explorer index/);
  assert.match(activeRecord.description, /deep-freezes the full nested record graph/);
  assert.match(activeRecord.description, /same immutable object identity/);
  assert.match(activeRecord.acceptanceBoundary, /(?:does|must) not merge source records/);

  const selectionDelta = upgrade("UPG-201");
  assert.equal(selectionDelta?.status, "completed");
  assert.equal(selectionDelta?.lane, "research_experience");
  assert.equal(selectionDelta?.blocker.code, "none_for_declared_increment");
  assert.match(selectionDelta.description, /immediately previous and current verified-ready canonical records/);
  assert.match(selectionDelta.description, /NMO 50424 = 8 \/ 427/);
  assert.match(selectionDelta.description, /NMO 50394 = 14 \/ 768/);
  assert.match(selectionDelta.description, /NMO 50408 = 11 \/ 709/);
  assert.match(selectionDelta.acceptanceBoundary, /not evidence of developmental or biological transition/);

  const denominators = upgrade("UPG-202");
  assert.equal(denominators?.status, "completed");
  assert.equal(denominators?.lane, "provenance_and_identity");
  assert.equal(denominators?.blocker.code, "none_for_declared_increment");
  assert.match(denominators.description, /derive every live research-facing source, record-set, exact cell\/profile-roster and exact source-object-set denominator from the checksum-verified canonical source registry/i);
  assert.match(denominators.description, /historical implementation baseline was 27 sources, 33 record sets, 9 exact cell\/profile rosters and 1 exact source-object set/);
  assert.match(denominators.description, /later validated source additions have changed the live totals; all eight .* read current values dynamically from the canonical registry/i);
  assert.match(denominators.acceptanceBoundary, /may not be summed across sources, record sets, cells, nuclei, morphologies or object assets into a biological census/);

  const todd = upgrade("UPG-203");
  assert.equal(todd?.status, "completed");
  assert.equal(todd?.lane, "morphology");
  assert.equal(todd?.blocker.code, "none_for_declared_increment");
  assert.match(todd.description, /All 33 retained objects and 1,904 vertices/);
  assert.match(todd.description, /48 ordered line loops \/ 2,379 vertices/);
  assert.match(todd.description, /sourceClosedFlag=false/);
  assert.match(`${todd.description} ${todd.acceptanceBoundary}`, /zero fill, triangles, loft, surface, membrane, volume, internal object/);

  const cano = upgrade("UPG-204");
  assert.equal(cano?.status, "completed");
  assert.equal(cano?.lane, "molecular_taxonomy");
  assert.equal(cano?.blocker.code, "none_for_declared_increment");
  assert.match(cano.description, /169,345 (?:source-scoped )?neuronal nuclei/);
  assert.match(cano.description, /57 source-scoped groups/);
  assert.match(cano.description, /11 exact[^.]{0,80}`?CHOL_IN`? profiles/);
  assert.match(cano.description, /923 (?:admitted |confirmed )?(?:`?CHOL_IN`? )?nuclei/);
  assert.match(`${cano.description} ${cano.acceptanceBoundary}`, /explicit(?:ly)?[^.]{0,160}(?:exclud|boundary)/i);
  for (const pattern of ["(?:motor|motoneuron)", "sensory", "projection", "ambiguous", "non[- ]?neuronal"]) {
    assert.match(`${cano.description} ${cano.acceptanceBoundary}`, new RegExp(`\\b${pattern}\\b`, "i"));
  }
  assert.match(`${cano.description} ${cano.acceptanceBoundary}`, /516[^.]{0,180}(?:not|never)[^.]{0,120}interneuron denominator|(?:not|never)[^.]{0,120}516[^.]{0,120}interneuron denominator/i);
  for (const boundary of [/zero[^.]{0,160}\bgeometry\b/i, /zero[^.]{0,160}\binternal objects?\b/i, /zero[^.]{0,160}\b(?:cross-source |same-cell )?joins?\b/i, /zero[^.]{0,160}\bregistrations?\b/i]) {
    assert.match(`${cano.description} ${cano.acceptanceBoundary}`, boundary);
  }
});

test("validation rejects drift in every completed UPG-200 through UPG-204 receipt", () => {
  const plannedAgain = structuredClone(registry);
  upgrade("UPG-200", plannedAgain).status = "planned";
  assert.throws(
    () => validateResearchUpgradeRegistry(plannedAgain, { requireDeterministicMatch: false }),
    /UPG-200 must remain a completed 2\.41 increment/,
  );

  const blockerAgain = structuredClone(registry);
  upgrade("UPG-204", blockerAgain).blocker.code = "implementation";
  assert.throws(
    () => validateResearchUpgradeRegistry(blockerAgain, { requireDeterministicMatch: false }),
    /UPG-204 must retain the completed-increment blocker receipt/,
  );

  for (const [id, expected] of [
    ["UPG-200", /UPG-200 deep-frozen active-record receipt drifted/],
    ["UPG-201", /UPG-201 NMO 50424 selection-delta receipt drifted/],
    ["UPG-202", /UPG-202 dynamic registry-derivation boundary drifted/],
    ["UPG-203", /UPG-203 Todd 33\/1,904 source-object receipt drifted/],
    ["UPG-204", /UPG-204 169,345-nucleus denominator drifted/],
  ]) {
    const drifted = structuredClone(registry);
    const item = upgrade(id, drifted);
    item.description = `${id} completed without its exact receipt.`;
    item.acceptanceBoundary = "Exact receipt removed for mutation test.";
    assert.throws(
      () => validateResearchUpgradeRegistry(drifted, { requireDeterministicMatch: false }),
      expected,
    );
  }
});

test("registry satisfies the JSON Schema contract", () => {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  assert.equal(validate(registry), true, JSON.stringify(validate.errors, null, 2));
});

test("every upgrade resolves status, lane, blocker, evidence, verification, and acceptance boundary", () => {
  assert.deepEqual(registry.controlledVocabularies.lanes, RESEARCH_LANES);
  assert.deepEqual(registry.controlledVocabularies.blockerCodes, BLOCKER_CODES);
  for (const item of registry.upgrades) {
    assert.match(item.id, /^UPG-\d{3}[A-Z]?$/);
    assert.match(item.priority, /^P[0-2]$/);
    assert.ok(item.status.length > 0);
    assert.ok(RESEARCH_LANES.includes(item.lane));
    assert.ok(BLOCKER_CODES.includes(item.blocker.code));
    assert.ok(item.blocker.detail.length > 0);
    assert.ok(item.evidenceBasis.markdown.length > 0);
    assert.ok(item.evidenceBasis.unlinkedText.length > 0);
    assert.ok(item.evidenceBasis.references.every((reference) => reference.url.startsWith("https://")));
    assert.equal(item.lastVerification.date, registry.sourceQueue.snapshotDate);
    assert.equal(item.lastVerification.scope, "queue_row_and_registry_derivation");
    assert.equal(item.lastVerification.independentEvidenceRecheck, false);
    assert.ok(item.acceptanceBoundary.length > 0);
    if (item.status === "completed") assert.equal(item.blocker.code, "none_for_declared_increment");
  }
});

test("UPG-113 is a provenance milestone and does not absorb the governance/admission queue", () => {
  const item = upgrade("UPG-113");
  assert.ok(item);
  assert.equal(item.priority, "P0");
  assert.equal(item.lane, "provenance_and_identity");
  assert.match(item.description, /machine-readable registry/);
  assert.match(item.description, /distinct from the 21-item governance\/admission queue/);
  assert.match(item.acceptanceBoundary, /distinct from/);
  assert.equal(registry.upgrades.some((candidate) => /^UPG-0(?:0[1-9]|1[0-9]|2[01])(?:[A-Z])?$/.test(candidate.id)), false);
});

test("UPG-143 and UPG-149 close exact morphology increments while UPG-144 remains deferred", () => {
  const premotorRoute = upgrade("UPG-143");
  assert.ok(premotorRoute);
  assert.equal(premotorRoute.priority, "P0");
  assert.equal(premotorRoute.status, "completed");
  assert.equal(premotorRoute.lane, "morphology");
  assert.equal(premotorRoute.blocker.code, "none_for_declared_increment");
  for (const receipt of [
    "1,513-byte API snapshot (`ac769a76e959d093a0468d345356256627b0ccd5536334f7b943734521b55407`)",
    "473-byte morphometry snapshot (`d999e37d9b94650415fd50e795ff0b43af24045e95a87c43c1b5e2ee57dda38a`)",
    "214,337-byte SWC (`c8926708a1350c58124c47ebee8167820b8e0bd568bcb676e90e34f3ca6dfaee`)",
    "343,774-byte native DAT receipt (`ae5f3122dfcebfa06f3e69351670ab6428ed61d4a2bc24f099edc98e62f69415`)",
    "615,468-byte lazy geometry (`c5193dbca4f17bb945a034196dd7dee130096502c71e01b6e5aedacfcade8865`)",
    "5,636 nodes / 5,635 segments",
    "type counts 8 soma / 4,237 axon / 1,391 dendrite",
    "19,112-byte route contract (`39afe0acc449c367cd48776b150058982c8d57186ea9adbeb9314b08d62b2cb3`)",
    "1,647-byte five-file asset manifest (`0220169ea294d8db086a228557b0b067fd057249e41f7187cf2a14ee924a33d8`)",
  ]) assert.ok(premotorRoute.description.includes(receipt), `UPG-143 missing exact receipt: ${receipt}`);
  for (const boundary of [
    "zero definitive molecular/premotor/Renshaw-exclusion claims",
    "zero same-cell physiology/contact/projection/connectivity joins",
    "zero native-DAT semantic objects",
    "zero complete-axon claims",
    "zero same-specimen membrane/internal/synapse primitives",
    "zero cross-source identities",
    "zero atlas registrations",
  ]) assert.ok(premotorRoute.description.includes(boundary), `UPG-143 missing zero-claim gate: ${boundary}`);
  assert.match(premotorRoute.evidenceBasis.unlinkedText, /premotor-comparison-observed-morphology-route-pack-0\.1\.json/);

  const tac2Planes = upgrade("UPG-144");
  assert.ok(tac2Planes);
  assert.equal(tac2Planes.priority, "P0");
  assert.match(tac2Planes.status, /^planned — deferred exact-2D contract; source thickness\/plane conflict locked/);
  assert.equal(tac2Planes.lane, "spatial_context");
  assert.equal(tac2Planes.blocker.code, "rights_or_permission");
  assert.match(tac2Planes.description, /four official datasets enumerate exactly 58 SectionImage objects/);
  assert.match(tac2Planes.description, /57 source-labelled `expression=true` and one `expression=false` \(`100061412`\)/);
  assert.match(tac2Planes.description, /API reports `section_thickness=25 µm` while the Allen production overview reports 20 µm/);
  assert.match(tac2Planes.description, /API reports plane `variable` while production documentation describes coronal\/cross-sectional tissue/);
  assert.match(tac2Planes.description, /four SectionDataSets, 58 SectionImages, 0 REG and zero cross-age transforms/);
  assert.match(tac2Planes.description, /custom noncommercial-attribution terms rather than CC BY/);
  assert.match(tac2Planes.acceptanceBoundary, /No stacking, interpolation, extrusion, inferred z, atlas placement/);

  const supplementaryComparison = upgrade("UPG-149");
  assert.ok(supplementaryComparison);
  assert.equal(supplementaryComparison.priority, "P0");
  assert.equal(supplementaryComparison.status, "completed");
  assert.equal(supplementaryComparison.lane, "morphology");
  assert.equal(supplementaryComparison.blocker.code, "none_for_declared_increment");
  for (const neuronId of [45674, 45718, 50394, 50408, 50424, 170035, 249676]) {
    assert.match(supplementaryComparison.description, new RegExp(`NMO_${neuronId}`));
  }
  assert.match(supplementaryComparison.description, /142 frozen census records and 7 supplementary routes/);
  assert.match(supplementaryComparison.description, /149 is displayed only as `142 census \+ 7 supplementary`/);
  assert.match(supplementaryComparison.description, /42,808-byte adapter SHA-256 is `f487034457ec2187996f0d3db8935545e64d1ce6783391b668c0747bdf2d5e05`/);
  assert.match(supplementaryComparison.description, /34,013-byte analysis delta is `b2f90156d9e9eb86cc2dfc72f05a140c6942c802a492274472c86a0c7a29d0df`/);
  assert.match(supplementaryComparison.description, /3,619-byte public manifest is `ab7b2a8fbc458e0871a39819e88007ffe3ad84f6378f87a2a24015484028db6f`/);
  assert.match(supplementaryComparison.acceptanceBoundary, /never as an expanded or rewritten census/);
  assert.match(supplementaryComparison.acceptanceBoundary, /failed supplementary receipt fails closed without changing the frozen census/);
});

test("every UPG id present in app source at UPG-022 or later resolves", async () => {
  const displayedUpgradeIds = await collectDisplayedResearchUpgradeIds();
  assert.ok(displayedUpgradeIds.length > 0);
  assert.doesNotThrow(() => validateResearchUpgradeRegistry(registry, { queueMarkdown, displayedUpgradeIds }));
  assert.ok(displayedUpgradeIds.every((id) => upgrade(id)));
  const summary = summarizeResearchUpgradeRegistry(registry, displayedUpgradeIds);
  assert.equal(summary.unresolvedDisplayedUpgradeCount, 0);
  assert.equal(summary.governanceAdmissionQueueIncluded, false);
});

test("validation rejects governance ids, unresolved UI ids, and missing acceptance boundaries", () => {
  const governanceLeak = structuredClone(registry);
  governanceLeak.upgrades[0].id = "UPG-021";
  assert.throws(
    () => validateResearchUpgradeRegistry(governanceLeak, { requireDeterministicMatch: false }),
    /excluded governance\/admission queue/,
  );

  assert.throws(
    () => validateResearchUpgradeRegistry(registry, { displayedUpgradeIds: ["UPG-999"], requireDeterministicMatch: false }),
    /displays unresolved upgrade id UPG-999/,
  );

  const missingBoundary = structuredClone(registry);
  upgrade("UPG-113", missingBoundary).acceptanceBoundary = "";
  assert.throws(
    () => validateResearchUpgradeRegistry(missingBoundary, { requireDeterministicMatch: false }),
    /UPG-113\.acceptanceBoundary is required/,
  );
});

test("validation rejects queue drift and invented independent evidence verification", () => {
  const drifted = structuredClone(registry);
  drifted.upgrades[0].status = "invented status";
  assert.throws(
    () => validateResearchUpgradeRegistry(drifted, { queueMarkdown }),
    /stale or was edited outside the deterministic builder/,
  );

  const overclaimed = structuredClone(registry);
  upgrade("UPG-113", overclaimed).lastVerification.independentEvidenceRecheck = true;
  assert.throws(
    () => validateResearchUpgradeRegistry(overclaimed, { requireDeterministicMatch: false }),
    /must not imply an independent evidence recheck/,
  );
});
