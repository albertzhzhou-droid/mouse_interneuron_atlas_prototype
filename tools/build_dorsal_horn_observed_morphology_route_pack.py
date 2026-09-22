#!/usr/bin/env python3
"""Build the source-local mouse dorsal-horn observed-morphology route pack.

The pack does not expand or rewrite the frozen 142-record NeuroMorpho query
census.  NMO 104003 and 108974 reuse their exact census children, while NMO
170035 and 249676 are separately pinned supplementary NeuroMorpho objects.
Every route remains source-local, unregistered, independent of the project SCI
entities and molecular taxonomies, and unable to authorize internal geometry.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import urllib.request
from pathlib import Path
from typing import Any

from build_neuromorpho_census import build_geometry, json_bytes, parse_swc_bytes


PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = PROJECT_ROOT / "public/data/dorsal_horn_observed_morphology_route_pack_v1"
CONTRACT_PATH = PROJECT_ROOT / "data/dorsal-horn-observed-morphology-route-pack-0.1.json"
CENSUS_ROOT = PROJECT_ROOT / "public/data/neuromorpho_release_8_6_124_census_v1"
CENSUS_INDEX_PATH = CENSUS_ROOT / "census-index.json"
CENSUS_MANIFEST_PATH = CENSUS_ROOT / "asset-manifest.json"
OBSERVED_LENS_PATH = PROJECT_ROOT / "data/observed-cell-form-lens-0.1.json"
FIDELITY_PATH = PROJECT_ROOT / "data/morphology-fidelity-contract-0.1.json"
RELEASE = "8.6.124"
SOURCE_FRAME = "NeuroMorpho_CNG_standardized_local_frame"
USER_AGENT = "OHRI-Open-Data-Route-Pack/0.1 (NeuroMorpho API and direct SWC audit)"


SUPPLEMENTARY = {
    249676: {
        "name": "061118B-S6-02_cell_2-RQ",
        "archive": "Todd",
        "apiUrl": "https://neuromorpho.org/api/neuron/id/249676",
        "swcUrl": "https://neuromorpho.org/dableFiles/todd/CNG%20version/061118B-S6-02_cell_2-RQ.CNG.swc",
        "apiBytes": 1457,
        "apiSha256": "1c3b72a58ae13e60732dcd3abd42ba0b138b0754ae4d3bc701b68779eafac6f1",
        "swcBytes": 41217,
        "swcSha256": "b5a96ebc6979f0022c70a26eaa6a5c060545a05d2164852a5a5dd8dc290f4f75",
    },
    170035: {
        "name": "19-02-19A-07-cell-1",
        "archive": "Hughes",
        "apiUrl": "https://neuromorpho.org/api/neuron/id/170035",
        "swcUrl": "https://neuromorpho.org/dableFiles/hughes/CNG%20version/19-02-19A-07-cell-1.CNG.swc",
        "apiBytes": 1690,
        "apiSha256": "c25b5869f0a6d1d4480cb29eeb4b9650f92b616881f2e1ec5d17aeafa5e9dae0",
        "swcBytes": 76053,
        "swcSha256": "73f85373bd426e8ef4dc0f95b73a61678ffb454d963ec292a403ad31a0f116a6",
    },
}


ROUTE_CONFIGURATION = {
    249676: {
        "routeId": "mouse.sc.grpr_lamina_i_ii.observed.nmo_249676",
        "title": "GRPRCreERT2-captured excitatory lamina I-II interneuron",
        "phenotype": "GRPRCreERT2-captured excitatory lamina I-II dorsal-horn interneuron",
        "transmitter": "excitatory",
        "markerBasis": "source_metadata_GRPR_class_and_GRPRCreERT2_capture_line",
        "identityBoundaryText": "GRPR is the receptor rather than the GRP ligand; Cre capture does not prove functional receptor abundance, and vertical morphology is a source-cohort interpretation rather than an exact deposited-cell annotation.",
    },
    108974: {
        "routeId": "mouse.sc.tac1_sp_dorsal_horn.observed.nmo_108974",
        "title": "Tac1Cre / Brainbow SP-class excitatory interneuron",
        "phenotype": "Tac1Cre/Brainbow SP-class excitatory dorsal-horn interneuron",
        "transmitter": "excitatory",
        "markerBasis": "source_metadata_cell_class_and_Tac1_IRES2_Cre_D_line",
        "identityBoundaryText": "The route does not claim direct SP peptide or mRNA confirmation in this exact reconstructed cell; radial morphology is a source-cohort interpretation rather than this record's deposited annotation.",
    },
    170035: {
        "routeId": "mouse.sc.pv_pax2_lamina_ii_iii.observed.nmo_170035",
        "title": "PVCre / Brainbow Pax2-positive inhibitory lamina II-III interneuron",
        "phenotype": "PVCre/Brainbow, Pax2-positive inhibitory lamina II-III dorsal-horn interneuron",
        "transmitter": "inhibitory",
        "markerBasis": "source_metadata_PV_positive_inhibitory_Pax2_positive_and_Pvcre_line",
        "identityBoundaryText": "This is the Pax2-positive inhibitory PV route, not evidence that every PV cell is inhibitory; the official API protocol says in vitro while the paper reports in-vivo viral delivery followed by fixed-section reconstruction.",
    },
    104003: {
        "routeId": "mouse.sc.pdyn_dorsal_horn.observed.nmo_104003",
        "title": "PdynCre / AAV-eGFP, Sst2a-receptor-positive inhibitory interneuron",
        "phenotype": "PdynCre/AAV-eGFP reporter-captured, Sst2a-receptor-positive inhibitory dorsal-horn interneuron",
        "transmitter": "inhibitory",
        "markerBasis": "PdynCre_AAV_flex_eGFP_capture_plus_Sst2a_receptor_immunoreactivity",
        "identityBoundaryText": "The filename's SST and VGLUT2 tokens describe presumed contacting boutons, not expression by the reconstructed cell; the SWC contains no bouton, contact, or synapse objects and does not authorize an SST- or VGLUT2-expressing cell label.",
    },
}


ROUTE_ORDER = [249676, 108974, 170035, 104003]
EXPECTED_COUNTS = {
    249676: {"nodes": 1178, "segments": 1177, "types": {"1": 12, "2": 63, "3": 1103}, "somaContours": 12},
    108974: {"nodes": 1801, "segments": 1800, "types": {"1": 9, "3": 1792}, "somaContours": 9},
    170035: {"nodes": 2167, "segments": 2166, "types": {"1": 18, "3": 2149}, "somaContours": 18},
    104003: {"nodes": 109, "segments": 108, "types": {"1": 3, "3": 106}, "somaContours": 3},
}


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_path(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def public_path(path: Path) -> str:
    return "/data/" + path.relative_to(PROJECT_ROOT / "public/data").as_posix()


def receipt(path: Path, *, role: str | None = None, **extra: Any) -> dict[str, Any]:
    value: dict[str, Any] = {
        "path": public_path(path),
        "bytes": path.stat().st_size,
        "sha256": sha256_path(path),
    }
    if role is not None:
        value["role"] = role
    value.update(extra)
    return value


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=90) as response:
        return response.read()


def validate_pinned_bytes(body: bytes, *, expected_bytes: int, expected_sha256: str, label: str) -> None:
    if len(body) != expected_bytes:
        raise ValueError(f"{label}: expected {expected_bytes} bytes, found {len(body)}")
    actual = sha256_bytes(body)
    if actual != expected_sha256:
        raise ValueError(f"{label}: expected SHA-256 {expected_sha256}, found {actual}")


def materialize_supplementary_sources(*, refresh: bool, seed_directory: Path | None) -> dict[int, dict[str, Path]]:
    api_directory = OUTPUT_ROOT / "api"
    swc_directory = OUTPUT_ROOT / "swc"
    api_directory.mkdir(parents=True, exist_ok=True)
    swc_directory.mkdir(parents=True, exist_ok=True)
    paths: dict[int, dict[str, Path]] = {}
    for neuron_id, config in SUPPLEMENTARY.items():
        api_path = api_directory / f"nmo-{neuron_id}.json"
        swc_path = swc_directory / f"nmo-{neuron_id}.swc"
        for kind, output_path, url, expected_bytes, expected_sha256, seed_name in [
            ("api", api_path, config["apiUrl"], config["apiBytes"], config["apiSha256"], f"nmo-{neuron_id}-api.json"),
            ("swc", swc_path, config["swcUrl"], config["swcBytes"], config["swcSha256"], f"nmo-{neuron_id}.swc"),
        ]:
            if refresh:
                body = fetch(url)
                output_path.write_bytes(body)
            elif seed_directory is not None and (seed_directory / seed_name).exists():
                shutil.copyfile(seed_directory / seed_name, output_path)
            elif not output_path.exists():
                raise FileNotFoundError(
                    f"Missing {output_path}. Use --refresh or provide --seed-directory with {seed_name}."
                )
            body = output_path.read_bytes()
            validate_pinned_bytes(
                body,
                expected_bytes=expected_bytes,
                expected_sha256=expected_sha256,
                label=f"NMO {neuron_id} {kind}",
            )
        paths[neuron_id] = {"api": api_path, "swc": swc_path}
    return paths


def validate_official_record(record: dict[str, Any], neuron_id: int) -> None:
    config = SUPPLEMENTARY[neuron_id]
    if record.get("neuron_id") != neuron_id:
        raise ValueError(f"NMO {neuron_id}: official API identity drifted")
    if record.get("neuron_name") != config["name"] or record.get("archive") != config["archive"]:
        raise ValueError(f"NMO {neuron_id}: official name or archive drifted")
    if record.get("species") != "mouse" or "spinal cord" not in (record.get("brain_region") or []):
        raise ValueError(f"NMO {neuron_id}: mouse spinal-cord scope drifted")


def build_supplementary_geometry(source_paths: dict[int, dict[str, Path]]) -> dict[int, dict[str, Any]]:
    geometry_directory = OUTPUT_ROOT / "geometry"
    geometry_directory.mkdir(parents=True, exist_ok=True)
    geometries: dict[int, dict[str, Any]] = {}
    for neuron_id in SUPPLEMENTARY:
        record = json.loads(source_paths[neuron_id]["api"].read_text("utf-8"))
        validate_official_record(record, neuron_id)
        swc_body = source_paths[neuron_id]["swc"].read_bytes()
        parsed = parse_swc_bytes(swc_body, f"NeuroMorpho:{neuron_id}")
        expected = EXPECTED_COUNTS[neuron_id]
        if len(parsed.nodes) != expected["nodes"] or parsed.segment_count != expected["segments"]:
            raise ValueError(f"NMO {neuron_id}: node or segment count drifted")
        if parsed.node_type_counts != expected["types"]:
            raise ValueError(f"NMO {neuron_id}: source-type count drifted")
        geometry = build_geometry(
            record,
            swc_body,
            parsed,
            f"swc/nmo-{neuron_id}.swc",
            SUPPLEMENTARY[neuron_id]["swcSha256"],
        )
        geometry_path = geometry_directory / f"nmo-{neuron_id}.json"
        geometry_path.write_bytes(json_bytes(geometry))
        geometries[neuron_id] = geometry
    return geometries


def contour_count_from_swc(path: Path) -> int:
    text = path.read_text("utf-8", errors="replace")
    match = re.search(r"The original file has (\d+) soma contours that are averaged into (\d+) soma points", text)
    if not match or match.group(1) != match.group(2):
        raise ValueError(f"{path}: exact averaged-soma statement is absent")
    return int(match.group(1))


def radius_evidence(geometry: dict[str, Any]) -> dict[str, Any]:
    computed = geometry["morphometrics"]["computedFromStandardizedSwc"]
    source_available = geometry["swc"]["sourceDiameterAvailable"]
    if source_available:
        values = computed["radiusDerived"]["value"]
        return {
            "status": "OBSERVED_SOURCE_RADIUS",
            "minimumMicrometre": values["minimumMicrometre"],
            "maximumMicrometre": values["maximumMicrometre"],
            "meanMicrometre": values["meanMicrometre"],
            "missingReason": None,
        }
    return {
        "status": "UNAVAILABLE",
        "minimumMicrometre": None,
        "maximumMicrometre": None,
        "meanMicrometre": None,
        "missingReason": "official_attributes_report_no_diameter",
    }


def fidelity_record(record: dict[str, Any], geometry: dict[str, Any], geometry_path: Path) -> dict[str, Any]:
    neuron_id = int(record["neuron_id"])
    computed = geometry["morphometrics"]["computedFromStandardizedSwc"]
    source_diameter_available = geometry["swc"]["sourceDiameterAvailable"]
    return {
        "neuronId": neuron_id,
        "assetId": f"NeuroMorpho:{neuron_id}",
        "geometry": {
            "path": public_path(geometry_path),
            "bytes": geometry_path.stat().st_size,
            "sha256": sha256_path(geometry_path),
            "rawSwcSha256": geometry["swc"]["sha256"],
            "geometryStatus": "OBS_STANDARDIZED_SOURCE_LOCAL",
            "sourceFrame": SOURCE_FRAME,
            "dimensionality": geometry["swc"]["dimensionality"],
            "sourceDiameterAvailable": source_diameter_available,
            "nodeCount": computed["nodeCount"],
            "segmentCount": computed["segmentCount"],
        },
        "axon": {
            "sourceType2NodeCount": int(computed["nodeTypeCounts"].get("2", 0)),
            "sourceDomain": record["domain"],
            "completeAxon": False,
        },
        "radiusEvidence": radius_evidence(geometry),
        "modes": {
            "observedSwc": {"available": True, "authority": "OBS_STANDARDIZED_SOURCE_LOCAL"},
            "radiusSurface": {
                "available": source_diameter_available,
                "authority": "DERIVED_FROM_OBSERVED_RADIUS" if source_diameter_available else "UNAVAILABLE",
                "missingReason": None if source_diameter_available else "official_attributes_report_no_diameter",
            },
            "internalStructure": {
                "available": False,
                "authority": "UNAVAILABLE",
                "missingEvidence": [
                    "membrane_segmentation",
                    "nucleus",
                    "organelles",
                    "synaptic_boutons",
                    "receptor_distribution",
                    "ultrastructure",
                ],
            },
        },
    }


def observed_cell_form(record: dict[str, Any], geometry: dict[str, Any]) -> dict[str, Any]:
    neuron_id = int(record["neuron_id"])
    config = ROUTE_CONFIGURATION[neuron_id]
    return {
        "neuronId": neuron_id,
        "assetId": f"NeuroMorpho:{neuron_id}",
        "phenotype": config["phenotype"],
        "transmitter": config["transmitter"],
        "domain": record["domain"],
        "physicalIntegrity": record["physical_Integrity"],
        "sourcePaperDoi": record["reference_doi"][0],
        "segmentCount": geometry["morphometrics"]["computedFromStandardizedSwc"]["segmentCount"],
        "geometryStatus": "OBS",
        "sourceFrame": SOURCE_FRAME,
        "registrationStatus": "unregistered",
    }


def source_record(record: dict[str, Any]) -> dict[str, Any]:
    return {
        "repository": "NeuroMorpho.Org",
        "repositoryRelease": RELEASE,
        "repositoryRrid": "RRID:SCR_002145",
        "neuronId": record["neuron_id"],
        "assetId": f"NeuroMorpho:{record['neuron_id']}",
        "neuronName": record["neuron_name"],
        "archive": record["archive"],
        "species": record["species"],
        "lifeStage": record["age_classification"],
        "sex": record["gender"],
        "strain": record["strain"],
        "regionLabels": record["brain_region"],
        "cellTypeLabels": record["cell_type"],
        "condition": record["experiment_condition"],
        "protocol": record["protocol"],
        "slicingDirection": record["slicing_direction"],
        "slicingThicknessMicrometre": float(record["slicing_thickness"]),
        "reconstructionSoftware": record["reconstruction_software"],
        "stain": record["stain"],
        "domain": record["domain"],
        "physicalIntegrity": record["physical_Integrity"],
        "sourceAttributes": record["attributes"],
        "sourcePaperDoi": record["reference_doi"][0],
        "sourcePaperPmid": record["reference_pmid"][0],
    }


def geometry_receipt(geometry: dict[str, Any]) -> dict[str, Any]:
    computed = geometry["morphometrics"]["computedFromStandardizedSwc"]
    return {
        "dimensionality": geometry["swc"]["dimensionality"],
        "sourceFrame": SOURCE_FRAME,
        "registrationStatus": "unregistered",
        "nodeCount": computed["nodeCount"],
        "segmentCount": computed["segmentCount"],
        "nodeTypeCounts": computed["nodeTypeCounts"],
        "boundsMicrometre": computed["boundsMicrometre"],
        "extentMicrometre": computed["extentMicrometre"],
        "canonicalGeometrySha256": computed["canonicalGeometrySha256"],
        "topologySha256": computed["topologySha256"],
        "sourceDiameterAvailable": geometry["swc"]["sourceDiameterAvailable"],
    }


def route_boundaries(record: dict[str, Any], soma_count: int, source_diameter_available: bool) -> list[str]:
    neuron_id = int(record["neuron_id"])
    config = ROUTE_CONFIGURATION[neuron_id]
    axon_boundary = (
        f"The source contains observed type-2 axon nodes but reports {record['physical_Integrity']}; the axon is incomplete and cannot establish a full projection."
        if "Axon" in record["domain"] and "No Axon" not in record["domain"]
        else "The source reconstruction domain reports No Axon; this is missing reconstruction coverage, not evidence that the biological cell lacked an axon."
    )
    radius_boundary = (
        "A deterministic radius-derived display surface is permitted from source-authorized radii, but it is not an observed membrane or measurement surface."
        if source_diameter_available
        else "The official source reports No Diameter; numeric SWC radius placeholders cannot authorize caliber or a radius-derived surface, so surface mode fails closed."
    )
    return [
        f"{config['title']} is an independent NeuroMorpho source record and is not the morphology of mouse.sc.vsx2_hoxa10, another SCI entity, a molecular cluster, or another reconstruction.",
        f"The {record['slicing_thickness']} micrometre {record['slicing_direction']} section and source-reported {record['physical_Integrity']} integrity require slice-aware interpretation and cannot establish a complete whole-cell arbor.",
        axon_boundary,
        f"The SWC header states that {soma_count} original soma contours were averaged into {soma_count} standardized soma points; those points are not original contour vertices, a membrane, a nucleus, or a volumetric soma segmentation.",
        radius_boundary,
        f"Identity wording is limited to {config['markerBasis']}; no direct individual-cell transcript, peptide-abundance, or cross-study molecular identity assay is claimed.",
        config["identityBoundaryText"],
        "Missing same-specimen membrane, nucleus, organelle, synapse, receptor, and ultrastructure evidence renders zero internal primitives.",
        "Source-local display scaling creates no atlas registration, laminar placement beyond source metadata, relationship to another route, or prevalence estimate.",
    ]


def build_contract(source_paths: dict[int, dict[str, Path]], supplementary_geometries: dict[int, dict[str, Any]]) -> dict[str, Any]:
    census = json.loads(CENSUS_INDEX_PATH.read_text("utf-8"))
    census_records = {record["neuronId"]: record for record in census["records"]}
    legacy_forms = {record["neuronId"]: record for record in json.loads(OBSERVED_LENS_PATH.read_text("utf-8"))["records"]}
    legacy_fidelity = {record["neuronId"]: record for record in json.loads(FIDELITY_PATH.read_text("utf-8"))["records"]}
    census_index_receipt = receipt(CENSUS_INDEX_PATH, role="pinned_full_census_index")
    census_manifest_receipt = receipt(CENSUS_MANIFEST_PATH, role="pinned_full_census_asset_manifest")
    routes = []
    for neuron_id in ROUTE_ORDER:
        config = ROUTE_CONFIGURATION[neuron_id]
        in_census = neuron_id in census_records
        if in_census:
            census_record = census_records[neuron_id]
            record = census_record["officialMetadata"]
            geometry_path = CENSUS_ROOT / census_record["geometry"]["path"]
            swc_path = CENSUS_ROOT / census_record["geometry"]["rawSwcPath"]
            geometry = json.loads(geometry_path.read_text("utf-8"))
            form = legacy_forms[neuron_id]
            fidelity = legacy_fidelity[neuron_id]
            metadata_receipt = census_index_receipt
            source_authority = "NEUROMORPHO_RELEASE_8_6_124_CENSUS_CHILD"
        else:
            record = json.loads(source_paths[neuron_id]["api"].read_text("utf-8"))
            geometry_path = OUTPUT_ROOT / "geometry" / f"nmo-{neuron_id}.json"
            swc_path = source_paths[neuron_id]["swc"]
            geometry = supplementary_geometries[neuron_id]
            form = observed_cell_form(record, geometry)
            fidelity = fidelity_record(record, geometry, geometry_path)
            metadata_receipt = receipt(source_paths[neuron_id]["api"], role="official_api_snapshot")
            source_authority = "PINNED_NEUROMORPHO_RELEASE_8_6_124_SOURCE_OBJECT"
        expected = EXPECTED_COUNTS[neuron_id]
        computed = geometry["morphometrics"]["computedFromStandardizedSwc"]
        if computed["nodeCount"] != expected["nodes"] or computed["nodeTypeCounts"] != expected["types"]:
            raise ValueError(f"NMO {neuron_id}: route geometry does not match the locked receipt")
        soma_count = contour_count_from_swc(swc_path)
        if soma_count != expected["somaContours"]:
            raise ValueError(f"NMO {neuron_id}: soma-contour count drifted")
        source_diameter_available = geometry["swc"]["sourceDiameterAvailable"]
        routes.append(
            {
                "routeId": config["routeId"],
                "title": config["title"],
                "authority": "OBS_STANDARDIZED_SOURCE_LOCAL",
                "sourceAuthority": source_authority,
                "censusMembership": in_census,
                "sourceRecord": source_record(record),
                "sourceObjects": {
                    "metadata": metadata_receipt,
                    "censusAssetManifest": census_manifest_receipt if in_census else None,
                    "geometry": receipt(
                        geometry_path,
                        role="source_local_lazy_geometry",
                        canonicalGeometrySha256=computed["canonicalGeometrySha256"],
                        topologySha256=computed["topologySha256"],
                    ),
                    "swc": receipt(swc_path, role="standardized_source_local_swc"),
                },
                "observedCellFormRecord": form,
                "fidelityRecord": fidelity,
                "geometryReceipt": geometry_receipt(geometry),
                "somaContourReceipt": {
                    "evidenceSource": "standardized_swc_header",
                    "originalContourCount": soma_count,
                    "standardizedSomaPointCount": soma_count,
                    "nativeContourVerticesAvailable": False,
                    "membraneClaim": False,
                },
                "renderingContract": {
                    "observedSwc": {
                        "available": True,
                        "authority": "OBS_STANDARDIZED_SOURCE_LOCAL",
                        "representationStateId": "OBS_SKELETON",
                    },
                    "radiusSurface": {
                        "available": source_diameter_available,
                        "authority": "DERIVED_FROM_OBSERVED_RADIUS" if source_diameter_available else "UNAVAILABLE",
                        "representationStateId": "DER_RADIUS_SURFACE" if source_diameter_available else "UNAVAILABLE",
                        "membraneClaim": False,
                        "measurementUse": "forbidden",
                        "missingReason": None if source_diameter_available else "official_attributes_report_no_diameter",
                    },
                    "sameSpecimenInternalStructure": {
                        "available": False,
                        "authority": "UNAVAILABLE",
                        "representationStateId": "UNAVAILABLE",
                        "renderedPrimitiveCount": 0,
                        "missingEvidence": [
                            "membrane_segmentation",
                            "nucleus",
                            "organelles",
                            "synapses",
                            "receptor_distribution",
                            "ultrastructure",
                        ],
                    },
                },
                "identityBoundary": {
                    "markerIdentityBasis": config["markerBasis"],
                    "individualMolecularAssayClaim": False,
                    "selectedSciEntityRelationship": "none",
                    "molecularProfileRelationship": "none",
                    "otherMorphologyRelationship": "independent_record",
                    "crossSourceIdentityCount": 0,
                    "projectRegistrationCount": 0,
                    "coDisplayCreatesRelationship": False,
                },
                "sourceLinks": {
                    "officialRecord": f"https://neuromorpho.org/neuron_info.jsp?neuron_name={record['neuron_name']}",
                    "officialApi": f"https://neuromorpho.org/api/neuron/id/{neuron_id}",
                    "standardizedSwc": geometry["source"]["standardizedSwcUrl"],
                    "primaryPaper": f"https://doi.org/{record['reference_doi'][0]}",
                    "rights": "https://neuromorpho.org/useterm.jsp",
                },
                "hardBoundaries": route_boundaries(record, soma_count, source_diameter_available),
            }
        )
    return {
        "schemaVersion": "0.1.0",
        "contractId": "dorsal-horn-observed-morphology-route-pack-0.1",
        "releaseId": "ohri-dorsal-horn-observed-morphology-route-pack-0.1.0",
        "releasedAt": "2026-08-30",
        "title": "Independent mouse dorsal-horn observed-morphology route pack",
        "purpose": "Expose four exact source-local dorsal-horn subtype routes without averaging cells, duplicating runtime identities, changing the 142-record census, or filling absent axons, diameters, membranes, internals, synapses, registrations, or cross-source identities.",
        "repository": {
            "name": "NeuroMorpho.Org",
            "release": RELEASE,
            "rrid": "RRID:SCR_002145",
            "rights": "CC BY 4.0 subject to NeuroMorpho.Org Terms of Use and original-paper attribution",
            "rightsUrl": "https://neuromorpho.org/useterm.jsp",
        },
        "runtimeMergePolicy": {
            "frozenLegacyExemplarCount": 5,
            "preExistingIndependentRouteCount": 1,
            "preMergeUniqueMainSceneNeuronCount": 6,
            "routePackRecordCount": 4,
            "overlappingFrozenNeuronIds": [104003, 108974],
            "supplementaryNeuronIds": [170035, 249676],
            "deduplicateBy": "neuronId",
            "postMergeUniqueMainSceneNeuronCount": 8,
            "postMergeNamedDorsalHornRouteCount": 5,
            "frozenCensusRecordCount": 142,
            "censusExpansionCount": 0,
        },
        "summary": {
            "routeCount": 4,
            "uniqueNeuronCount": 4,
            "existingCensusRecordCount": 2,
            "supplementaryRecordCount": 2,
            "sourceDiameterAvailableCount": 2,
            "sourceNoDiameterCount": 2,
            "observedAxonRouteCount": 1,
            "sourceCompleteAxonCount": 0,
            "sameSpecimenInternalStructureCount": 0,
            "renderedInternalPrimitiveCount": 0,
            "exactCrossSourceIdentityCount": 0,
            "projectRegistrationCount": 0,
        },
        "routes": routes,
        "packBoundaries": [
            "The four records are independent source objects and are never averaged, morphed, or treated as a representative interneuron.",
            "NMO 104003 and 108974 reuse their frozen census geometry and runtime identities; they are not duplicated in selectors, exports, or counts.",
            "NMO 170035 and 249676 are supplementary exact NeuroMorpho objects and do not expand or rewrite the frozen 142-record census.",
            "A shared marker, dorsal-horn label, source paper, display frame, or co-display cannot create a same-cell, same-type, molecular-profile, SCI-entity, atlas, or registration relationship.",
            "Missing axons, diameters, membranes, nuclei, organelles, synapses, receptors, ultrastructure, raw imagery, and registration remain visibly missing and are never replaced by procedural biological geometry.",
            "NeuroMorpho.Org asset reuse terms do not transfer article-figure rights; this pack bundles only the attributed NeuroMorpho metadata, standardized SWC, and deterministic source-local geometry receipts, never paper figures or microscopy panels.",
        ],
    }


def write_asset_manifest(source_paths: dict[int, dict[str, Path]]) -> dict[str, Any]:
    files = []
    for neuron_id in sorted(SUPPLEMENTARY):
        for kind, path in [
            ("official_api_snapshot", source_paths[neuron_id]["api"]),
            ("lazy_geometry", OUTPUT_ROOT / "geometry" / f"nmo-{neuron_id}.json"),
            ("standardized_swc", source_paths[neuron_id]["swc"]),
        ]:
            files.append(
                {
                    "path": path.relative_to(OUTPUT_ROOT).as_posix(),
                    "kind": kind,
                    "sha256": sha256_path(path),
                    "bytes": path.stat().st_size,
                    "neuronId": neuron_id,
                }
            )
    files.sort(key=lambda item: item["path"])
    manifest = {
        "schemaVersion": "1.0.0",
        "assetSetId": "neuromorpho:8.6.124:dorsal-horn-observed-morphology-route-pack-v1",
        "repositoryRelease": RELEASE,
        "generatedAt": "2026-08-30",
        "summary": {
            "supplementaryNeuronCount": 2,
            "officialApiSnapshotCount": 2,
            "standardizedSwcCount": 2,
            "lazyGeometryCount": 2,
            "fileCount": 6,
            "registrationCount": 0,
        },
        "files": files,
    }
    (OUTPUT_ROOT / "asset-manifest.json").write_bytes(json_bytes(manifest, pretty=True))
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--refresh", action="store_true", help="Refetch the two pinned supplementary API and SWC objects")
    parser.add_argument("--seed-directory", type=Path, help="Seed exact source bytes from an existing directory")
    args = parser.parse_args()
    source_paths = materialize_supplementary_sources(refresh=args.refresh, seed_directory=args.seed_directory)
    supplementary_geometries = build_supplementary_geometry(source_paths)
    manifest = write_asset_manifest(source_paths)
    contract = build_contract(source_paths, supplementary_geometries)
    CONTRACT_PATH.write_bytes(json_bytes(contract, pretty=True))
    print(
        json.dumps(
            {
                "releaseId": contract["releaseId"],
                "routeCount": contract["summary"]["routeCount"],
                "postMergeUniqueMainSceneNeuronCount": contract["runtimeMergePolicy"]["postMergeUniqueMainSceneNeuronCount"],
                "supplementaryAssetFileCount": manifest["summary"]["fileCount"],
                "censusExpansionCount": contract["runtimeMergePolicy"]["censusExpansionCount"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
