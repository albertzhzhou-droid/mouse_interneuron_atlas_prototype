#!/usr/bin/env python3
"""Build the pinned NeuroMorpho adult-mouse spinal-interneuron census.

The official API record is preserved verbatim inside the generated snapshot and
inside each index record.  Standardized CNG SWCs remain in their source-local
coordinate systems.  The builder never registers, reorients, repairs, or
biologically completes a reconstruction.  SWC type 6 is preserved as an
uninterpreted neurite and is never promoted to axon or dendrite.
"""

from __future__ import annotations

import argparse
import collections
import datetime as dt
import hashlib
import json
import math
import shutil
import struct
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


NEUROMORPHO_RELEASE = "8.6.124"
SCHEMA_VERSION = "1.0.0"
ASSET_SET_ID = "neuromorpho:8.6.124:adult-mouse-spinal-interneuron-census-v1"
EXPECTED_QUERY_TOTAL = 142
PINNED_SNAPSHOT_SHA256 = "f35f1755885ca495ab3fecb2385e797eaeec3dc56d684413a8324a2e9297113b"
PINNED_RETRIEVAL_EVIDENCE = "Wed, 26 Aug 2026 23:52:32 GMT"
QUERY_URL = (
    "https://neuromorpho.org/api/neuron/select?q=species:mouse&"
    "fq=brain_region:spinal%20cord&fq=cell_type:interneuron&"
    "fq=age_classification:adult&size=500&sort=neuron_id,asc"
)
USER_AGENT = (
    "OHRI-Open-Data-Census-UPG-030A/1.0 "
    "(NeuroMorpho API and direct SWC research audit)"
)
OUTPUT_DIRECTORY = Path("public/data/neuromorpho_release_8_6_124_census_v1")
SOURCE_FRAME = "NeuroMorpho_CNG_standardized_local_frame"
UNITS = "micrometre_reported_by_source"
MISSING_MARKERS = {None, "", "Not Reported", "Not reported", "not reported"}


@dataclass(frozen=True)
class ParsedSwc:
    nodes: dict[int, tuple[int, float, float, float, float, int]]
    root_id: int
    node_type_counts: dict[str, int]
    bounds_min: list[float]
    bounds_max: list[float]
    extent: list[float]
    segment_count: int
    zero_length_edges: int
    total_cable_length: float
    radius_min: float
    radius_max: float
    radius_mean: float
    canonical_geometry_sha256: str
    topology_sha256: str


