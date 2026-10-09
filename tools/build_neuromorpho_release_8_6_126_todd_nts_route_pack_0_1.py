#!/usr/bin/env python3
"""Build a source-local supplementary route pack for Todd 8.6.126 NTS SWCs.

Only NeuroMorpho's published metadata API and direct standardized-SWC links are
used. The script preserves the 8.6.124 universe as the frozen denominator and
never retrieves the unavailable source-native Neurolucida files.
"""

from __future__ import annotations

import argparse
import collections
import hashlib
import json
import sys
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_neuromorpho_census as nmo  # noqa: E402

nmo.USER_AGENT = "OHRI-Open-Data-Census-UPG-245/1.0 (NeuroMorpho API and direct SWC research audit)"

AUDIT_PATH = ROOT / "data/neuromorpho-release-8-6-126-todd-stable-id-audit-0.1.json"
BASELINE_PATH = ROOT / "public/data/neuromorpho_release_8_6_124_no_age_universe_v1/universe-index.json"
QUERY_CACHE_PATH = ROOT / "data/source-candidates/neuromorpho-release-8-6-126-todd-nts-v1/official-current-query-response.json"
SWC_ROOT = ROOT / "public/data/neuromorpho_release_8_6_126_todd_nts_v1/swc"
GEOMETRY_ROOT = ROOT / "public/data/neuromorpho_release_8_6_126_todd_nts_v1/geometry"
ASSET_MANIFEST_PATH = ROOT / "public/data/neuromorpho_release_8_6_126_todd_nts_v1/asset-manifest.json"
ROUTE_PACK_PATH = ROOT / "data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json"

