#!/usr/bin/env python3
"""Build lightweight, provenance-linked localhost assets from allen_cord_20um.

The script never assigns spinal segment labels and never registers cells.  It
samples the pinned BrainGlobe reference in its native atlas frame, emits PNG
planes, coarse longitudinal contours, and source-mask-derived major internal
compartments, then records every display transform and scientific-use boundary.
"""

from __future__ import annotations

import argparse
from collections import defaultdict, deque
import csv
import hashlib
import json
import os
import shutil
from pathlib import Path


ATLAS_NAME = "allen_cord_20um"
ATLAS_VERSION = "3.0"
API_VERSION = "3.0.1"
EXPECTED_MANIFEST_SHA256 = (
    "95f305de7b19274908ac5dd24abfa5a0e6544effad1bfdd7d542b177a27cfad1"
)
BASE_Z_INDICES = tuple(range(0, 1520, 49)) + (1566,)
ADDED_SOURCE_STATE_Z_INDICES = (27, 77, 172, 811, 1106)
DEFAULT_Z_INDICES = tuple(sorted((*BASE_Z_INDICES, *ADDED_SOURCE_STATE_Z_INDICES)))
INTERNAL_COMPARTMENT_FILENAME = "atlas-internal-compartments.json"
FINE_ANATOMY_FILENAME = "atlas-fine-anatomy.json"
FINE_ANATOMY_OVERLAY_DIRECTORY = "fine-anatomy-overlays"
REFERENCE_ASSET_ID = "allen_cord_20um:3.0:ohri-sampled-reference-v4"
INTERNAL_COMPARTMENTS_ASSET_ID = "allen_cord_20um:3.0:internal-compartments-v3"
TARGET_INTERNAL_STRUCTURES = (
    {"identifier": 90, "selectionMode": "inclusive_descendants"},
    {"identifier": 100, "selectionMode": "inclusive_descendants"},
    {"identifier": 110, "selectionMode": "inclusive_descendants"},
    {"identifier": 16, "selectionMode": "exact_identifier"},
    {"identifier": 74, "selectionMode": "inclusive_descendants"},
    {"identifier": 75, "selectionMode": "inclusive_descendants"},
    {"identifier": 70, "selectionMode": "inclusive_descendants"},
)
FINE_ANATOMY_STRUCTURES = (
    # Rexed laminae and source-declared laminar subdivisions.
    {"identifier": 1, "category": "lamina"},
    {"identifier": 2, "category": "lamina"},
    {"identifier": 3, "category": "lamina"},
    {"identifier": 4, "category": "lamina"},
    {"identifier": 5, "category": "lamina"},
    {"identifier": 7, "category": "lamina"},
    {"identifier": 8, "category": "lamina"},
    {"identifier": 9, "category": "lamina"},
    {"identifier": 11, "category": "lamina"},
    {"identifier": 12, "category": "lamina"},
    {"identifier": 13, "category": "lamina"},
    {"identifier": 14, "category": "lamina"},
    {"identifier": 18, "category": "lamina"},
    {"identifier": 26, "category": "lamina"},
    # Named nuclei and autonomic/intermediate columns. Source names are retained.
    {"identifier": 6, "category": "nucleus_or_column"},
    {"identifier": 10, "category": "nucleus_or_column"},
    {"identifier": 15, "category": "nucleus_or_column"},
    {"identifier": 17, "category": "nucleus_or_column"},
    {"identifier": 19, "category": "nucleus_or_column"},
    {"identifier": 20, "category": "nucleus_or_column"},
    {"identifier": 21, "category": "nucleus_or_column"},
    {"identifier": 224, "category": "nucleus_or_column"},
    {"identifier": 225, "category": "nucleus_or_column"},
    {"identifier": 226, "category": "nucleus_or_column"},
    {"identifier": 227, "category": "nucleus_or_column"},
    {"identifier": 228, "category": "nucleus_or_column"},
    {"identifier": 23, "category": "nucleus_or_column"},
    {"identifier": 24, "category": "nucleus_or_column"},
    {"identifier": 25, "category": "nucleus_or_column"},
    {"identifier": 67, "category": "nucleus_or_column"},
    {"identifier": 68, "category": "nucleus_or_column"},
    # Individually annotated white-matter tracts; coarse funiculi stay in v1.
    {"identifier": 61, "category": "tract"},
    {"identifier": 62, "category": "tract"},
    {"identifier": 63, "category": "tract"},
    {"identifier": 64, "category": "tract"},
    {"identifier": 66, "category": "tract"},
    {"identifier": 69, "category": "tract"},
)
STRUCTURAL_CONTEXT_STRUCTURES = (
    {"identifier": 16, "category": "structural_context"},
    {"identifier": 65, "category": "structural_context"},
    {"identifier": 70, "category": "structural_context"},
)
MOTOR_CONTEXT_STRUCTURES = tuple(
    {"identifier": identifier, "category": "motor_context"}
    for identifier in range(28, 61)
)
ALL_DIRECT_STRUCTURE_SPECS = (
    *FINE_ANATOMY_STRUCTURES,
    *STRUCTURAL_CONTEXT_STRUCTURES,
    *MOTOR_CONTEXT_STRUCTURES,
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("public/data/allen_cord_20um_v3_0"),
    )
    parser.add_argument(
        "--cache",
        type=Path,
        default=Path("/private/tmp/ohri-brainglobe"),
    )
    parser.add_argument(
        "--z-indices",
        default=",".join(str(value) for value in DEFAULT_Z_INDICES),
        help="Comma-separated native atlas z indices.",
    )
    return parser.parse_args()


def polygon_from_mask(mask, stride: int = 4):
    """Return a compact perimeter as native [x, y] voxel coordinates."""
    import numpy as np

    left: list[list[float]] = []
    right: list[list[float]] = []
    ys = np.flatnonzero(mask.any(axis=1))
    if not len(ys):
        return []
    sampled = list(ys[::stride])
    if sampled[-1] != int(ys[-1]):
        sampled.append(int(ys[-1]))
    for y in sampled:
        xs = np.flatnonzero(mask[y])
        if len(xs):
            left.append([float(xs[0]), float(y)])
            right.append([float(xs[-1]), float(y)])
    return left + list(reversed(right))


def parse_identifier_path(raw_path: str) -> list[int]:
    """Parse the frozen terminology path without silently accepting bad IDs."""
    text = raw_path.strip()
    if not (text.startswith("[") and text.endswith("]")):
        raise ValueError(f"Invalid root_identifier_path: {raw_path!r}")
    values = [part.strip() for part in text[1:-1].split(",") if part.strip()]
    if not values or any(not value.isdigit() for value in values):
        raise ValueError(f"Invalid root_identifier_path: {raw_path!r}")
    return [int(value) for value in values]


