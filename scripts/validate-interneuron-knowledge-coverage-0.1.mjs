import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const DATA_URL = new URL("../data/interneuron-knowledge-coverage-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/interneuron-knowledge-coverage-0.1.schema.json", import.meta.url);

const EXPECTED_AXES = [
  "type_taxonomy",
  "region_lamina_context",
  "life_stage",
  "injury_state",
  "spatial_measurement",
  "causal_mechanism",
  "morphology",
];
const EXPECTED_STATUSES = ["direct", "contextual", "not_measured", "not_ingested"];
const EXPECTED_LANES = new Map([
  ["russ-2021", ["GSE158380"]],
  ["haring-2018", ["GSE103840"]],
  ["sathyamurthy-2018", ["GSE103892"]],
  ["hayashi-2018", ["GSE108788"]],
  ["delile-2019", ["E-MTAB-7320"]],
  ["tabulae-paralytica-2024", ["GSE234774", "GSE230765"]],
  ["iglesias-gonzalez-2021", ["GSE185731"]],
  ["roome-2026", ["GSE291462", "GSE291459", "GSE291460"]],
]);

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

export async function validateInterneuronKnowledgeCoverage(value) {
  const [coverage, schema] = await Promise.all([
    value ? Promise.resolve(value) : readFile(DATA_URL, "utf8").then(JSON.parse),
    readFile(SCHEMA_URL, "utf8").then(JSON.parse),
  ]);
  const validate = createResearchMvpValidator(schema);
  const errors = [];
  if (!validate(coverage)) errors.push(...formatSchemaErrors(validate.errors));

  check(coverage.coordinateAuthority === "SOURCE_LOCAL_METADATA_ONLY", "coverage must remain source-local metadata only", errors);
  check(coverage.projectRegistrationCount === 0, "global project registration count must remain 0", errors);

  const statusIds = (coverage.statusSemantics ?? []).map((item) => item.id);
  check(JSON.stringify(statusIds) === JSON.stringify(EXPECTED_STATUSES), "status semantics must retain their fixed order and complete vocabulary", errors);
  check((coverage.statusSemantics ?? []).find((item) => item.id === "not_measured")?.meaning.includes("not biological absence"), "not_measured must remain distinct from biological absence", errors);

  const axisIds = (coverage.axes ?? []).map((axis) => axis.id);
  check(JSON.stringify(axisIds) === JSON.stringify(EXPECTED_AXES), "coverage axes must retain their fixed order and complete set", errors);

  const laneIds = new Set();
  let coverageEntryCount = 0;
  let sourceLocatorCount = 0;
  for (const lane of coverage.lanes ?? []) {
    check(!laneIds.has(lane.id), "duplicate lane " + lane.id, errors);
    laneIds.add(lane.id);
    check(EXPECTED_LANES.has(lane.id), "unexpected lane " + lane.id, errors);
    check(lane.crossStudyMappingStatus === "not_established", lane.id + ": cross-study mapping must remain not_established", errors);
    check(lane.coordinateAuthority === "SOURCE_LOCAL_ONLY", lane.id + ": coordinate authority must remain source-local", errors);
    check(lane.projectRegistrationCount === 0, lane.id + ": project registration count must remain 0", errors);
    check(lane.assetAccess?.publicMetadata === true, lane.id + ": public metadata access must be explicit", errors);
    check(lane.assetAccess?.sourceObjectsBundled === false, lane.id + ": source objects must not be bundled", errors);
    check(lane.assetAccess?.assetLevelReuseStatus === "not_assumed", lane.id + ": asset-level reuse must not be assumed", errors);
    check((lane.sourceLocalLabels ?? []).length > 0, lane.id + ": source-local label namespace is required", errors);
    check((lane.cannotAnswer ?? []).length >= 3, lane.id + ": at least three non-answerable boundaries are required", errors);

    const expectedAccessions = EXPECTED_LANES.get(lane.id) ?? [];
    check(JSON.stringify((lane.accessions ?? []).map((item) => item.id)) === JSON.stringify(expectedAccessions), lane.id + ": accession set or order changed", errors);
    const laneCoverage = lane.coverage ?? [];
    coverageEntryCount += laneCoverage.length;
    sourceLocatorCount += laneCoverage.filter((entry) => typeof entry.sourceLocator === "string" && entry.sourceLocator.trim().length >= 20).length;
    const laneAxisIds = laneCoverage.map((entry) => entry.axisId);
    check(JSON.stringify(laneAxisIds) === JSON.stringify(EXPECTED_AXES), lane.id + ": must evaluate every precision axis exactly once in fixed order", errors);
    check(new Set(laneAxisIds).size === EXPECTED_AXES.length, lane.id + ": duplicate or missing coverage axis", errors);
    check(laneCoverage.every((entry) => EXPECTED_STATUSES.includes(entry.status)), lane.id + ": unknown coverage status", errors);
    check(
      laneCoverage.every((entry) => typeof entry.sourceLocator === "string" && entry.sourceLocator.trim().length >= 20),
      lane.id + ": every coverage judgment requires a non-empty source locator",
      errors,
    );
    check(
      laneCoverage.every((entry) => /Abstract|Results|Methods|Study|Fig\.|Supplement|Data availability|Activity-SEQ/i.test(entry.sourceLocator ?? "")),
      lane.id + ": each source locator must identify a publication section, figure or supplement",
      errors,
    );
    check(laneCoverage.find((entry) => entry.axisId === "morphology")?.status === "not_measured", lane.id + ": morphology must remain not_measured", errors);
    const causalStatus = laneCoverage.find((entry) => entry.axisId === "causal_mechanism")?.status;
    check(
      lane.id === "tabulae-paralytica-2024" ? causalStatus === "direct" : causalStatus !== "direct",
      lane.id + ": causal-mechanism status must retain the source-specific evidence boundary",
      errors,
    );
    check(laneCoverage.every((entry) => /not|no|cannot|does not|remain|must/i.test(entry.displayBoundary)), lane.id + ": every axis must retain an explicit display boundary", errors);
  }

  check(laneIds.size === EXPECTED_LANES.size && [...EXPECTED_LANES.keys()].every((id) => laneIds.has(id)), "the eight required primary-source lanes must be present exactly once", errors);
  check(coverageEntryCount === 56, "coverage matrix must contain exactly 56 source-by-axis judgments", errors);
  check(sourceLocatorCount === 56, "all 56 coverage judgments must retain a non-empty source locator", errors);
  check((coverage.lanes ?? []).find((lane) => lane.id === "haring-2018")?.sampleFrame.includes("P17–P28"), "Häring sample frame must retain the exact P17–P28 range", errors);
  check(!(coverage.lanes ?? []).find((lane) => lane.id === "haring-2018")?.sampleFrame.startsWith("Adult"), "Häring sample frame must not invent an adult category", errors);
  check((coverage.lanes ?? []).find((lane) => lane.id === "tabulae-paralytica-2024")?.coverage.find((entry) => entry.axisId === "type_taxonomy")?.status === "not_ingested", "Tabulae cell taxonomy must remain not_ingested in the metadata-only release", errors);
  check((coverage.lanes ?? []).find((lane) => lane.id === "tabulae-paralytica-2024")?.citation.includes("Nature 631, 150–163"), "Tabulae citation must retain the corrected Nature page range", errors);

  const dmrt3 = (coverage.lanes ?? []).find((lane) => lane.id === "iglesias-gonzalez-2021");
  check(dmrt3?.doi === "10.3389/fncel.2021.781197", "Dmrt3/dI6 lane must retain the primary DOI", errors);
  check(JSON.stringify(dmrt3?.sourceLocalLabels) === JSON.stringify(["M1", "M2", "M3", "M4", "M5", "M6"]), "Dmrt3/dI6 lane must retain the exact six source-local M1–M6 labels", errors);
  check(/three E14\.5 mouse embryos pooled into one tube and one library/i.test(dmrt3?.sampleFrame ?? ""), "Dmrt3/dI6 lane must retain the three-embryo one-tube one-library frame", errors);
  check(/384 deposited wells.*354 QC-retained cells.*274 retained dI6-lineage cells/i.test(dmrt3?.sampleFrame ?? ""), "Dmrt3/dI6 lane must retain the 384 → 354 → 274 analysis denominators", errors);
  check(/no per-well M1–M6 roster.*scalar pseudotime/i.test(dmrt3?.sampleFrame ?? ""), "Dmrt3/dI6 lane must retain the absent per-well roster and pseudotime scalar", errors);
  check(
    JSON.stringify((dmrt3?.coverage ?? []).map((entry) => entry.status)) === JSON.stringify(["direct", "contextual", "direct", "not_measured", "not_measured", "not_measured", "not_measured"]),
    "Dmrt3/dI6 coverage statuses must remain direct, contextual, direct, then four not_measured judgments",
    errors,
  );
  check(/six source-local M1–M6.*totaling 274 retained cells/i.test(dmrt3?.coverage?.find((entry) => entry.axisId === "type_taxonomy")?.evidence ?? ""), "Dmrt3/dI6 taxonomy must remain a direct six-group, 274-cell summary", errors);
  check(/source-local mouse spinal-cord.*Dmrt3-lineage dI6 context/i.test(dmrt3?.coverage?.find((entry) => entry.axisId === "region_lamina_context")?.evidence ?? ""), "Dmrt3/dI6 region coverage must remain source-local spinal/dI6 context", errors);
  check(/no cell-coordinate or spatial-assay measurement/i.test(dmrt3?.coverage?.find((entry) => entry.axisId === "spatial_measurement")?.evidence ?? ""), "Dmrt3/dI6 spatial measurement must remain absent", errors);
  const dmrt3Boundaries = JSON.stringify([dmrt3?.sampleFrame, dmrt3?.sourceLocalLabelScope, ...(dmrt3?.cannotAnswer ?? []), ...(coverage.hardBoundaries ?? [])]);
  check(/no per-well M1–M6 roster/i.test(dmrt3Boundaries), "Dmrt3/dI6 boundaries must forbid a reconstructed per-well group roster", errors);
  check(/scalar pseudotime/i.test(dmrt3Boundaries), "Dmrt3/dI6 boundaries must retain absent scalar pseudotime", errors);
  check(/cross-study identit/i.test(dmrt3Boundaries), "Dmrt3/dI6 boundaries must forbid exact cross-study identity", errors);
  check(/geometry/i.test(dmrt3Boundaries) && /internal structure/i.test(dmrt3Boundaries) && /atlas registration/i.test(dmrt3Boundaries), "Dmrt3/dI6 boundaries must retain zero geometry, internal structure and registration", errors);

  const roome = (coverage.lanes ?? []).find((lane) => lane.id === "roome-2026");
  check(roome?.doi === "10.1126/science.adx5781", "Roome lane must retain the primary DOI", errors);
  check((roome?.sourceLocalLabels ?? []).length === 12 && roome.sourceLocalLabels[0] === "dILA1" && roome.sourceLocalLabels.at(-1) === "dILB6", "Roome lane must retain the 12 exact source-family labels", errors);
  check(/15 biological litter pools.*3–10.*29 technical outputs.*157 refined dIL types.*61,444 captured dIL cells/i.test(roome?.sampleFrame ?? ""), "Roome lane must retain its biological, technical and captured-cell denominators", errors);
  check(
    JSON.stringify((roome?.coverage ?? []).map((entry) => entry.status)) === JSON.stringify(["direct", "contextual", "direct", "not_measured", "not_ingested", "not_measured", "not_measured"]),
    "Roome coverage statuses must retain direct, contextual, direct, not measured/not ingested boundaries",
    errors,
  );
  check(/157 unique refined dIL labels.*cluster-QC metrics.*100 differential rows/i.test(roome?.coverage?.find((entry) => entry.axisId === "type_taxonomy")?.evidence ?? ""), "Roome exact type-taxonomy coverage drifted", errors);
  check(/different cells.*same-cell identity.*pseudo-depth.*3D registration/i.test(roome?.coverage?.find((entry) => entry.axisId === "spatial_measurement")?.displayBoundary ?? ""), "Roome scRNA–Xenium and 2D spatial boundary drifted", errors);
  check(/no same-cell whole-neuron arbor.*organelle.*internal-structure/i.test(roome?.coverage?.find((entry) => entry.axisId === "morphology")?.evidence ?? ""), "Roome morphology/internal-structure absence drifted", errors);
  check((coverage.hardBoundaries ?? []).some((item) => /Twenty-six apparent Excel-date tokens.*quarantined.*never auto-repaired/i.test(item)), "Roome Excel-coercion quarantine boundary is missing", errors);

  check((coverage.hardBoundaries ?? []).some((item) => /cross-study mapping.*not_established/i.test(item)), "hard boundaries must forbid inferred cross-study identity", errors);
  check((coverage.hardBoundaries ?? []).some((item) => /projectRegistrationCount is 0/i.test(item)), "hard boundaries must lock zero project registrations", errors);
  check((coverage.hardBoundaries ?? []).some((item) => /not evidence.*biological feature is absent/i.test(item)), "hard boundaries must distinguish coverage gaps from biological absence", errors);
  check((coverage.hardBoundaries ?? []).some((item) => /No morphology may be synthesized as observed evidence/i.test(item)), "hard boundaries must forbid fabricated observed morphology", errors);

  if (errors.length) {
    throw new Error("Interneuron knowledge coverage 0.1 validation failed:\n" + errors.map((error) => "- " + error).join("\n"));
  }
  return { releaseId: coverage.releaseId, laneCount: laneIds.size, axisCount: axisIds.length, projectRegistrationCount: 0 };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL("file://" + process.argv[1]))) {
  const result = await validateInterneuronKnowledgeCoverage();
  console.log("Interneuron knowledge coverage 0.1 validation passed: " + result.releaseId + " (" + result.laneCount + " lanes; " + result.axisCount + " axes; 0 project registrations)");
}