QUERY_URL = (
    "https://neuromorpho.org/api/neuron/select?q=species:mouse&"
    "fq=brain_region:spinal%20cord&fq=cell_type:interneuron&"
    "fq=archive:Todd&page=0&size=500&sort=neuron_id,asc"
)
EXPECTED_QUERY_TOTAL = 339
SOURCE_FRAME = "NeuroMorpho_CNG_standardized_local_frame"
RELEASE_DATE = "2026-09-23"
CONTEXT_STUDY = {
    "title": "Characterisation of neurotensin-expressing interneurons in the mouse spinal dorsal horn",
    "doi": "10.1177/17448069261468203",
    "url": "https://journals.sagepub.com/doi/10.1177/17448069261468203",
    "relationStatus": "candidate_context_only_record_level_crosswalk_unverified",
    "basis": "The article reports a 30-cell mouse neurotensin-expressing spinal interneuron cohort, matching the release-set count and broad label; the NeuroMorpho API's per-record DOI is blank and PMID field is the non-resolving value 2017, so no record-to-article identity is admitted.",
    "articleDataAvailability": "The article states that study datasets are available from corresponding authors on reasonable request; no non-open access is presumed.",
}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def write_bytes(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def write_json(path: Path, value: Any) -> bytes:
    data = nmo.json_bytes(value, pretty=True)
    write_bytes(path, data)
    return data


def listify(value: Any) -> list[Any]:
    if value is None:
        return []
    return value if isinstance(value, list) else [value]


def parse_query_response(data: bytes) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    response = json.loads(data)
    page = response.get("page") or {}
    records = (response.get("_embedded") or {}).get("neuronResources") or []
    if page.get("totalElements") != EXPECTED_QUERY_TOTAL or page.get("totalPages") != 1 or len(records) != EXPECTED_QUERY_TOTAL:
        raise ValueError(
            "Official 8.6.126 Todd query must return the complete one-page 339-record roster; "
            f"observed total={page.get('totalElements')}, pages={page.get('totalPages')}, rows={len(records)}"
        )
    ids = [record.get("neuron_id") for record in records]
    if any(not isinstance(value, int) for value in ids) or len(set(ids)) != EXPECTED_QUERY_TOTAL:
        raise ValueError("Official Todd query has missing or duplicate stable neuron IDs")
    return response, records


def metadata_deltas(current: list[dict[str, Any]], baseline: list[dict[str, Any]]) -> tuple[int, list[dict[str, Any]]]:
    baseline_records = {
        record["officialMetadata"]["neuron_id"]: record["officialMetadata"]
        for record in baseline
        if record.get("officialMetadata", {}).get("archive") == "Todd"
        and record.get("officialMetadata", {}).get("species") == "mouse"
        and "spinal cord" in [str(value).lower() for value in record.get("officialMetadata", {}).get("brain_region", [])]
        and "interneuron" in [str(value).lower() for value in record.get("officialMetadata", {}).get("cell_type", [])]
    }
    current_records = {record["neuron_id"]: record for record in current}
    common_ids = set(baseline_records) & set(current_records)
    compared_fields = (
        "neuron_name", "archive", "species", "brain_region", "cell_type",
        "age_classification", "domain", "attributes", "physical_Integrity",
        "reference_doi", "reference_pmid",
    )
    changes = []
    for neuron_id in sorted(common_ids):
        before = baseline_records[neuron_id]
        after = current_records[neuron_id]
        changed = [field for field in compared_fields if before.get(field) != after.get(field)]
        if changed:
            changes.append({"neuronId": neuron_id, "changedFields": changed})
    return len(common_ids), changes


def source_record(record: dict[str, Any], geometry: dict[str, Any], object_receipts: dict[str, Any]) -> dict[str, Any]:
    neuron_id = int(record["neuron_id"])
    metadata = nmo.normalized_metadata(record)
    labels = listify(record.get("cell_type"))
    regions = listify(record.get("brain_region"))
    age_min = nmo.parse_optional_float(record.get("min_age"))
    age_max = nmo.parse_optional_float(record.get("max_age"))
    computed = geometry["morphometrics"]["computedFromStandardizedSwc"]
    doi_values = listify(record.get("reference_doi"))
    pmid_values = listify(record.get("reference_pmid"))
    source_paper_doi = next((str(value) for value in doi_values if value), "")
    source_paper_pmid = next((str(value) for value in pmid_values if str(value).isdigit() and len(str(value)) >= 6), "")
    return {
        "routeId": f"mouse.sc.todd_nts.observed.nmo_{neuron_id}",
        "title": f"Neurotensin-expressing excitatory interneuron — NMO {neuron_id}",
        "authority": "OBS_STANDARDIZED_SOURCE_LOCAL",
        "sourceAuthority": "NEUROMORPHO_RELEASE_8_6_126_TODD_NTS_SUPPLEMENT",
        "censusMembership": False,
        "frozenLensMembership": False,
        "sourceRecord": {
            "repository": "NeuroMorpho.Org",
            "repositoryRelease": "8.6.126",
            "repositoryRrid": "RRID:SCR_002145",
            "neuronId": neuron_id,
            "assetId": f"NeuroMorpho:{neuron_id}",
            "neuronName": record["neuron_name"],
            "archive": record["archive"],
            "species": record["species"],
            "lifeStage": record.get("age_classification"),
            "sex": record.get("gender"),
            "strain": record.get("strain"),
            "regionLabels": regions,
            "cellTypeLabels": labels,
            "condition": listify(record.get("experiment_condition")),
            "protocol": record.get("protocol"),
            "slicingDirection": record.get("slicing_direction"),
            "slicingThicknessMicrometre": nmo.parse_optional_float(record.get("slicing_thickness")),
            "reconstructionSoftware": record.get("reconstruction_software"),
            "stain": record.get("stain"),
            "domain": record.get("domain"),
            "physicalIntegrity": record.get("physical_Integrity"),
            "sourceAttributes": record.get("attributes"),
            "sourcePaperDoi": source_paper_doi,
            "sourcePaperPmid": source_paper_pmid,
            "repositoryReferenceFieldsRaw": {"reference_doi": doi_values, "reference_pmid": pmid_values},
            "sourcePaperMappingStatus": "unresolved_repository_reference_fields_do_not_identify_a_citable_article",
            "numericAge": {
                "minimum": {"value": age_min, "unit": record.get("age_scale"), "missingReason": None if age_min is not None else "official_repository_metadata_not_reported"},
                "maximum": {"value": age_max, "unit": record.get("age_scale"), "missingReason": None if age_max is not None else "official_repository_metadata_not_reported"},
            },
            "sourceFrame": metadata["sourceFrame"],
            "registrationStatus": "unregistered",
        },
        "sourceObjects": {
            "officialApiRoster": {**object_receipts["officialApiRoster"], "role": "exact_complete_current_query_snapshot"},
            "swc": {**object_receipts["swc"], "role": "standardized_source_local_swc"},
            "geometry": {
                **object_receipts["geometry"],
                "role": "source_local_lazy_geometry",
                "canonicalGeometrySha256": computed["canonicalGeometrySha256"],
                "topologySha256": computed["topologySha256"],
            },
            "originalMorphologyFile": {"value": None, "missingReason": "temporarily_unavailable_from_repository"},
            "standardizationLog": {"value": None, "missingReason": "temporarily_unavailable_from_repository"},
        },
        "observedCellFormRecord": {
            "neuronId": neuron_id,
            "assetId": f"NeuroMorpho:{neuron_id}",
            "phenotype": " · ".join(str(value) for value in labels[1:]) or "Interneuron label not reported",
            "transmitter": "excitatory" if any(str(value).lower() == "excitatory" for value in labels) else "mixed_or_unspecified",
            "domain": record.get("domain"),
            "physicalIntegrity": record.get("physical_Integrity"),
            "sourcePaperDoi": source_paper_doi,
            "segmentCount": computed["segmentCount"],
            "geometryStatus": "OBS",
            "sourceFrame": SOURCE_FRAME,
            "registrationStatus": "unregistered",
        },
        "fidelityRecord": {
            "neuronId": neuron_id,
            "assetId": f"NeuroMorpho:{neuron_id}",
            "geometry": {
                **object_receipts["geometry"],
                "rawSwcSha256": object_receipts["swc"]["sha256"],
                "geometryStatus": "OBS_STANDARDIZED_SOURCE_LOCAL",
                "sourceFrame": SOURCE_FRAME,
                "dimensionality": "3D",
                "sourceDiameterAvailable": metadata["sourceDiameterAvailable"],
                "nodeCount": computed["nodeCount"],
                "segmentCount": computed["segmentCount"],
            },
            "axon": {
                "sourceType2NodeCount": computed["nodeTypeCounts"].get("2", 0),
                "sourceDomain": record.get("domain"),
                "completeAxon": False,
            },
            "radiusEvidence": {
                "status": "OBSERVED_SOURCE_RADIUS" if metadata["sourceDiameterAvailable"] else "UNAVAILABLE",
                "minimumMicrometre": computed["radiusDerived"]["value"]["minimumMicrometre"] if metadata["sourceDiameterAvailable"] else None,
                "maximumMicrometre": computed["radiusDerived"]["value"]["maximumMicrometre"] if metadata["sourceDiameterAvailable"] else None,
                "meanMicrometre": computed["radiusDerived"]["value"]["meanMicrometre"] if metadata["sourceDiameterAvailable"] else None,
                "missingReason": computed["radiusDerived"]["missingReason"],
            },
            "modes": {
                "observedSwc": {"available": True, "authority": "OBS_STANDARDIZED_SOURCE_LOCAL"},
                "radiusSurface": {
                    "available": metadata["sourceDiameterAvailable"],
                    "authority": "DERIVED_FROM_OBSERVED_RADIUS" if metadata["sourceDiameterAvailable"] else "UNAVAILABLE",
                    "missingReason": None if metadata["sourceDiameterAvailable"] else "official_attributes_report_no_diameter",
                },
                "internalStructure": {
                    "available": False,
                    "authority": "UNAVAILABLE",
                    "missingEvidence": ["membrane_segmentation", "nucleus", "organelles", "synaptic_boutons", "receptor_distribution", "ultrastructure"],
                },
            },
        },
        "renderingContract": {
            "sourceAuthority": "OBS_STANDARDIZED_SOURCE_LOCAL",
            "sourceFrame": SOURCE_FRAME,
            "coordinateUse": "unregistered_source_local_visualization_only",
            "morphology": "render_source_swc_centerlines_from_this_exact_record_only",
            "radiusSurface": "only_when_neuromorpho_metadata_explicitly_reports_Diameter_and_3D",
            "internalStructure": "not_available_no_inferred_primitives",
        },
        "identityBoundary": {
            "crossSourceIdentity": "not_established",
            "studyCellMapping": "unresolved; cohort-level matching does not establish a record-level link",
            "registration": "none",
            "biologicalTypeInference": "repository labels only; do not promote to an atlas subtype",
        },
        "sourceLinks": {
            "officialRecord": f"https://neuromorpho.org/api/neuron/id/{neuron_id}",
            "standardizedSwc": nmo.swc_url(record),
            "primaryPaper": None,
            "contextualStudy": CONTEXT_STUDY["url"],
            "rights": "https://neuromorpho.org/useterm.jsp",
        },
        "studyContext": CONTEXT_STUDY,
        "hardBoundaries": [
            "This is a NeuroMorpho.Org standardized CNG SWC reconstruction in its source-local frame, not a volume registered to the mouse spinal atlas.",
            "The repository labels this record as interneuron, excitatory and Neurotensin-expressing*; the asterisk is retained and no paper-specific subtype or one-to-one study identity is asserted.",
            "The repository reports Dendrites Complete and Dendrites, Soma, No Axon. These are repository metadata claims; no axon is inferred or rendered.",
            "Only records whose official metadata says Diameter, 3D may expose a radius-derived visualization surface. No Diameter records remain centerline-only despite SWC radius syntax.",
            "The original Neurolucida DAT and standardization log are unavailable in the current public repository route; no soma contours, spine placements, nucleus, membrane, organelles, synapses or other internal structures are added.",
            "The candidate 2026 neurotensin paper is contextual only. Its matching cohort size and broad label do not establish a record-level crosswalk; the source API reference fields are unresolved.",
            "NeuroMorpho.Org terms require attribution to the original reconstruction paper when known, NeuroMorpho.Org (RRID:SCR_002145), and Tecuatl et al. 2024. Resolve the missing per-record paper reference before using these objects in a publication.",
        ],
    }


def build(*, refresh: bool, delay_seconds: float) -> dict[str, Any]:
    audit = json.loads(AUDIT_PATH.read_text("utf-8"))
    baseline = json.loads(BASELINE_PATH.read_text("utf-8"))
    if baseline.get("repositoryRelease") != "8.6.124" or baseline.get("summary", {}).get("queryRecordCount") != 1097:
        raise ValueError("Pinned 8.6.124 baseline identity changed")
    if QUERY_CACHE_PATH.exists() and not refresh:
        response_body = QUERY_CACHE_PATH.read_bytes()
        retrieved_date = "cached_official_response"
    else:
        response_body, retrieved_date = nmo.fetch_bytes(QUERY_URL, retries=3, delay_seconds=delay_seconds)
        write_bytes(QUERY_CACHE_PATH, response_body)
    response, records = parse_query_response(response_body)
    baseline_todd_count, common_metadata_changes = metadata_deltas(records, baseline["records"])
    if baseline_todd_count != 309:
        raise ValueError(f"Expected the pinned Todd baseline count 309, got {baseline_todd_count}")
    candidate_specs = {record["neuronId"]: record for record in audit["releaseSetReview"]["candidateRecords"]}
    current_by_id = {record["neuron_id"]: record for record in records}
    candidate_ids = set(candidate_specs)
    if len(candidate_specs) != 30 or not candidate_ids.issubset(current_by_id):
        raise ValueError("The complete current Todd roster does not contain the exact 30 audited candidate IDs")
    if len(current_by_id) - len(set(record["officialMetadata"]["neuron_id"] for record in baseline["records"] if record["officialMetadata"].get("archive") == "Todd")) != 30:
        raise ValueError("Current-query delta does not reconcile to exactly 30 additions and zero removals")
    if common_metadata_changes:
        raise ValueError(f"Common current/baseline Todd metadata changed and needs review: {common_metadata_changes[:5]}")
    if set(current_by_id) - candidate_ids != {
        record["officialMetadata"]["neuron_id"] for record in baseline["records"]
        if record["officialMetadata"].get("archive") == "Todd"
    }:
        raise ValueError("The current-query shared IDs do not exactly match the pinned 309-record Todd subset")

    api_receipt = {
        "path": "data/source-candidates/neuromorpho-release-8-6-126-todd-nts-v1/official-current-query-response.json",
        "bytes": len(response_body),
        "sha256": sha256(response_body),
        "requestUrl": QUERY_URL,
        "userAgent": nmo.USER_AGENT,
        "retrievedDateHeader": retrieved_date,
    }
    write_bytes(QUERY_CACHE_PATH, response_body)
    routes = []
    object_files = [{"path": api_receipt["path"], "kind": "official_api_query_snapshot", "sha256": api_receipt["sha256"], "bytes": api_receipt["bytes"]}]
    diameter_counts: collections.Counter[str] = collections.Counter()
    total_nodes = 0
    total_segments = 0
    extent_z_values = []
    for neuron_id in sorted(candidate_ids):
        record = current_by_id[neuron_id]
        expected = candidate_specs[neuron_id]
        if record.get("neuron_name") != expected["neuronName"]:
            raise ValueError(f"NeuroMorpho:{neuron_id} name differs from the audited candidate roster")
        if record.get("archive") != "Todd" or record.get("species") != "mouse":
            raise ValueError(f"NeuroMorpho:{neuron_id} no longer matches Todd + mouse filters")
        if (
            "spinal cord" not in [str(value).lower() for value in listify(record.get("brain_region"))]
            or "interneuron" not in [str(value).lower() for value in listify(record.get("cell_type"))]
        ):
            raise ValueError(f"NeuroMorpho:{neuron_id} no longer matches spinal-cord interneuron filters")
        if "Neurotensin-expressing*" not in listify(record.get("cell_type")):
            raise ValueError(f"NeuroMorpho:{neuron_id} no longer carries the exact repository neurotensin label")
        if record.get("attributes") not in {"No Diameter, 3D, Angles", "Diameter, 3D, Angles"}:
            raise ValueError(f"NeuroMorpho:{neuron_id} has unsupported dimensionality/radius metadata")
        if record.get("domain") != "Dendrites, Soma, No Axon" or record.get("physical_Integrity") != "Dendrites Complete":
            raise ValueError(f"NeuroMorpho:{neuron_id} source domain or integrity metadata changed")

        swc_path = SWC_ROOT / f"nmo-{neuron_id}.swc"
        swc_url = nmo.swc_url(record)
        if swc_path.exists() and not refresh:
            swc_bytes = swc_path.read_bytes()
            retrieved = "cached_direct_swc"
        else:
            if delay_seconds > 0:
                time.sleep(delay_seconds)
            swc_bytes, retrieved = nmo.fetch_bytes(swc_url, retries=3, delay_seconds=delay_seconds)
            write_bytes(swc_path, swc_bytes)
        parsed = nmo.parse_swc_bytes(swc_bytes, f"NeuroMorpho:{neuron_id}")
        if parsed.extent[2] <= 0:
            raise ValueError(f"NeuroMorpho:{neuron_id} source advertises 3D but the parsed z extent is zero")
        if parsed.node_type_counts.get("2", 0) != 0:
            raise ValueError(f"NeuroMorpho:{neuron_id} has source type-2 nodes despite the no-axon source domain")
        diameter_available = nmo.source_diameter_available(record)
        swc_sha = sha256(swc_bytes)
        swc_url_path = f"/data/neuromorpho_release_8_6_126_todd_nts_v1/swc/nmo-{neuron_id}.swc"
        geometry = nmo.build_geometry(record, swc_bytes, parsed, swc_url_path, swc_sha)
        geometry_path = GEOMETRY_ROOT / f"nmo-{neuron_id}.json"
        geometry_bytes = nmo.json_bytes(geometry, pretty=True)
        write_bytes(geometry_path, geometry_bytes)
        swc_receipt = {"path": swc_url_path, "bytes": len(swc_bytes), "sha256": swc_sha, "url": swc_url, "retrieval": retrieved}
        geometry_receipt = {
            "path": f"/data/neuromorpho_release_8_6_126_todd_nts_v1/geometry/nmo-{neuron_id}.json",
            "bytes": len(geometry_bytes),
            "sha256": sha256(geometry_bytes),
            "rawSwcSha256": swc_sha,
        }
        route_object_receipts = {"officialApiRoster": api_receipt, "swc": swc_receipt, "geometry": geometry_receipt}
        routes.append(source_record(record, geometry, route_object_receipts))
        object_files.extend([
            {"path": f"public/data/neuromorpho_release_8_6_126_todd_nts_v1/swc/nmo-{neuron_id}.swc", "kind": "standardized_swc", "neuronId": neuron_id, "sha256": swc_sha, "bytes": len(swc_bytes)},
            {"path": f"public/data/neuromorpho_release_8_6_126_todd_nts_v1/geometry/nmo-{neuron_id}.json", "kind": "source_local_geometry_json", "neuronId": neuron_id, "sha256": sha256(geometry_bytes), "bytes": len(geometry_bytes)},
        ])
        diameter_counts["reported" if diameter_available else "not_reported"] += 1
        total_nodes += parsed.node_count if hasattr(parsed, "node_count") else len(parsed.nodes)
        total_segments += parsed.segment_count
        extent_z_values.append(parsed.extent[2])

    route_ids = [route["routeId"] for route in routes]
    neuron_ids = [route["sourceRecord"]["neuronId"] for route in routes]
    if len(set(route_ids)) != 30 or len(set(neuron_ids)) != 30:
        raise ValueError("Supplementary route IDs and neuron IDs must be unique")
    asset_manifest = {
        "schemaVersion": "0.1.0",
        "assetSetId": "neuromorpho:8.6.126:todd-nts-supplementary-routes-v1",
        "repository": "NeuroMorpho.Org",
        "repositoryRelease": "8.6.126",
        "sourceFrame": SOURCE_FRAME,
        "recordCount": 30,
        "objectFiles": object_files,
    }
    asset_manifest_bytes = write_json(ASSET_MANIFEST_PATH, asset_manifest)
    route_pack = {
        "schemaVersion": "0.1.0",
        "contractId": "neuromorpho-release-8-6-126-todd-nts-route-pack-0.1",
        "releaseId": "ohri-neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.0",
        "releasedAt": RELEASE_DATE,
        "purpose": "Add thirty source-local NeuroMorpho 8.6.126 Todd neurotensin-labelled standardized reconstructions as supplementary selectable geometries. The frozen 8.6.124 universe and all of its denominators remain unchanged.",
        "licenseAndAttribution": {
            "license": "CC BY 4.0",
            "termsUrl": "https://neuromorpho.org/useterm.jsp",
            "repositoryName": "NeuroMorpho.Org",
            "repositoryRrid": "RRID:SCR_002145",
            "repositoryPaperDoi": "10.1096/fba.2024-00048",
            "originalPaperCitationStatus": "unresolved_for_all_30_records_from_current_repository_api_fields",
            "publicationUseBoundary": "Resolve the original-paper crosswalk for each object before citing that object's reconstruction in a publication.",
        },
        "runtimeMergePolicy": {
            "frozenNoAgeQueryRecordCount": 1097,
            "supplementaryRouteCount": 30,
            "censusContribution": 0,
            "censusExpansionCount": 0,
            "crossSourceIdentityCount": 0,
            "projectRegistrationCount": 0,
        },
        "sourceQuery": {
            "url": QUERY_URL,
            "retrievalDate": RELEASE_DATE,
            "requestUserAgent": nmo.USER_AGENT,
            "retrievedDateHeader": retrieved_date,
            "completeResponse": True,
            "responseRecordCount": len(records),
            "responseReceipt": api_receipt,
        },
        "baselineComparison": {
            "baselineRelease": "8.6.124",
            "baselineQueryRecordCount": 1097,
            "baselineToddQueryRecordCount": baseline_todd_count,
            "currentToddInterneuronQueryRecordCount": len(records),
            "commonStableIdCount": baseline_todd_count,
            "newStableIdCount": len(set(current_by_id) - set(record["officialMetadata"]["neuron_id"] for record in baseline["records"] if record["officialMetadata"].get("archive") == "Todd")),
            "removedStableIdCount": 0,
            "commonMetadataChangeCount": len(common_metadata_changes),
            "commonMetadataChanges": common_metadata_changes,
            "auditId": audit["auditId"],
        },
        "candidateStudyContext": CONTEXT_STUDY,
        "summary": {
            "routeCount": len(routes),
            "currentCompleteToddQueryRecordCount": len(records),
            "sourceLabelled3DCount": len(routes),
            "sourceDiameterReportedCount": diameter_counts["reported"],
            "sourceDiameterNotReportedCount": diameter_counts["not_reported"],
            "observedSwcNodeCount": total_nodes,
            "observedSwcSegmentCount": total_segments,
            "positiveZExtentCount": sum(1 for value in extent_z_values if value > 0),
            "syntacticallyParsedSwcCount": len(routes),
            "repositoryReportedDendritesCompleteCount": sum(1 for route in routes if route["sourceRecord"]["physicalIntegrity"] == "Dendrites Complete"),
            "biologicalCompletenessIndependentlyEstablishedCount": 0,
            "originalNeurolucidaFileCount": 0,
            "standardizationLogCount": 0,
            "paperRecordCrosswalkCount": 0,
            "sameSpecimenInternalStructureCount": 0,
            "renderedInternalPrimitiveCount": 0,
            "censusExpansionCount": 0,
            "crossSourceIdentityCount": 0,
            "projectRegistrationCount": 0,
        },
        "assetManifest": {
            "path": "public/data/neuromorpho_release_8_6_126_todd_nts_v1/asset-manifest.json",
            "bytes": len(asset_manifest_bytes),
            "sha256": sha256(asset_manifest_bytes),
            "role": "exact_standardized_swc_and_geometry_manifest",
        },
        "routes": routes,
    }
    route_pack_bytes = write_json(ROUTE_PACK_PATH, route_pack)
    return {
        "routePack": str(ROUTE_PACK_PATH.relative_to(ROOT)),
        "routePackBytes": len(route_pack_bytes),
        "routePackSha256": sha256(route_pack_bytes),
        "routeCount": len(routes),
        "completeCurrentRosterCount": len(records),
        "baselineToddCount": baseline_todd_count,
        "newCount": route_pack["baselineComparison"]["newStableIdCount"],
        "removedCount": 0,
        "commonMetadataChangeCount": len(common_metadata_changes),
        "sourceDiameterReportedCount": diameter_counts["reported"],
        "sourceDiameterNotReportedCount": diameter_counts["not_reported"],
        "nodeCount": total_nodes,
        "segmentCount": total_segments,
        "assetManifestSha256": sha256(asset_manifest_bytes),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--refresh", action="store_true", help="refetch the official API query and all 30 standardized SWCs")
    parser.add_argument("--delay-seconds", type=float, default=0.5, help="polite delay between direct standardized-SWC requests")
    args = parser.parse_args()
    if args.delay_seconds < 0:
        raise SystemExit("--delay-seconds must be non-negative")
    result = build(refresh=args.refresh, delay_seconds=args.delay_seconds)
    print(json.dumps(result, sort_keys=True))


if __name__ == "__main__":
    main()