def read_terminology_rows(terminology_source: Path) -> list[dict]:
    """Return normalized, source-faithful terminology rows."""
    rows = []
    seen_identifiers: set[int] = set()
    seen_annotation_values: set[int] = set()
    with terminology_source.open(newline="", encoding="utf-8") as stream:
        for raw in csv.DictReader(stream):
            identifier = int(raw["identifier"])
            annotation_value = int(raw["annotation_value"])
            if identifier in seen_identifiers:
                raise ValueError(f"Duplicate terminology identifier {identifier}")
            if annotation_value in seen_annotation_values:
                raise ValueError(
                    f"Duplicate terminology annotation value {annotation_value}"
                )
            seen_identifiers.add(identifier)
            seen_annotation_values.add(annotation_value)
            color = raw["color_hex_triplet"].upper()
            if len(color) != 7 or not color.startswith("#"):
                raise ValueError(f"Invalid color for terminology identifier {identifier}")
            rows.append(
                {
                    "identifier": identifier,
                    "parentIdentifier": (
                        int(raw["parent_identifier"])
                        if raw["parent_identifier"].strip()
                        else None
                    ),
                    "annotationValue": annotation_value,
                    "name": raw["name"],
                    "abbreviation": raw["abbreviation"],
                    "colorHexTriplet": color,
                    "rootIdentifierPath": parse_identifier_path(
                        raw["root_identifier_path"]
                    ),
                }
            )
    return rows


def connected_components_4(mask) -> list[list[tuple[int, int]]]:
    """Extract deterministic row-major 4-connected components as (y, x)."""
    import numpy as np

    if getattr(mask, "ndim", None) != 2:
        raise ValueError("connected_components_4 expects a two-dimensional mask")
    height, width = mask.shape
    visited = np.zeros((height, width), dtype=bool)
    components: list[list[tuple[int, int]]] = []
    for y in range(height):
        for x in range(width):
            if not bool(mask[y, x]) or bool(visited[y, x]):
                continue
            visited[y, x] = True
            queue = deque([(y, x)])
            component: list[tuple[int, int]] = []
            while queue:
                current_y, current_x = queue.popleft()
                component.append((current_y, current_x))
                for next_y, next_x in (
                    (current_y - 1, current_x),
                    (current_y, current_x - 1),
                    (current_y, current_x + 1),
                    (current_y + 1, current_x),
                ):
                    if (
                        0 <= next_y < height
                        and 0 <= next_x < width
                        and bool(mask[next_y, next_x])
                        and not bool(visited[next_y, next_x])
                    ):
                        visited[next_y, next_x] = True
                        queue.append((next_y, next_x))
            component.sort()
            components.append(component)
    return components


def _edge_heading(start: tuple[int, int], end: tuple[int, int]) -> int:
    delta = (end[0] - start[0], end[1] - start[1])
    headings = {(1, 0): 0, (0, 1): 1, (-1, 0): 2, (0, -1): 3}
    if delta not in headings:
        raise ValueError(f"Non-unit raster boundary edge: {start!r} -> {end!r}")
    return headings[delta]


def _canonical_closed_ring(points: list[tuple[int, int]]) -> list[list[int]]:
    if len(points) < 5 or points[0] != points[-1]:
        raise ValueError("Raster boundary ring must be closed and have four edges")
    open_points = points[:-1]
    changed = True
    while changed and len(open_points) > 3:
        changed = False
        simplified: list[tuple[int, int]] = []
        for index, point in enumerate(open_points):
            previous = open_points[index - 1]
            following = open_points[(index + 1) % len(open_points)]
            first_delta = (point[0] - previous[0], point[1] - previous[1])
            next_delta = (following[0] - point[0], following[1] - point[1])
            if first_delta[0] * next_delta[1] == first_delta[1] * next_delta[0]:
                changed = True
                continue
            simplified.append(point)
        open_points = simplified
    if len(open_points) < 4:
        raise ValueError("Raster boundary simplified below four vertices")
    start_index = min(
        range(len(open_points)), key=lambda index: (open_points[index][1], open_points[index][0])
    )
    canonical = open_points[start_index:] + open_points[:start_index]
    canonical.append(canonical[0])
    return [[x, y] for x, y in canonical]


def signed_polygon_area(points: list[list[int]]) -> float:
    return 0.5 * sum(
        left[0] * right[1] - right[0] * left[1]
        for left, right in zip(points, points[1:])
    )


def split_closed_walk_at_repeated_vertices(
    points: list[tuple[int, int]],
) -> list[list[tuple[int, int]]]:
    """Split corner-touching raster walks into simple closed rings."""
    if len(points) < 5 or points[0] != points[-1]:
        raise ValueError("Raster boundary walk must be closed")
    pending = [points]
    simple_rings: list[list[tuple[int, int]]] = []
    while pending:
        ring = pending.pop()
        open_ring = ring[:-1]
        first_index: dict[tuple[int, int], int] = {}
        split = None
        for index, point in enumerate(open_ring):
            if point in first_index:
                split = (first_index[point], index)
                break
            first_index[point] = index
        if split is None:
            simple_rings.append(ring)
            continue
        start, end = split
        extracted = open_ring[start : end + 1]
        remainder_open = open_ring[: start + 1] + open_ring[end + 1 :]
        if len(extracted) < 5 or len(remainder_open) < 4:
            raise ValueError("Repeated raster vertex cannot form two valid closed rings")
        remainder = remainder_open + [remainder_open[0]]
        pending.append(remainder)
        pending.append(extracted)
    return simple_rings


def boundary_polygons_from_component(
    component: list[tuple[int, int]],
) -> list[dict]:
    """Trace exact pixel-edge rings without joining distinct components."""
    pixels = set(component)
    edges: set[tuple[tuple[int, int], tuple[int, int]]] = set()
    for y, x in pixels:
        if (y - 1, x) not in pixels:
            edges.add(((x, y), (x + 1, y)))
        if (y, x + 1) not in pixels:
            edges.add(((x + 1, y), (x + 1, y + 1)))
        if (y + 1, x) not in pixels:
            edges.add(((x + 1, y + 1), (x, y + 1)))
        if (y, x - 1) not in pixels:
            edges.add(((x, y + 1), (x, y)))

    unused = set(edges)
    outgoing: dict[tuple[int, int], list[tuple[int, int]]] = defaultdict(list)
    for start, end in edges:
        outgoing[start].append(end)
    for candidates in outgoing.values():
        candidates.sort(key=lambda point: (point[1], point[0]))

    rings = []
    while unused:
        first_edge = min(
            unused,
            key=lambda edge: (
                edge[0][1],
                edge[0][0],
                edge[1][1],
                edge[1][0],
            ),
        )
        start, current = first_edge
        unused.remove(first_edge)
        ring = [start, current]
        previous = start
        while current != start:
            candidates = [
                endpoint
                for endpoint in outgoing.get(current, [])
                if (current, endpoint) in unused
            ]
            if not candidates:
                raise ValueError(f"Open raster boundary at {current!r}")
            incoming_heading = _edge_heading(previous, current)

            def turn_priority(endpoint: tuple[int, int]):
                outgoing_heading = _edge_heading(current, endpoint)
                turn = (outgoing_heading - incoming_heading) % 4
                return ({1: 0, 0: 1, 3: 2, 2: 3}[turn], endpoint[1], endpoint[0])

            following = min(candidates, key=turn_priority)
            unused.remove((current, following))
            previous, current = current, following
            ring.append(current)
            if len(ring) > len(edges) + 1:
                raise ValueError("Raster boundary tracing exceeded its edge count")
        for simple_ring in split_closed_walk_at_repeated_vertices(ring):
            points = _canonical_closed_ring(simple_ring)
            signed_area = signed_polygon_area(points)
            if signed_area == 0:
                raise ValueError("Raster boundary ring has zero area")
            rings.append(
                {
                    "role": "exterior" if signed_area > 0 else "hole",
                    "signedAreaVoxel2": signed_area,
                    "pointsVoxelEdgeXY": points,
                }
            )
    rings.sort(
        key=lambda ring: (
            ring["role"] != "exterior",
            ring["pointsVoxelEdgeXY"][0][1],
            ring["pointsVoxelEdgeXY"][0][0],
            -abs(ring["signedAreaVoxel2"]),
        )
    )
    return rings


