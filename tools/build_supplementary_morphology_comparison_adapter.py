#!/usr/bin/env python3
"""Build the seven-record supplementary morphology comparison adapter.

The adapter is a delta over the immutable 142-record adult-mouse spinal
interneuron census.  It exposes seven independently sourced NeuroMorpho route
objects without adding them to that census, copying their geometry, aligning
their local coordinate frames, or promoting source labels into biological
identity.  Per-record morphology metrics are computed with the exact algorithm
used by ``build_neuromorpho_analysis.py``; no cross-record cohort statistic is
admitted because the routes do not share a registered frame, preparation, or
independent-animal denominator.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import math
from pathlib import Path
from typing import Any

import build_neuromorpho_analysis as morphology_analysis


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BUILDER_PATH = PROJECT_ROOT / "tools/build_supplementary_morphology_comparison_adapter.py"
BUILDER_REPOSITORY_PATH = "tools/build_supplementary_morphology_comparison_adapter.py"
BUILDER_VERSION = "0.1.0"
ANALYSIS_ALGORITHM_PATH = PROJECT_ROOT / "tools/build_neuromorpho_analysis.py"
ANALYSIS_ALGORITHM_REPOSITORY_PATH = "tools/build_neuromorpho_analysis.py"
ANALYSIS_ALGORITHM_VERSION = "1.0.0"
ANALYSIS_ALGORITHM_SHA256 = "10813a83b8c42f6478186bbd752571f5db62391283966b073b08516c9d95a132"

CONTRACT_PATH = PROJECT_ROOT / "data/supplementary-morphology-comparison-adapter-0.1.json"
OUTPUT_DIRECTORY = PROJECT_ROOT / "public/data/supplementary_morphology_comparison_v1"
ANALYSIS_PATH = OUTPUT_DIRECTORY / "analysis-delta.json"
ASSET_MANIFEST_PATH = OUTPUT_DIRECTORY / "asset-manifest.json"

SCHEMA_VERSION = "0.1.0"
RELEASE_ID = "ohri-supplementary-morphology-comparison-adapter-0.1.0"
ADAPTER_ID = "supplementary-morphology-comparison-adapter-0.1"
ASSET_SET_ID = "ohri:supplementary-morphology-comparison-v1"
RELEASED_AT = "2026-08-31"
FROZEN_CENSUS_RECORD_COUNT = 142
SUPPLEMENTARY_NEURON_IDS = (45674, 45718, 50394, 50408, 50424, 170035, 249676)
VIEWABLE_SOURCE_OBJECT_COUNT = 149

CENSUS_SOURCE = {
    "assetSetId": "neuromorpho:8.6.124:adult-mouse-spinal-interneuron-census-v1",
    "censusIndexPath": "public/data/neuromorpho_release_8_6_124_census_v1/census-index.json",
    "censusIndexSha256": "1598b5119f5826719e390fe46615a291b51fa3cd7716e9a191ad645f73165364",
    "censusIndexBytes": 968797,
    "assetManifestPath": "public/data/neuromorpho_release_8_6_124_census_v1/asset-manifest.json",
    "assetManifestSha256": "2c1153fe86e3bc2f08505cf2416ab25b2d8e9ca747b0bffcfad5aacc9286cf91",
    "assetManifestBytes": 62165,
}

ROUTE_SOURCES = (
    {
        "contractId": "functional-class-observed-morphology-route-pack-0.1",
        "contractPath": "data/functional-class-observed-morphology-route-pack-0.1.json",
        "contractSha256": "400b17afd707c3b53ee0cbb1d6402943535111c01402eb3903b256d12e176840",
        "contractBytes": 28937,
        "assetManifestPath": "public/data/functional_class_observed_morphology_route_pack_v1/asset-manifest.json",
        "assetManifestSha256": "a44d7b109357d086d0d7bc27481ee76bdcfe7382e804f74aeb08195b47878f5f",
        "assetManifestBytes": 2768,
        "supplementaryNeuronIds": (45674, 50424),
    },
    {
        "contractId": "premotor-comparison-observed-morphology-route-pack-0.1",
        "contractPath": "data/premotor-comparison-observed-morphology-route-pack-0.1.json",
        "contractSha256": "39afe0acc449c367cd48776b150058982c8d57186ea9adbeb9314b08d62b2cb3",
        "contractBytes": 19112,
        "assetManifestPath": "public/data/premotor_comparison_observed_morphology_route_pack_v1/asset-manifest.json",
        "assetManifestSha256": "0220169ea294d8db086a228557b0b067fd057249e41f7187cf2a14ee924a33d8",
        "assetManifestBytes": 1647,
        "supplementaryNeuronIds": (45718,),
    },
    {
        "contractId": "prp-dorsal-horn-observed-morphology-route-pack-0.1",
        "contractPath": "data/prp-dorsal-horn-observed-morphology-route-pack-0.1.json",
        "contractSha256": "a8737dff3fbfe244d36e2af19b32e1dd8142e2626a90c0d89c00881b83eaf709",
        "contractBytes": 31435,
        "assetManifestPath": "public/data/prp_dorsal_horn_observed_morphology_route_pack_v1/asset-manifest.json",
        "assetManifestSha256": "2f17597f67532debfa79828a6313887fb362e9cdc4baba9d3015d94129c5ef8f",
        "assetManifestBytes": 2766,
        "supplementaryNeuronIds": (50394, 50408),
    },
    {
        "contractId": "dorsal-horn-observed-morphology-route-pack-0.1",
        "contractPath": "data/dorsal-horn-observed-morphology-route-pack-0.1.json",
        "contractSha256": "923db6a9ed013e856ffc7c6ab601c67b25608ac68572538c578fd75fa41fe593",
        "contractBytes": 42226,
        "assetManifestPath": "public/data/dorsal_horn_observed_morphology_route_pack_v1/asset-manifest.json",
        "assetManifestSha256": "4f64fb595a4362cf0403cb0d3abc3c6fdc14b7f74d473a82ccd67bed9b9dab87",
        "assetManifestBytes": 1696,
        "supplementaryNeuronIds": (170035, 249676),
    },
)


def fail(message: str) -> None:
    raise ValueError(message)


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_path(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def json_bytes(value: Any) -> bytes:
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


def load_json_bytes(value: bytes, label: str) -> dict[str, Any]:
    try:
        result = json.loads(value.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        fail(f"{label}: invalid UTF-8 JSON: {error}")
    require(isinstance(result, dict), f"{label}: expected a JSON object")
    return result


def load_pinned_json(
    repository_path: str,
    expected_bytes: int,
    expected_sha256: str,
    label: str,
) -> tuple[dict[str, Any], bytes]:
    path = PROJECT_ROOT / repository_path
    require(path.is_file(), f"{label}: missing {repository_path}")
    value = path.read_bytes()
    require(len(value) == expected_bytes, f"{label}: byte count drifted")
    require(sha256_bytes(value) == expected_sha256, f"{label}: SHA-256 drifted")
    return load_json_bytes(value, label), value


def public_receipt_path(receipt_path: str) -> Path:
    require(receipt_path.startswith("/data/"), f"unsupported public receipt path: {receipt_path}")
    path = (PROJECT_ROOT / "public/data" / receipt_path.removeprefix("/data/")).resolve()
    public_root = (PROJECT_ROOT / "public/data").resolve()
    try:
        path.relative_to(public_root)
    except ValueError:
        fail(f"public receipt escapes data root: {receipt_path}")
    return path


def verify_file_receipt(path: Path, receipt: dict[str, Any], label: str) -> None:
    require(path.is_file(), f"{label}: file is missing")
    declared_bytes = receipt.get("bytes")
    declared_sha256 = receipt.get("sha256")
    require(isinstance(declared_bytes, int) and declared_bytes > 0, f"{label}: invalid bytes")
    require(isinstance(declared_sha256, str), f"{label}: invalid SHA-256")
    require(path.stat().st_size == declared_bytes, f"{label}: byte count drifted")
    require(sha256_path(path) == declared_sha256, f"{label}: SHA-256 drifted")


def validate_census() -> dict[str, Any]:
    census, _ = load_pinned_json(
        CENSUS_SOURCE["censusIndexPath"],
        CENSUS_SOURCE["censusIndexBytes"],
        CENSUS_SOURCE["censusIndexSha256"],
        "frozen census index",
    )
    manifest, _ = load_pinned_json(
        CENSUS_SOURCE["assetManifestPath"],
        CENSUS_SOURCE["assetManifestBytes"],
        CENSUS_SOURCE["assetManifestSha256"],
        "frozen census asset manifest",
    )
    records = census.get("records")
    require(isinstance(records, list), "frozen census records must be an array")
    ids = [record.get("neuronId") for record in records if isinstance(record, dict)]
    require(len(records) == FROZEN_CENSUS_RECORD_COUNT, "frozen census record count drifted")
    require(len(ids) == FROZEN_CENSUS_RECORD_COUNT, "frozen census contains a non-object record")
    require(len(ids) == len(set(ids)), "frozen census contains duplicate neuron IDs")
    require(ids == sorted(ids), "frozen census records are not sorted by neuron ID")
    require(not set(ids).intersection(SUPPLEMENTARY_NEURON_IDS), "supplementary IDs entered the frozen census")
    summary = census.get("summary", {})
    for key in ("queryRecordCount", "uniqueNeuronIdCount", "admittedGeometryCount"):
        require(summary.get(key) == FROZEN_CENSUS_RECORD_COUNT, f"frozen census {key} drifted")
    require(summary.get("quarantinedGeometryCount") == 0, "frozen census contains quarantined geometry")
    require(manifest.get("assetSetId") == CENSUS_SOURCE["assetSetId"], "census manifest assetSetId drifted")
    require(manifest.get("queryRecordCount") == FROZEN_CENSUS_RECORD_COUNT, "census manifest query count drifted")
    require(manifest.get("admittedGeometryCount") == FROZEN_CENSUS_RECORD_COUNT, "census manifest geometry count drifted")
    return census


def relative_manifest_path(public_path: str, manifest_repository_path: str) -> str:
    absolute = public_receipt_path(public_path)
    root = (PROJECT_ROOT / manifest_repository_path).parent.resolve()
    try:
        return absolute.relative_to(root).as_posix()
    except ValueError:
        fail(f"receipt {public_path} is outside route asset directory {root}")


def validate_route_boundary(route: dict[str, Any], label: str) -> None:
    require(route.get("censusMembership") is False, f"{label}: route entered the census")
    receipt = route.get("geometryReceipt")
    require(isinstance(receipt, dict), f"{label}: missing geometry receipt")
    require(receipt.get("registrationStatus") == "unregistered", f"{label}: route gained registration")
    fidelity = route.get("fidelityRecord")
    require(isinstance(fidelity, dict), f"{label}: missing fidelity record")
    require(fidelity.get("axon", {}).get("completeAxon") is False, f"{label}: complete axon was claimed")
    rendering = route.get("renderingContract")
    require(isinstance(rendering, dict), f"{label}: missing rendering contract")
    internals = rendering.get("sameSpecimenInternalStructure", {})
    require(internals.get("available") is False, f"{label}: internal structures were admitted")
    require(internals.get("renderedPrimitiveCount") == 0, f"{label}: internal primitives were rendered")
    identity = route.get("identityBoundary")
    require(isinstance(identity, dict), f"{label}: missing identity boundary")
    require(identity.get("crossSourceIdentityCount") == 0, f"{label}: cross-source identity was admitted")
    require(identity.get("projectRegistrationCount") == 0, f"{label}: project registration was admitted")
    require(identity.get("coDisplayCreatesRelationship") is False, f"{label}: co-display created a relationship")
    native_dat = route.get("nativeDatContract")
    if native_dat is not None:
        require(native_dat.get("parsed") is False, f"{label}: native DAT was parsed")
        require(native_dat.get("rendered") is False, f"{label}: native DAT was rendered")
        require(native_dat.get("semanticObjectCountAdmitted") == 0, f"{label}: DAT semantics were admitted")
        require(native_dat.get("renderedPrimitiveCount") == 0, f"{label}: DAT primitives were rendered")


def manifest_declarations(
    manifest: dict[str, Any],
    manifest_repository_path: str,
    label: str,
) -> dict[tuple[int, str], dict[str, Any]]:
    files = manifest.get("files")
    require(isinstance(files, list), f"{label}: manifest files must be an array")
    by_key: dict[tuple[int, str], dict[str, Any]] = {}
    seen_paths: set[str] = set()
    manifest_root = (PROJECT_ROOT / manifest_repository_path).parent
    for index, declaration in enumerate(files):
        require(isinstance(declaration, dict), f"{label}: files[{index}] must be an object")
        relative_path = declaration.get("path")
        neuron_id = declaration.get("neuronId")
        kind = declaration.get("kind")
        require(isinstance(relative_path, str) and relative_path, f"{label}: invalid file path")
        require(relative_path not in seen_paths, f"{label}: duplicate file path {relative_path}")
        require(isinstance(neuron_id, int), f"{label}: invalid file neuronId")
        require(isinstance(kind, str) and kind, f"{label}: invalid file kind")
        key = (neuron_id, kind)
        require(key not in by_key, f"{label}: duplicate manifest declaration {key}")
        seen_paths.add(relative_path)
        by_key[key] = declaration
        verify_file_receipt(manifest_root / relative_path, declaration, f"{label}:{relative_path}")
    require(manifest.get("summary", {}).get("registrationCount") == 0, f"{label}: manifest registration count drifted")
    return by_key


def load_route_inputs() -> list[dict[str, Any]]:
    selected: list[dict[str, Any]] = []
    for source in ROUTE_SOURCES:
        label = source["contractId"]
        contract, _ = load_pinned_json(
            source["contractPath"],
            source["contractBytes"],
            source["contractSha256"],
            f"{label} contract",
        )
        manifest, _ = load_pinned_json(
            source["assetManifestPath"],
            source["assetManifestBytes"],
            source["assetManifestSha256"],
            f"{label} asset manifest",
        )
        require(contract.get("contractId") == source["contractId"], f"{label}: contract ID drifted")
        require(manifest.get("repositoryRelease") == "8.6.124", f"{label}: repository release drifted")
        declarations = manifest_declarations(manifest, source["assetManifestPath"], label)
        routes = contract.get("routes")
        require(isinstance(routes, list), f"{label}: routes must be an array")
        expected_ids = set(source["supplementaryNeuronIds"])
        matched = [route for route in routes if route.get("sourceRecord", {}).get("neuronId") in expected_ids]
        require(len(matched) == len(expected_ids), f"{label}: supplementary route count drifted")
        require(
            {route["sourceRecord"]["neuronId"] for route in matched} == expected_ids,
            f"{label}: supplementary route IDs drifted",
        )
        declared_supplementary = set(contract.get("runtimeMergePolicy", {}).get("supplementaryNeuronIds", []))
        require(expected_ids.issubset(declared_supplementary), f"{label}: runtime supplementary membership drifted")
        for route in matched:
            neuron_id = route["sourceRecord"]["neuronId"]
            route_label = f"NeuroMorpho:{neuron_id}"
            validate_route_boundary(route, route_label)
            objects = route.get("sourceObjects")
            require(isinstance(objects, dict), f"{route_label}: missing source objects")
            for object_name, manifest_kind in (
                ("metadata", "official_api_snapshot"),
                ("geometry", "lazy_geometry"),
                ("swc", "standardized_swc"),
            ):
                receipt = objects.get(object_name)
                declaration = declarations.get((neuron_id, manifest_kind))
                require(isinstance(receipt, dict), f"{route_label}: missing {object_name} receipt")
                require(isinstance(declaration, dict), f"{route_label}: manifest omits {manifest_kind}")
                relative_path = relative_manifest_path(receipt["path"], source["assetManifestPath"])
                require(relative_path == declaration.get("path"), f"{route_label}: {object_name} path drifted")
                require(receipt.get("bytes") == declaration.get("bytes"), f"{route_label}: {object_name} bytes drifted")
                require(receipt.get("sha256") == declaration.get("sha256"), f"{route_label}: {object_name} SHA-256 drifted")
            metadata_path = public_receipt_path(objects["metadata"]["path"])
            geometry_path = public_receipt_path(objects["geometry"]["path"])
            metadata = load_json_bytes(metadata_path.read_bytes(), f"{route_label} API")
            geometry = load_json_bytes(geometry_path.read_bytes(), f"{route_label} geometry")
            require(metadata.get("neuron_id") == neuron_id, f"{route_label}: API identity drifted")
            require(geometry.get("neuronId") == neuron_id, f"{route_label}: geometry identity drifted")
            require(geometry.get("name") == route["sourceRecord"].get("neuronName"), f"{route_label}: geometry name drifted")
            require(geometry.get("registration", {}).get("registrationCount") == 0, f"{route_label}: geometry gained registration")
            selected.append(
                {
                    "source": source,
                    "contract": contract,
                    "manifest": manifest,
                    "route": route,
                    "metadata": metadata,
                    "geometry": geometry,
                    "geometryPath": geometry_path,
                }
            )
    selected.sort(key=lambda item: item["route"]["sourceRecord"]["neuronId"])
    ids = [item["route"]["sourceRecord"]["neuronId"] for item in selected]
    require(ids == list(SUPPLEMENTARY_NEURON_IDS), "supplementary IDs are incomplete, duplicated, or unsorted")
    geometry_paths = [item["route"]["sourceObjects"]["geometry"]["path"] for item in selected]
    require(len(geometry_paths) == len(set(geometry_paths)), "supplementary geometry paths are duplicated")
    return selected


def explicit_missing(value: Any, missing_reason: str | None) -> dict[str, Any]:
    return {"value": copy.deepcopy(value), "missingReason": missing_reason}


def numeric_age(metadata: dict[str, Any]) -> dict[str, Any]:
    minimum = metadata.get("min_age")
    maximum = metadata.get("max_age")
    scale = metadata.get("age_scale")
    missing_tokens = {None, "", "Not Reported", "not reported"}
    if minimum in missing_tokens and maximum in missing_tokens:
        return explicit_missing(None, "numeric_age_not_reported_by_source")
    require(scale not in (None, ""), "numeric age has no source scale")
    try:
        minimum_number = float(minimum) if minimum not in (None, "") else None
        maximum_number = float(maximum) if maximum not in (None, "") else None
    except (TypeError, ValueError):
        fail("numeric age contains a non-numeric source value")
    for value in (minimum_number, maximum_number):
        require(value is None or math.isfinite(value), "numeric age contains a non-finite value")
    return explicit_missing(
        {"minimum": minimum_number, "maximum": maximum_number, "scale": scale},
        None,
    )


def membership(item: dict[str, Any]) -> dict[str, Any]:
    source = item["source"]
    route = item["route"]
    return {
        "collection": "supplementary",
        "censusContribution": 0,
        "supplementaryContribution": 1,
        "routeId": route["routeId"],
        "routeContractPath": source["contractPath"],
        "routeContractSha256": source["contractSha256"],
        "routeAssetManifestPath": source["assetManifestPath"],
        "routeAssetManifestSha256": source["assetManifestSha256"],
    }


def build_adapter_record(item: dict[str, Any]) -> dict[str, Any]:
    route = item["route"]
    source_record = route["sourceRecord"]
    metadata = item["metadata"]
    geometry_document = item["geometry"]
    geometry_receipt = route["sourceObjects"]["geometry"]
    swc_receipt = route["sourceObjects"]["swc"]
    swc = geometry_document["swc"]
    registration = geometry_document["registration"]
    computed = geometry_document["morphometrics"]["computedFromStandardizedSwc"]
    require(computed.get("nodeCount") == route["geometryReceipt"].get("nodeCount"), "computed node count drifted")
    require(computed.get("segmentCount") == route["geometryReceipt"].get("segmentCount"), "computed segment count drifted")
    require(computed.get("canonicalGeometrySha256") == route["geometryReceipt"].get("canonicalGeometrySha256"), "canonical geometry receipt drifted")
    require(computed.get("topologySha256") == route["geometryReceipt"].get("topologySha256"), "topology receipt drifted")
    return {
        "assetId": source_record["assetId"],
        "neuronId": source_record["neuronId"],
        "officialMetadata": copy.deepcopy(source_record),
        "normalizedMetadata": {
            "name": source_record["neuronName"],
            "archive": source_record["archive"],
            "species": source_record["species"],
            "scientificName": metadata.get("scientific_name"),
            "lifeStage": source_record["lifeStage"],
            "brainRegion": copy.deepcopy(source_record["regionLabels"]),
            "cellType": copy.deepcopy(source_record["cellTypeLabels"]),
            "strain": metadata.get("strain"),
            "gender": source_record.get("sex"),
            "experimentCondition": copy.deepcopy(source_record["condition"]),
            "domain": source_record["domain"],
            "physicalIntegrity": source_record["physicalIntegrity"],
            "attributes": source_record["sourceAttributes"],
            "dimensionality": swc["dimensionality"],
            "sourceDiameterAvailable": swc["sourceDiameterAvailable"],
            "sourceFrame": geometry_document["sourceFrame"],
            "registrationStatus": registration["status"],
        },
        "missingness": {
            "numericAge": numeric_age(metadata),
            "donorId": explicit_missing(None, "not_provided_by_official_api_schema"),
            "specimenId": explicit_missing(None, "not_provided_by_official_api_schema"),
            "atlasTransform": copy.deepcopy(registration["atlasTransform"]),
            "atlasPlacement": copy.deepcopy(registration["atlasPlacement"]),
            "originalMorphologyFile": copy.deepcopy(swc["originalMorphologyFile"]),
            "standardizationLog": copy.deepcopy(swc["standardizationLog"]),
        },
        "sourcePaper": {
            "pmids": copy.deepcopy(geometry_document["source"]["pmids"]),
            "dois": copy.deepcopy(geometry_document["source"]["dois"]),
        },
        "geometry": {
            "available": True,
            "path": geometry_receipt["path"],
            "sha256": geometry_receipt["sha256"],
            "bytes": geometry_receipt["bytes"],
            "rawSwcPath": swc_receipt["path"],
            "rawSwcSha256": swc_receipt["sha256"],
            "missingReason": None,
            "sourceAssetSetId": item["manifest"]["assetSetId"],
            "canonicalGeometrySha256": computed["canonicalGeometrySha256"],
            "topologySha256": computed["topologySha256"],
        },
        "qc": copy.deepcopy(geometry_document["qc"]),
        "morphometrics": {
            "sourceReported": copy.deepcopy(geometry_document["morphometrics"]["sourceReported"]),
            "computed": copy.deepcopy(computed),
        },
        "comparisonMembership": membership(item),
    }


def scientific_boundary() -> dict[str, Any]:
    return {
        "analysisUnit": "NeuroMorpho_record",
        "paddingRecordCount": 0,
        "censusExpansionCount": 0,
        "registrationCount": 0,
        "atlasTransformCount": 0,
        "atlasPlacementCount": 0,
        "crossSourceIdentityCount": 0,
        "commonScaleAdmissionCount": 0,
        "commonOrientationAdmissionCount": 0,
        "completeAxonClaimCount": 0,
        "sameSpecimenInternalStructureCount": 0,
        "renderedInternalPrimitiveCount": 0,
        "commonCoordinateFrameClaim": False,
        "commonScaleClaim": False,
        "commonOrientationClaim": False,
        "combinedCensusClaim": False,
        "forbiddenClaims": [
            "149_record_census_or_any_rewrite_of_the_immutable_142_record_census",
            "synthetic_padding_or_placeholder_morphology_records",
            "cross_source_cell_identity_or_equivalence",
            "atlas_registration_placement_transform_or_common_coordinate_frame",
            "shared_anatomical_scale_or_orientation_across_source_local_frames",
            "complete_axon_projection_synaptic_connectivity_or_circuit_membership",
            "membrane_nucleus_organelle_synapse_receptor_or_ultrastructure_detail",
            "independent_animal_donor_specimen_or_prevalence_denominator",
        ],
    }


def route_source_receipts() -> list[dict[str, Any]]:
    return [
        {
            "contractId": source["contractId"],
            "contractPath": source["contractPath"],
            "contractSha256": source["contractSha256"],
            "contractBytes": source["contractBytes"],
            "assetManifestPath": source["assetManifestPath"],
            "assetManifestSha256": source["assetManifestSha256"],
            "assetManifestBytes": source["assetManifestBytes"],
            "supplementaryNeuronIds": list(source["supplementaryNeuronIds"]),
        }
        for source in ROUTE_SOURCES
    ]


def source_census_receipt() -> dict[str, Any]:
    return {
        **CENSUS_SOURCE,
        "recordCount": FROZEN_CENSUS_RECORD_COUNT,
        "immutable": True,
    }


def build_analysis_record(
    adapter_record: dict[str, Any],
    geometry_document: dict[str, Any],
) -> tuple[dict[str, Any], dict[str, int]]:
    neuron_id = adapter_record["neuronId"]
    tree = morphology_analysis.parse_geometry_tree(geometry_document, f"NeuroMorpho:{neuron_id}")
    computed = adapter_record["morphometrics"]["computed"]
    require(computed["nodeCount"] == len(tree.nodes), f"NeuroMorpho:{neuron_id}: node count drifted")
    require(computed["segmentCount"] == len(tree.nodes) - 1, f"NeuroMorpho:{neuron_id}: segment count drifted")
    metrics, edge_cases = morphology_analysis.analyse_tree(tree)
    return (
        {
            "neuronId": neuron_id,
            "name": adapter_record["normalizedMetadata"]["name"],
            "source": morphology_analysis.record_source(adapter_record, f"NeuroMorpho:{neuron_id}"),
            "dimensionality": adapter_record["normalizedMetadata"]["dimensionality"],
            "domain": adapter_record["normalizedMetadata"]["domain"],
            "physicalIntegrity": adapter_record["normalizedMetadata"]["physicalIntegrity"],
            "sourceGeometry": {
                "assetSetId": adapter_record["geometry"]["sourceAssetSetId"],
                "path": adapter_record["geometry"]["path"],
                "sha256": adapter_record["geometry"]["sha256"],
            },
            "denominatorBoundary": morphology_analysis.record_denominator_boundary(),
            "metrics": metrics,
            "comparisonMembership": copy.deepcopy(adapter_record["comparisonMembership"]),
        },
        edge_cases,
    )


def build_analysis_delta(
    records: list[dict[str, Any]],
    selected: list[dict[str, Any]],
) -> dict[str, Any]:
    analysed_records: list[dict[str, Any]] = []
    edge_totals = {
        "zeroLengthNeuriteSegmentCount": 0,
        "sourceType6SegmentCount": 0,
        "somaType1ChildSegmentExcludedCount": 0,
    }
    require(len(records) == len(selected), "adapter and route-record counts differ")
    for record, item in zip(records, selected):
        analysed, edge_cases = build_analysis_record(record, item["geometry"])
        analysed_records.append(analysed)
        for key in edge_totals:
            edge_totals[key] += edge_cases[key]
    return {
        "documentType": "supplementary_morphology_analysis_delta",
        "schemaVersion": SCHEMA_VERSION,
        "assetSetId": ASSET_SET_ID,
        "releaseId": RELEASE_ID,
        "releasedAt": RELEASED_AT,
        "sourceAdapter": {
            "adapterId": ADAPTER_ID,
            "path": "data/supplementary-morphology-comparison-adapter-0.1.json",
            "contentHashRelationship": "generated_together_without_reverse_hash_to_avoid_a_receipt_cycle",
        },
        "sourceRoutes": route_source_receipts(),
        "algorithm": {
            "path": ANALYSIS_ALGORITHM_REPOSITORY_PATH,
            "version": ANALYSIS_ALGORITHM_VERSION,
            "sha256": ANALYSIS_ALGORITHM_SHA256,
            "reusedFunctions": ["parse_geometry_tree", "analyse_tree", "record_source", "record_denominator_boundary"],
        },
        "analysisPolicy": morphology_analysis.analysis_policy(),
        "aggregationPolicy": {
            "crossRecordAggregateCount": 0,
            "cohortCount": 0,
            "reason": "records_remain_source_local_and_no_registered_common_frame_preparation_or_independent_animal_denominator_is_available",
        },
        "scientificBoundary": scientific_boundary(),
        "summary": {
            "supplementaryRecordCount": len(analysed_records),
            "geometryReferenceCount": len(analysed_records),
            "geometryCopyCount": 0,
            "swcCopyCount": 0,
            "cohortCount": 0,
            "registrationCount": 0,
            "crossSourceIdentityCount": 0,
            "commonScaleAdmissionCount": 0,
            "commonOrientationAdmissionCount": 0,
            "completeAxonClaimCount": 0,
            "sameSpecimenInternalStructureCount": 0,
            "renderedInternalPrimitiveCount": 0,
            "edgeCases": edge_totals,
        },
        "records": analysed_records,
    }


def build_asset_manifest(
    analysis_bytes: bytes,
    builder_sha256: str,
) -> dict[str, Any]:
    return {
        "documentType": "supplementary_morphology_comparison_asset_manifest",
        "schemaVersion": SCHEMA_VERSION,
        "assetSetId": ASSET_SET_ID,
        "releaseId": RELEASE_ID,
        "releasedAt": RELEASED_AT,
        "builder": {
            "path": BUILDER_REPOSITORY_PATH,
            "version": BUILDER_VERSION,
            "sha256": builder_sha256,
            "runtime": "Python_3_standard_library_plus_pinned_local_analysis_module",
        },
        "sources": {
            "frozenCensus": source_census_receipt(),
            "routeSources": route_source_receipts(),
            "analysisAlgorithm": {
                "path": ANALYSIS_ALGORITHM_REPOSITORY_PATH,
                "version": ANALYSIS_ALGORITHM_VERSION,
                "sha256": ANALYSIS_ALGORITHM_SHA256,
            },
        },
        "summary": {
            "directoryFileCount": 2,
            "declaredPayloadFileCount": 1,
            "supplementaryRecordCount": 7,
            "geometryCopyCount": 0,
            "swcCopyCount": 0,
            "fullContentCopyCount": 0,
            "registrationCount": 0,
        },
        "files": [
            {
                "path": "analysis-delta.json",
                "kind": "supplementary_morphology_analysis_delta",
                "sha256": sha256_bytes(analysis_bytes),
                "bytes": len(analysis_bytes),
            }
        ],
    }


def build_adapter(
    records: list[dict[str, Any]],
    analysis_bytes: bytes,
    manifest_bytes: bytes,
) -> dict[str, Any]:
    return {
        "documentType": "supplementary_morphology_comparison_adapter",
        "schemaVersion": SCHEMA_VERSION,
        "adapterId": ADAPTER_ID,
        "releaseId": RELEASE_ID,
        "releasedAt": RELEASED_AT,
        "purpose": "Expose seven exact route-local NeuroMorpho objects and per-record morphology analyses as a supplementary comparison layer without changing the immutable 142-record census or copying source geometry.",
        "sourceCensus": source_census_receipt(),
        "routeSources": route_source_receipts(),
        "summary": {
            "frozenCensusRecordCount": FROZEN_CENSUS_RECORD_COUNT,
            "supplementaryRecordCount": len(records),
            "viewableSourceObjectCount": VIEWABLE_SOURCE_OBJECT_COUNT,
            "combinedCensusClaim": False,
            "paddingRecordCount": 0,
            "geometryReferenceCount": len(records),
            "geometryCopyCount": 0,
            "swcCopyCount": 0,
            "registrationCount": 0,
            "crossSourceIdentityCount": 0,
            "commonScaleAdmissionCount": 0,
            "commonOrientationAdmissionCount": 0,
            "completeAxonClaimCount": 0,
            "sameSpecimenInternalStructureCount": 0,
            "renderedInternalPrimitiveCount": 0,
        },
        "scientificBoundary": scientific_boundary(),
        "analysisDelta": {
            "path": "/data/supplementary_morphology_comparison_v1/analysis-delta.json",
            "sha256": sha256_bytes(analysis_bytes),
            "bytes": len(analysis_bytes),
            "assetManifestPath": "/data/supplementary_morphology_comparison_v1/asset-manifest.json",
            "assetManifestSha256": sha256_bytes(manifest_bytes),
            "assetManifestBytes": len(manifest_bytes),
        },
        "records": records,
    }


def build_outputs() -> tuple[bytes, bytes, bytes]:
    validate_census()
    require(sha256_path(ANALYSIS_ALGORITHM_PATH) == ANALYSIS_ALGORITHM_SHA256, "analysis algorithm SHA-256 drifted")
    selected = load_route_inputs()
    records = [build_adapter_record(item) for item in selected]
    ids = [record["neuronId"] for record in records]
    geometry_paths = [record["geometry"]["path"] for record in records]
    require(ids == list(SUPPLEMENTARY_NEURON_IDS), "adapter records are not exact and sorted")
    require(len(set(geometry_paths)) == len(records), "adapter geometry paths are not unique")
    analysis = build_analysis_delta(records, selected)
    analysis_bytes = json_bytes(analysis)
    builder_sha256 = sha256_path(BUILDER_PATH)
    manifest = build_asset_manifest(analysis_bytes, builder_sha256)
    manifest_bytes = json_bytes(manifest)
    adapter = build_adapter(records, analysis_bytes, manifest_bytes)
    adapter_bytes = json_bytes(adapter)
    return adapter_bytes, analysis_bytes, manifest_bytes


def compare_exact(path: Path, expected: bytes, label: str) -> None:
    require(path.is_file(), f"{label}: generated file is missing")
    actual = path.read_bytes()
    require(actual == expected, f"{label}: generated bytes drifted; rebuild required")


def check_directory_inventory() -> None:
    require(OUTPUT_DIRECTORY.is_dir(), "supplementary comparison output directory is missing")
    actual = sorted(path.name for path in OUTPUT_DIRECTORY.iterdir())
    require(actual == ["analysis-delta.json", "asset-manifest.json"], "delta directory must contain exactly two JSON files")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="fail unless all generated bytes are current")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    adapter_bytes, analysis_bytes, manifest_bytes = build_outputs()
    if args.check:
        check_directory_inventory()
        compare_exact(CONTRACT_PATH, adapter_bytes, "adapter contract")
        compare_exact(ANALYSIS_PATH, analysis_bytes, "analysis delta")
        compare_exact(ASSET_MANIFEST_PATH, manifest_bytes, "delta asset manifest")
    else:
        OUTPUT_DIRECTORY.mkdir(parents=True, exist_ok=True)
        if any(path.name not in {"analysis-delta.json", "asset-manifest.json"} for path in OUTPUT_DIRECTORY.iterdir()):
            fail("refusing to write into a delta directory containing unexpected files")
        CONTRACT_PATH.write_bytes(adapter_bytes)
        ANALYSIS_PATH.write_bytes(analysis_bytes)
        ASSET_MANIFEST_PATH.write_bytes(manifest_bytes)
        check_directory_inventory()
    print(
        json.dumps(
            {
                "releaseId": RELEASE_ID,
                "frozenCensusRecordCount": FROZEN_CENSUS_RECORD_COUNT,
                "supplementaryRecordCount": len(SUPPLEMENTARY_NEURON_IDS),
                "viewableSourceObjectCount": VIEWABLE_SOURCE_OBJECT_COUNT,
                "combinedCensusClaim": False,
                "adapterBytes": len(adapter_bytes),
                "adapterSha256": sha256_bytes(adapter_bytes),
                "analysisDeltaBytes": len(analysis_bytes),
                "analysisDeltaSha256": sha256_bytes(analysis_bytes),
                "assetManifestBytes": len(manifest_bytes),
                "assetManifestSha256": sha256_bytes(manifest_bytes),
                "geometryCopyCount": 0,
                "swcCopyCount": 0,
            },
            ensure_ascii=False,
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
