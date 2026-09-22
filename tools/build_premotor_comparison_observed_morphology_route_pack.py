#!/usr/bin/env python3
"""Build one exact ventral-horn premotor comparison morphology route.

NMO 45718 is an independent NeuroMorpho.Org source object.  This delta-only
builder reuses the validated functional-route materialization helpers while
pinning a separate asset directory and contract.  The standardized SWC is the
only renderable source object; the source-native DAT remains an immutable
provenance receipt with zero admitted semantic objects or biological
primitives.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import build_functional_class_observed_morphology_route_pack as base


PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = PROJECT_ROOT / "public/data/premotor_comparison_observed_morphology_route_pack_v1"
CONTRACT_PATH = PROJECT_ROOT / "data/premotor-comparison-observed-morphology-route-pack-0.1.json"

SOURCE_OBJECTS: dict[int, dict[str, Any]] = {
    45718: {
        "name": "101026p1-A-In",
        "archive": "Bannatyne",
        "apiUrl": "https://neuromorpho.org/api/neuron/id/45718",
        "morphometryUrl": "https://neuromorpho.org/api/morphometry/id/45718",
        "swcUrl": "https://neuromorpho.org/dableFiles/bannatyne/CNG%20version/101026p1-A-In.CNG.swc",
        "datUrl": "https://neuromorpho.org/dableFiles/bannatyne/Source-Version/101026p1-A-In.dat",
        "receipts": {
            "api": (1513, "ac769a76e959d093a0468d345356256627b0ccd5536334f7b943734521b55407"),
            "morphometry": (473, "d999e37d9b94650415fd50e795ff0b43af24045e95a87c43c1b5e2ee57dda38a"),
            "swc": (214337, "c8926708a1350c58124c47ebee8167820b8e0bd568bcb676e90e34f3ca6dfaee"),
            "dat": (343774, "ae5f3122dfcebfa06f3e69351670ab6428ed61d4a2bc24f099edc98e62f69415"),
        },
        "expected": {
            "nodes": 5636,
            "segments": 5635,
            "types": {"1": 8, "2": 4237, "3": 1391},
            "repositoryDimensions": [583.793, 482.994, 212.0],
        },
        "routeId": "mouse.sc.repository_labeled_premotor_non_renshaw_l5_ventral_horn.observed.nmo_45718",
        "title": "Repository-labelled calbindin-negative glycinergic premotor / non-Renshaw interneuron",
        "phenotype": "Repository-labelled calbindin-negative, glycinergic, premotor / non-Renshaw interneuron from the L5 ventral horn",
        "transmitter": "inhibitory",
        "markerBasis": "official_repository_metadata_calbindin_negative_glycinergic_pre_motor_non_renshaw_labels_only",
        "paperPreparationContext": "Bhumbra et al. studied both Renshaw-cell and non-Renshaw glycinergic premotor-interneuron-motoneuron paired recordings in P8-P14 GlyT2-EGFP mice; the article reports 400 micrometre transverse L5 recording slices followed by 50 micrometre serial resectioning, but provides no NMO or filename crosswalk.",
        "preparationBoundary": "The raw repository fields are slicing_direction=horizontal and slicing_thickness=50 micrometres. The article separately describes 400 micrometre transverse recording slices followed by 50 micrometre serial resectioning and exposes neither NMO 45718 nor filename 101026p1-A-In, so the fields cannot be assigned to a specific paper stage or interpreted as one 50 micrometre source slab.",
        "paperStrainContext": "GlyT2-EGFP mouse study context; the article exposes no filename-keyed individual genotype record for NMO 45718",
        "strainJoinStatus": "context_consistent_not_individual_genotype_validation",
        "preparationJoinStatus": "context_only_not_exact_stage_equivalence",
        "metadataConflictBoundary": "The repository retains GlyT2-EGFP, P9, cohort-valued Male/Female and no reported weight. Male/Female is not an individual-sex assignment, and missing weight is not imputed.",
        "identityBoundaryText": "The official repository record assigns calbindin-negative, glycinergic, pre-motor and non-renshaw labels to NMO 45718. The primary article exposes neither this NeuroMorpho ID nor filename 101026p1-A-In; it also notes that absent calbindin detection in four cells in the Renshaw-cell area could reflect washout and that non-Renshaw glycinergic cells are not necessarily premotor. The repository annotation is therefore not promoted to an independently verified molecular result, premotor identity or Renshaw exclusion, and no paired physiology, contact or projection result is joined to this object.",
    },
}

ROUTE_ORDER = [45718]


def configure_base() -> None:
    base.OUTPUT_ROOT = OUTPUT_ROOT
    base.CONTRACT_PATH = CONTRACT_PATH
    base.SOURCE_OBJECTS = SOURCE_OBJECTS
    base.ROUTE_ORDER = ROUTE_ORDER
    base.USER_AGENT = "OHRI-Open-Data-Premotor-Comparison-Route-Pack/0.1"


def finalize_manifest(manifest: dict[str, Any]) -> dict[str, Any]:
    manifest["assetSetId"] = "neuromorpho:8.6.124:premotor-comparison-observed-morphology-route-pack-v1"
    manifest["generatedAt"] = "2026-08-31"
    manifest["summary"] = {
        "supplementaryNeuronCount": 1,
        "officialApiSnapshotCount": 1,
        "officialMorphometrySnapshotCount": 1,
        "standardizedSwcCount": 1,
        "sourceNativeDatReceiptCount": 1,
        "lazyGeometryCount": 1,
        "nativeDatSemanticAdmissionCount": 0,
        "fileCount": 5,
        "registrationCount": 0,
    }
    return manifest


def finalize_contract(contract: dict[str, Any]) -> dict[str, Any]:
    contract.update(
        {
            "schemaVersion": "0.1.0",
            "contractId": "premotor-comparison-observed-morphology-route-pack-0.1",
            "releaseId": "ohri-premotor-comparison-observed-morphology-route-pack-0.1.0",
            "releasedAt": "2026-08-31",
            "title": "Independent mouse ventral-horn premotor comparison observed-morphology route pack",
            "purpose": "Expose exact NMO 45718 as one source-local ventral-horn comparison morphology while preserving repository-label, preparation-stage, native-DAT, physiology, registration and internal-detail boundaries.",
        }
    )
    contract["runtimeMergePolicy"] = {
        "frozenLegacyExemplarCount": 5,
        "preExistingNamedRouteCount": 9,
        "preMergeUniqueMainSceneNeuronCount": 12,
        "routePackRecordCount": 1,
        "overlappingActiveNeuronIds": [],
        "supplementaryNeuronIds": ROUTE_ORDER,
        "deduplicateBy": "neuronId",
        "postMergeUniqueMainSceneNeuronCount": 13,
        "postMergeNamedRouteCount": 10,
        "postMergeNamedDorsalHornRouteCount": 8,
        "postMergeNamedVentralHornRouteCount": 2,
        "frozenCensusRecordCount": 142,
        "censusExpansionCount": 0,
    }
    contract["summary"] = {
        "routeCount": 1,
        "uniqueNeuronCount": 1,
        "existingCensusRecordCount": 0,
        "supplementaryRecordCount": 1,
        "sourceDiameterAvailableCount": 1,
        "observedAxonRouteCount": 1,
        "sourceCompleteAxonCount": 0,
        "originalDatReceiptCount": 1,
        "nativeDatSemanticAdmissionCount": 0,
        "sameCellElectrophysiologyJoinCount": 0,
        "sameSpecimenInternalStructureCount": 0,
        "renderedInternalPrimitiveCount": 0,
        "exactCrossSourceIdentityCount": 0,
        "projectRegistrationCount": 0,
    }
    route = contract["routes"][0]
    route["somaStandardizationReceipt"] = {
        "evidenceSource": "standardized_swc_header_and_type_1_nodes",
        "standardizedSomaPointCount": 8,
        "originalContourCount": 8,
        "standardizationStatement": "The original file has 8 soma contours that are averaged into 8 soma points",
        "nativeContourVerticesAdmitted": False,
        "membraneClaim": False,
    }
    route["hardBoundaries"] = [
        boundary
        for boundary in route["hardBoundaries"]
        if not boundary.startswith("The standardized SWC contains")
    ]
    route["hardBoundaries"].extend(
        [
            "The standardized SWC header states that 8 original soma contours were averaged into 8 type-1 soma points. This documents a contour-to-point standardization step only; original contour vertices are unavailable and the points are not a membrane, nucleus or volumetric soma segmentation.",
            "The paper reports that failure to detect calbindin in four cells in the Renshaw-cell area could reflect washout, and that non-Renshaw glycinergic cells are not necessarily premotor. With no NMO or filename crosswalk, neither observation can be assigned to NMO 45718.",
            "The repository says shrinkage was reported and not corrected, but supplies no numeric reported or corrected values. Source coordinates are not shrinkage-restored in-vivo dimensions.",
            "The SWC z extent, repository slicing fields and official principal-component morphometry describe different source representations and must not be compared as a tissue-thickness or anatomical-axis measurement.",
        ]
    )
    contract["packBoundaries"] = [
        "NMO 45718 is one independent source object and is never averaged, morphed or treated as a representative premotor, non-Renshaw, glycinergic or ventral-horn archetype.",
        "The record is a supplementary exact NeuroMorpho object and does not expand or rewrite the frozen 142-record census.",
        "Calbindin-negative, glycinergic, pre-motor and non-renshaw are retained as official repository labels. They are not upgraded into a paper-keyed molecular assay, functional classification or independently verified Renshaw exclusion.",
        "The primary article supplies study context but exposes neither NMO 45718 nor filename 101026p1-A-In, so it creates no exact physiology, connectivity, contact-count, projection or per-cell genotype join.",
        "The article's calbindin-washout caveat and statement that non-Renshaw glycinergic cells are not necessarily premotor prevent the repository labels from becoming definitive molecular or functional exclusions.",
        "Repository morphometry width, height and depth are 95-percent principal-component extents; they are not raw SWC bounds, anatomical axes or an atlas registration.",
        "Raw repository fields slicing_direction=horizontal and slicing_thickness=50 micrometres remain distinct from the article's 400 micrometre transverse recording slice and later 50 micrometre serial resectioning; they do not prove one 50 micrometre source slab.",
        "The SWC header documents 8 original soma contours averaged into 8 type-1 soma points. This is a standardization receipt, not preservation of native contour vertices or evidence for a membrane, nucleus or volumetric soma.",
        "Reported-but-uncorrected shrinkage with no numeric values forbids treating source coordinates as shrinkage-restored in-vivo dimensions.",
        "The bundled original DAT is an immutable provenance receipt, not admitted semantic geometry; no native annotation is rendered without a validated parser and object dictionary.",
        "Observed SWC radii permit only a labelled deterministic derivative, never an observed membrane, segmentation or internal structure.",
        "Moderate dendrite-and-axon integrity cannot establish a complete arbor. Missing membrane, nucleus, organelles, boutons, synapses, receptors, ultrastructure, registration and cross-source identity remain unavailable and render zero primitives.",
        "NeuroMorpho.Org asset reuse terms do not transfer article-figure or manuscript redistribution rights; no paper text, figure, PDF or microscopy panel is bundled.",
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