def build_internal_compartments(
    annotation,
    terminology_rows: list[dict],
    z_indices: list[int],
) -> dict:
    """Derive seven source-ID-preserving internal compartment masks."""
    import numpy as np

    terminology_by_id = {row["identifier"]: row for row in terminology_rows}
    target_ids = {spec["identifier"] for spec in TARGET_INTERNAL_STRUCTURES}
    if not target_ids.issubset(terminology_by_id):
        missing = sorted(target_ids - terminology_by_id.keys())
        raise ValueError(f"Terminology is missing target identifiers: {missing}")

    structures = []
    for spec in TARGET_INTERNAL_STRUCTURES:
        identifier = spec["identifier"]
        source_structure = terminology_by_id[identifier]
        if spec["selectionMode"] == "exact_identifier":
            included_rows = [source_structure]
        else:
            included_rows = [
                row for row in terminology_rows if identifier in row["rootIdentifierPath"]
            ]
        included_rows.sort(key=lambda row: (row["identifier"], row["annotationValue"]))
        annotation_values = [row["annotationValue"] for row in included_rows]
        row_by_annotation = {row["annotationValue"]: row for row in included_rows}
        planes = []
        for z_index in z_indices:
            labels = np.asarray(annotation[z_index], dtype=np.int32)
            source_mask = np.isin(labels, annotation_values)
            components = []
            for component_index, pixels in enumerate(
                connected_components_4(source_mask), start=1
            ):
                values = sorted({int(labels[y, x]) for y, x in pixels})
                min_y = min(y for y, _ in pixels)
                max_y = max(y for y, _ in pixels)
                min_x = min(x for _, x in pixels)
                max_x = max(x for _, x in pixels)
                polygons = boundary_polygons_from_component(pixels)
                components.append(
                    {
                        "componentIndex": component_index,
                        "connectivity": 4,
                        "voxelCount": len(pixels),
                        "firstVoxelXY": [pixels[0][1], pixels[0][0]],
                        "boundsVoxelCenterXY": {
                            "min": [min_x, min_y],
                            "max": [max_x, max_y],
                        },
                        "sourceAnnotationValues": values,
                        "sourceIdentifiers": [
                            row_by_annotation[value]["identifier"] for value in values
                        ],
                        "polygons": polygons,
                    }
                )
            plane = {
                "zIndex": z_index,
                "anteriorPosteriorMm": round(z_index * 0.02, 3),
                "segment": {"value": None, "missingReason": "pending_curation"},
                "voxelCount": int(source_mask.sum()),
                "components": components,
            }
            if components:
                plane["presence"] = "present"
            else:
                plane["presence"] = "missing"
                plane["missingReason"] = "source_mask_absent_at_sampled_plane"
            planes.append(plane)
        structures.append(
            {
                "identifier": identifier,
                "annotationValue": source_structure["annotationValue"],
                "parentIdentifier": source_structure["parentIdentifier"],
                "rootIdentifierPath": source_structure["rootIdentifierPath"],
                "name": source_structure["name"],
                "abbreviation": source_structure["abbreviation"],
                "colorHexTriplet": source_structure["colorHexTriplet"],
                "selectionMode": spec["selectionMode"],
                "includedSourceLabels": included_rows,
                "planes": planes,
            }
        )

    return {
        "schemaVersion": "0.1.0",
        "assetId": INTERNAL_COMPARTMENTS_ASSET_ID,
        "sourceAtlasAssetId": REFERENCE_ASSET_ID,
        "atlas": ATLAS_NAME,
        "atlasVersion": ATLAS_VERSION,
        "coordinateSpaceId": "allen_spinal_cord-adult-mouse-space:2021",
        "sourceAnnotation": "allen_spinal_cord-adult-mouse-annotation:2021",
        "units": {
            "zIndex": "native_voxel_index",
            "polygonXY": "native_voxel_edge",
            "anteriorPosterior": "millimetre",
        },
        "geometryStatus": "INF",
        "confidence": {"value": None, "missingReason": "not_measured"},
        "measurementUse": "forbidden",
        "registrationCount": 0,
        "registrationStatus": "not_a_registration",
        "segmentLabelStatus": "not_available_pending_curation",
        "sampledZIndices": z_indices,
        "componentPolicy": {
            "connectivity": 4,
            "componentIndexScope": "plane_local_no_cross_plane_correspondence",
            "disconnectedComponents": "preserved_never_bridged",
            "diagonalContact": "separate_components",
            "minimumVoxelCount": 1,
        },
        "polygonPolicy": {
            "source": "exact_pixel_edges_of_each_connected_source_mask_component",
            "interpolation": "none",
            "manualGeometry": "none",
            "closedRings": True,
            "holesPreserved": True,
        },
        "method": (
            "For each sampled native transverse plane and each declared Allen source "
            "structure, select exact annotation values by frozen terminology identifier "
            "path (or exact identifier for Central Canal), split the binary source mask "
            "with deterministic 4-neighbour connectivity, and trace closed polygons on "
            "the exact pixel edges of every component. No components, bilateral masks, "
            "planes, or source structures are bridged, interpolated, or hand drawn."
        ),
        "structures": structures,
    }


def source_hierarchy_for_structure(
    source_structure: dict, terminology_by_id: dict[int, dict]
) -> list[dict]:
    """Resolve a frozen terminology path without synthesizing hierarchy entries."""
    source_hierarchy = []
    for hierarchy_identifier in source_structure["rootIdentifierPath"]:
        hierarchy_row = terminology_by_id.get(hierarchy_identifier)
        if hierarchy_row is None:
            raise ValueError(
                f"Structure {source_structure['identifier']} has unknown hierarchy "
                f"identifier {hierarchy_identifier}"
            )
        source_hierarchy.append(
            {
                "identifier": hierarchy_row["identifier"],
                "name": hierarchy_row["name"],
                "abbreviation": hierarchy_row["abbreviation"],
            }
        )
    return source_hierarchy


