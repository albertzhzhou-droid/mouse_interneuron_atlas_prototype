#!/usr/bin/env python3
"""Rebuild a metadata-only adapter from the current checksum-pinned BIL receipt."""
import csv
import hashlib
import io
import json
from pathlib import Path
import re
import warnings
import openpyxl

warnings.filterwarnings("ignore", message="Data Validation extension is not supported and will be removed", category=UserWarning)

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data/source-candidates/bil-xenium-20260929"
OUTPUT = ROOT / "data/bil-xenium-source-metadata-0.1.json"


def read_outline(path):
    text = path.read_text(encoding="utf-8-sig")
    lines = text.splitlines()
    header = next((i for i, line in enumerate(lines) if line == "Selection,X,Y"), None)
    if header is None:
        raise ValueError("Missing exact source outline header: " + str(path))
    rows = list(csv.DictReader(io.StringIO("\n".join(lines[header:]))))
    for row in rows:
        float(row["X"])
        float(row["Y"])
        if not row["Selection"]:
            raise ValueError("Empty outline Selection")
    return {"fileName": path.name, "vertexRowCount": len(rows),
            "selectionNames": sorted({row["Selection"] for row in rows}),
            "columns": ["Selection", "X", "Y"], "cellIdColumnPresent": False,
            "coordinateUnitsDeclared": False, "cellFrameTransformDeclared": False,
            "areaUnitCommentPresent": "µm^2" in text,
            "boundaryAdmission": "metadata_only_unverified_section_frame"}


