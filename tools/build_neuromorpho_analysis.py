#!/usr/bin/env python3
"""Build deterministic, source-local NeuroMorpho morphology analyses.

This builder accepts only the checksum-pinned NeuroMorpho 8.6.124 census.  It
derives record-level topology, cable, path, branch-order, and Sholl metrics from
the stored node rows without changing coordinates or topology.  All aggregate
statistics are restricted to exact source cohorts and their denominator is a
NeuroMorpho record, never an animal, donor, specimen, or prevalence sample.
"""

from __future__ import annotations

import argparse
import collections
import hashlib
import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable, Sequence


SCHEMA_VERSION = "1.0.0"
BUILDER_VERSION = "1.0.0"
RELEASE = "8.6.124"
ASSET_SET_ID = (
    "neuromorpho:8.6.124:adult-mouse-spinal-interneuron-morphology-analysis-v1"
)
SOURCE_ASSET_SET_ID = (
    "neuromorpho:8.6.124:adult-mouse-spinal-interneuron-census-v1"
)
SOURCE_CENSUS_INDEX_SHA256 = (
    "1598b5119f5826719e390fe46615a291b51fa3cd7716e9a191ad645f73165364"
)
SOURCE_ASSET_MANIFEST_SHA256 = (
    "2c1153fe86e3bc2f08505cf2416ab25b2d8e9ca747b0bffcfad5aacc9286cf91"
)
EXPECTED_RECORD_COUNT = 142
SOURCE_DIRECTORY = Path("public/data/neuromorpho_release_8_6_124_census_v1")
OUTPUT_DIRECTORY = Path("public/data/neuromorpho_release_8_6_124_analysis_v1")
BUILDER_REPOSITORY_PATH = "tools/build_neuromorpho_analysis.py"
SHOLL_STEP_MICROMETRE = 10
NODE_COLUMNS = ["id", "type", "x", "y", "z", "radius", "parent"]
GEOMETRY_STATUS = "OBS_STANDARDIZED_SOURCE_LOCAL"
NON_ANIMAL_BOUNDARY = (
    "one_NeuroMorpho_record_not_an_independent_animal_donor_specimen_or_"
    "prevalence_observation"
)


@dataclass(frozen=True)
class Node:
    node_id: int
    source_type: int
    x: float
    y: float
    z: float
    radius: float
    parent_id: int

    @property
    def coordinate(self) -> tuple[float, float, float]:
        return (self.x, self.y, self.z)


@dataclass(frozen=True)
class GeometryTree:
    nodes: dict[int, Node]
    children: dict[int, tuple[int, ...]]
    root_id: int