def analyze_annotation_volume(
    annotation,
    terminology_rows: list[dict],
    z_indices: list[int],
    *,
    expected_source_state_count: int | None = None,
) -> dict:
    """Audit direct labels and every empirically distinct native annotation plane."""
    import numpy as np

    terminology_by_value = {
        row["annotationValue"]: row for row in terminology_rows
    }
    parent_identifiers = {
        row["parentIdentifier"]
        for row in terminology_rows
        if row["parentIdentifier"] is not None
    }
    leaf_identifiers = {
        row["identifier"]
        for row in terminology_rows
        if row["identifier"] not in parent_identifiers
    }
    hierarchy_only_identifiers = {
        row["identifier"] for row in terminology_rows
    } - leaf_identifiers

    value_counts: defaultdict[int, int] = defaultdict(int)
    state_hashes: list[str] = []
    for start in range(0, int(annotation.shape[0]), 32):
        block = np.asarray(annotation[start : start + 32], dtype=np.uint32)
        values, counts = np.unique(block, return_counts=True)
        for value, count in zip(values.tolist(), counts.tolist()):
            value_counts[int(value)] += int(count)
        for plane in block:
            canonical = np.asarray(plane, dtype="<u4", order="C")
            state_hashes.append(hashlib.sha256(canonical.tobytes(order="C")).hexdigest())

    unknown_nonzero_values = sorted(
        value for value, count in value_counts.items()
        if value != 0 and count > 0 and value not in terminology_by_value
    )
    if unknown_nonzero_values:
        raise ValueError(
            f"Annotation contains values absent from terminology: {unknown_nonzero_values}"
        )
    direct_identifiers = {
        terminology_by_value[value]["identifier"]
        for value, count in value_counts.items()
        if value != 0 and count > 0
    }
    if direct_identifiers != leaf_identifiers:
        raise ValueError(
            "Pinned annotation nonzero identifiers must exactly equal terminology leaves: "
            f"annotation-only={sorted(direct_identifiers - leaf_identifiers)}, "
            f"leaf-only={sorted(leaf_identifiers - direct_identifiers)}"
        )

    full_volume_counts = {
        row["identifier"]: value_counts.get(row["annotationValue"], 0)
        for row in terminology_rows
    }
    nonzero_hierarchy_ids = sorted(
        identifier
        for identifier in hierarchy_only_identifiers
        if full_volume_counts[identifier] != 0
    )
    if nonzero_hierarchy_ids:
        raise ValueError(
            f"Hierarchy-only terminology identifiers have direct voxels: {nonzero_hierarchy_ids}"
        )

    state_runs = []
    run_start = 0
    for z_index in range(1, len(state_hashes) + 1):
        if z_index < len(state_hashes) and state_hashes[z_index] == state_hashes[run_start]:
            continue
        state_runs.append(
            {
                "stateIndex": len(state_runs) + 1,
                "zStartInclusive": run_start,
                "zEndInclusive": z_index - 1,
                "sha256": state_hashes[run_start],
            }
        )
        run_start = z_index

    distinct_state_hashes = set(state_hashes)
    if len(state_runs) != len(distinct_state_hashes):
        raise ValueError(
            "Pinned source annotation states must each occupy one contiguous z run"
        )
    if (
        expected_source_state_count is not None
        and len(distinct_state_hashes) != expected_source_state_count
    ):
        raise ValueError(
            f"Expected {expected_source_state_count} distinct source annotation states, "
            f"found {len(distinct_state_hashes)}"
        )

    sampled_state_hashes = [state_hashes[z_index] for z_index in z_indices]
    sampled_state_set = set(sampled_state_hashes)
    if sampled_state_set != distinct_state_hashes:
        raise ValueError(
            "Sampled z indices do not cover every exact source annotation state: "
            f"covered={len(sampled_state_set)}, source={len(distinct_state_hashes)}"
        )
    for state_run in state_runs:
        representatives = [
            z_index
            for z_index in z_indices
            if state_run["zStartInclusive"]
            <= z_index
            <= state_run["zEndInclusive"]
        ]
        if not representatives:
            raise ValueError(
                f"Source state {state_run['stateIndex']} has no sampled representative"
            )
        state_run["representativeSampleZIndex"] = representatives[0]

    return {
        "terminologyIdentifierCount": len(terminology_rows),
        "directLeafIdentifiers": sorted(leaf_identifiers),
        "hierarchyOnlyIdentifiers": sorted(hierarchy_only_identifiers),
        "fullVolumeCounts": full_volume_counts,
        "fullVolumeDirectVoxelCount": sum(
            full_volume_counts[identifier] for identifier in leaf_identifiers
        ),
        "stateHashAlgorithm": "sha256_uint32_little_endian_c_order_253x322",
        "sourceStateRuns": state_runs,
        "distinctSourceStateCount": len(distinct_state_hashes),
        "sampledStateHashes": [
            {"zIndex": z_index, "sha256": state_hash}
            for z_index, state_hash in zip(z_indices, sampled_state_hashes)
        ],
    }


def exact_label_planes(
    sampled_labels: dict[int, object],
    z_indices: list[int],
    identifier: int,
    annotation_value: int,
    *,
    include_polygons: bool,
) -> list[dict]:
    """Build deterministic plane records for one exact source annotation value."""
    planes = []
    for z_index in z_indices:
        source_mask = sampled_labels[z_index] == annotation_value
        pixel_components = connected_components_4(source_mask)
        plane = {
            "zIndex": z_index,
            "anteriorPosteriorMm": round(z_index * 0.02, 3),
            "segment": {"value": None, "missingReason": "pending_curation"},
            "voxelCount": int(source_mask.sum()),
        }
        if include_polygons:
            components = []
            for component_index, pixels in enumerate(pixel_components, start=1):
                min_y = min(y for y, _ in pixels)
                max_y = max(y for y, _ in pixels)
                min_x = min(x for _, x in pixels)
                max_x = max(x for _, x in pixels)
                components.append(
                    {
                        "componentIndex": component_index,
                        "connectivity": 4,
                        "voxelCount": len(pixels),
                        "firstVoxelXY": [pixels[0][1], pixels[0][0]],
                        "boundsVoxelCenterXY": {
                            "min": [min_x, min_y],
                            "max": [max_x, max_y],
                        },
                        "sourceAnnotationValues": [annotation_value],
                        "sourceIdentifiers": [identifier],
                        "polygons": boundary_polygons_from_component(pixels),
                    }
                )
            plane["components"] = components
        else:
            plane["componentCount"] = len(pixel_components)
            plane["maskRepresentation"] = "native_rgba_overlay_exact_source_pixels"
        if pixel_components:
            plane["presence"] = "present"
        else:
            plane["presence"] = "missing"
            plane["missingReason"] = "source_mask_absent_at_sampled_plane"
        planes.append(plane)
    return planes


def compact_exact_label_structures(
    specs: tuple[dict, ...],
    terminology_by_id: dict[int, dict],
    sampled_labels: dict[int, object],
    z_indices: list[int],
    full_volume_counts: dict[int, int],
    *,
    mask_lane: str,
) -> list[dict]:
    """Describe exact raster-only context labels without duplicating contour geometry."""
    structures = []
    for spec in specs:
        identifier = spec["identifier"]
        source_structure = terminology_by_id[identifier]
        planes = exact_label_planes(
            sampled_labels,
            z_indices,
            identifier,
            source_structure["annotationValue"],
            include_polygons=False,
        )
        structures.append(
            {
                "identifier": identifier,
                "annotationValue": source_structure["annotationValue"],
                "parentIdentifier": source_structure["parentIdentifier"],
                "rootIdentifierPath": source_structure["rootIdentifierPath"],
                "sourceHierarchy": source_hierarchy_for_structure(
                    source_structure, terminology_by_id
                ),
                "name": source_structure["name"],
                "abbreviation": source_structure["abbreviation"],
                "colorHexTriplet": source_structure["colorHexTriplet"],
                "contextCategory": spec["category"],
                "selectionMode": "exact_identifier",
                "maskLane": mask_lane,
                "fullVolumeDiagnostic": {
                    "voxelCount": full_volume_counts[identifier],
                    "presence": "present",
                    "scientificUse": "source_presence_integrity_check_only_not_measurement",
                },
                "sampledPlaneSummary": {
                    "presentPlaneCount": sum(
                        plane["presence"] == "present" for plane in planes
                    ),
                    "missingPlaneCount": sum(
                        plane["presence"] == "missing" for plane in planes
                    ),
                    "sampledVoxelCount": sum(
                        plane["voxelCount"] for plane in planes
                    ),
                    "componentCount": sum(
                        plane["componentCount"] for plane in planes
                    ),
                },
                "planes": planes,
            }
        )
    return structures