def main():
    receipt = json.loads((SOURCE / "receipt.json").read_text())
    files = {}
    for item in receipt["files"]:
        path = ROOT / item["path"]
        content = path.read_bytes()
        if len(content) != item["bytes"] or hashlib.sha256(content).hexdigest() != item["sha256"]:
            raise ValueError("Source receipt mismatch: " + item["path"])
        files[str(path.relative_to(SOURCE))] = {key: item[key] for key in ("path", "url", "bytes", "sha256")}
    group = json.loads((SOURCE / "groupdoi.json").read_text())
    entries = group["doc"]["public"]["relatedmap"][0]["data"]
    workbook_path = SOURCE / "BILMetadataV2TemplateUpdate_Spatial - POOL _v2.xlsx"
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        workbook = openpyxl.load_workbook(workbook_path, read_only=True, data_only=True)
    workbook_rows = {}
    for row_number, row in enumerate(workbook["Dataset"].values, 1):
        if row_number > 6 and isinstance(row[0], str) and "fe798993f13debd2/Run" in row[0]:
            workbook_rows[row[0].rsplit("/", 1)[-1]] = {"sheet": "Dataset", "row": row_number,
                "directory": row[0], "rights": row[5], "rightsUri": row[6], "rightsIdentifier": row[7]}
    spatial_row = list(workbook["SpatialTX"].iter_rows(min_row=7, max_row=7, values_only=True))[0]
    runs = []
    for entry in sorted(entries, key=lambda x: x["bilurl"]):
        folder = entry["bilurl"].rstrip("/").rsplit("/", 1)[-1]
        manifest = json.loads((SOURCE / folder / "experiment.xenium").read_text())
        metrics = list(csv.DictReader((SOURCE / folder / "metrics_summary.csv").open(newline="")))
        if len(metrics) != 1:
            raise ValueError("Expected one run metrics row")
        metrics = metrics[0]
        api = json.loads((SOURCE / "metadata" / (entry["bildid"] + ".json")).read_text())["retjson"]
        if len(api) != 1 or len(api[0]["Dataset"]) != 1:
            raise ValueError("Ambiguous BIL source metadata")
        metadata = api[0]
        dataset = metadata["Dataset"][0]
        if dataset["bildirectory"].rsplit("/", 1)[-1] != folder:
            raise ValueError("BIL ID directory mismatch")
        if int(metrics["num_cells_detected"]) != manifest["num_cells"]:
            raise ValueError("Manifest/metrics raw cell denominator mismatch")
        counts = {method: int(metrics["segmented_cell_" + method + "_count"])
                  for method in ("boundary", "interior", "nuc_expansion")}
        if sum(counts.values()) != manifest["num_cells"]:
            raise ValueError("Segmentation method counts do not sum to raw cell count")
        outlines = [read_outline(path) for path in sorted((SOURCE / folder).glob("*.csv"))
                    if path.name != "metrics_summary.csv"]
        names = sorted({name for outline in outlines for name in outline["selectionNames"]
                        if re.match(r"(?:Cervical|Thoracic|Lumbar|Sacral)_", name)})
        runs.append({"sourceObjectKey": "BIL:" + entry["bildid"], "bildid": entry["bildid"],
            "directoryFolder": folder, "sourceUrl": entry["bilurl"] + "/",
            "directoryDonorToken": re.search(r"Mus_.+$", folder).group(),
            "manifestIdentity": {key: manifest[key] for key in ("run_name", "cassette_name", "slide_id",
                "region_name", "experiment_uuid", "analysis_uuid", "roi_uuid", "cassette_uuid")},
            "apiSpecimens": metadata["Specimen"], "specimenScope": "API_dataset_record_not_per_cell_or_section",
            "apiImageCoordinates": metadata["Image"],
            "rights": {"apiIdentifier": dataset["rightsidentifier"], "apiText": dataset["rights"],
                "apiUri": dataset["rightsuri"], "workbook": workbook_rows[folder],
                "sitePolicyIdentifier": "CC-BY-SA-4.0", "policyDifferenceResolved": False,
                "disposition": "local_metadata_inspection_geometry_not_admitted"},
            "processing": {"analysisSoftware": manifest["analysis_sw_version"],
                "instrumentSoftware": manifest["instrument_sw_version"], "chemistry": manifest["chemistry_version"],
                "stain": manifest["segmentation_stain"], "pixelSizeUm": manifest["pixel_size"],
                "methodCounts": counts, "nuclearExpansionDistanceUm": None,
                "distanceReason": "not_declared_in_the_acquired_run_manifest_or_metrics",
                "methodEvidence": "run-level_manifest_and_metrics_not_per_cell_method_assignment"},
            "rawSegmentedCellCount": manifest["num_cells"], "outlineCandidates": outlines,
            "namedOutlineLabels": names, "namedOutlineLabelCount": len(names),
            "cellToSectionJoinVerified": False, "curatedCellTypeJoinVerified": False,
            "sourceFiles": [files[folder + "/experiment.xenium"], files[folder + "/metrics_summary.csv"],
                            files["metadata/" + entry["bildid"] + ".json"]]})
    panel = json.loads((SOURCE / "Run1_Slide1_Mus_M1_F1/gene_panel.json").read_text())
    targets = panel["payload"]["targets"]
    descriptor_counts = {}
    for target in targets:
        descriptor = target["type"]["descriptor"]
        descriptor_counts[descriptor] = descriptor_counts.get(descriptor, 0) + 1
    core = [item for item in receipt["files"] if item["path"].endswith((".xenium", "metrics_summary.csv", "gene_panel.json", ".xlsx"))]
    normalized = {"schemaVersion": "0.1.0", "adapterId": "bil-xenium-source-metadata-0.1",
        "checkedDate": "2026-09-29", "researchUpgradeIds": ["UPG-163", "UPG-244", "UPG-255"],
        "collection": {"doi": "10.35077/g.1196", "title": "Xenium data of mouse rostro-caudal spinal cord",
            "url": "https://doi.brainimagelibrary.org/doi/10.35077/g.1196", "sourceObjectKind": "run_slide_roi_metadata",
            "runSlideBundleCount": len(runs), "rawSegmentedCellCount": sum(run["rawSegmentedCellCount"] for run in runs),
            "namedOutlineLabelCount": sum(run["namedOutlineLabelCount"] for run in runs),
            "paperReportedSectionCount": 523, "outlineLabelsAreVerifiedSections": False,
            "paperQcCounts": {"neurons": 616599, "nonNeuronal": 2081760,
                "scope": "previous_primary_article_context_not_recomputed_from_current_inputs"}},
        "acquisition": {"receiptPath": str((SOURCE / "receipt.json").relative_to(ROOT)),
            "inputFileCount": len(receipt["files"]), "inputBytes": receipt["totalBytes"],
            "coreInputFileCount": len(core), "coreInputBytes": sum(item["bytes"] for item in core),
            "geometryFilesDownloaded": 0, "cryptographicChecksumScope": "computed_on_acquired_bytes_not_publisher_supplied"},
        "panel": {"descriptorCounts": descriptor_counts,
            "uniqueGeneTargetCount": len({target["type"]["data"]["name"] for target in targets if target["type"]["descriptor"] == "gene"}),
            "receipt": files["Run1_Slide1_Mus_M1_F1/gene_panel.json"],
            "allPanelsByteIdentical": "historical_UPG-163_claim_not_rechecked_this_run"},
        "workbook": {"receipt": files[workbook_path.name], "datasetRows": len(workbook_rows),
            "spatialTxRow7": {"segmentationMethod": spatial_row[15], "nuclearImageTransform": spatial_row[20],
                "histologicalImageTransform": spatial_row[21], "cellId": spatial_row[26]},
            "templateExampleRow6Excluded": True},
        "runs": runs,
        "pilotGates": [
            {"id": "file_rights", "status": "unresolved_policy_difference", "evidence": "16 current BIL dataset APIs and workbook rows declare CC-BY-4.0; site policy declares CC-BY-SA-4.0.",
                "requiredInput": "A consistent applicable rights statement for copied or derived boundary files; keep both declarations and source attribution."},
            {"id": "section_identity", "status": "blocked", "evidence": "Named Selection outlines are source labels; no cell_id-to-section table or declared outline-to-cell frame transform occurs in the acquired inputs.",
                "requiredInput": "Source-supported cell_id-to-section mapping, or source-declared outline frame, units, transform and section crosswalk."},
            {"id": "specimen_identity", "status": "blocked", "evidence": "Directory tokens, cassette labels and API specimen linkage keys differ; some API donor/tissue keys repeat across multiple run/slide records. They are retained separately.",
                "requiredInput": "Source-supported per-section donor/tissue mapping; do not apply a dataset-level specimen record to all ROI cells."},
            {"id": "cell_schema", "status": "not_acquired", "evidence": "cells and cell/nucleus boundary payloads were not downloaded because section/frame admission remains unresolved.",
                "requiredInput": "Checksum-pinned small cells and cell/nucleus boundary inputs after prior gates, then duplicate/orphan/missing/ID and schema audit."},
            {"id": "curated_labels", "status": "blocked_for_interneuron_lane", "evidence": "No exact curated cell_id label table was acquired; the gene panel and automatic clusters cannot identify interneurons.",
                "requiredInput": "Exact deposited cell_id-to-curated-class/type labels and provenance; otherwise retain source-only unresolved classification."},
            {"id": "segmentation_method", "status": "run_level_verified_parameters_partial", "evidence": "All acquired manifests declare XOA 3.3.0.1 with Multi-Tissue Stain, and metrics distinguish boundary, interior and nuclear-expansion counts.",
                "requiredInput": "Exact processing parameter evidence for nuclear expansion distance and per-cell method only if claimed; do not infer values from chemistry."}],
        "admission": {"disposition": "metadata_only", "cellBoundaryObjects": 0, "nucleusBoundaryObjects": 0,
            "interneuronObjects": 0, "threeDimensionalCellObjects": 0, "atlasRegistrations": 0,
            "sameCellMorphologyJoins": 0},
        "interpretation": "Run/slide metadata and outline names are not identified cell geometry, biological animal counts, or an interneuron census."}
    OUTPUT.write_text(json.dumps(normalized, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({"runs": len(runs), "rawCells": normalized["collection"]["rawSegmentedCellCount"],
                      "namedOutlineLabels": normalized["collection"]["namedOutlineLabelCount"],
                      "geometryObjects": 0, "outputBytes": OUTPUT.stat().st_size}))


if __name__ == "__main__":
    main()
