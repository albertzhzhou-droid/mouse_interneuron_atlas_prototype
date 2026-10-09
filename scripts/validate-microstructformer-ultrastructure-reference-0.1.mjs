#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(ROOT, "data/microstructformer-ultrastructure-reference-0.1.json");
const EXPECTED_LABELS = [
  "background",
  "abnormality",
  "mitochondria-like organelles",
  "mitochondria",
  "mitochondria outside axon",
  "periaxonal space",
];

function check(condition, message) {
  if (!condition) throw new Error(message);
}

export async function validateMicroStructFormerUltrastructureReference(override = null) {
  const contract = override ?? JSON.parse(await readFile(CONTRACT_PATH, "utf8"));
  check(contract.schemaVersion === "0.1.0" && contract.contractId === "microstructformer-open-ultrastructure-reference-0.1", "MicroStructFormer reference identity changed");
  check(contract.auditDate === "2026-09-23" && contract.source.doi === "10.64898/2026.05.26.727755", "MicroStructFormer source receipt changed");
  const data = contract.datasetRelease;
  check(data.repository === "Dnq2025/Mask2former_Finetune" && /^[0-9a-f]{40}$/.test(data.revisionSha), "MicroStructFormer Hugging Face revision must be pinned");
  check(data.task === "image segmentation" && data.format === "parquet"
    && JSON.stringify(data.columns) === JSON.stringify(["image", "label"]), "MicroStructFormer data is not the audited paired image-mask release");
  check(data.rowCount === 540 && data.splitCounts.train === 528 && data.splitCounts.validation === 12
    && data.splitCounts.train + data.splitCounts.validation === data.rowCount, "MicroStructFormer viewer row denominator changed");
  check(data.reportedRepositorySize === "5.69 GB", "MicroStructFormer public package size receipt changed");
  check(data.sampleRowPreview.split === "train" && data.sampleRowPreview.rowIndex === 0
    && JSON.stringify(data.sampleRowPreview.imageDimensionsPixel) === JSON.stringify([3964, 3964])
    && JSON.stringify(data.sampleRowPreview.labelDimensionsPixel) === JSON.stringify([3964, 3964])
    && /not provided/.test(data.sampleRowPreview.pixelScale)
    && /no neuron.*animal.*section.*cell-object identifier/i.test(data.sampleRowPreview.rowIdentifierScope), "MicroStructFormer preview must remain pixel-only and unlinked to a biological object");
  check(JSON.stringify(contract.semanticLabels.map((label) => label.name)) === JSON.stringify(EXPECTED_LABELS)
    && contract.semanticLabels.every((label, index) => label.labelId === index && label.role === "model output class"), "MicroStructFormer model label map changed");
  check(contract.modelAndLicense.datasetLicense === "CC BY-NC-SA 4.0"
    && contract.modelAndLicense.softwareLicense === "GPLv3; separate from the dataset/model license."
    && contract.modelAndLicense.distributionDecision.startsWith("Link-only"), "MicroStructFormer data/software licensing boundary changed");
  check(/external segmentation tool/.test(contract.modelAndLicense.modelScope), "Axon/myelin masks must remain attributed to the separate documented pipeline");
  check(contract.sources.length === 5
    && contract.sources.some((source) => source.url === "https://huggingface.co/datasets/Dnq2025/Mask2former_Finetune")
    && contract.sources.some((source) => source.url === "https://huggingface.co/Dnq2025/MicroStructFormer")
    && contract.sources.some((source) => source.url === "https://dnq2023.github.io/MSF_WEBSITE/dataset/")
    && contract.sources.some((source) => source.url === "https://dnq2023.github.io/MSF_WEBSITE/license/")
    && contract.sources.some((source) => source.url === "https://doi.org/10.64898/2026.05.26.727755"), "MicroStructFormer source links changed");
  check(JSON.stringify(contract.identityAndGeometryBoundary) === JSON.stringify({
    identifiedInterneuronCount: 0,
    serialVolumeCount: 0,
    sameCellJoinCount: 0,
    admittedCellGeometryCount: 0,
    admittedInternalGeometryCount: 0,
    registrationCount: 0,
    predictionAdmittedAsObservation: false,
    crossSectionStackingAllowed: false,
    sameCellPlacementAllowed: false,
    interpretation: contract.identityAndGeometryBoundary.interpretation,
  }), "MicroStructFormer cannot create a selected-cell identity, 3D geometry, or prediction-as-observation claim");
  check(Array.isArray(contract.sources) && contract.sources.length === 5 && contract.sources.every((source) => /^https:\/\//.test(source.url)), "MicroStructFormer primary links are incomplete");
  check(!("images" in contract) && !("masks" in contract) && !("predictions" in contract) && !("geometry" in contract), "Link-only MicroStructFormer reference must not embed image, mask, prediction, or geometry payloads");

  return {
    contractId: contract.contractId,
    revisionSha: data.revisionSha,
    rowCount: data.rowCount,
    splitCounts: data.splitCounts,
    previewDimensionsPixel: data.sampleRowPreview.imageDimensionsPixel,
    labelCount: contract.semanticLabels.length - 1,
    identifiedInterneuronCount: contract.identityAndGeometryBoundary.identifiedInterneuronCount,
    admittedInternalGeometryCount: contract.identityAndGeometryBoundary.admittedInternalGeometryCount,
    downloadedPayloadBytes: 0,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateMicroStructFormerUltrastructureReference()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