def build_fine_anatomy(
    annotation,
    terminology_rows: list[dict],
    z_indices: list[int],
    *,
    expected_source_state_count: int | None = None,
) -> dict:
    """Extract exact fine labels plus source-complete structural context lanes."""
    import numpy as np

    terminology_by_id = {row["identifier"]: row for row in terminology_rows}
    all_target_ids = {spec["identifier"] for spec in ALL_DIRECT_STRUCTURE_SPECS}
    fine_target_ids = {spec["identifier"] for spec in FINE_ANATOMY_STRUCTURES}
    motor_target_ids = {spec["identifier"] for spec in MOTOR_CONTEXT_STRUCTURES}
    if not all_target_ids.issubset(terminology_by_id):
        missing = sorted(all_target_ids - terminology_by_id.keys())
        raise ValueError(f"Terminology is missing direct source identifiers: {missing}")
    if any(
        120 in terminology_by_id[identifier]["rootIdentifierPath"]
        for identifier in fine_target_ids
    ):
        raise ValueError("Fine-anatomy targets must exclude the motor-neuron subtree")
    if any(
        120 not in terminology_by_id[identifier]["rootIdentifierPath"]
        for identifier in motor_target_ids
    ):
        raise ValueError("Motor-context targets must remain inside source subtree 120")

    volume_audit = analyze_annotation_volume(
        annotation,
        terminology_rows,
        z_indices,
        expected_source_state_count=expected_source_state_count,
    )
    if set(volume_audit["directLeafIdentifiers"]) != all_target_ids:
        raise ValueError(
            "Fine, structural-context, and motor-context lanes must partition all "
            "direct source leaves"
        )
    sampled_labels = {
        z_index: np.asarray(annotation[z_index], dtype=np.int32)
        for z_index in z_indices
    }

    structures = []
    for spec in FINE_ANATOMY_STRUCTURES:
        identifier = spec["identifier"]
        source_structure = terminology_by_id[identifier]
        annotation_value = source_structure["annotationValue"]
        planes = exact_label_planes(
            sampled_labels,
            z_indices,
            identifier,
            annotation_value,
            include_polygons=True,
        )

        present_planes = [plane for plane in planes if plane["presence"] == "present"]
        structures.append(
            {
                "identifier": identifier,
                "annotationValue": annotation_value,
                "parentIdentifier": source_structure["parentIdentifier"],
                "rootIdentifierPath": source_structure["rootIdentifierPath"],
                "sourceHierarchy": source_hierarchy_for_structure(
                    source_structure, terminology_by_id
                ),
                "name": source_structure["name"],
                "abbreviation": source_structure["abbreviation"],
                "colorHexTriplet": source_structure["colorHexTriplet"],
                "browserCategory": spec["category"],
                "selectionMode": "exact_identifier",
                "maskLane": "interneuron_focused_plus_structural_context",
                "fullVolumeDiagnostic": {
                    "voxelCount": volume_audit["fullVolumeCounts"][identifier],
                    "presence": "present",
                    "scientificUse": "source_presence_integrity_check_only_not_measurement",
                },
                "sampledPlaneSummary": {
                    "presentPlaneCount": len(present_planes),
                    "missingPlaneCount": len(planes) - len(present_planes),
                    "sampledVoxelCount": sum(plane["voxelCount"] for plane in planes),
                    "componentCount": sum(
                        len(plane["components"]) for plane in planes
                    ),
                    "polygonCount": sum(
                        len(component["polygons"])
                        for plane in planes
                        for component in plane["components"]
                    ),
                },
                "planes": planes,
            }
        )

    structural_context_structures = compact_exact_label_structures(
        STRUCTURAL_CONTEXT_STRUCTURES,
        terminology_by_id,
        sampled_labels,
        z_indices,
        volume_audit["fullVolumeCounts"],
        mask_lane="interneuron_focused_plus_structural_context",
    )
    motor_context_structures = compact_exact_label_structures(
        MOTOR_CONTEXT_STRUCTURES,
        terminology_by_id,
        sampled_labels,
        z_indices,
        volume_audit["fullVolumeCounts"],
        mask_lane="motor_context",
    )

    category_counts = {
        category: sum(
            structure["browserCategory"] == category for structure in structures
        )
        for category in ("lamina", "nucleus_or_column", "tract")
    }
    missing_plane_count = sum(
        structure["sampledPlaneSummary"]["missingPlaneCount"]
        for structure in structures
    )
    total_components = sum(
        structure["sampledPlaneSummary"]["componentCount"]
        for structure in structures
    )
    total_polygons = sum(
        structure["sampledPlaneSummary"]["polygonCount"]
        for structure in structures
    )
    return {
        "schemaVersion": "0.2.0",
        "assetId": "allen_cord_20um:3.0:fine-anatomy-v2",
        "sourceAtlasAssetId": REFERENCE_ASSET_ID,
        "atlas": ATLAS_NAME,
        "atlasVersion": ATLAS_VERSION,
        "coordinateSpaceId": "allen_spinal_cord-adult-mouse-space:2021",
        "sourceAnnotation": "allen_spinal_cord-adult-mouse-annotation:2021",
        "units": {
            "zIndex": "native_voxel_index",
            "polygonXY": "native_voxel_edge",
            "anteriorPosterior": "millimetre",
        },
        "geometryStatus": "INF",
        "confidence": {"value": None, "missingReason": "not_measured"},
        "measurementUse": "forbidden",
        "registrationCount": 0,
        "registrationStatus": "not_a_registration",
        "segmentLabelStatus": "not_available_pending_curation",
        "sampledZIndices": z_indices,
        "browserCategoryAuthority": "project_navigation_only_source_identity_preserved",
        "sourceInventory": {
            "terminologyIdentifierCount": volume_audit[
                "terminologyIdentifierCount"
            ],
            "directLeafCount": len(volume_audit["directLeafIdentifiers"]),
            "directLeafIdentifiers": volume_audit["directLeafIdentifiers"],
            "annotationNonzeroIdentifiers": volume_audit[
                "directLeafIdentifiers"
            ],
            "directLeafEqualityValidated": True,
            "hierarchyOnlyCount": len(
                volume_audit["hierarchyOnlyIdentifiers"]
            ),
            "hierarchyOnlyIdentifiers": volume_audit[
                "hierarchyOnlyIdentifiers"
            ],
            "hierarchyOnlyDirectVoxelCount": 0,
            "fullVolumeDirectVoxelCount": volume_audit[
                "fullVolumeDirectVoxelCount"
            ],
        },
        "sourceStateCoverage": {
            "hashAlgorithm": volume_audit["stateHashAlgorithm"],
            "distinctSourceStateCount": volume_audit[
                "distinctSourceStateCount"
            ],
            "contiguousSourceStateRunCount": len(
                volume_audit["sourceStateRuns"]
            ),
            "sourceStateRuns": volume_audit["sourceStateRuns"],
            "sampledStateHashes": volume_audit["sampledStateHashes"],
            "coveredDistinctStateCount": len(
                {entry["sha256"] for entry in volume_audit["sampledStateHashes"]}
            ),
            "allSourceStatesCovered": True,
            "addedRepresentativeZIndices": list(
                ADDED_SOURCE_STATE_Z_INDICES
            ),
            "interpretation": (
                "empirical_exact_annotation_array_states_not_named_spinal_segments"
            ),
        },
        "lanePolicy": {
            "interneuronFocusedStructureCount": len(structures),
            "interneuronFocusedStructureIdentifiers": [
                structure["identifier"] for structure in structures
            ],
            "structuralContextStructureCount": len(
                structural_context_structures
            ),
            "structuralContextStructureIdentifiers": [
                structure["identifier"]
                for structure in structural_context_structures
            ],
            "motorContextStructureCount": len(motor_context_structures),
            "motorContextStructureIdentifiers": [
                structure["identifier"] for structure in motor_context_structures
            ],
            "allDirectStructureCount": (
                len(structures)
                + len(structural_context_structures)
                + len(motor_context_structures)
            ),
            "motorContextDefaultVisibility": "off",
            "atlasRegionCountsAreInterneuronCounts": False,
            "motorContextIncludedInInterneuronCounts": False,
        },
        "targetPolicy": {
            "selectionMode": "exact_identifier_only",
            "descendantExpansion": "none",
            "motorNeuronSubtreeIdentifier": 120,
            "motorNeuronSubtreePolicy": "separate_motor_context_off_by_default",
            "coarseParentStructures": "remain_in_internal_compartments_v3",
        },
        "componentPolicy": {
            "connectivity": 4,
            "componentIndexScope": "plane_local_no_cross_plane_correspondence",
            "disconnectedComponents": "preserved_never_bridged",
            "diagonalContact": "separate_components",
            "minimumVoxelCount": 1,
        },
        "polygonPolicy": {
            "source": "exact_pixel_edges_of_each_connected_exact_label_component",
            "interpolation": "none",
            "manualGeometry": "none",
            "closedRings": True,
            "holesPreserved": True,
        },
        "fillOverlayPolicy": {
            "format": "PNG",
            "colorModel": "RGBA",
            "nativeWidth": 322,
            "nativeHeight": 253,
            "sourcePixelMapping": "one_output_pixel_per_source_annotation_voxel",
            "generationResampling": "none",
            "displayResamplingRequired": "nearest",
            "transparentBackgroundRgba": [0, 0, 0, 0],
            "sourceLabelAlpha": 255,
            "sourceColorsPreserved": True,
            "sourceColorsUniquePerIdentifier": False,
            "colorIdentityAuthority": (
                "source_identifier_metadata_not_display_color"
            ),
            "holesAndDisconnectedComponents": "preserved_by_exact_native_raster",
            "lanes": [],
        },
        "samplingSummary": {
            "structureCount": len(structures),
            "structuralContextStructureCount": len(
                structural_context_structures
            ),
            "motorContextStructureCount": len(motor_context_structures),
            "allDirectStructureCount": len(volume_audit["directLeafIdentifiers"]),
            "categoryCounts": category_counts,
            "planeRecordCount": len(structures) * len(z_indices),
            "missingPlaneRecordCount": missing_plane_count,
            "componentCount": total_components,
            "polygonCount": total_polygons,
            "fullyUnsampledStructureIdentifiers": [
                structure["identifier"]
                for structure in structures
                if structure["sampledPlaneSummary"]["presentPlaneCount"] == 0
            ],
        },
        "method": (
            "For each declared fine-anatomy target, select only its exact pinned Allen "
            "annotation value on each sampled native transverse plane, split the mask "
            "with deterministic 4-neighbour connectivity, and trace the exact pixel-edge "
            "rings of every component. Full-volume voxel counts are retained only to "
            "distinguish sampled-plane absence from source-label absence. No descendants, "
            "components, planes, or structures are joined, interpolated, smoothed, or hand "
            "drawn. Native-resolution RGBA overlays separately preserve the exact source "
            "pixels for the 37-label fine lane plus IDs 16/65/70 and for the off-by-default "
            "motor-context IDs 28-60."
        ),
        "structures": structures,
        "structuralContextStructures": structural_context_structures,
        "motorContextStructures": motor_context_structures,
    }