def json_bytes(value: Any, *, pretty: bool = False) -> bytes:
    if pretty:
        return (json.dumps(value, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_path(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def file_declaration(path: Path, relative_path: str, kind: str, neuron_id: int | None = None) -> dict[str, Any]:
    declaration: dict[str, Any] = {
        "path": relative_path,
        "kind": kind,
        "sha256": sha256_path(path),
        "bytes": path.stat().st_size,
    }
    if neuron_id is not None:
        declaration["neuronId"] = neuron_id
    return declaration


def fetch_bytes(url: str, *, retries: int, delay_seconds: float) -> tuple[bytes, str | None]:
    last_error: Exception | None = None
    for attempt in range(retries + 1):
        if attempt:
            time.sleep(delay_seconds * (2**attempt))
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                return response.read(), response.headers.get("Date")
        except (urllib.error.URLError, TimeoutError, OSError) as error:
            last_error = error
    assert last_error is not None
    raise last_error


def load_or_fetch_api_snapshot(
    cache_path: Path,
    *,
    refresh: bool,
    retries: int,
    delay_seconds: float,
) -> tuple[bytes, str]:
    if cache_path.exists() and not refresh:
        return cache_path.read_bytes(), "cached_pinned_snapshot"
    body, date_header = fetch_bytes(QUERY_URL, retries=retries, delay_seconds=delay_seconds)
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_bytes(body)
    return body, date_header or "network_response_date_unavailable"


def swc_url(record: dict[str, Any]) -> str:
    archive = urllib.parse.quote(str(record["archive"]).lower(), safe="_")
    name = urllib.parse.quote(str(record["neuron_name"]), safe="-_.~")
    return f"https://neuromorpho.org/dableFiles/{archive}/CNG%20version/{name}.CNG.swc"


def interpretation_for_type(node_type: int) -> str:
    return {
        0: "uninterpreted_undefined_type_0",
        1: "soma_type_1",
        2: "axon_type_2",
        3: "dendrite_type_3",
        4: "apical_dendrite_type_4",
        5: "uninterpreted_custom_type_5",
        6: "uninterpreted_neurite_type_6",
        7: "glia_process_type_7",
    }.get(node_type, f"uninterpreted_unknown_type_{node_type}")


def canonical_geometry_sha256(
    nodes: dict[int, tuple[int, float, float, float, float, int]]
) -> str:
    """Hash parsed geometry using language-neutral IEEE-754 encodings."""
    rows: list[str] = []
    for node_id in sorted(nodes):
        node_type, x, y, z, radius, parent = nodes[node_id]
        encoded = [struct.pack(">d", value).hex() for value in (x, y, z, radius)]
        rows.append(
            ",".join(
                [str(node_id), str(node_type), *encoded, str(parent)]
            )
        )
    return sha256_bytes(("\n".join(rows) + "\n").encode("ascii"))


def parse_swc_bytes(body: bytes, label: str) -> ParsedSwc:
    text = body.decode("utf-8", errors="replace")
    nodes: dict[int, tuple[int, float, float, float, float, int]] = {}
    for line_number, raw_line in enumerate(text.splitlines(), 1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        fields = line.split()
        if len(fields) != 7:
            raise ValueError(f"{label}:{line_number}: expected 7 columns, found {len(fields)}")
        try:
            node_id = int(fields[0])
            node_type = int(fields[1])
            x, y, z, radius = (float(value) for value in fields[2:6])
            parent = int(fields[6])
        except ValueError as error:
            raise ValueError(f"{label}:{line_number}: invalid numeric value") from error
        if node_id <= 0:
            raise ValueError(f"{label}:{line_number}: node id must be positive")
        if node_type < 0:
            raise ValueError(f"{label}:{line_number}: node type must be non-negative")
        if parent == 0 or parent < -1:
            raise ValueError(f"{label}:{line_number}: invalid parent id {parent}")
        if node_id in nodes:
            raise ValueError(f"{label}:{line_number}: duplicate node id {node_id}")
        if not all(math.isfinite(value) for value in (x, y, z, radius)):
            raise ValueError(f"{label}:{line_number}: non-finite coordinate or radius")
        if radius <= 0:
            raise ValueError(f"{label}:{line_number}: radius must be positive")
        nodes[node_id] = (node_type, x, y, z, radius, parent)

    if not nodes:
        raise ValueError(f"{label}: no SWC data rows")
    roots = [node_id for node_id, node in nodes.items() if node[5] == -1]
    if len(roots) != 1:
        raise ValueError(f"{label}: expected one root, found {len(roots)}")
    root_id = roots[0]

    completed: set[int] = set()
    for node_id, node in nodes.items():
        if node[5] == node_id:
            raise ValueError(f"{label}: node {node_id} is its own parent")
        if node[5] != -1 and node[5] not in nodes:
            raise ValueError(f"{label}: missing parent {node[5]} for node {node_id}")
        if node_id in completed:
            continue
        active: set[int] = set()
        path: list[int] = []
        cursor = node_id
        while cursor != -1 and cursor not in completed:
            if cursor in active:
                raise ValueError(f"{label}: cycle includes node {cursor}")
            active.add(cursor)
            path.append(cursor)
            cursor = nodes[cursor][5]
        if cursor == -1 and path and path[-1] != root_id:
            raise ValueError(f"{label}: node {node_id} does not connect to the single root")
        completed.update(path)

    coordinates = [(node[1], node[2], node[3]) for node in nodes.values()]
    bounds_min = [min(point[index] for point in coordinates) for index in range(3)]
    bounds_max = [max(point[index] for point in coordinates) for index in range(3)]
    extent = [bounds_max[index] - bounds_min[index] for index in range(3)]
    zero_length_edges = 0
    total_cable_length = 0.0
    for node in nodes.values():
        parent_id = node[5]
        if parent_id == -1:
            continue
        parent = nodes[parent_id]
        distance = math.dist((node[1], node[2], node[3]), (parent[1], parent[2], parent[3]))
        total_cable_length += distance
        if distance == 0:
            zero_length_edges += 1

    canonical_geometry_digest = canonical_geometry_sha256(nodes)
    topology_sha256 = sha256_bytes(
        json_bytes([[node_id, nodes[node_id][0], nodes[node_id][5]] for node_id in sorted(nodes)])
    )
    radii = [node[4] for node in nodes.values()]
    return ParsedSwc(
        nodes=nodes,
        root_id=root_id,
        node_type_counts={
            str(node_type): count
            for node_type, count in sorted(collections.Counter(node[0] for node in nodes.values()).items())
        },
        bounds_min=bounds_min,
        bounds_max=bounds_max,
        extent=extent,
        segment_count=len(nodes) - 1,
        zero_length_edges=zero_length_edges,
        total_cable_length=total_cable_length,
        radius_min=min(radii),
        radius_max=max(radii),
        radius_mean=sum(radii) / len(radii),
        canonical_geometry_sha256=canonical_geometry_digest,
        topology_sha256=topology_sha256,
    )


def parse_optional_float(value: Any) -> float | None:
    if value in MISSING_MARKERS:
        return None
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    return parsed if math.isfinite(parsed) else None


def explicit_measure(value: Any, unit: str) -> dict[str, Any]:
    parsed = parse_optional_float(value)
    return {
        "value": parsed,
        "unit": unit,
        "missingReason": None if parsed is not None else "not_reported_by_official_api",
    }


def numeric_age(record: dict[str, Any]) -> dict[str, Any]:
    minimum = parse_optional_float(record.get("min_age"))
    maximum = parse_optional_float(record.get("max_age"))
    scale = record.get("age_scale")
    if minimum is None or maximum is None or scale in MISSING_MARKERS:
        return {"value": None, "missingReason": "numeric_age_not_reported_by_source"}
    return {
        "value": {"minimum": minimum, "maximum": maximum, "scale": scale},
        "missingReason": None,
    }


def dimensionality(record: dict[str, Any]) -> str:
    attributes = str(record.get("attributes") or "")
    if "2D" in attributes:
        return "2D"
    if "3D" in attributes:
        return "3D"
    return "not_reported"


def source_diameter_available(record: dict[str, Any]) -> bool:
    attributes = str(record.get("attributes") or "")
    return "Diameter" in attributes and "No Diameter" not in attributes


def domain_matches_types(domain: str, node_type_counts: dict[str, int]) -> bool:
    has_axon = node_type_counts.get("2", 0) > 0
    if "No Axon" in domain:
        return not has_axon
    if "Axon" in domain:
        return has_axon
    if domain == "Neurites, Soma":
        return not has_axon and node_type_counts.get("6", 0) > 0
    return True


def display_transform(parsed: ParsedSwc) -> dict[str, Any]:
    root = parsed.nodes[parsed.root_id]
    span = max(parsed.extent)
    return {
        "kind": "soma_centered_uniform_scale",
        "originMicrometre": [root[1], root[2], root[3]],
        "scaleViewerUnitPerMicrometre": 6.0 / span if span > 0 else 1.0,
        "use": "viewer_only",
    }


def build_geometry(
    record: dict[str, Any],
    body: bytes,
    parsed: ParsedSwc,
    raw_path: str,
    raw_sha256: str,
) -> dict[str, Any]:
    neuron_id = int(record["neuron_id"])
    diameter_available = source_diameter_available(record)
    nodes = [[node_id, *parsed.nodes[node_id]] for node_id in sorted(parsed.nodes)]
    segments: list[list[Any]] = []
    for node_id in sorted(parsed.nodes):
        node_type, x, y, z, radius, parent_id = parsed.nodes[node_id]
        if parent_id == -1:
            continue
        parent = parsed.nodes[parent_id]
        segments.append(
            [
                parent[1],
                parent[2],
                parent[3],
                parent[4],
                x,
                y,
                z,
                radius,
                node_type,
                interpretation_for_type(node_type),
            ]
        )
    qc = {
        "status": "passed",
        "sevenColumns": True,
        "finite": True,
        "uniquePositiveNodeIds": True,
        "singleRoot": True,
        "parentsPresent": True,
        "noSelfParent": True,
        "acyclic": True,
        "positiveRadius": True,
        "connected": True,
        "domainMatchesTypes": domain_matches_types(str(record.get("domain") or ""), parsed.node_type_counts),
        "type6PreservedUninterpreted": True,
        "errors": [],
    }
    if not qc["domainMatchesTypes"]:
        raise ValueError(
            f"NeuroMorpho:{neuron_id}: official domain does not agree with SWC node types"
        )
    computed = {
        "nodeCount": len(parsed.nodes),
        "segmentCount": parsed.segment_count,
        "rootNodeId": parsed.root_id,
        "nodeTypeCounts": parsed.node_type_counts,
        "boundsMicrometre": {"min": parsed.bounds_min, "max": parsed.bounds_max},
        "extentMicrometre": parsed.extent,
        "zeroLengthEdgeCount": parsed.zero_length_edges,
        "totalCableLengthMicrometre": parsed.total_cable_length,
        "rawSwcSha256": raw_sha256,
        "canonicalGeometrySha256": parsed.canonical_geometry_sha256,
        "topologySha256": parsed.topology_sha256,
        "radiusDerived": (
            {
                "value": {
                    "minimumMicrometre": parsed.radius_min,
                    "maximumMicrometre": parsed.radius_max,
                    "meanMicrometre": parsed.radius_mean,
                },
                "missingReason": None,
            }
            if diameter_available
            else {
                "value": None,
                "missingReason": "official_attributes_report_no_diameter",
            }
        ),
    }
    return {
        "documentType": "neuromorpho_geometry",
        "schemaVersion": SCHEMA_VERSION,
        "assetId": f"NeuroMorpho:{neuron_id}",
        "neuronId": neuron_id,
        "name": record["neuron_name"],
        "geometryStatus": "OBS_STANDARDIZED_SOURCE_LOCAL",
        "sourceFrame": SOURCE_FRAME,
        "units": UNITS,
        "registration": {
            "status": "unregistered",
            "registrationCount": 0,
            "atlasTransform": {"value": None, "missingReason": "not_available"},
            "atlasPlacement": {"value": None, "missingReason": "not_established"},
        },
        "scientificUse": "source_local_morphology_visualization_and_qc_only",
        "source": {
            "officialRecordUrl": f"https://neuromorpho.org/api/neuron/id/{neuron_id}",
            "standardizedSwcUrl": swc_url(record),
            "pmids": record.get("reference_pmid") or [],
            "dois": record.get("reference_doi") or [],
            "license": "CC BY 4.0 subject to NeuroMorpho.Org Terms of Use",
        },
        "swc": {
            "format": "NeuroMorpho_CNG_standardized_SWC",
            "path": raw_path,
            "sha256": raw_sha256,
            "bytes": len(body),
            "nodeCount": len(parsed.nodes),
            "rootNodeId": parsed.root_id,
            "nodeTypeCounts": parsed.node_type_counts,
            "dimensionality": dimensionality(record),
            "sourceDiameterAvailable": diameter_available,
            "type6Policy": "preserve_uninterpreted_never_infer_axon_or_dendrite",
            "originalMorphologyFile": {
                "value": None,
                "missingReason": "temporarily_unavailable_from_repository",
            },
            "standardizationLog": {
                "value": None,
                "missingReason": "temporarily_unavailable_from_repository",
            },
        },
        "qc": qc,
        "morphometrics": {
            "sourceReported": {
                "somaSurface": explicit_measure(record.get("soma_surface"), "square_micrometre"),
                "surface": explicit_measure(record.get("surface"), "square_micrometre"),
                "volume": explicit_measure(record.get("volume"), "cubic_micrometre"),
            },
            "computedFromStandardizedSwc": computed,
        },
        "displayTransform": display_transform(parsed),
        "nodeColumns": ["id", "type", "x", "y", "z", "radius", "parent"],
        "nodes": nodes,
        "segmentColumns": [
            "x1",
            "y1",
            "z1",
            "r1",
            "x2",
            "y2",
            "z2",
            "r2",
            "sourceType",
            "interpretation",
        ],
        "segmentEndpointMeaning": {"endpoint1": "parent", "endpoint2": "child"},
        "segments": segments,
    }


def normalized_metadata(record: dict[str, Any]) -> dict[str, Any]:
    return {
        "name": record["neuron_name"],
        "archive": record["archive"],
        "species": record.get("species"),
        "scientificName": record.get("scientific_name"),
        "lifeStage": record.get("age_classification"),
        "brainRegion": record.get("brain_region") or [],
        "cellType": record.get("cell_type") or [],
        "strain": record.get("strain"),
        "gender": record.get("gender"),
        "experimentCondition": record.get("experiment_condition") or [],
        "domain": record.get("domain"),
        "physicalIntegrity": record.get("physical_Integrity"),
        "attributes": record.get("attributes"),
        "dimensionality": dimensionality(record),
        "sourceDiameterAvailable": source_diameter_available(record),
        "sourceFrame": SOURCE_FRAME,
        "registrationStatus": "unregistered",
    }


def base_missingness(record: dict[str, Any]) -> dict[str, Any]:
    return {
        "numericAge": numeric_age(record),
        "donorId": {"value": None, "missingReason": "not_provided_by_official_api_schema"},
        "specimenId": {"value": None, "missingReason": "not_provided_by_official_api_schema"},
        "atlasTransform": {"value": None, "missingReason": "not_available"},
        "atlasPlacement": {"value": None, "missingReason": "not_established"},
        "originalMorphologyFile": {
            "value": None,
            "missingReason": "temporarily_unavailable_from_repository",
        },
        "standardizationLog": {
            "value": None,
            "missingReason": "temporarily_unavailable_from_repository",
        },
    }


def distribution(values: list[Any]) -> list[dict[str, Any]]:
    counts: dict[str, tuple[Any, int]] = {}
    for value in values:
        key = json.dumps(value, sort_keys=True, ensure_ascii=False)
        original, count = counts.get(key, (value, 0))
        counts[key] = (original, count + 1)
    return [
        {"value": value, "count": count}
        for value, count in sorted(counts.values(), key=lambda item: (-item[1], str(item[0])))
    ]


def duplicate_groups(records: list[dict[str, Any]], key: str) -> list[dict[str, Any]]:
    grouped: dict[str, list[int]] = collections.defaultdict(list)
    for record in records:
        value = record["morphometrics"]["computed"][key]
        if value is not None:
            grouped[value].append(record["neuronId"])
    return [
        {"sha256": digest, "neuronIds": sorted(neuron_ids)}
        for digest, neuron_ids in sorted(grouped.items())
        if len(neuron_ids) > 1
    ]


def build_summary(records: list[dict[str, Any]]) -> dict[str, Any]:
    admitted = [record for record in records if record["geometry"]["available"]]
    quarantined = [record for record in records if not record["geometry"]["available"]]
    paper_counts: dict[tuple[str | None, str | None], int] = collections.Counter()
    for record in records:
        pmids = record["sourcePaper"]["pmids"]
        dois = record["sourcePaper"]["dois"]
        paper_counts[(pmids[0] if pmids else None, dois[0] if dois else None)] += 1
    return {
        "queryRecordCount": len(records),
        "uniqueNeuronIdCount": len({record["neuronId"] for record in records}),
        "uniqueNeuronNameCount": len({record["normalizedMetadata"]["name"] for record in records}),
        "uniqueArchiveNameKeyCount": len(
            {
                (record["normalizedMetadata"]["archive"], record["normalizedMetadata"]["name"])
                for record in records
            }
        ),
        "admittedGeometryCount": len(admitted),
        "quarantinedGeometryCount": len(quarantined),
        "geometry2DCount": sum(
            record["normalizedMetadata"]["dimensionality"] == "2D" for record in records
        ),
        "geometry3DCount": sum(
            record["normalizedMetadata"]["dimensionality"] == "3D" for record in records
        ),
        "sourceDiameterAvailableCount": sum(
            record["normalizedMetadata"]["sourceDiameterAvailable"] for record in records
        ),
        "sourceDiameterUnavailableCount": sum(
            not record["normalizedMetadata"]["sourceDiameterAvailable"] for record in records
        ),
        "numericAgeReportedCount": sum(
            record["missingness"]["numericAge"]["value"] is not None for record in records
        ),
        "numericAgeMissingCount": sum(
            record["missingness"]["numericAge"]["value"] is None for record in records
        ),
        "registrationCount": 0,
        "type6GeometryCount": sum(
            record["morphometrics"]["computed"]["nodeTypeCounts"].get("6", 0) > 0
            for record in admitted
        ),
        "byArchive": distribution([record["normalizedMetadata"]["archive"] for record in records]),
        "bySecondaryType": distribution(
            [
                (record["normalizedMetadata"]["cellType"] + [None, None])[1]
                for record in records
            ]
        ),
        "byTertiaryType": distribution(
            [
                (record["normalizedMetadata"]["cellType"] + [None, None, None])[2]
                for record in records
            ]
        ),
        "byDomain": distribution([record["normalizedMetadata"]["domain"] for record in records]),
        "byPhysicalIntegrity": distribution(
            [record["normalizedMetadata"]["physicalIntegrity"] for record in records]
        ),
        "byAttributes": distribution(
            [record["normalizedMetadata"]["attributes"] for record in records]
        ),
        "bySourcePaper": [
            {"pmid": pmid, "doi": doi, "count": count}
            for (pmid, doi), count in sorted(
                paper_counts.items(), key=lambda item: (-item[1], str(item[0]))
            )
        ],
        "duplicateRawSwcGroups": duplicate_groups(admitted, "rawSwcSha256"),
        "duplicateCanonicalGeometryGroups": duplicate_groups(
            admitted, "canonicalGeometrySha256"
        ),
        "quarantinedNeuronIds": [record["neuronId"] for record in quarantined],
    }


def validate_official_snapshot(snapshot: dict[str, Any]) -> list[dict[str, Any]]:
    page = snapshot.get("page") or {}
    embedded = snapshot.get("_embedded") or {}
    records = embedded.get("neuronResources")
    if not isinstance(records, list):
        raise SystemExit("Official snapshot lacks _embedded.neuronResources")
    if page.get("totalElements") != EXPECTED_QUERY_TOTAL:
        raise SystemExit(
            f"Expected official query total {EXPECTED_QUERY_TOTAL}, got {page.get('totalElements')}"
        )
    if page.get("number") != 0 or page.get("totalPages") != 1:
        raise SystemExit(f"Official query is not a complete single page: {page}")
    if len(records) != EXPECTED_QUERY_TOTAL:
        raise SystemExit(
            f"Expected {EXPECTED_QUERY_TOTAL} records in snapshot, got {len(records)}"
        )
    ids = [record.get("neuron_id") for record in records]
    if ids != sorted(ids) or len(set(ids)) != len(ids):
        raise SystemExit("Official query records are not unique and sorted by neuron_id")
    if len({record.get("neuron_name") for record in records}) != len(records):
        raise SystemExit("Official query contains duplicate neuron names")
    return records


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=OUTPUT_DIRECTORY)
    parser.add_argument(
        "--source-cache",
        type=Path,
        default=Path("/private/tmp/ohri-neuromorpho-census-v1"),
    )
    parser.add_argument("--refresh-api", action="store_true")
    parser.add_argument("--request-delay", type=float, default=0.10)
    parser.add_argument("--retries", type=int, default=3)
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)
    swc_output = args.output / "swc"
    geometry_output = args.output / "geometry"
    swc_output.mkdir(exist_ok=True)
    geometry_output.mkdir(exist_ok=True)
    cache_swc = args.source_cache / "swc"
    cache_swc.mkdir(parents=True, exist_ok=True)

    cached_snapshot = args.source_cache / "official-query-snapshot.json"
    snapshot_body, _response_date = load_or_fetch_api_snapshot(
        cached_snapshot,
        refresh=args.refresh_api,
        retries=args.retries,
        delay_seconds=args.request_delay,
    )
    try:
        snapshot = json.loads(snapshot_body)
    except json.JSONDecodeError as error:
        raise SystemExit(f"Official snapshot is not valid JSON: {error}") from error
    official_records = validate_official_snapshot(snapshot)
    if sha256_bytes(snapshot_body) != PINNED_SNAPSHOT_SHA256:
        raise SystemExit(
            "Official API response differs from the pinned 2026-08-26 snapshot; "
            "review and version a new census instead of silently rebuilding v1"
        )

    snapshot_path = args.output / "official-query-snapshot.json"
    snapshot_path.write_bytes(snapshot_body)
    generated_records: list[dict[str, Any]] = []

    for index, official in enumerate(official_records):
        neuron_id = int(official["neuron_id"])
        raw_relative_path = f"swc/nmo-{neuron_id}.swc"
        geometry_relative_path = f"geometry/nmo-{neuron_id}.json"
        cache_path = cache_swc / f"nmo-{neuron_id}.swc"
        output_swc_path = swc_output / f"nmo-{neuron_id}.swc"
        output_geometry_path = geometry_output / f"nmo-{neuron_id}.json"
        errors: list[str] = []
        parsed: ParsedSwc | None = None
        raw_sha: str | None = None
        geometry_sha: str | None = None
        geometry_bytes: int | None = None
        body: bytes | None = None

        try:
            if cache_path.exists():
                body = cache_path.read_bytes()
            else:
                if index:
                    time.sleep(args.request_delay)
                body, _ = fetch_bytes(
                    swc_url(official),
                    retries=args.retries,
                    delay_seconds=args.request_delay,
                )
                cache_path.write_bytes(body)
            parsed = parse_swc_bytes(body, f"NeuroMorpho:{neuron_id}")
            if not domain_matches_types(str(official.get("domain") or ""), parsed.node_type_counts):
                raise ValueError("official domain does not agree with SWC node types")
            output_swc_path.write_bytes(body)
            raw_sha = sha256_bytes(body)
            geometry = build_geometry(
                official,
                body,
                parsed,
                raw_relative_path,
                raw_sha,
            )
            geometry_body = json_bytes(geometry)
            output_geometry_path.write_bytes(geometry_body)
            geometry_sha = sha256_bytes(geometry_body)
            geometry_bytes = len(geometry_body)
        except Exception as error:  # quarantine is deliberate and denominator-preserving
            errors.append(f"{type(error).__name__}: {error}")

        available = not errors
        computed = {
            "nodeCount": len(parsed.nodes) if parsed else None,
            "segmentCount": parsed.segment_count if parsed else None,
            "nodeTypeCounts": parsed.node_type_counts if parsed else {},
            "boundsMicrometre": (
                {"min": parsed.bounds_min, "max": parsed.bounds_max} if parsed else None
            ),
            "extentMicrometre": parsed.extent if parsed else None,
            "zeroLengthEdgeCount": parsed.zero_length_edges if parsed else None,
            "totalCableLengthMicrometre": parsed.total_cable_length if parsed else None,
            "rawSwcSha256": raw_sha,
            "canonicalGeometrySha256": parsed.canonical_geometry_sha256 if parsed else None,
            "topologySha256": parsed.topology_sha256 if parsed else None,
            "radiusDerived": (
                {
                    "value": {
                        "minimumMicrometre": parsed.radius_min,
                        "maximumMicrometre": parsed.radius_max,
                        "meanMicrometre": parsed.radius_mean,
                    },
                    "missingReason": None,
                }
                if parsed and source_diameter_available(official)
                else {
                    "value": None,
                    "missingReason": (
                        "official_attributes_report_no_diameter"
                        if parsed
                        else "geometry_quarantined"
                    ),
                }
            ),
        }
        generated_records.append(
            {
                "assetId": f"NeuroMorpho:{neuron_id}",
                "neuronId": neuron_id,
                "officialMetadata": official,
                "normalizedMetadata": normalized_metadata(official),
                "missingness": base_missingness(official),
                "sourcePaper": {
                    "pmids": official.get("reference_pmid") or [],
                    "dois": official.get("reference_doi") or [],
                },
                "geometry": {
                    "available": available,
                    "path": geometry_relative_path if available else None,
                    "sha256": geometry_sha,
                    "bytes": geometry_bytes,
                    "rawSwcPath": raw_relative_path if available else None,
                    "rawSwcSha256": raw_sha,
                    "missingReason": None if available else "failed_direct_file_or_qc_admission",
                },
                "qc": {
                    "status": "passed" if available else "quarantined",
                    "sevenColumns": available,
                    "finite": available,
                    "uniquePositiveNodeIds": available,
                    "singleRoot": available,
                    "parentsPresent": available,
                    "noSelfParent": available,
                    "acyclic": available,
                    "positiveRadius": available,
                    "connected": available,
                    "domainMatchesTypes": available,
                    "type6PreservedUninterpreted": available,
                    "errors": errors,
                },
                "morphometrics": {
                    "sourceReported": {
                        "somaSurface": explicit_measure(
                            official.get("soma_surface"), "square_micrometre"
                        ),
                        "surface": explicit_measure(
                            official.get("surface"), "square_micrometre"
                        ),
                        "volume": explicit_measure(
                            official.get("volume"), "cubic_micrometre"
                        ),
                    },
                    "computed": computed,
                },
            }
        )

    summary = build_summary(generated_records)
    index_payload = {
        "documentType": "neuromorpho_census_index",
        "schemaVersion": SCHEMA_VERSION,
        "assetSetId": ASSET_SET_ID,
        "release": NEUROMORPHO_RELEASE,
        "snapshot": {
            "queryUrl": QUERY_URL,
            "queryTotal": EXPECTED_QUERY_TOTAL,
            "path": snapshot_path.name,
            "sha256": sha256_path(snapshot_path),
            "bytes": snapshot_path.stat().st_size,
            "retrievalEvidence": PINNED_RETRIEVAL_EVIDENCE,
            "completeness": "complete_single_page_sorted_official_api_query",
        },
        "authority": {
            "apiReference": "https://neuromorpho.org/apiReference.html",
            "faq": "https://neuromorpho.org/myfaq.jsp",
            "standardization": "https://neuromorpho.org/StdSwc1.21.jsp",
            "terms": "https://neuromorpho.org/useterm.jsp",
        },
        "rights": {
            "license": "CC BY 4.0 subject to NeuroMorpho.Org Terms of Use",
            "requiredCitations": [
                "Each original paper identified by the record PMID and DOI",
                "NeuroMorpho.Org, RRID:SCR_002145",
                "Tecuatl et al. 2024, doi:10.1096/fba.2024-00048",
            ],
            "programmaticAccess": (
                "Metadata acquired through the official API and standardized SWCs through "
                "documented direct file URLs with an identifying User-Agent; no JSP scraping."
            ),
        },
        "scientificBoundary": {
            "scope": "query_complete_for_pinned_release_not_biologically_complete_census",
            "geometry": "OBS_STANDARDIZED_SOURCE_LOCAL",
            "registrationCount": 0,
            "type6Policy": "preserve_uninterpreted_never_infer_axon_or_dendrite",
            "forbiddenClaims": [
                "atlas placement or cross-source registration",
                "complete axonal projection or connectivity",
                "population frequency or biological completeness",
                "independent animal count",
                "radius-derived claims when official attributes report no diameter",
            ],
        },
        "summary": summary,
        "records": generated_records,
    }
    index_path = args.output / "census-index.json"
    index_path.write_bytes(json_bytes(index_payload, pretty=True))

    quarantine_payload = {
        "schemaVersion": SCHEMA_VERSION,
        "queryRecordCount": summary["queryRecordCount"],
        "admittedGeometryCount": summary["admittedGeometryCount"],
        "quarantinedGeometryCount": summary["quarantinedGeometryCount"],
        "records": [
            {
                "neuronId": record["neuronId"],
                "name": record["normalizedMetadata"]["name"],
                "errors": record["qc"]["errors"],
            }
            for record in generated_records
            if not record["geometry"]["available"]
        ],
    }
    quarantine_path = args.output / "quarantine-report.json"
    quarantine_path.write_bytes(json_bytes(quarantine_payload, pretty=True))

    declared_files = [
        file_declaration(snapshot_path, snapshot_path.name, "official_api_snapshot"),
        file_declaration(index_path, index_path.name, "census_index"),
        file_declaration(quarantine_path, quarantine_path.name, "quarantine_report"),
    ]
    for record in generated_records:
        if not record["geometry"]["available"]:
            continue
        neuron_id = record["neuronId"]
        declared_files.append(
            file_declaration(
                args.output / record["geometry"]["rawSwcPath"],
                record["geometry"]["rawSwcPath"],
                "standardized_swc",
                neuron_id,
            )
        )
        declared_files.append(
            file_declaration(
                args.output / record["geometry"]["path"],
                record["geometry"]["path"],
                "lazy_geometry",
                neuron_id,
            )
        )
    declared_files.sort(key=lambda item: item["path"])
    manifest_path = args.output / "asset-manifest.json"
    manifest_path.write_bytes(
        json_bytes(
            {
                "assetSetId": ASSET_SET_ID,
                "release": NEUROMORPHO_RELEASE,
                "queryRecordCount": summary["queryRecordCount"],
                "admittedGeometryCount": summary["admittedGeometryCount"],
                "quarantinedGeometryCount": summary["quarantinedGeometryCount"],
                "files": declared_files,
            },
            pretty=True,
        )
    )

    print(
        f"NeuroMorpho census: {summary['queryRecordCount']} records; "
        f"{summary['admittedGeometryCount']} admitted geometries; "
        f"{summary['quarantinedGeometryCount']} quarantined"
    )
    print(f"census-index sha256 {sha256_path(index_path)}")
    print(f"asset-manifest sha256 {sha256_path(manifest_path)}")


if __name__ == "__main__":
    main()
