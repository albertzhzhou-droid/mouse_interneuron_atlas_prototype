#!/usr/bin/env python3
"""Build two exact PrP-reporter dorsal-horn morphology routes.

NMO 50394 and NMO 50408 are independent NeuroMorpho.Org source objects.
This delta-only builder reuses the validated functional-route materialization
helpers while pinning a separate asset directory and contract. Standardized
SWCs are renderable; source-native DAT files remain immutable provenance bytes
with zero admitted semantic objects or biological primitives.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import build_functional_class_observed_morphology_route_pack as base


PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = PROJECT_ROOT / "public/data/prp_dorsal_horn_observed_morphology_route_pack_v1"
CONTRACT_PATH = PROJECT_ROOT / "data/prp-dorsal-horn-observed-morphology-route-pack-0.1.json"

SOURCE_OBJECTS: dict[int, dict[str, Any]] = {
    50394: {
        "name": "C11-15-08-12-B",
        "archive": "Todd",
        "apiUrl": "https://neuromorpho.org/api/neuron/id/50394",
        "morphometryUrl": "https://neuromorpho.org/api/morphometry/id/50394",
        "swcUrl": "https://neuromorpho.org/dableFiles/todd/CNG%20version/C11-15-08-12-B.CNG.swc",
        "datUrl": "https://neuromorpho.org/dableFiles/todd/Source-Version/C11-15-08-12-B.dat",
        "receipts": {
            "api": (1542, "d5954d795e3a2308ae3bb7077d546766641b2e169c4be73f2bfdaa0c663081d1"),
            "morphometry": (469, "b2e1da4a3ae35e854969a16357c014851745b2c67020b372615a03de77ef9162"),
            "swc": (151317, "adeb2b0c6934ae07f32d54e8fcaebc8cee29429d884e44692756ee15da8a00d2"),
            "dat": (191975, "eceb6bc0cd2247e2ef2c51c6063b97db64d194d8483ef6d7427c715d9054a109"),
        },
        "expected": {
            "nodes": 4012,
            "segments": 4011,
            "types": {"1": 3, "2": 1520, "3": 2489},
            "repositoryDimensions": [80.2899, 313.59, 65.97],
        },
        "routeId": "mouse.sc.nnos_prp_l2i_dorsal_horn.observed.nmo_50394",
        "title": "PrP-promoter reporter-positive nNOS-positive interneuron",
        "phenotype": "PrP-promoter reporter-positive, nNOS-positive interneuron from superficial lumbar dorsal horn / L2i",
        "transmitter": "inhibitory",
        "markerBasis": "official_metadata_nNOS_positive_and_PrP_promoter_positive_with_paper_level_PrP_GFP_inhibitory_population_context",
        "paperPreparationContext": "Ganley et al. studied 4-6-week PrP-GFP mice of either sex. Routine recordings used 300 micrometre parasagittal slices; attached-root variants used 400 micrometre parasagittal or 500 micrometre transverse slices. Filled-cell scans were followed by 60 micrometre serial resectioning for deeper arbor recovery.",
        "preparationBoundary": "The repository reports a 300 micrometre parasagittal source object, matching one paper protocol, but the paper does not expose this filename as an object crosswalk. The later 60 micrometre serial resectioning is a separate recovery stage and must not be collapsed into the initial slice-thickness field.",
        "paperStrainContext": "PrP-GFP transgenic mouse line; the article does not expose a filename-keyed individual background or genotype record",
        "strainJoinStatus": "context_incomplete_not_individual_genotype_validation",
        "preparationJoinStatus": "context_consistent_not_exact_object_crosswalk",
        "metadataConflictBoundary": "The repository retains the raw strain value Swiss-Webster with a trailing space, while the paper identifies the PrP-GFP line without a filename-keyed individual background. The Male/Female field is cohort-valued rather than individual sex, and the deposited 27-to-15 gram weight bounds are inverted and invalid for biological interpretation.",
        "identityBoundaryText": "The official repository record supports nNOS-positive and PrP-promoter-positive object labels, but the paper does not expose NeuroMorpho ID 50394 or filename C11-15-08-12-B. Galanin negativity, firing properties, primary-afferent inputs, bouton contacts, projection targets, and other cohort findings cannot be assigned to this deposited object.",
    },
    50408: {
        "name": "C113-08-05-13-C",
        "archive": "Todd",
        "apiUrl": "https://neuromorpho.org/api/neuron/id/50408",
        "morphometryUrl": "https://neuromorpho.org/api/morphometry/id/50408",
        "swcUrl": "https://neuromorpho.org/dableFiles/todd/CNG%20version/C113-08-05-13-C.CNG.swc",
        "datUrl": "https://neuromorpho.org/dableFiles/todd/Source-Version/C113-08-05-13-C.dat",
        "receipts": {
            "api": (1515, "6d6be05370c9054aa0956ad3cdfb0ec94acfad560216b57da5d67fe5d32f2444"),
            "morphometry": (470, "9c849e5a828b99f37e215dc1b09856617a70b2ef1c0505ff3b81a151d028606d"),
            "swc": (222351, "452c2b3d76d9680318470ba16b5c271a403018a1c6dcedaa94b68f1fdec6c470"),
            "dat": (300076, "78cfeae785b8ab4cf0792e7223cf310cd4aef1e3caa3447aa14ca61421ed9cb2"),
        },
        "expected": {
            "nodes": 6125,
            "segments": 6124,
            "types": {"1": 4, "2": 3244, "3": 2877},
            "repositoryDimensions": [88.1899, 212.33, 56.48],
        },
        "routeId": "mouse.sc.galanin_prp_l2i_dorsal_horn.observed.nmo_50408",
        "title": "PrP-promoter reporter-positive galanin-positive interneuron",
        "phenotype": "PrP-promoter reporter-positive, galanin-positive interneuron from superficial lumbar dorsal horn / L2i",
        "transmitter": "inhibitory",
        "markerBasis": "official_metadata_galanin_expressing_and_PrP_promoter_positive_with_paper_level_PrP_GFP_inhibitory_population_context",
        "paperPreparationContext": "Ganley et al. studied 4-6-week PrP-GFP mice of either sex. Routine recordings used 300 micrometre parasagittal slices; attached-root variants used 400 micrometre parasagittal or 500 micrometre transverse slices. Filled-cell scans were followed by 60 micrometre serial resectioning for deeper arbor recovery.",
        "preparationBoundary": "The repository reports a 300 micrometre parasagittal source object, matching one paper protocol, but the paper does not expose this filename as an object crosswalk. The later 60 micrometre serial resectioning is a separate recovery stage and must not be collapsed into the initial slice-thickness field.",
        "paperStrainContext": "PrP-GFP transgenic mouse line; the article does not expose a filename-keyed individual background or genotype record",
        "strainJoinStatus": "context_incomplete_not_individual_genotype_validation",
        "preparationJoinStatus": "context_consistent_not_exact_object_crosswalk",
        "metadataConflictBoundary": "The repository retains the raw strain value Swiss-Webster with a trailing space, while the paper identifies the PrP-GFP line without a filename-keyed individual background. The Male/Female field is cohort-valued rather than individual sex, and the deposited 27-to-15 gram weight bounds are inverted and invalid for biological interpretation.",
        "identityBoundaryText": "The official repository record supports galanin-expressing and PrP-promoter-positive object labels, but the paper does not expose NeuroMorpho ID 50408 or filename C113-08-05-13-C. nNOS negativity, firing properties, primary-afferent inputs, bouton contacts, projection targets, and other cohort findings cannot be assigned to this deposited object.",
    },
}

ROUTE_ORDER = [50394, 50408]


def configure_base() -> None:
    base.OUTPUT_ROOT = OUTPUT_ROOT
    base.CONTRACT_PATH = CONTRACT_PATH
    base.SOURCE_OBJECTS = SOURCE_OBJECTS
    base.ROUTE_ORDER = ROUTE_ORDER
    base.USER_AGENT = "OHRI-Open-Data-PrP-Dorsal-Horn-Route-Pack/0.1"


def finalize_manifest(manifest: dict[str, Any]) -> dict[str, Any]:
    manifest["assetSetId"] = "neuromorpho:8.6.124:prp-dorsal-horn-observed-morphology-route-pack-v1"
    manifest["generatedAt"] = "2026-08-31"
    return manifest


def finalize_contract(contract: dict[str, Any]) -> dict[str, Any]:
    contract.update(
        {
            "schemaVersion": "0.1.0",
            "contractId": "prp-dorsal-horn-observed-morphology-route-pack-0.1",
            "releaseId": "ohri-prp-dorsal-horn-observed-morphology-route-pack-0.1.0",
            "releasedAt": "2026-08-31",
            "title": "Independent PrP-reporter mouse superficial dorsal-horn observed-morphology route pack",
            "purpose": "Expose exact nNOS-positive and galanin-positive PrP-promoter-reporter source-local morphologies while preserving moderate-integrity, preparation-stage, marker-exclusivity, native-DAT, physiology, registration, and internal-detail boundaries.",
        }
    )
    contract["runtimeMergePolicy"] = {
        "frozenLegacyExemplarCount": 5,
        "preExistingNamedRouteCount": 7,
        "preMergeUniqueMainSceneNeuronCount": 10,
        "routePackRecordCount": 2,
        "overlappingActiveNeuronIds": [],
        "supplementaryNeuronIds": ROUTE_ORDER,
        "deduplicateBy": "neuronId",
        "postMergeUniqueMainSceneNeuronCount": 12,
        "postMergeNamedRouteCount": 9,
        "postMergeNamedDorsalHornRouteCount": 8,
        "postMergeNamedVentralHornRouteCount": 1,
        "frozenCensusRecordCount": 142,
        "censusExpansionCount": 0,
    }
    contract["packBoundaries"] = [
        "The two records are independent source objects and are never averaged, morphed, or treated as representative nNOS, galanin, PrP-GFP, or inhibitory interneuron archetypes.",
        "Both records are supplementary exact NeuroMorpho objects and do not expand or rewrite the frozen 142-record census.",
        "The official repository record supplies each individual marker label. The paper supplies study context but exposes neither NeuroMorpho ID nor deposited filename, so it cannot create an exact physiology, synapse, input, output, or per-cell marker-exclusivity join.",
        "PrP-promoter-positive denotes the reporter context recorded by the repository; it is not a claim of endogenous PrP protein abundance in the reconstructed cell.",
        "nNOS-positive does not establish galanin-negative, and galanin-positive does not establish nNOS-negative.",
        "Repository morphometry width, height, and depth are 95-percent principal-component extents; they are not raw SWC bounds, native rostrocaudal/dorsoventral/mediolateral axes, or an atlas registration.",
        "The repository 300 micrometre parasagittal field matches one paper protocol, but the article provides no exact filename crosswalk. Subsequent 60 micrometre serial resectioning is a distinct recovery stage.",
        "The raw Swiss-Webster strain field, PrP-GFP study context, cohort-valued Male/Female field, and inverted 27-to-15 gram weight bounds remain explicit; no individual background, sex, or weight is inferred.",
        "The bundled original DAT files are immutable provenance receipts, not admitted semantic geometry; no native annotation is rendered without a validated parser and object dictionary.",
        "Observed SWC radii permit only a labelled deterministic derivative, never an observed membrane, segmentation, or internal structure.",
        "Moderate dendrite-and-axon integrity cannot establish a complete arbor. Missing membranes, nuclei, organelles, boutons, synapses, receptors, ultrastructure, registration, and cross-source identity remain unavailable and render zero primitives.",
        "NeuroMorpho.Org asset reuse terms do not transfer article-figure or accepted-manuscript redistribution rights; no paper text, figure, PDF, or microscopy panel is bundled.",
    ]
    return contract


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--refresh", action="store_true", help="Refetch all pinned official source objects")
    parser.add_argument("--seed-directory", type=Path, help="Seed exact source bytes from an existing directory")
    args = parser.parse_args()

    configure_base()
    paths = base.materialize_sources(refresh=args.refresh, seed_directory=args.seed_directory)
    geometries = base.build_geometries(paths)
    manifest = finalize_manifest(base.write_asset_manifest(paths))
    (OUTPUT_ROOT / "asset-manifest.json").write_bytes(base.json_bytes(manifest, pretty=True))
    contract = finalize_contract(base.build_contract(paths, geometries))
    CONTRACT_PATH.write_bytes(base.json_bytes(contract, pretty=True))
    print(
        json.dumps(
            {
                "releaseId": contract["releaseId"],
                "routeCount": contract["summary"]["routeCount"],
                "postMergeUniqueMainSceneNeuronCount": contract["runtimeMergePolicy"]["postMergeUniqueMainSceneNeuronCount"],
                "postMergeNamedRouteCount": contract["runtimeMergePolicy"]["postMergeNamedRouteCount"],
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