def write_fine_anatomy_fill_overlays(
    annotation,
    terminology_rows: list[dict],
    z_indices: list[int],
    output_directory: Path,
) -> tuple[list[dict], list[dict]]:
    """Write exact one-source-voxel-per-pixel RGBA overlays for two context lanes."""
    import numpy as np
    from PIL import Image

    terminology_by_id = {row["identifier"]: row for row in terminology_rows}
    overlay_directory = output_directory / FINE_ANATOMY_OVERLAY_DIRECTORY
    overlay_directory.mkdir(parents=True, exist_ok=True)
    lane_specs = (
        {
            "laneId": "interneuron_focused_plus_structural_context",
            "defaultVisibility": "on",
            "includedInInterneuronCounts": False,
            "identifiers": [
                *[spec["identifier"] for spec in FINE_ANATOMY_STRUCTURES],
                *[spec["identifier"] for spec in STRUCTURAL_CONTEXT_STRUCTURES],
            ],
            "filenamePrefix": "fine-context",
        },
        {
            "laneId": "motor_context",
            "defaultVisibility": "off",
            "includedInInterneuronCounts": False,
            "identifiers": [spec["identifier"] for spec in MOTOR_CONTEXT_STRUCTURES],
            "filenamePrefix": "motor-context",
        },
    )

    lanes = []
    file_declarations = []
    for lane_spec in lane_specs:
        overlay_records = []
        lane_identifiers = lane_spec["identifiers"]
        identifiers_by_color: defaultdict[str, list[int]] = defaultdict(list)
        for identifier in lane_identifiers:
            identifiers_by_color[
                terminology_by_id[identifier]["colorHexTriplet"]
            ].append(identifier)
        for z_index in z_indices:
            labels = np.asarray(annotation[z_index], dtype=np.int32)
            rgba = np.zeros((*labels.shape, 4), dtype=np.uint8)
            identifiers_present = []
            opaque_voxel_count = 0
            for identifier in lane_identifiers:
                source_structure = terminology_by_id[identifier]
                source_mask = labels == source_structure["annotationValue"]
                source_voxel_count = int(source_mask.sum())
                if not source_voxel_count:
                    continue
                identifiers_present.append(identifier)
                opaque_voxel_count += source_voxel_count
                color = source_structure["colorHexTriplet"].lstrip("#")
                rgba[source_mask, :3] = tuple(
                    int(color[offset : offset + 2], 16)
                    for offset in (0, 2, 4)
                )
                rgba[source_mask, 3] = 255

            filename = f"{lane_spec['filenamePrefix']}-z{z_index:04d}.png"
            relative_path = f"{FINE_ANATOMY_OVERLAY_DIRECTORY}/{filename}"
            output_path = overlay_directory / filename
            Image.fromarray(rgba).save(
                output_path,
                format="PNG",
                optimize=False,
                compress_level=9,
            )
            record = {
                "path": relative_path,
                "sha256": sha256(output_path),
                "bytes": output_path.stat().st_size,
                "zIndex": z_index,
                "anteriorPosteriorMm": round(z_index * 0.02, 3),
                "opaqueVoxelCount": opaque_voxel_count,
                "sourceIdentifiersPresent": identifiers_present,
            }
            overlay_records.append(record)
            file_declarations.append(
                {
                    **record,
                    "assetRole": "fine_anatomy_fill_overlay",
                    "laneId": lane_spec["laneId"],
                    "width": int(labels.shape[1]),
                    "height": int(labels.shape[0]),
                    "colorModel": "RGBA",
                }
            )
        lanes.append(
            {
                "laneId": lane_spec["laneId"],
                "defaultVisibility": lane_spec["defaultVisibility"],
                "includedInInterneuronCounts": lane_spec[
                    "includedInInterneuronCounts"
                ],
                "sourceIdentifiers": lane_identifiers,
                "sourceColorCollisionGroups": [
                    {"colorHexTriplet": color, "sourceIdentifiers": identifiers}
                    for color, identifiers in sorted(identifiers_by_color.items())
                    if len(identifiers) > 1
                ],
                "overlayCount": len(overlay_records),
                "overlays": overlay_records,
            }
        )
    return lanes, file_declarations