def fail(message: str) -> None:
    raise ValueError(message)


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_path(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def compact_json_bytes(value: Any) -> bytes:
    return (
        json.dumps(
            value,
            ensure_ascii=False,
            allow_nan=False,
            sort_keys=True,
            separators=(",", ":"),
        )
        + "\n"
    ).encode("utf-8")


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as error:
        fail(f"{path}: cannot read valid UTF-8 JSON: {error}")


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def require_int(value: Any, label: str) -> int:
    require(isinstance(value, int) and not isinstance(value, bool), f"{label}: expected integer")
    return value


def require_finite_number(value: Any, label: str) -> float:
    require(
        isinstance(value, (int, float)) and not isinstance(value, bool),
        f"{label}: expected number",
    )
    result = float(value)
    require(math.isfinite(result), f"{label}: expected finite number")
    return result


def source_type_interpretation(source_type: int) -> str:
    return {
        0: "uninterpreted_undefined_type_0",
        1: "soma_type_1",
        2: "axon_type_2",
        3: "dendrite_type_3",
        4: "apical_dendrite_type_4",
        5: "uninterpreted_custom_type_5",
        6: "uninterpreted_neurite_type_6",
        7: "glia_process_type_7",
    }.get(source_type, f"uninterpreted_unknown_type_{source_type}")


def safe_source_path(source_directory: Path, relative_path: str) -> Path:
    require(relative_path != "", "source geometry path is empty")
    path = (source_directory / relative_path).resolve()
    root = source_directory.resolve()
    try:
        path.relative_to(root)
    except ValueError:
        fail(f"source geometry path escapes source directory: {relative_path}")
    require(path.is_file(), f"source geometry file is missing: {relative_path}")
    return path


def validate_source_documents(
    source_directory: Path,
) -> tuple[dict[str, Any], dict[str, Any], dict[str, dict[str, Any]]]:
    census_path = source_directory / "census-index.json"
    manifest_path = source_directory / "asset-manifest.json"
    require(census_path.is_file(), f"missing source census index: {census_path}")
    require(manifest_path.is_file(), f"missing source asset manifest: {manifest_path}")
    require(
        sha256_path(census_path) == SOURCE_CENSUS_INDEX_SHA256,
        "source census-index SHA-256 mismatch; refusing analysis",
    )
    require(
        sha256_path(manifest_path) == SOURCE_ASSET_MANIFEST_SHA256,
        "source asset-manifest SHA-256 mismatch; refusing analysis",
    )

    census = load_json(census_path)
    manifest = load_json(manifest_path)
    require(isinstance(census, dict), "source census index must be an object")
    require(isinstance(manifest, dict), "source asset manifest must be an object")
    require(census.get("schemaVersion") == SCHEMA_VERSION, "unexpected source census schema")
    require(census.get("assetSetId") == SOURCE_ASSET_SET_ID, "unexpected source census assetSetId")
    require(census.get("release") == RELEASE, "unexpected source census release")
    require(manifest.get("assetSetId") == SOURCE_ASSET_SET_ID, "unexpected source manifest assetSetId")
    require(manifest.get("release") == RELEASE, "unexpected source manifest release")

    records = census.get("records")
    require(isinstance(records, list), "source census records must be an array")
    require(
        len(records) == EXPECTED_RECORD_COUNT,
        f"source census record count mismatch: expected {EXPECTED_RECORD_COUNT}, found {len(records)}",
    )
    summary = census.get("summary")
    require(isinstance(summary, dict), "source census summary must be an object")
    for field in ("queryRecordCount", "uniqueNeuronIdCount", "admittedGeometryCount"):
        require(
            summary.get(field) == EXPECTED_RECORD_COUNT,
            f"source census summary {field} must equal {EXPECTED_RECORD_COUNT}",
        )
    require(summary.get("quarantinedGeometryCount") == 0, "source census has quarantined geometry")
    for field in ("queryRecordCount", "admittedGeometryCount"):
        require(
            manifest.get(field) == EXPECTED_RECORD_COUNT,
            f"source manifest {field} must equal {EXPECTED_RECORD_COUNT}",
        )
    require(manifest.get("quarantinedGeometryCount") == 0, "source manifest has quarantined geometry")

    files = manifest.get("files")
    require(isinstance(files, list), "source manifest files must be an array")
    declarations: dict[str, dict[str, Any]] = {}
    for index, declaration in enumerate(files):
        require(isinstance(declaration, dict), f"source manifest files[{index}] must be an object")
        relative_path = declaration.get("path")
        require(isinstance(relative_path, str), f"source manifest files[{index}].path must be a string")
        require(relative_path not in declarations, f"duplicate source manifest path: {relative_path}")
        declarations[relative_path] = declaration
    census_declaration = declarations.get("census-index.json")
    require(isinstance(census_declaration, dict), "source manifest omits census-index.json")
    require(
        census_declaration.get("sha256") == SOURCE_CENSUS_INDEX_SHA256,
        "source manifest declares the wrong census-index SHA-256",
    )
    require(
        census_declaration.get("bytes") == census_path.stat().st_size,
        "source manifest declares the wrong census-index byte count",
    )

    geometry_declarations = {
        path: declaration
        for path, declaration in declarations.items()
        if declaration.get("kind") == "lazy_geometry"
    }
    require(
        len(geometry_declarations) == EXPECTED_RECORD_COUNT,
        "source manifest lazy-geometry count mismatch",
    )
    return census, manifest, geometry_declarations


def parse_geometry_tree(geometry: dict[str, Any], label: str) -> GeometryTree:
    require(geometry.get("documentType") == "neuromorpho_geometry", f"{label}: wrong documentType")
    require(geometry.get("schemaVersion") == SCHEMA_VERSION, f"{label}: wrong schemaVersion")
    require(geometry.get("geometryStatus") == GEOMETRY_STATUS, f"{label}: wrong geometryStatus")
    require(geometry.get("nodeColumns") == NODE_COLUMNS, f"{label}: unexpected nodeColumns")
    registration = geometry.get("registration")
    require(isinstance(registration, dict), f"{label}: registration must be an object")
    require(registration.get("registrationCount") == 0, f"{label}: geometry is registered")

    rows = geometry.get("nodes")
    require(isinstance(rows, list) and rows, f"{label}: nodes must be a non-empty array")
    nodes: dict[int, Node] = {}
    roots: list[int] = []
    for row_index, row in enumerate(rows):
        row_label = f"{label}:nodes[{row_index}]"
        require(isinstance(row, list) and len(row) == 7, f"{row_label}: expected seven columns")
        node_id = require_int(row[0], f"{row_label}.id")
        source_type = require_int(row[1], f"{row_label}.type")
        x = require_finite_number(row[2], f"{row_label}.x")
        y = require_finite_number(row[3], f"{row_label}.y")
        z = require_finite_number(row[4], f"{row_label}.z")
        radius = require_finite_number(row[5], f"{row_label}.radius")
        parent_id = require_int(row[6], f"{row_label}.parent")
        require(node_id > 0, f"{row_label}: node id must be positive")
        require(source_type >= 0, f"{row_label}: source type must be non-negative")
        require(radius > 0, f"{row_label}: radius must be positive")
        require(parent_id == -1 or parent_id > 0, f"{row_label}: invalid parent id")
        require(node_id not in nodes, f"{label}: duplicate node id {node_id}")
        nodes[node_id] = Node(node_id, source_type, x, y, z, radius, parent_id)
        if parent_id == -1:
            roots.append(node_id)

    require(len(roots) == 1, f"{label}: expected one root, found {len(roots)}")
    root_id = roots[0]
    require(nodes[root_id].source_type == 1, f"{label}: root node source type must be 1")
    swc = geometry.get("swc")
    require(isinstance(swc, dict), f"{label}: swc must be an object")
    require(swc.get("rootNodeId") == root_id, f"{label}: swc rootNodeId mismatch")
    require(swc.get("nodeCount") == len(nodes), f"{label}: swc nodeCount mismatch")

    children_lists: dict[int, list[int]] = {node_id: [] for node_id in nodes}
    for node in nodes.values():
        if node.parent_id == -1:
            continue
        require(node.parent_id != node.node_id, f"{label}: node {node.node_id} is its own parent")
        require(node.parent_id in nodes, f"{label}: missing parent {node.parent_id}")
        children_lists[node.parent_id].append(node.node_id)

    completed: set[int] = set()
    for node_id in sorted(nodes):
        if node_id in completed:
            continue
        active: set[int] = set()
        path: list[int] = []
        cursor = node_id
        while cursor != -1 and cursor not in completed:
            require(cursor not in active, f"{label}: cycle includes node {cursor}")
            active.add(cursor)
            path.append(cursor)
            cursor = nodes[cursor].parent_id
        require(cursor == -1 or cursor in completed, f"{label}: disconnected topology")
        if cursor == -1:
            require(path[-1] == root_id, f"{label}: node {node_id} is disconnected from root")
        completed.update(path)
    require(len(completed) == len(nodes), f"{label}: topology traversal did not cover every node")

    children = {
        node_id: tuple(sorted(child_ids))
        for node_id, child_ids in children_lists.items()
    }
    return GeometryTree(nodes=nodes, children=children, root_id=root_id)


def segment_length(parent: Node, child: Node) -> float:
    return math.dist(parent.coordinate, child.coordinate)


def sholl_intersection_count(
    parent: Node,
    child: Node,
    centre: tuple[float, float, float],
    radius: float,
) -> int:
    """Count analytic line-segment/sphere roots in the half-open interval (0, 1]."""
    px = parent.x - centre[0]
    py = parent.y - centre[1]
    pz = parent.z - centre[2]
    dx = child.x - parent.x
    dy = child.y - parent.y
    dz = child.z - parent.z
    a = dx * dx + dy * dy + dz * dz
    if a == 0.0:
        return 0
    b = 2.0 * (px * dx + py * dy + pz * dz)
    c = px * px + py * py + pz * pz - radius * radius
    discriminant = b * b - 4.0 * a * c
    if discriminant < 0.0:
        return 0
    if discriminant == 0.0:
        t = -b / (2.0 * a)
        return int(0.0 < t <= 1.0)
    root = math.sqrt(discriminant)
    first = (-b - root) / (2.0 * a)
    second = (-b + root) / (2.0 * a)
    return int(0.0 < first <= 1.0) + int(0.0 < second <= 1.0)


def analyse_tree(tree: GeometryTree) -> tuple[dict[str, Any], dict[str, int]]:
    nodes = tree.nodes
    root = nodes[tree.root_id]
    neurite_children = {
        node_id: tuple(
            child_id
            for child_id in tree.children[node_id]
            if nodes[child_id].source_type != 1
        )
        for node_id in nodes
    }
    bifurcation_ids = {
        node_id
        for node_id, child_ids in neurite_children.items()
        if nodes[node_id].source_type != 1 and len(child_ids) >= 2
    }

    path_lengths: dict[int, float] = {tree.root_id: 0.0}
    branch_orders: dict[int, int] = {}
    stack = [tree.root_id]
    while stack:
        parent_id = stack.pop()
        parent = nodes[parent_id]
        for child_id in reversed(tree.children[parent_id]):
            child = nodes[child_id]
            is_neurite_segment = child.source_type != 1
            path_lengths[child_id] = path_lengths[parent_id] + (
                segment_length(parent, child) if is_neurite_segment else 0.0
            )
            if is_neurite_segment:
                if parent.source_type == 1:
                    branch_orders[child_id] = 0
                else:
                    require(
                        parent_id in branch_orders,
                        f"node {child_id}: neurite parent has no branch order",
                    )
                    branch_orders[child_id] = branch_orders[parent_id] + int(
                        parent_id in bifurcation_ids
                    )
            stack.append(child_id)
    require(len(path_lengths) == len(nodes), "tree analysis did not visit every node")

    neurite_ids = sorted(
        node_id for node_id, node in nodes.items() if node.source_type != 1
    )
    require(neurite_ids, "geometry has no neurite nodes after excluding source type 1")
    stem_ids = [
        node_id
        for node_id in neurite_ids
        if nodes[nodes[node_id].parent_id].source_type == 1
    ]
    terminal_ids = [node_id for node_id in neurite_ids if not neurite_children[node_id]]

    cable_by_type: dict[int, float] = collections.defaultdict(float)
    segments_by_type: collections.Counter[int] = collections.Counter()
    zero_length_neurite_segment_count = 0
    neurite_segments: list[tuple[Node, Node]] = []
    for node_id in neurite_ids:
        child = nodes[node_id]
        parent = nodes[child.parent_id]
        length = segment_length(parent, child)
        if length == 0.0:
            zero_length_neurite_segment_count += 1
        cable_by_type[child.source_type] += length
        segments_by_type[child.source_type] += 1
        neurite_segments.append((parent, child))
    terminals_by_type = collections.Counter(nodes[node_id].source_type for node_id in terminal_ids)

    euclidean_distances = {
        node_id: math.dist(root.coordinate, nodes[node_id].coordinate)
        for node_id in neurite_ids
    }
    maximum_euclidean = max(euclidean_distances.values())
    maximum_sholl_radius = (
        math.floor(maximum_euclidean / SHOLL_STEP_MICROMETRE)
        * SHOLL_STEP_MICROMETRE
    )
    sholl_profile = []
    for radius in range(
        SHOLL_STEP_MICROMETRE,
        maximum_sholl_radius + 1,
        SHOLL_STEP_MICROMETRE,
    ):
        intersections = sum(
            sholl_intersection_count(parent, child, root.coordinate, float(radius))
            for parent, child in neurite_segments
        )
        sholl_profile.append(
            {"radiusMicrometre": radius, "intersectionCount": intersections}
        )

    observed_types = sorted(segments_by_type)
    by_source_type = [
        {
            "sourceType": source_type,
            "interpretation": source_type_interpretation(source_type),
            "segmentCount": segments_by_type[source_type],
            "terminalNodeCount": terminals_by_type[source_type],
            "cableLengthMicrometre": cable_by_type[source_type],
        }
        for source_type in observed_types
    ]
    metrics = {
        "stemCount": len(stem_ids),
        "terminalNodeCount": len(terminal_ids),
        "bifurcationNodeCount": len(bifurcation_ids),
        "maximumCentrifugalBranchOrder": max(branch_orders.values()),
        "maximumRootPathLengthMicrometre": max(path_lengths[node_id] for node_id in neurite_ids),
        "maximumRootEuclideanDistanceMicrometre": maximum_euclidean,
        "neuriteCableLengthMicrometre": sum(cable_by_type.values()),
        "bySourceType": by_source_type,
        "shollProfile": sholl_profile,
    }
    edge_cases = {
        "zeroLengthNeuriteSegmentCount": zero_length_neurite_segment_count,
        "sourceType6SegmentCount": segments_by_type[6],
        "somaType1ChildSegmentExcludedCount": sum(
            nodes[child_id].source_type == 1
            for child_ids in tree.children.values()
            for child_id in child_ids
        ),
    }
    return metrics, edge_cases


def preferred_source_citation(source: dict[str, Any], label: str) -> tuple[str, str]:
    dois = source.get("dois")
    pmids = source.get("pmids")
    require(isinstance(dois, list), f"{label}: source.dois must be an array")
    require(isinstance(pmids, list), f"{label}: source.pmids must be an array")
    require(all(isinstance(value, str) and value for value in dois), f"{label}: invalid DOI")
    require(all(isinstance(value, str) and value for value in pmids), f"{label}: invalid PMID")
    if dois:
        require(len(dois) == 1, f"{label}: ambiguous multiple-DOI cohort key")
        return ("DOI", dois[0])
    require(len(pmids) == 1, f"{label}: expected exactly one fallback PMID")
    return ("PMID", pmids[0])


def record_source(record: dict[str, Any], label: str) -> dict[str, Any]:
    normalized = record.get("normalizedMetadata")
    source_paper = record.get("sourcePaper")
    require(isinstance(normalized, dict), f"{label}: normalizedMetadata must be an object")
    require(isinstance(source_paper, dict), f"{label}: sourcePaper must be an object")
    cell_type = normalized.get("cellType")
    require(isinstance(cell_type, list), f"{label}: normalized cellType must be an array")
    require(
        all(isinstance(value, str) and value for value in cell_type),
        f"{label}: normalized cellType contains an invalid label",
    )
    return {
        "dois": list(source_paper["dois"]),
        "pmids": list(source_paper["pmids"]),
        "archive": normalized.get("archive"),
        "cellTypeLabels": list(cell_type),
        "sourceClass": cell_type[1] if len(cell_type) >= 2 else "unreported",
        "sourceSubtypeLabels": list(cell_type[2:]) if len(cell_type) >= 3 else ["unreported"],
        "sourceTertiaryLabel": cell_type[2] if len(cell_type) >= 3 else "unreported",
    }


def record_denominator_boundary() -> dict[str, Any]:
    missing_reason = "not_established_by_the_source_census"
    return {
        "analysisUnit": "NeuroMorpho_record",
        "recordCountContribution": 1,
        "independentAnimalCount": {"value": None, "missingReason": missing_reason},
        "independentDonorCount": {"value": None, "missingReason": missing_reason},
        "independentSpecimenCount": {"value": None, "missingReason": missing_reason},
        "prevalenceDenominator": {"value": None, "missingReason": missing_reason},
        "boundary": NON_ANIMAL_BOUNDARY,
    }


def validate_and_analyse_record(
    record: dict[str, Any],
    source_directory: Path,
    geometry_declarations: dict[str, dict[str, Any]],
) -> tuple[dict[str, Any], dict[str, int]]:
    neuron_id = require_int(record.get("neuronId"), "source record neuronId")
    label = f"NeuroMorpho:{neuron_id}"
    name = record.get("normalizedMetadata", {}).get("name")
    require(isinstance(name, str) and name, f"{label}: missing normalized name")
    geometry_reference = record.get("geometry")
    require(isinstance(geometry_reference, dict), f"{label}: geometry must be an object")
    require(geometry_reference.get("available") is True, f"{label}: geometry is not admitted")
    relative_path = geometry_reference.get("path")
    declared_sha256 = geometry_reference.get("sha256")
    declared_bytes = geometry_reference.get("bytes")
    require(isinstance(relative_path, str), f"{label}: geometry path must be a string")
    require(isinstance(declared_sha256, str), f"{label}: geometry SHA-256 must be a string")
    require_int(declared_bytes, f"{label}: geometry bytes")
    manifest_declaration = geometry_declarations.get(relative_path)
    require(isinstance(manifest_declaration, dict), f"{label}: geometry omitted by source manifest")
    require(manifest_declaration.get("neuronId") == neuron_id, f"{label}: manifest neuronId mismatch")
    require(manifest_declaration.get("sha256") == declared_sha256, f"{label}: manifest geometry hash mismatch")
    require(manifest_declaration.get("bytes") == declared_bytes, f"{label}: manifest geometry bytes mismatch")

    geometry_path = safe_source_path(source_directory, relative_path)
    require(geometry_path.stat().st_size == declared_bytes, f"{label}: geometry byte count mismatch")
    actual_sha256 = sha256_path(geometry_path)
    require(actual_sha256 == declared_sha256, f"{label}: geometry SHA-256 mismatch")
    geometry = load_json(geometry_path)
    require(isinstance(geometry, dict), f"{label}: geometry document must be an object")
    require(geometry.get("neuronId") == neuron_id, f"{label}: geometry neuronId mismatch")
    require(geometry.get("name") == name, f"{label}: geometry name mismatch")
    tree = parse_geometry_tree(geometry, label)
    computed = record.get("morphometrics", {}).get("computed")
    require(isinstance(computed, dict), f"{label}: census computed morphometrics missing")
    require(computed.get("nodeCount") == len(tree.nodes), f"{label}: census nodeCount mismatch")
    require(computed.get("segmentCount") == len(tree.nodes) - 1, f"{label}: census segmentCount mismatch")

    normalized = record["normalizedMetadata"]
    dimensionality = normalized.get("dimensionality")
    domain = normalized.get("domain")
    physical_integrity = normalized.get("physicalIntegrity")
    for value, field in (
        (dimensionality, "dimensionality"),
        (domain, "domain"),
        (physical_integrity, "physicalIntegrity"),
    ):
        require(isinstance(value, str) and value, f"{label}: invalid {field}")
    require(geometry.get("swc", {}).get("dimensionality") == dimensionality, f"{label}: dimensionality mismatch")

    metrics, edge_cases = analyse_tree(tree)
    return (
        {
            "neuronId": neuron_id,
            "name": name,
            "source": record_source(record, label),
            "dimensionality": dimensionality,
            "domain": domain,
            "physicalIntegrity": physical_integrity,
            "sourceGeometry": {
                "assetSetId": SOURCE_ASSET_SET_ID,
                "path": relative_path,
                "sha256": declared_sha256,
            },
            "denominatorBoundary": record_denominator_boundary(),
            "metrics": metrics,
        },
        edge_cases,
    )


def type7_quantile(values: Sequence[int | float], probability: float) -> float:
    require(bool(values), "type-7 quantile requires at least one value")
    require(0.0 <= probability <= 1.0, "type-7 quantile probability is outside [0,1]")
    ordered = sorted(float(value) for value in values)
    h = (len(ordered) - 1) * probability
    lower = math.floor(h)
    fraction = h - lower
    if lower == len(ordered) - 1:
        return ordered[lower]
    return ordered[lower] + fraction * (ordered[lower + 1] - ordered[lower])


def metric_summary(values: Sequence[int | float]) -> dict[str, int | float]:
    require(bool(values), "metric summary requires at least one value")
    return {
        "n": len(values),
        "min": min(values),
        "q1": type7_quantile(values, 0.25),
        "median": type7_quantile(values, 0.5),
        "q3": type7_quantile(values, 0.75),
        "max": max(values),
    }


def cohort_tuple(record: dict[str, Any]) -> tuple[str, str, str, str, str, str]:
    scheme, citation = preferred_source_citation(
        record["source"], f"NeuroMorpho:{record['neuronId']}"
    )
    return (
        scheme,
        citation,
        record["source"]["sourceTertiaryLabel"],
        record["dimensionality"],
        record["domain"],
        record["physicalIntegrity"],
    )


def source_type_metric(record: dict[str, Any], source_type: int, field: str) -> int | float:
    for row in record["metrics"]["bySourceType"]:
        if row["sourceType"] == source_type:
            return row[field]
    return 0


def cohort_id(key: tuple[str, str, str, str, str, str]) -> str:
    digest = sha256_bytes(compact_json_bytes(list(key)))
    return f"cohort-{digest[:16]}"


def build_cohort(key: tuple[str, str, str, str, str, str], records: list[dict[str, Any]]) -> dict[str, Any]:
    scheme, citation, tertiary, dimensionality, domain, integrity = key
    records = sorted(records, key=lambda record: record["neuronId"])
    scalar_fields = (
        "stemCount",
        "terminalNodeCount",
        "bifurcationNodeCount",
        "maximumCentrifugalBranchOrder",
        "maximumRootPathLengthMicrometre",
        "maximumRootEuclideanDistanceMicrometre",
        "neuriteCableLengthMicrometre",
    )
    metric_summaries = {
        field: metric_summary([record["metrics"][field] for record in records])
        for field in scalar_fields
    }
    source_types = sorted(
        {
            row["sourceType"]
            for record in records
            for row in record["metrics"]["bySourceType"]
        }
    )
    by_source_type_summaries = []
    for source_type in source_types:
        by_source_type_summaries.append(
            {
                "sourceType": source_type,
                "interpretation": source_type_interpretation(source_type),
                "segmentCount": metric_summary(
                    [source_type_metric(record, source_type, "segmentCount") for record in records]
                ),
                "terminalNodeCount": metric_summary(
                    [source_type_metric(record, source_type, "terminalNodeCount") for record in records]
                ),
                "cableLengthMicrometre": metric_summary(
                    [source_type_metric(record, source_type, "cableLengthMicrometre") for record in records]
                ),
            }
        )

    profiles = {
        record["neuronId"]: {
            row["radiusMicrometre"]: row["intersectionCount"]
            for row in record["metrics"]["shollProfile"]
        }
        for record in records
    }
    maximum_radius = max(
        (
            max(profile) if profile else 0
            for profile in profiles.values()
        ),
        default=0,
    )
    sholl_median_profile = []
    for radius in range(
        SHOLL_STEP_MICROMETRE,
        maximum_radius + 1,
        SHOLL_STEP_MICROMETRE,
    ):
        values = [profiles[record["neuronId"]].get(radius, 0) for record in records]
        sholl_median_profile.append(
            {
                "radiusMicrometre": radius,
                "n": len(records),
                "medianIntersectionCount": type7_quantile(values, 0.5),
            }
        )

    return {
        "cohortId": cohort_id(key),
        "cohortKey": {
            "sourceCitation": {"scheme": scheme, "value": citation},
            "sourceTertiaryLabel": tertiary,
            "dimensionality": dimensionality,
            "domain": domain,
            "physicalIntegrity": integrity,
        },
        "denominatorBoundary": {
            "analysisUnit": "NeuroMorpho_record",
            "n": len(records),
            "boundary": NON_ANIMAL_BOUNDARY,
        },
        "neuronIds": [record["neuronId"] for record in records],
        "metricSummaries": metric_summaries,
        "bySourceTypeMetricSummaries": by_source_type_summaries,
        "shollMedianProfile": sholl_median_profile,
    }


def count_distribution(values: Iterable[Any]) -> list[dict[str, Any]]:
    counts: dict[str, tuple[Any, int]] = {}
    for value in values:
        key = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        original, count = counts.get(key, (value, 0))
        counts[key] = (original, count + 1)
    return [
        {"value": value, "count": count}
        for value, count in sorted(counts.values(), key=lambda item: str(item[0]))
    ]


def analysis_policy() -> dict[str, Any]:
    return {
        "coordinateAndTopologyPolicy": (
            "read_pinned_geometry_node_rows_without_coordinate_topology_radius_or_type_modification"
        ),
        "rootPolicy": "exactly_one_parent_minus_1_root_required_and_root_source_type_must_equal_1",
        "neuriteSegmentPolicy": (
            "a_segment_is_neurite_when_its_child_node_source_type_is_not_1;_"
            "child_source_type_1_segments_are_excluded_from_all_neurite_metrics"
        ),
        "stemPolicy": "a_neurite_segment_whose_parent_node_source_type_is_1",
        "terminalPolicy": "a_non_type_1_node_with_zero_non_type_1_child_nodes",
        "bifurcationPolicy": "a_non_type_1_node_with_two_or_more_non_type_1_child_nodes",
        "centrifugalBranchOrderPolicy": (
            "stem_segments_have_order_0;_a_downstream_neurite_segment_increments_by_1_"
            "only_when_its_upstream_neurite_parent_is_a_bifurcation"
        ),
        "rootPathPolicy": (
            "sum_parent_child_Euclidean_segment_lengths_from_root_to_node_while_"
            "assigning_zero_length_contribution_to_child_source_type_1_segments"
        ),
        "rootEuclideanPolicy": "straight_line_distance_from_root_node_coordinate_to_each_neurite_node",
        "sourceTypePolicy": (
            "segment_source_type_is_the_unmodified_child_node_SWC_type;_source_type_6_"
            "remains_uninterpreted_and_is_never_promoted_to_axon_or_dendrite"
        ),
        "shollPolicy": {
            "centre": "root_node_coordinate_not_soma_centroid",
            "radiusStepMicrometre": SHOLL_STEP_MICROMETRE,
            "radii": "positive_step_multiples_not_exceeding_maximum_root_node_Euclidean_distance",
            "segments": "neurite_segments_only;_child_source_type_1_segments_excluded",
            "intersection": (
                "analytic_straight_segment_sphere_quadratic_roots_using_IEEE_754_binary64"
            ),
            "endpointInterval": "half_open_t_in_(0,1]",
            "tangentPolicy": "a_repeated_quadratic_root_counts_once",
            "zeroLengthSegmentPolicy": "undefined_sphere_overlap_counts_zero",
        },
        "cohortPolicy": {
            "exactKey": [
                "preferred_source_DOI_or_fallback_PMID",
                "source_tertiary_label_or_unreported",
                "dimensionality",
                "domain",
                "physical_integrity",
            ],
            "citationChoice": (
                "require_exactly_one_DOI_when_present;_otherwise_require_exactly_one_PMID;_"
                "ambiguous_multiple_DOI_records_fail_closed"
            ),
            "dimensionality": "2D_and_3D_are_never_implicitly_pooled",
            "sourceTypeAbsentInRecord": (
                "zero_for_cohort_by_source_type_summary_with_all_cohort_records_retained"
            ),
        },
        "quantilePolicy": {
            "method": "Hyndman-Fan_type_7_linear_interpolation",
            "formula": "h=(n-1)*p;_x[floor(h)]+fraction(h)*(x[floor(h)+1]-x[floor(h)])",
            "probabilities": {"q1": 0.25, "median": 0.5, "q3": 0.75},
        },
        "shollCohortPolicy": (
            "each_radius_uses_all_cohort_records;_profiles_ending_before_a_radius_contribute_"
            "zero_because_no_straight_segment_can_reach_beyond_the_record_maximum_node_radius"
        ),
        "denominatorPolicy": NON_ANIMAL_BOUNDARY,
    }


def scientific_boundary() -> dict[str, Any]:
    return {
        "geometryStatus": GEOMETRY_STATUS,
        "registrationCount": 0,
        "analysisUnit": "NeuroMorpho_record",
        "type6Policy": "preserve_uninterpreted_never_infer_axon_or_dendrite",
        "forbiddenClaims": [
            "cross-paper biological comparison outside the exact declared cohorts",
            "atlas placement, atlas registration, laminar position, or spinal-segment position",
            "biological cell-type identity, equivalence, or prevalence inferred from morphology or source labels",
            "independent animal, donor, or specimen counts",
            "complete axonal projection, synaptic connectivity, or circuit membership",
        ],
    }


def inherited_rights(census: dict[str, Any]) -> dict[str, Any]:
    rights = census.get("rights")
    require(isinstance(rights, dict), "source census rights must be an object")
    license_value = rights.get("license")
    citations = rights.get("requiredCitations")
    require(isinstance(license_value, str) and license_value, "source census license missing")
    require(isinstance(citations, list) and citations, "source census required citations missing")
    return {
        "inheritance": "inherited_from_checksum_pinned_source_census",
        "license": license_value,
        "requiredAttribution": list(citations),
        "sourceTerms": census.get("authority", {}).get("terms"),
    }


def build_analysis(
    census: dict[str, Any],
    source_directory: Path,
    geometry_declarations: dict[str, dict[str, Any]],
    builder_sha256: str,
) -> tuple[dict[str, Any], dict[str, int]]:
    source_records = census["records"]
    source_ids = [require_int(record.get("neuronId"), "source record neuronId") for record in source_records]
    require(len(set(source_ids)) == EXPECTED_RECORD_COUNT, "source census neuron IDs are not unique")
    require(source_ids == sorted(source_ids), "source census records are not sorted by neuronId")
    declared_geometry_paths = {
        record.get("geometry", {}).get("path") for record in source_records
    }
    require(
        declared_geometry_paths == set(geometry_declarations),
        "source record geometry paths and source manifest geometry paths differ",
    )

    records: list[dict[str, Any]] = []
    edge_case_totals: collections.Counter[str] = collections.Counter()
    for source_record in source_records:
        require(isinstance(source_record, dict), "source census record must be an object")
        analysed, edge_cases = validate_and_analyse_record(
            source_record, source_directory, geometry_declarations
        )
        records.append(analysed)
        edge_case_totals.update(edge_cases)
    require(len(records) == EXPECTED_RECORD_COUNT, "analysis record count mismatch")

    grouped: dict[tuple[str, str, str, str, str, str], list[dict[str, Any]]] = collections.defaultdict(list)
    for record in records:
        grouped[cohort_tuple(record)].append(record)
    cohorts = [build_cohort(key, grouped[key]) for key in sorted(grouped)]
    cohort_ids = [cohort["cohortId"] for cohort in cohorts]
    require(len(cohort_ids) == len(set(cohort_ids)), "cohort ID hash collision")
    require(
        sum(cohort["denominatorBoundary"]["n"] for cohort in cohorts) == EXPECTED_RECORD_COUNT,
        "cohort partition does not cover each record exactly once",
    )

    citations = [
        {"scheme": key[0], "value": key[1]}
        for key in [cohort_tuple(record) for record in records]
    ]
    summary = {
        "recordCount": len(records),
        "cohortCount": len(cohorts),
        "registrationCount": 0,
        "byDimensionality": count_distribution(record["dimensionality"] for record in records),
        "bySourceCitation": count_distribution(citations),
        "bySourceTertiaryLabel": count_distribution(
            record["source"]["sourceTertiaryLabel"] for record in records
        ),
        "recordsWithSourceType6": sum(
            any(row["sourceType"] == 6 for row in record["metrics"]["bySourceType"])
            for record in records
        ),
    }
    analysis = {
        "documentType": "neuromorpho_morphology_analysis_index",
        "schemaVersion": SCHEMA_VERSION,
        "assetSetId": ASSET_SET_ID,
        "release": RELEASE,
        "source": {
            "assetSetId": SOURCE_ASSET_SET_ID,
            "censusIndex": {
                "path": f"{SOURCE_DIRECTORY.as_posix()}/census-index.json",
                "sha256": SOURCE_CENSUS_INDEX_SHA256,
            },
            "assetManifest": {
                "path": f"{SOURCE_DIRECTORY.as_posix()}/asset-manifest.json",
                "sha256": SOURCE_ASSET_MANIFEST_SHA256,
            },
            "geometryRecordCount": EXPECTED_RECORD_COUNT,
        },
        "builder": {
            "path": BUILDER_REPOSITORY_PATH,
            "version": BUILDER_VERSION,
            "sha256": builder_sha256,
            "runtime": "Python_3_standard_library_only",
            "determinism": "sorted_input_records_sorted_cohorts_sorted_keys_compact_UTF-8_JSON",
        },
        "rights": inherited_rights(census),
        "scientificBoundary": scientific_boundary(),
        "analysisPolicy": analysis_policy(),
        "summary": summary,
        "records": records,
        "cohorts": cohorts,
    }
    return analysis, dict(sorted(edge_case_totals.items()))


def write_outputs(
    analysis: dict[str, Any],
    census: dict[str, Any],
    output_directory: Path,
    builder_sha256: str,
) -> tuple[dict[str, Any], str]:
    output_directory.mkdir(parents=True, exist_ok=True)
    analysis_path = output_directory / "analysis-index.json"
    manifest_path = output_directory / "asset-manifest.json"
    analysis_bytes = compact_json_bytes(analysis)
    analysis_path.write_bytes(analysis_bytes)
    analysis_sha256 = sha256_bytes(analysis_bytes)
    manifest = {
        "documentType": "neuromorpho_morphology_analysis_asset_manifest",
        "schemaVersion": SCHEMA_VERSION,
        "assetSetId": ASSET_SET_ID,
        "release": RELEASE,
        "builder": {
            "path": BUILDER_REPOSITORY_PATH,
            "version": BUILDER_VERSION,
            "sha256": builder_sha256,
            "runtime": "Python_3_standard_library_only",
        },
        "source": {
            "assetSetId": SOURCE_ASSET_SET_ID,
            "censusIndexSha256": SOURCE_CENSUS_INDEX_SHA256,
            "assetManifestSha256": SOURCE_ASSET_MANIFEST_SHA256,
            "geometryRecordCount": EXPECTED_RECORD_COUNT,
        },
        "rights": inherited_rights(census),
        "scientificBoundary": scientific_boundary(),
        "files": [
            {
                "path": "analysis-index.json",
                "kind": "morphology_analysis_index",
                "sha256": analysis_sha256,
                "bytes": len(analysis_bytes),
            }
        ],
    }
    manifest_path.write_bytes(compact_json_bytes(manifest))
    return manifest, analysis_sha256


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source-directory",
        type=Path,
        default=SOURCE_DIRECTORY,
        help="directory containing the checksum-pinned census-index and geometry files",
    )
    parser.add_argument(
        "--output-directory",
        type=Path,
        default=OUTPUT_DIRECTORY,
        help="directory for deterministic analysis-index.json and asset-manifest.json",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    census, _source_manifest, geometry_declarations = validate_source_documents(
        args.source_directory
    )
    builder_path = Path(__file__).resolve()
    builder_sha256 = sha256_path(builder_path)
    analysis, edge_cases = build_analysis(
        census, args.source_directory, geometry_declarations, builder_sha256
    )
    manifest, analysis_sha256 = write_outputs(
        analysis, census, args.output_directory, builder_sha256
    )
    manifest_sha256 = sha256_path(args.output_directory / "asset-manifest.json")
    print(
        json.dumps(
            {
                "assetSetId": ASSET_SET_ID,
                "recordCount": analysis["summary"]["recordCount"],
                "cohortCount": analysis["summary"]["cohortCount"],
                "analysisIndexSha256": analysis_sha256,
                "assetManifestSha256": manifest_sha256,
                "analysisIndexBytes": manifest["files"][0]["bytes"],
                "edgeCases": edge_cases,
            },
            ensure_ascii=False,
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
