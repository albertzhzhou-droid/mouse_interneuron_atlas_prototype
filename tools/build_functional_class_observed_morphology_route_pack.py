#!/usr/bin/env python3
"""Build two exact, source-local functional-class morphology routes.

NMO 45674 (Renshaw) and NMO 50424 (NPY-positive) are independent
NeuroMorpho.Org objects.  This builder pins official metadata, morphometry,
standardized SWC, and source-native DAT bytes.  Only the standardized SWC is
renderable.  The binary DAT files are retained as immutable provenance
receipts and are never parsed into boutons, synapses, membranes, or internal
cell structures.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import urllib.request
from pathlib import Path
from typing import Any

from build_neuromorpho_census import build_geometry, json_bytes, parse_swc_bytes


PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = PROJECT_ROOT / "public/data/functional_class_observed_morphology_route_pack_v1"
CONTRACT_PATH = PROJECT_ROOT / "data/functional-class-observed-morphology-route-pack-0.1.json"
CENSUS_INDEX_PATH = PROJECT_ROOT / "public/data/neuromorpho_release_8_6_124_census_v1/census-index.json"
RELEASE = "8.6.124"
SOURCE_FRAME = "NeuroMorpho_CNG_standardized_local_frame"
USER_AGENT = "OHRI-Open-Data-Functional-Class-Route-Pack/0.1"


SOURCE_OBJECTS: dict[int, dict[str, Any]] = {
    45674: {
        "name": "101029p2-A-In",
        "archive": "Bannatyne",
        "apiUrl": "https://neuromorpho.org/api/neuron/id/45674",
        "morphometryUrl": "https://neuromorpho.org/api/morphometry/id/45674",
        "swcUrl": "https://neuromorpho.org/dableFiles/bannatyne/CNG%20version/101029p2-A-In.CNG.swc",
        "datUrl": "https://neuromorpho.org/dableFiles/bannatyne/Source-Version/101029p2-A-In.dat",
        "receipts": {
            "api": (1528, "198e02202a92dd9e449afeb28fa61d2588e9cc1de242b127017091d075c8e1e3"),
            "morphometry": (472, "c05be11c388849f5d5190b9062e5765e2a5a2c3f441964b0d3b0520a898ab707"),
            "swc": (294364, "95b2fc29900a994ef87d6f50c07481115f94207c5ebaeb9f436e7e494edac1fd"),
            "dat": (353251, "9d5a8670fdb97656c18eb8819b3c4723f438fb8929e66ea8dc6103c6bb547d87"),
        },
        "expected": {
            "nodes": 6973,
            "segments": 6972,
            "types": {"1": 8, "2": 6247, "3": 718},
            "repositoryDimensions": [297.817, 363.353, 206.0],
        },
        "routeId": "mouse.sc.renshaw_l5_lamina_vii.observed.nmo_45674",
        "title": "Calbindin-positive glycinergic Renshaw interneuron",
        "phenotype": "Calbindin-positive, premotor, glycinergic Renshaw interneuron from L5 lamina VII",
        "transmitter": "inhibitory",
        "markerBasis": "official_metadata_calbindin_positive_premotor_glycinergic_Renshaw",
        "paperPreparationContext": "The primary paper reports recordings in 400 micrometre transverse L5 slices and later 50 micrometre serial resectioning of reconstructed material.",
        "preparationBoundary": "The repository reports a 50 micrometre horizontal section, whereas the paper reports 400 micrometre transverse recording slices followed by 50 micrometre serial resectioning; these stages must not be collapsed into one preparation claim.",
        "paperStrainContext": "GlyT2-EGFP mouse",
        "metadataConflictBoundary": "No object-level strain conflict was identified, but the unresolved Male/Female repository field is not an individual-sex assignment.",
        "identityBoundaryText": "The primary paper does not expose NeuroMorpho ID 45674 or filename 101029p2-A-In, so paper-level paired recordings, contact counts, conductances, and simulations cannot be assigned to this deposited object.",
    },
    50424: {
        "name": "C135-18-06-13-Ab",
        "archive": "Todd",
        "apiUrl": "https://neuromorpho.org/api/neuron/id/50424",
        "morphometryUrl": "https://neuromorpho.org/api/morphometry/id/50424",
        "swcUrl": "https://neuromorpho.org/dableFiles/todd/CNG%20version/C135-18-06-13-Ab.CNG.swc",
        "datUrl": "https://neuromorpho.org/dableFiles/todd/Source-Version/C135-18-06-13-Ab.dat",
        "receipts": {
            "api": (1490, "366903a183c6dcc6279314af3674a3057034d5f18275df11dca31d0117c70997"),
            "morphometry": (474, "4d69cb3ef59f104a399ad45b225211211d1ae2e7edcbc605f2aa7c51c0911e32"),
            "swc": (381795, "0cdb5c32555f94d2ffd1765d8c21f1f95703692c45917f2a2d2449ecc457138b"),
            "dat": (480757, "90662374ccfacc0404b1b8817161015fa52c6c384911700f428a4c5421cb79d9"),
        },
        "expected": {
            "nodes": 9805,
            "segments": 9804,
            "types": {"1": 3, "2": 8718, "3": 1084},
            "repositoryDimensions": [140.827, 606.848, 46.5],
        },
        "routeId": "mouse.sc.npy_l2i_dorsal_horn.observed.nmo_50424",
        "title": "NPY-positive superficial lumbar dorsal-horn interneuron",
        "phenotype": "NPY-positive interneuron from superficial lumbar dorsal horn / L2i",
        "transmitter": "inhibitory",
        "markerBasis": "official_metadata_NPY_positive_plus_primary_paper_inhibitory_population_context",
        "paperPreparationContext": "The primary paper studies NPY-expressing inhibitory interneurons with combined electrophysiology and morphology in parasagittal lumbar spinal slices.",
        "preparationBoundary": "The repository reports a 300 micrometre parasagittal section; this route retains that object-level metadata without inferring an atlas transform or complete whole-cell recovery.",
        "paperStrainContext": "B6.FvP-Tg(Npy-hrGFP)1Lowl/J maintained by crossing with C57BL/6",
        "metadataConflictBoundary": "The repository strain field is Swiss-Webster with a trailing space, whereas the paper describes an NPY-hrGFP/C57BL/6 background; repository weight bounds are also inverted at 27 to 15 grams. Exact strain and weight are unresolved and neither value is biologically interpreted.",
        "identityBoundaryText": "The primary paper does not expose NeuroMorpho ID 50424 or filename C135-18-06-13-Ab in its article text, so firing class, capsaicin response, inputs, projection targets, and other electrophysiology cannot be joined to this deposited object.",
    },
}

ROUTE_ORDER = [45674, 50424]


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


def receipt(path: Path, *, role: str, **extra: Any) -> dict[str, Any]:
    value = {
        "path": public_path(path),
        "bytes": path.stat().st_size,
        "sha256": sha256_path(path),
        "role": role,
    }
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


def source_path(neuron_id: int, kind: str) -> Path:
    directory = {
        "api": "api",
        "morphometry": "morphometry",
        "swc": "swc",
        "dat": "original",
    }[kind]
    extension = {"api": "json", "morphometry": "json", "swc": "swc", "dat": "dat"}[kind]
    suffix = "-morphometry" if kind == "morphometry" else ""
    return OUTPUT_ROOT / directory / f"nmo-{neuron_id}{suffix}.{extension}"


def materialize_sources(*, refresh: bool, seed_directory: Path | None) -> dict[int, dict[str, Path]]:
    paths: dict[int, dict[str, Path]] = {}
    for neuron_id, config in SOURCE_OBJECTS.items():
        paths[neuron_id] = {}
        for kind, url_key in [
            ("api", "apiUrl"),
            ("morphometry", "morphometryUrl"),
            ("swc", "swcUrl"),
            ("dat", "datUrl"),
        ]:
            output_path = source_path(neuron_id, kind)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            seed_name = {
                "api": f"nmo-{neuron_id}-api.json",
                "morphometry": f"nmo-{neuron_id}-morphometry.json",
                "swc": f"nmo-{neuron_id}.swc",
                "dat": f"nmo-{neuron_id}.dat",
            }[kind]
            if refresh:
                output_path.write_bytes(fetch(config[url_key]))
            elif seed_directory is not None and (seed_directory / seed_name).exists():
                shutil.copyfile(seed_directory / seed_name, output_path)
            elif not output_path.exists():
                raise FileNotFoundError(
                    f"Missing {output_path}. Use --refresh or provide --seed-directory containing {seed_name}."
                )
            body = output_path.read_bytes()
            expected_bytes, expected_sha256 = config["receipts"][kind]
            validate_pinned_bytes(
                body,
                expected_bytes=expected_bytes,
                expected_sha256=expected_sha256,
                label=f"NMO {neuron_id} {kind}",
            )
            paths[neuron_id][kind] = output_path
    return paths


def validate_official_objects(record: dict[str, Any], morphometry: dict[str, Any], neuron_id: int) -> None:
    config = SOURCE_OBJECTS[neuron_id]
    if record.get("neuron_id") != neuron_id or record.get("neuron_name") != config["name"]:
        raise ValueError(f"NMO {neuron_id}: official API identity drifted")
    if record.get("archive") != config["archive"]:
        raise ValueError(f"NMO {neuron_id}: archive drifted")
    if record.get("species") != "mouse" or "spinal cord" not in (record.get("brain_region") or []):
        raise ValueError(f"NMO {neuron_id}: mouse spinal-cord scope drifted")
    if record.get("domain") != "Dendrites, Soma, Axon":
        raise ValueError(f"NMO {neuron_id}: reconstruction domain drifted")
    if record.get("attributes") != "Diameter, 3D, Angles":
        raise ValueError(f"NMO {neuron_id}: diameter/dimensionality authority drifted")
    if record.get("physical_Integrity") != "Dendrites & Axon Moderate":
        raise ValueError(f"NMO {neuron_id}: physical-integrity boundary drifted")
    if morphometry.get("neuron_id") != neuron_id or morphometry.get("neuron_name") != config["name"]:
        raise ValueError(f"NMO {neuron_id}: morphometry identity drifted")
    dimensions = [morphometry.get("width"), morphometry.get("height"), morphometry.get("depth")]
    if dimensions != config["expected"]["repositoryDimensions"]:
        raise ValueError(f"NMO {neuron_id}: repository morphometry dimensions drifted")


def build_geometries(paths: dict[int, dict[str, Path]]) -> dict[int, dict[str, Any]]:
    geometry_directory = OUTPUT_ROOT / "geometry"
    geometry_directory.mkdir(parents=True, exist_ok=True)
    geometries: dict[int, dict[str, Any]] = {}
    for neuron_id in ROUTE_ORDER:
        record = json.loads(paths[neuron_id]["api"].read_text("utf-8"))
        morphometry = json.loads(paths[neuron_id]["morphometry"].read_text("utf-8"))
        validate_official_objects(record, morphometry, neuron_id)
        swc_body = paths[neuron_id]["swc"].read_bytes()
        parsed = parse_swc_bytes(swc_body, f"NeuroMorpho:{neuron_id}")
        expected = SOURCE_OBJECTS[neuron_id]["expected"]
        if len(parsed.nodes) != expected["nodes"] or parsed.segment_count != expected["segments"]:
            raise ValueError(f"NMO {neuron_id}: SWC node or segment count drifted")
        if parsed.node_type_counts != expected["types"]:
            raise ValueError(f"NMO {neuron_id}: SWC node-type counts drifted")
        geometry = build_geometry(
            record,
            swc_body,
            parsed,
            f"swc/nmo-{neuron_id}.swc",
            SOURCE_OBJECTS[neuron_id]["receipts"]["swc"][1],
        )
        dat_path = paths[neuron_id]["dat"]
        geometry["source"]["originalDatUrl"] = SOURCE_OBJECTS[neuron_id]["datUrl"]
        geometry["swc"]["originalMorphologyFile"] = {
            "value": {
                **receipt(dat_path, role="source_native_neurolucida_dat_receipt_only"),
                "format": "Neurolucida_V3_DAT_binary",
                "semanticAdmission": "not_parsed_not_rendered",
            },
            "missingReason": None,
        }
        geometry["nativeAnnotationPolicy"] = {
            "parserAvailable": False,
            "semanticObjectsAdmitted": 0,
            "renderedPrimitiveCount": 0,
            "reason": "No validated source-native DAT parser or object dictionary is part of this release.",
        }
        geometry_path = geometry_directory / f"nmo-{neuron_id}.json"
        geometry_path.write_bytes(json_bytes(geometry))
        geometries[neuron_id] = geometry
    return geometries


def radius_evidence(geometry: dict[str, Any]) -> dict[str, Any]:
    values = geometry["morphometrics"]["computedFromStandardizedSwc"]["radiusDerived"]["value"]
    return {
        "status": "OBSERVED_SOURCE_RADIUS",
        "minimumMicrometre": values["minimumMicrometre"],
        "maximumMicrometre": values["maximumMicrometre"],
        "meanMicrometre": values["meanMicrometre"],
        "missingReason": None,
    }


def fidelity_record(record: dict[str, Any], geometry: dict[str, Any], geometry_path: Path) -> dict[str, Any]:
    neuron_id = int(record["neuron_id"])
    computed = geometry["morphometrics"]["computedFromStandardizedSwc"]
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
            "sourceDiameterAvailable": True,
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
                "available": True,
                "authority": "DERIVED_FROM_OBSERVED_RADIUS",
                "missingReason": None,
            },
            "internalStructure": {
                "available": False,
                "authority": "UNAVAILABLE",
                "missingEvidence": [
                    "validated_native_DAT_semantics",
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
    config = SOURCE_OBJECTS[neuron_id]
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


def source_record(record: dict[str, Any], config: dict[str, Any]) -> dict[str, Any]:
    try:
        minimum_weight = float(record["min_weight"])
        maximum_weight = float(record["max_weight"])
    except (KeyError, TypeError, ValueError):
        minimum_weight = None
        maximum_weight = None
    weight_valid = (
        minimum_weight is not None
        and maximum_weight is not None
        and minimum_weight <= maximum_weight
    )
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
        "numericAge": {
            "minimum": float(record["min_age"]),
            "maximum": float(record["max_age"]),
            "scale": record["age_scale"],
        },
        "sex": record["gender"],
        "repositoryStrainRaw": record["strain"],
        "paperStrainContext": config["paperStrainContext"],
        "strainJoinStatus": config.get(
            "strainJoinStatus",
            "conflict_unresolved"
            if record["neuron_id"] == 50424
            else "context_consistent_not_individual_genotype_validation",
        ),
        "repositoryWeightGrams": {
            "minimum": minimum_weight,
            "maximum": maximum_weight,
            "validForBiologicalInterpretation": weight_valid,
            "missingOrInvalidReason": None if weight_valid else (
                "inverted_repository_bounds" if minimum_weight is not None and maximum_weight is not None else "not_reported"
            ),
        },
        "regionLabels": record["brain_region"],
        "cellTypeLabels": record["cell_type"],
        "condition": record["experiment_condition"],
        "protocol": record["protocol"],
        "repositorySlicingDirection": record["slicing_direction"],
        "repositorySlicingThicknessMicrometre": float(record["slicing_thickness"]),
        "paperPreparationContext": config["paperPreparationContext"],
        "preparationJoinStatus": config.get(
            "preparationJoinStatus",
            "context_only_not_exact_stage_equivalence",
        ),
        "reconstructionSoftware": record["reconstruction_software"],
        "stain": record["stain"],
        "domain": record["domain"],
        "physicalIntegrity": record["physical_Integrity"],
        "sourceAttributes": record["attributes"],
        "shrinkageReported": record["shrinkage_reported"],
        "shrinkageCorrected": record["shrinkage_corrected"],
        "sourcePaperDoi": record["reference_doi"][0],
        "sourcePaperPmid": record["reference_pmid"][0],
    }


def geometry_receipt(geometry: dict[str, Any], morphometry: dict[str, Any]) -> dict[str, Any]:
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
        "repositoryMorphometry": {
            "widthMicrometre": morphometry["width"],
            "heightMicrometre": morphometry["height"],
            "depthMicrometre": morphometry["depth"],
            "lengthMicrometre": morphometry["length"],
            "authority": "official_morphometry_endpoint",
            "extentDefinition": "95_percent_principal_component_extents",
            "equivalentToSwcBounds": False,
            "atlasRegistrationClaim": False,
        },
        "canonicalGeometrySha256": computed["canonicalGeometrySha256"],
        "topologySha256": computed["topologySha256"],
        "sourceDiameterAvailable": True,
    }


def route_boundaries(record: dict[str, Any], config: dict[str, Any], soma_count: int) -> list[str]:
    return [
        f"{config['title']} is one independent NeuroMorpho source object, not an average, archetype, molecular cluster, SCI entity, or morphology transferred from another record.",
        config["preparationBoundary"],
        f"The source reports {record['physical_Integrity']}; the observed type-2 axon and dendrites are incomplete and cannot establish a complete projection or whole-cell arbor.",
        f"The standardized SWC contains {soma_count} type-1 soma points. No native contour-to-SWC mapping is asserted, and these points are not a membrane, nucleus, or volumetric soma segmentation.",
        "Source-authorized radii permit a deterministic radius-derived display surface, but that surface is not an observed membrane, a segmentation, or an independent morphometric measurement.",
        f"Identity wording is limited to {config['markerBasis']}; no cross-study transcriptomic, peptide-abundance, or receptor-distribution identity is created.",
        config["metadataConflictBoundary"],
        config["identityBoundaryText"],
        "The original Neurolucida DAT is checksum-pinned as a provenance object but has no validated parser or admitted semantic objects in this release; apparent native annotations cannot be promoted to boutons, contacts, or synapses.",
        "Missing same-specimen membrane, nucleus, organelle, synapse, receptor-distribution, and ultrastructure evidence renders zero internal primitives.",
        "Source-local display scaling creates no atlas registration, cross-source identity, relationship to another route, or prevalence estimate.",
    ]


def build_contract(paths: dict[int, dict[str, Path]], geometries: dict[int, dict[str, Any]]) -> dict[str, Any]:
    census = json.loads(CENSUS_INDEX_PATH.read_text("utf-8"))
    census_ids = {record["neuronId"] for record in census["records"]}
    routes = []
    for neuron_id in ROUTE_ORDER:
        if neuron_id in census_ids:
            raise ValueError(f"NMO {neuron_id}: unexpectedly entered the frozen 142-record census")
        config = SOURCE_OBJECTS[neuron_id]
        record = json.loads(paths[neuron_id]["api"].read_text("utf-8"))
        morphometry = json.loads(paths[neuron_id]["morphometry"].read_text("utf-8"))
        geometry = geometries[neuron_id]
        geometry_path = OUTPUT_ROOT / "geometry" / f"nmo-{neuron_id}.json"
        soma_count = int(geometry["morphometrics"]["computedFromStandardizedSwc"]["nodeTypeCounts"].get("1", 0))
        routes.append(
            {
                "routeId": config["routeId"],
                "title": config["title"],
                "authority": "OBS_STANDARDIZED_SOURCE_LOCAL",
                "sourceAuthority": "PINNED_NEUROMORPHO_RELEASE_8_6_124_SOURCE_OBJECT",
                "censusMembership": False,
                "sourceRecord": source_record(record, config),
                "sourceObjects": {
                    "metadata": receipt(paths[neuron_id]["api"], role="official_api_snapshot"),
                    "morphometry": receipt(paths[neuron_id]["morphometry"], role="official_morphometry_snapshot"),
                    "geometry": receipt(
                        geometry_path,
                        role="source_local_lazy_geometry",
                        canonicalGeometrySha256=geometry["morphometrics"]["computedFromStandardizedSwc"]["canonicalGeometrySha256"],
                        topologySha256=geometry["morphometrics"]["computedFromStandardizedSwc"]["topologySha256"],
                    ),
                    "swc": receipt(paths[neuron_id]["swc"], role="standardized_source_local_swc"),
                    "originalDat": receipt(paths[neuron_id]["dat"], role="source_native_neurolucida_dat_receipt_only"),
                },
                "observedCellFormRecord": observed_cell_form(record, geometry),
                "fidelityRecord": fidelity_record(record, geometry, geometry_path),
                "geometryReceipt": geometry_receipt(geometry, morphometry),
                "somaStandardizationReceipt": {
                    "evidenceSource": "standardized_swc_type_1_nodes",
                    "standardizedSomaPointCount": soma_count,
                    "originalContourCount": None,
                    "nativeContourVerticesAdmitted": False,
                    "membraneClaim": False,
                },
                "nativeDatContract": {
                    "bundled": True,
                    "format": "Neurolucida_V3_DAT_binary",
                    "parsed": False,
                    "rendered": False,
                    "semanticObjectCountAdmitted": 0,
                    "renderedPrimitiveCount": 0,
                    "reason": "No validated source-native parser or object dictionary is included.",
                },
                "renderingContract": {
                    "observedSwc": {
                        "available": True,
                        "authority": "OBS_STANDARDIZED_SOURCE_LOCAL",
                        "representationStateId": "OBS_SKELETON",
                    },
                    "radiusSurface": {
                        "available": True,
                        "authority": "DERIVED_FROM_OBSERVED_RADIUS",
                        "representationStateId": "DER_RADIUS_SURFACE",
                        "membraneClaim": False,
                        "measurementUse": "forbidden",
                        "missingReason": None,
                    },
                    "sameSpecimenInternalStructure": {
                        "available": False,
                        "authority": "UNAVAILABLE",
                        "representationStateId": "UNAVAILABLE",
                        "renderedPrimitiveCount": 0,
                        "missingEvidence": [
                            "validated_native_DAT_semantics",
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
                    "sameCellElectrophysiologyJoinStatus": "not_established",
                    "paperMentionsExactNeuronIdOrFilename": False,
                    "selectedSciEntityRelationship": "none",
                    "molecularProfileRelationship": "none",
                    "otherMorphologyRelationship": "independent_record",
                    "crossSourceIdentityCount": 0,
                    "projectRegistrationCount": 0,
                    "coDisplayCreatesRelationship": False,
                },
                "sourceLinks": {
                    "officialRecord": f"https://neuromorpho.org/neuron_info.jsp?neuron_name={record['neuron_name']}",
                    "officialApi": config["apiUrl"],
                    "officialMorphometry": config["morphometryUrl"],
                    "standardizedSwc": config["swcUrl"],
                    "originalDat": config["datUrl"],
                    "primaryPaper": f"https://doi.org/{record['reference_doi'][0]}",
                    "rights": "https://neuromorpho.org/useterm.jsp",
                },
                "hardBoundaries": route_boundaries(record, config, soma_count),
            }
        )
    return {
        "schemaVersion": "0.1.0",
        "contractId": "functional-class-observed-morphology-route-pack-0.1",
        "releaseId": "ohri-functional-class-observed-morphology-route-pack-0.1.0",
        "releasedAt": "2026-08-31",
        "title": "Independent mouse spinal functional-class observed-morphology route pack",
        "purpose": "Expose exact Renshaw and NPY-positive source-local morphologies while preserving moderate-integrity, preparation, identity, native-DAT, registration, and internal-detail boundaries.",
        "repository": {
            "name": "NeuroMorpho.Org",
            "release": RELEASE,
            "rrid": "RRID:SCR_002145",
            "rights": "CC BY 4.0 subject to NeuroMorpho.Org Terms of Use and original-paper attribution",
            "rightsUrl": "https://neuromorpho.org/useterm.jsp",
        },
        "runtimeMergePolicy": {
            "frozenLegacyExemplarCount": 5,
            "preExistingNamedRouteCount": 5,
            "preMergeUniqueMainSceneNeuronCount": 8,
            "routePackRecordCount": 2,
            "overlappingActiveNeuronIds": [],
            "supplementaryNeuronIds": [45674, 50424],
            "deduplicateBy": "neuronId",
            "postMergeUniqueMainSceneNeuronCount": 10,
            "postMergeNamedRouteCount": 7,
            "postMergeNamedDorsalHornRouteCount": 6,
            "postMergeNamedVentralHornRouteCount": 1,
            "frozenCensusRecordCount": 142,
            "censusExpansionCount": 0,
        },
        "summary": {
            "routeCount": 2,
            "uniqueNeuronCount": 2,
            "existingCensusRecordCount": 0,
            "supplementaryRecordCount": 2,
            "sourceDiameterAvailableCount": 2,
            "observedAxonRouteCount": 2,
            "sourceCompleteAxonCount": 0,
            "originalDatReceiptCount": 2,
            "nativeDatSemanticAdmissionCount": 0,
            "sameCellElectrophysiologyJoinCount": 0,
            "sameSpecimenInternalStructureCount": 0,
            "renderedInternalPrimitiveCount": 0,
            "exactCrossSourceIdentityCount": 0,
            "projectRegistrationCount": 0,
        },
        "routes": routes,
        "packBoundaries": [
            "The two records are independent source objects and are never averaged, morphed, or treated as representative interneuron archetypes.",
            "Both records are supplementary exact NeuroMorpho objects and do not expand or rewrite the frozen 142-record census.",
            "Paper-level physiology and anatomy provide study context only because neither article exposes the exact NeuroMorpho ID or deposited filename.",
            "Repository morphometry width, height, and depth are 95-percent principal-component extents; they are not raw SWC bounds, anatomical axes, or an atlas registration.",
            "The NMO 50424 repository strain conflicts with the primary paper and its weight bounds are inverted; both conflicts remain explicit and unresolved.",
            "The bundled original DAT files are immutable provenance receipts, not admitted semantic geometry; no native annotation is rendered without a validated parser and object dictionary.",
            "Observed SWC radii permit only a labeled deterministic derivative, never an observed membrane, segmentation, or internal structure.",
            "Missing membranes, nuclei, organelles, synapses, receptors, ultrastructure, registration, and cross-source identity remain visibly unavailable and render zero primitives.",
            "NeuroMorpho.Org asset reuse terms do not transfer article-figure rights; no paper figure or microscopy panel is bundled.",
        ],
    }


def write_asset_manifest(paths: dict[int, dict[str, Path]]) -> dict[str, Any]:
    files = []
    for neuron_id in ROUTE_ORDER:
        for kind, path in [
            ("official_api_snapshot", paths[neuron_id]["api"]),
            ("official_morphometry_snapshot", paths[neuron_id]["morphometry"]),
            ("lazy_geometry", OUTPUT_ROOT / "geometry" / f"nmo-{neuron_id}.json"),
            ("source_native_dat_receipt_only", paths[neuron_id]["dat"]),
            ("standardized_swc", paths[neuron_id]["swc"]),
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
        "assetSetId": "neuromorpho:8.6.124:functional-class-observed-morphology-route-pack-v1",
        "repositoryRelease": RELEASE,
        "generatedAt": "2026-08-31",
        "summary": {
            "supplementaryNeuronCount": 2,
            "officialApiSnapshotCount": 2,
            "officialMorphometrySnapshotCount": 2,
            "standardizedSwcCount": 2,
            "sourceNativeDatReceiptCount": 2,
            "lazyGeometryCount": 2,
            "nativeDatSemanticAdmissionCount": 0,
            "fileCount": 10,
            "registrationCount": 0,
        },
        "files": files,
    }
    (OUTPUT_ROOT / "asset-manifest.json").write_bytes(json_bytes(manifest, pretty=True))
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--refresh", action="store_true", help="Refetch all pinned official source objects")
    parser.add_argument("--seed-directory", type=Path, help="Seed exact source bytes from an existing directory")
    args = parser.parse_args()
    paths = materialize_sources(refresh=args.refresh, seed_directory=args.seed_directory)
    geometries = build_geometries(paths)
    manifest = write_asset_manifest(paths)
    contract = build_contract(paths, geometries)
    CONTRACT_PATH.write_bytes(json_bytes(contract, pretty=True))
    print(
        json.dumps(
            {
                "releaseId": contract["releaseId"],
                "routeCount": contract["summary"]["routeCount"],
                "postMergeUniqueMainSceneNeuronCount": contract["runtimeMergePolicy"]["postMergeUniqueMainSceneNeuronCount"],
                "assetFileCount": manifest["summary"]["fileCount"],
                "nativeDatSemanticAdmissionCount": contract["summary"]["nativeDatSemanticAdmissionCount"],
                "internalPrimitiveCount": contract["summary"]["renderedInternalPrimitiveCount"],
                "censusExpansionCount": contract["runtimeMergePolicy"]["censusExpansionCount"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