def main() -> None:
    args = parse_args()
    z_indices = [int(value) for value in args.z_indices.split(",") if value]
    if not z_indices or min(z_indices) < 0 or max(z_indices) >= 1567:
        raise SystemExit("z-indices must fall within [0, 1566]")
    if z_indices != sorted(set(z_indices)):
        raise SystemExit("z-indices must be unique and strictly increasing")

    args.output.mkdir(parents=True, exist_ok=True)
    args.cache.mkdir(parents=True, exist_ok=True)
    os.environ.setdefault("BRAINGLOBE_CONFIG_DIR", "/private/tmp/ohri-bg-config")
    os.environ.setdefault("XDG_CACHE_HOME", "/private/tmp/ohri-atlas-cache")

    import numpy as np
    from PIL import Image
    from brainglobe_atlasapi import BrainGlobeAtlas

    atlas = BrainGlobeAtlas(
        ATLAS_NAME,
        version=ATLAS_VERSION,
        brainglobe_dir=args.cache,
        check_latest=False,
    )
    template = atlas.template
    annotation = atlas.annotation
    if tuple(template.shape) != (1567, 253, 322):
        raise SystemExit(f"Unexpected atlas shape: {template.shape}")
    if tuple(float(value) for value in atlas.resolution) != (20.0, 10.0, 10.0):
        raise SystemExit(f"Unexpected atlas resolution: {atlas.resolution}")
    if atlas.orientation != "asr":
        raise SystemExit(f"Unexpected atlas orientation: {atlas.orientation}")

    api_root = args.cache / "brainglobe-atlasapi"
    manifest_source = api_root / "atlases" / ATLAS_NAME / "3_0" / "manifest.json"
    terminology_source = (
        api_root
        / "terminologies"
        / "allen_spinal_cord-adult-mouse-terminology"
        / "2021"
        / "terminology.csv"
    )
    actual_manifest_sha = sha256(manifest_source)
    if actual_manifest_sha != EXPECTED_MANIFEST_SHA256:
        raise SystemExit(
            "Atlas manifest hash mismatch: "
            f"expected {EXPECTED_MANIFEST_SHA256}, got {actual_manifest_sha}"
        )

    terminology_rows = read_terminology_rows(terminology_source)
    color_by_value: dict[int, tuple[int, int, int]] = {}
    gray_values: set[int] = set()
    for row in terminology_rows:
        value = row["annotationValue"]
        hex_color = row["colorHexTriplet"].lstrip("#")
        color_by_value[value] = tuple(
            int(hex_color[offset : offset + 2], 16) for offset in (0, 2, 4)
        )
        if 71 in row["rootIdentifierPath"]:
            gray_values.add(value)

    contours = []
    files = []
    for z_index in z_indices:
        plane = np.asarray(template[z_index], dtype=np.float32)
        labels = np.asarray(annotation[z_index], dtype=np.int32)
        nonzero = plane[plane > 0]
        low, high = (
            np.percentile(nonzero, [1, 99.5]) if nonzero.size else (0.0, 1.0)
        )
        scaled = np.clip((plane - low) / max(high - low, 1.0), 0, 1)
        gray = np.asarray((1.0 - scaled) * 255, dtype=np.uint8)
        rgb = np.repeat(gray[:, :, None], 3, axis=2)

        label_rgb = np.zeros_like(rgb)
        for value in np.unique(labels):
            if value:
                label_rgb[labels == value] = color_by_value.get(
                    int(value), (188, 188, 188)
                )
        neighbors_equal = (
            (labels == np.roll(labels, 1, axis=0))
            & (labels == np.roll(labels, -1, axis=0))
            & (labels == np.roll(labels, 1, axis=1))
            & (labels == np.roll(labels, -1, axis=1))
        )
        boundaries = (labels > 0) & ~neighbors_equal
        composite = np.asarray(rgb * 0.72 + label_rgb * 0.28, dtype=np.uint8)
        composite[boundaries] = (247, 185, 66)

        filename = f"slice-z{z_index:04d}.png"
        output_path = args.output / filename
        Image.fromarray(composite).resize(
            (644, 506), Image.Resampling.NEAREST
        ).save(output_path, optimize=True)
        files.append(
            {
                "path": filename,
                "sha256": sha256(output_path),
                "bytes": output_path.stat().st_size,
                "assetRole": "reference_slice",
                "zIndex": z_index,
                "anteriorPosteriorMm": round(z_index * 0.02, 3),
            }
        )

        gray_mask = np.isin(labels, tuple(gray_values))
        contours.append(
            {
                "zIndex": z_index,
                "anteriorPosteriorMm": round(z_index * 0.02, 3),
                "segment": {"value": None, "missingReason": "pending_curation"},
                "outerContourVoxelXY": polygon_from_mask(labels > 0),
                "grayMatterContourVoxelXY": polygon_from_mask(gray_mask),
            }
        )

    contours_path = args.output / "atlas-contours.json"
    contours_path.write_text(
        json.dumps(
            {
                "coordinateSpaceId": "allen_spinal_cord-adult-mouse-space:2021",
                "units": "voxel_index",
                "geometryStatus": "INF",
                "inputs": [
                    "allen_spinal_cord-adult-mouse-annotation:2021",
                    "allen_spinal_cord-adult-mouse-nissl-template:2021",
                ],
                "method": (
                    "Sampled native transverse planes; annotation>0 and Gray Matter "
                    "descendants converted to row-wise perimeter polygons at 4-voxel stride."
                ),
                "confidence": {"value": None, "missingReason": "not_measured"},
                "measurementUse": "forbidden",
                "planes": contours,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    files.append(
        {
            "path": contours_path.name,
            "sha256": sha256(contours_path),
            "bytes": contours_path.stat().st_size,
        }
    )

    internal_compartments_path = args.output / INTERNAL_COMPARTMENT_FILENAME
    internal_compartments_path.write_text(
        json.dumps(
            build_internal_compartments(annotation, terminology_rows, z_indices),
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    files.append(
        {
            "path": internal_compartments_path.name,
            "sha256": sha256(internal_compartments_path),
            "bytes": internal_compartments_path.stat().st_size,
            "geometryStatus": "INF",
            "measurementUse": "forbidden",
            "registrationCount": 0,
            "targetStructureIdentifiers": [
                spec["identifier"] for spec in TARGET_INTERNAL_STRUCTURES
            ],
        }
    )

    fine_anatomy_path = args.output / FINE_ANATOMY_FILENAME
    fine_anatomy = build_fine_anatomy(
        annotation,
        terminology_rows,
        z_indices,
        expected_source_state_count=32,
    )
    overlay_lanes, overlay_files = write_fine_anatomy_fill_overlays(
        annotation,
        terminology_rows,
        z_indices,
        args.output,
    )
    fine_anatomy["fillOverlayPolicy"]["lanes"] = overlay_lanes
    files.extend(overlay_files)
    fine_anatomy_path.write_text(
        json.dumps(fine_anatomy, indent=2) + "\n",
        encoding="utf-8",
    )
    files.append(
        {
            "path": fine_anatomy_path.name,
            "sha256": sha256(fine_anatomy_path),
            "bytes": fine_anatomy_path.stat().st_size,
            "geometryStatus": "INF",
            "measurementUse": "forbidden",
            "registrationCount": 0,
            "targetStructureIdentifiers": [
                spec["identifier"] for spec in FINE_ANATOMY_STRUCTURES
            ],
            "structuralContextStructureIdentifiers": [
                spec["identifier"] for spec in STRUCTURAL_CONTEXT_STRUCTURES
            ],
            "motorContextStructureIdentifiers": [
                spec["identifier"] for spec in MOTOR_CONTEXT_STRUCTURES
            ],
            "motorContextDefaultVisibility": "off",
        }
    )

    shutil.copy2(manifest_source, args.output / "source-atlas-manifest.json")
    shutil.copy2(terminology_source, args.output / "terminology.csv")
    for copied in ("source-atlas-manifest.json", "terminology.csv"):
        copied_path = args.output / copied
        files.append(
            {
                "path": copied,
                "sha256": sha256(copied_path),
                "bytes": copied_path.stat().st_size,
            }
        )

    asset_manifest = {
        "assetId": REFERENCE_ASSET_ID,
        "assetKind": "derived_atlas_reference",
        "atlas": ATLAS_NAME,
        "atlasVersion": ATLAS_VERSION,
        "atlasApiVersion": API_VERSION,
        "species": "Mus musculus",
        "lifeStage": "adult",
        "shapeZyx": [1567, 253, 322],
        "resolutionUmZyx": [20, 10, 10],
        "orientation": "asr",
        "axes": [
            {"arrayAxis": "z", "direction": "anterior_to_posterior"},
            {"arrayAxis": "y", "direction": "superior_to_inferior"},
            {"arrayAxis": "x", "direction": "right_to_left"},
        ],
        "coordinateSpaceId": "allen_spinal_cord-adult-mouse-space:2021",
        "componentVersions": {
            "coordinateSpace": "2021",
            "template": "2021",
            "annotation": "2021",
            "terminology": "2021",
        },
        "geometryStatus": "INF",
        "statusRationale": (
            "Published reference atlas data are assembled from representative sections "
            "and longitudinal interpolation; this derivative further samples planes and contours."
        ),
        "sourceManifestSha256": actual_manifest_sha,
        "sourceManifestEtag": "b372800d773e593592c08a39418a9782",
        "sourceUrls": [
            "https://brainglobe.s3.amazonaws.com/atlas/atlases/allen_cord_20um/3_0/manifest.json",
            "https://data.mendeley.com/datasets/4rrggzv5d5/1",
        ],
        "citation": (
            "Fiederling et al. 2021; doi:10.1016/j.crmeth.2021.100074; "
            "dataset doi:10.17632/4rrggzv5d5.1; BrainGlobe Atlas API."
        ),
        "license": "CC BY 4.0 original dataset; BrainGlobe AWS distribution CC0",
        "nativeVoxelToMmMatrix": [
            [0.0, 0.0, 0.01, -1.605],
            [0.0, -0.01, 0.0, 1.26],
            [0.02, 0.0, 0.0, 0.0],
            [0.0, 0.0, 0.0, 1.0],
        ],
        "nativeMmToDisplayMatrix": [
            [1.0, 0.0, 0.0, 0.0],
            [0.0, 1.0, 0.0, 0.0],
            [0.0, 0.0, -1.277139, 20.0],
            [0.0, 0.0, 0.0, 1.0],
        ],
        "displayTransformUse": "visualization_only_not_cell_registration",
        "registrationError": {"value": None, "missingReason": "not_applicable"},
        "sampledZIndices": z_indices,
        "derivedInternalCompartments": {
            "path": INTERNAL_COMPARTMENT_FILENAME,
            "geometryStatus": "INF",
            "measurementUse": "forbidden",
            "registrationCount": 0,
            "targetStructureIdentifiers": [
                spec["identifier"] for spec in TARGET_INTERNAL_STRUCTURES
            ],
            "componentConnectivity": 4,
            "disconnectedComponents": "preserved_never_bridged",
        },
        "derivedFineAnatomy": {
            "path": FINE_ANATOMY_FILENAME,
            "assetId": fine_anatomy["assetId"],
            "geometryStatus": "INF",
            "measurementUse": "forbidden",
            "registrationCount": 0,
            "structureCount": fine_anatomy["samplingSummary"]["structureCount"],
            "structuralContextStructureCount": fine_anatomy["samplingSummary"][
                "structuralContextStructureCount"
            ],
            "motorContextStructureCount": fine_anatomy["samplingSummary"][
                "motorContextStructureCount"
            ],
            "allDirectStructureCount": fine_anatomy["samplingSummary"][
                "allDirectStructureCount"
            ],
            "categoryCounts": fine_anatomy["samplingSummary"]["categoryCounts"],
            "selectionMode": "exact_identifier_only",
            "componentConnectivity": 4,
            "disconnectedComponents": "preserved_never_bridged",
            "nativeFillOverlayCount": sum(
                lane["overlayCount"]
                for lane in fine_anatomy["fillOverlayPolicy"]["lanes"]
            ),
            "motorContextDefaultVisibility": "off",
            "motorContextIncludedInInterneuronCounts": False,
        },
        "generator": "tools/build_atlas_reference.py@4",
        "files": files,
    }
    manifest_path = args.output / "asset-manifest.json"
    manifest_path.write_text(
        json.dumps(asset_manifest, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Wrote {len(files)} assets to {args.output}")
    print(f"asset-manifest sha256 {sha256(manifest_path)}")


if __name__ == "__main__":
    main()
