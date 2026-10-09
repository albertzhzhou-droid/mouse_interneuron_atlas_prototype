#!/usr/bin/env python3
"""Offline source-table audit. Requires pyarrow; emits no display geometry."""
from collections import Counter
import hashlib
import json
import math
from pathlib import Path
import sys
import pyarrow
import pyarrow.parquet as pq

ROOT = Path(__file__).resolve().parents[1]
DIR = "data/source-candidates/bil-xenium-geometry-20260930"
OUT = ROOT / "data/bil-xenium-geometry-schema-audit-0.1.json"
FOLDER = "Run8_Slide2_Mus_M7_F7"


def receipt(path, url=None):
    data = (ROOT / path).read_bytes()
    result = {"path": path, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
    if url:
        result["url"] = url
    return result


def source_schema(file):
    return {"columns": [{"name": f.name, "type": str(f.type), "nullable": f.nullable}
                        for f in file.schema_arrow],
            "rowCount": file.metadata.num_rows, "rowGroupCount": file.metadata.num_row_groups,
            "createdBy": file.metadata.created_by,
            "fileDeclaredPhysicalUnits": None,
            "physicalUnitMetadataPresent": False}


def clean_row(row, index):
    fields = {}
    for key, value in row.items():
        missing = value is None or isinstance(value, float) and not math.isfinite(value)
        fields[key] = {"value": None if missing else value,
                       "state": "source_nonfinite" if isinstance(value, float) and not math.isfinite(value)
                       else "source_null" if value is None else "source_value",
                       "locator": {"file": "cells.parquet", "rowIndexZeroBased": index, "column": key}}
    return {"cellId": row["cell_id"], "rowIndexZeroBased": index, "fields": fields}


def audit_cells(source):
    q = pq.ParquetFile(ROOT / source["path"])
    required = {"cell_id", "x_centroid", "y_centroid", "nucleus_count", "segmentation_method"}
    if not required.issubset(q.schema_arrow.names):
        raise ValueError("Cell source schema changed")
    ids, nuclei, methods = Counter(), {}, Counter()
    nulls, nonfinite = Counter(), Counter()
    nucleus_distribution = Counter()
    samples, multi_sample, row_index, zero_transcripts = [], False, 0, 0
    for batch in q.iter_batches(batch_size=65_536):
        columns = batch.to_pydict()
        for values in zip(*(columns[name] for name in columns)):
            row = dict(zip(columns, values))
            cell_id = row["cell_id"]
            if not isinstance(cell_id, str) or not cell_id:
                raise ValueError("Source cell ID must remain a nonempty string")
            ids[cell_id] += 1
            count = row["nucleus_count"]
            if not isinstance(count, int) or count < 0:
                raise ValueError("Invalid source nucleus_count")
            nuclei[cell_id] = count
            nucleus_distribution[str(count)] += 1
            methods[row["segmentation_method"]] += 1
            zero_transcripts += row.get("transcript_counts") == 0
            for key, value in row.items():
                nulls[key] += value is None
                nonfinite[key] += isinstance(value, float) and not math.isfinite(value)
            if row_index < 3 or count > 1 and not multi_sample:
                samples.append(clean_row(row, row_index))
                if count > 1:
                    multi_sample = True
            row_index += 1
    return {**source_schema(q), "uniqueCellIdCount": len(ids),
            "duplicateCellIdCount": sum(v > 1 for v in ids.values()),
            "duplicateCellRowCount": sum(v - 1 for v in ids.values()),
            "nullCountByColumn": dict(nulls), "nonfiniteCountByColumn": dict(nonfinite),
            "nucleusCountDistribution": dict(sorted(nucleus_distribution.items(), key=lambda x: int(x[0]))),
            "zeroTranscriptCellCount": zero_transcripts,
            "segmentationMethodCounts": dict(sorted(methods.items())),
            "sampleRows": samples}, set(ids), nuclei


def audit_boundaries(source):
    q = pq.ParquetFile(ROOT / source["path"])
    if q.schema_arrow.names != ["cell_id", "vertex_x", "vertex_y", "label_id"]:
        raise ValueError("Boundary source schema changed")
    ids, label_cells, cell_polygons, seen_groups = set(), {}, Counter(), set()
    invalid_xy, invalid_labels, label_conflicts, repeated_groups = 0, 0, 0, 0
    closed, open_polygons, degenerate = 0, 0, 0
    min_x = min_y = math.inf
    max_x = max_y = -math.inf
    current, points, group_start, row_index = None, [], 0, 0
    examples = []

    def finish():
        nonlocal closed, open_polygons, degenerate
        if current is None:
            return
        is_closed = len(points) > 1 and points[0] == points[-1]
        closed += is_closed
        open_polygons += not is_closed
        distinct = len(set(points))
        degenerate += len(points) < 4 or distinct < 3
        if len(examples) < 2:
            examples.append({"cellId": current[0], "labelId": current[1],
                             "firstVertexRowIndexZeroBased": group_start,
                             "vertexRowCount": len(points), "closedExactly": is_closed,
                             "distinctVertexCount": distinct})

    for batch in q.iter_batches(batch_size=65_536):
        values = batch.to_pydict()
        for cell_id, x, y, label_id in zip(*(values[name] for name in q.schema_arrow.names)):
            if not isinstance(cell_id, str) or not cell_id:
                raise ValueError("Empty or nonstring boundary cell ID")
            ids.add(cell_id)
            if not isinstance(label_id, int) or label_id <= 0:
                invalid_labels += 1
            if label_id in label_cells and label_cells[label_id] != cell_id:
                label_conflicts += 1
            label_cells[label_id] = cell_id
            key = (cell_id, label_id)
            if key != current:
                finish()
                repeated_groups += key in seen_groups
                seen_groups.add(key)
                cell_polygons[cell_id] += 1
                current, points, group_start = key, [], row_index
            if not isinstance(x, (float, int)) or not isinstance(y, (float, int)) or not math.isfinite(x) or not math.isfinite(y):
                invalid_xy += 1
            else:
                points.append((x, y))
                min_x, min_y, max_x, max_y = min(min_x, x), min(min_y, y), max(max_x, x), max(max_y, y)
            row_index += 1
    finish()
    return {**source_schema(q), "uniqueCellIdCount": len(ids), "uniqueLabelIdCount": len(label_cells),
            "polygonGroupCount": sum(cell_polygons.values()),
            "closedPolygonGroupCount": closed, "openPolygonGroupCount": open_polygons,
            "degeneratePolygonGroupCount": degenerate, "noncontiguousRepeatedGroupCount": repeated_groups,
            "nonfiniteOrMissingCoordinateRowCount": invalid_xy,
            "invalidLabelRowCount": invalid_labels, "labelMapsToMultipleCellsRowCount": label_conflicts,
            "cellsWithMultiplePolygonGroups": sum(v > 1 for v in cell_polygons.values()),
            "nativeCoordinateBounds": {"min": [min_x, min_y], "max": [max_x, max_y]},
            "sampleGroupsWithoutGeometry": examples}, ids, label_cells, cell_polygons


def main():
    acquisition = json.loads((ROOT / DIR / "receipt.json").read_text())
    if acquisition["sourceObjectKey"] != "BIL:ace-pie-cot" or acquisition["totalBytes"] != 37_282_469 or acquisition["geometryViewerAdmission"]:
        raise ValueError("Unsupported acquisition")
    metadata = json.loads((ROOT / "data/bil-xenium-source-metadata-0.1.json").read_text())
    run = next(x for x in metadata["runs"] if x["sourceObjectKey"] == acquisition["sourceObjectKey"])
    sources = {}
    for item in acquisition["files"]:
        current = receipt(item["path"], item["url"])
        if any(current[key] != item[key] for key in ["bytes", "sha256"]):
            raise ValueError("Source byte receipt changed")
        sources[Path(item["path"]).name] = current
    cells, cell_ids, nuclei = audit_cells(sources["cells.parquet"])
    cell_boundary, cell_boundary_ids, cell_labels, cell_groups = audit_boundaries(sources["cell_boundaries.parquet"])
    nucleus_boundary, nucleus_ids, nucleus_labels, nucleus_groups = audit_boundaries(sources["nucleus_boundaries.parquet"])
    method_mapping = {"Segmented by boundary stain (ATP1A1+CD45+E-Cadherin)": "boundary",
                      "Segmented by interior stain (18S)": "interior",
                      "Segmented by nucleus expansion of 5.0µm": "nuc_expansion"}
    if set(cells["segmentationMethodCounts"]) != set(method_mapping):
        raise ValueError("Unexpected native segmentation method label; inspect before mapping")
    method_counts = {value: cells["segmentationMethodCounts"][key] for key, value in method_mapping.items()}
    shared_labels = set(cell_labels) & set(nucleus_labels)
    dependencies = [receipt(DIR + "/receipt.json"), receipt("data/bil-xenium-source-metadata-0.1.json")]
    dependencies += [receipt(x["path"], x["url"]) for x in run["sourceFiles"]]
    output = {"schemaVersion": "0.1.0", "auditId": "bil-xenium-geometry-schema-audit-0.1",
              "checkedDate": "2026-09-30", "scope": "one_run_local_source_schema_inspection_not_section_pilot",
              "sourceObjectKey": acquisition["sourceObjectKey"], "collectionDoi": acquisition["collectionDoi"],
              "directoryFolder": FOLDER, "manifestIdentity": acquisition["manifestIdentity"],
              "sourceFiles": list(sources.values()), "dependencyReceipts": dependencies,
              "totalSourceBytes": acquisition["totalBytes"],
              "reader": {"package": "pyarrow", "version": pyarrow.__version__, "projectRuntimeDependency": False},
              "tables": {"cells": cells, "cellBoundaries": cell_boundary, "nucleusBoundaries": nucleus_boundary},
              "idJoins": {"key": "exact_string_cell_id_scoped_to_source_analysis_roi",
                          "cellTableIdsWithoutCellBoundary": len(cell_ids - cell_boundary_ids),
                          "orphanCellBoundaryIds": len(cell_boundary_ids - cell_ids),
                          "cellTableIdsWithoutNucleusBoundary": len(cell_ids - nucleus_ids),
                          "orphanNucleusBoundaryIds": len(nucleus_ids - cell_ids),
                          "positiveNucleusCountWithoutBoundary": sum(v > 0 and k not in nucleus_ids for k, v in nuclei.items()),
                          "zeroNucleusCountWithBoundary": sum(v == 0 and k in nucleus_ids for k, v in nuclei.items()),
                          "nucleusCountVersusPolygonGroupMismatchCellCount": sum(nucleus_groups[k] != v for k, v in nuclei.items()),
                          "crossFileSharedLabelIdCount": len(shared_labels),
                          "crossFileLabelIdDifferentCellCount": sum(cell_labels[k] != nucleus_labels[k] for k in shared_labels),
                          "labelIdCanJoinCellAndNucleusFiles": False,
                          "sourceBoundaryVertexRowsAreDuplicateCells": False},
              "methodCrosscheck": {"nativeLabelToMetricsField": method_mapping, "tableCounts": method_counts,
                                   "metricsCounts": run["processing"]["methodCounts"],
                                   "countsMatchMetrics": method_counts == run["processing"]["methodCounts"],
                                   "rawCellCountMatchMetrics": cells["rowCount"] == run["rawSegmentedCellCount"],
                                   "nuclearExpansionDistanceUm": 5.0,
                                   "distanceScope": "only_rows_with_native_method_label_Segmented_by_nucleus_expansion_of_5.0µm",
                                   "distanceEvidence": {"file": "cells.parquet", "column": "segmentation_method",
                                                        "nativeValue": "Segmented by nucleus expansion of 5.0µm"}},
              "coordinateEvidence": {"nativeColumns": ["x_centroid", "y_centroid", "vertex_x", "vertex_y"],
                                     "platformDocumentationUrl": "https://www.10xgenomics.com/support/software/xenium-onboard-analysis/latest/tutorials/outputs/xoa-output-understanding-outputs",
                                     "platformDocumentationCheckedDate": "2026-09-30", "platformDocumentationVersion": "4.1",
                                     "acquiredAnalysisVersion": "xenium-3.3.0.1",
                                     "platformDescribedUnit": "um", "status": "platform_schema_consistent_not_file_declared",
                                     "fileMetadataUnit": None, "sectionCoordinateFrame": None,
                                     "outlineToCellFrameTransform": None, "atlasRegistration": None,
                                     "geometryMeaning": "source_simplified_segmentation_visualization_polygons_not_observed_membranes_or_3d"},
              "remainingGates": [{"id": "section_identity", "status": "blocked", "reason": "No source-supported cell_id-to-section table or declared outline-to-cell frame transform."},
                                 {"id": "specimen_identity", "status": "blocked", "reason": "Dataset specimen record does not assign each cell or named outline to a verified donor/tissue."},
                                 {"id": "curated_labels", "status": "blocked_for_interneuron_lane", "reason": "No exact deposited cell_id-to-curated-type label table in the acquired inputs; segmentation methods are not cell types."},
                                 {"id": "file_rights", "status": "unresolved_policy_difference", "reason": "Dataset API/workbook CC-BY-4.0 and site CC-BY-SA-4.0 remain distinct. No viewer geometry or derived polygon asset admitted."}],
              "admission": {"disposition": "local_schema_audit_only", "geometryViewerAdmission": False,
                            "sectionLinkedCellNucleusGeometryCount": 0, "interneuronObjects": 0,
                            "threeDimensionalCellObjects": 0, "atlasRegistrations": 0,
                            "sameCellMorphologyJoins": 0, "fullGoalComplete": False}}
    serialized = json.dumps(output, indent=2, ensure_ascii=False, allow_nan=False) + "\n"
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_text() != serialized:
            raise ValueError("Derived schema audit differs from the complete current source-table replay")
    else:
        OUT.write_text(serialized)
    print(json.dumps({"sourceBytes": output["totalSourceBytes"], "cells": cells["rowCount"],
                      "cellBoundaryVertices": cell_boundary["rowCount"], "nucleusBoundaryVertices": nucleus_boundary["rowCount"],
                      "idJoins": output["idJoins"], "methodCrosscheck": output["methodCrosscheck"]}))


if __name__ == "__main__":
    main()
