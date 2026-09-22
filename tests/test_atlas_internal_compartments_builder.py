import unittest
from tempfile import TemporaryDirectory
from pathlib import Path

import numpy as np

from tools.build_atlas_reference import (
    ALL_DIRECT_STRUCTURE_SPECS,
    DEFAULT_Z_INDICES,
    FINE_ANATOMY_STRUCTURES,
    MOTOR_CONTEXT_STRUCTURES,
    STRUCTURAL_CONTEXT_STRUCTURES,
    TARGET_INTERNAL_STRUCTURES,
    boundary_polygons_from_component,
    build_fine_anatomy,
    build_internal_compartments,
    connected_components_4,
    parse_identifier_path,
    read_terminology_rows,
    split_closed_walk_at_repeated_vertices,
    write_fine_anatomy_fill_overlays,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]
TERMINOLOGY_PATH = (
    PROJECT_ROOT / "public/data/allen_cord_20um_v3_0/terminology.csv"
)


class AtlasInternalCompartmentBuilderTest(unittest.TestCase):
    def test_connected_components_never_bridge_bilateral_or_diagonal_masks(self):
        mask = np.asarray(
            [
                [1, 0, 0, 0, 1],
                [1, 0, 0, 1, 0],
                [0, 0, 1, 1, 0],
            ],
            dtype=bool,
        )
        components = connected_components_4(mask)
        self.assertEqual([len(component) for component in components], [2, 1, 3])
        self.assertEqual(components[0][0], (0, 0))
        self.assertEqual(components[1][0], (0, 4))
        self.assertEqual(components[2][0], (1, 3))

    def test_boundary_polygons_preserve_holes_and_exact_mask_area(self):
        mask = np.asarray(
            [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1],
            ],
            dtype=bool,
        )
        component = connected_components_4(mask)[0]
        polygons = boundary_polygons_from_component(component)
        self.assertEqual([polygon["role"] for polygon in polygons], ["exterior", "hole"])
        self.assertEqual(sum(polygon["signedAreaVoxel2"] for polygon in polygons), 8)
        self.assertTrue(
            all(
                polygon["pointsVoxelEdgeXY"][0]
                == polygon["pointsVoxelEdgeXY"][-1]
                for polygon in polygons
            )
        )

    def test_corner_touching_walk_is_split_into_simple_closed_rings(self):
        walk = [
            (0, 0),
            (4, 0),
            (4, 4),
            (2, 4),
            (2, 2),
            (1, 2),
            (1, 3),
            (2, 3),
            (2, 4),
            (0, 4),
            (0, 0),
        ]
        rings = split_closed_walk_at_repeated_vertices(walk)
        self.assertEqual(len(rings), 2)
        self.assertTrue(all(ring[0] == ring[-1] for ring in rings))
        self.assertTrue(
            all(len(set(ring[:-1])) == len(ring) - 1 for ring in rings)
        )

    def test_build_preserves_target_ids_source_paths_and_missing_planes(self):
        terminology_rows = read_terminology_rows(TERMINOLOGY_PATH)
        annotation = np.zeros((max(DEFAULT_Z_INDICES) + 1, 8, 12), dtype=np.int16)
        first_plane = DEFAULT_Z_INDICES[0]
        for offset, spec in enumerate(TARGET_INTERNAL_STRUCTURES):
            if spec["identifier"] == 16:
                continue
            annotation[first_plane, 1 + offset, 1] = spec["identifier"]
        annotation[first_plane, 1, 10] = 90

        asset = build_internal_compartments(
            annotation,
            terminology_rows,
            list(DEFAULT_Z_INDICES),
        )
        self.assertEqual(asset["geometryStatus"], "INF")
        self.assertEqual(asset["measurementUse"], "forbidden")
        self.assertEqual(asset["registrationCount"], 0)
        self.assertEqual(asset["sampledZIndices"], list(DEFAULT_Z_INDICES))
        self.assertEqual(
            [structure["identifier"] for structure in asset["structures"]],
            [90, 100, 110, 16, 74, 75, 70],
        )

        dorsal_horn = asset["structures"][0]
        self.assertEqual(dorsal_horn["rootIdentifierPath"], [250, 71, 90])
        self.assertEqual(len(dorsal_horn["planes"][0]["components"]), 2)
        central_canal = next(
            structure for structure in asset["structures"] if structure["identifier"] == 16
        )
        self.assertEqual(len(central_canal["includedSourceLabels"]), 1)
        self.assertTrue(
            all(
                plane["presence"] == "missing"
                and plane["missingReason"] == "source_mask_absent_at_sampled_plane"
                and plane["components"] == []
                for plane in central_canal["planes"]
            )
        )
        self.assertTrue(
            all(
                plane["segment"]
                == {"value": None, "missingReason": "pending_curation"}
                for structure in asset["structures"]
                for plane in structure["planes"]
            )
        )

    def test_rejects_malformed_terminology_paths(self):
        self.assertEqual(parse_identifier_path("[250, 71, 90]"), [250, 71, 90])
        with self.assertRaisesRegex(ValueError, "Invalid root_identifier_path"):
            parse_identifier_path("250/71/90")

    def test_fine_anatomy_uses_only_exact_source_ids_and_explicit_missingness(self):
        terminology_rows = read_terminology_rows(TERMINOLOGY_PATH)
        annotation = np.zeros(
            (max(DEFAULT_Z_INDICES) + 1, len(ALL_DIRECT_STRUCTURE_SPECS) + 2, 8),
            dtype=np.int16,
        )
        first_plane = DEFAULT_Z_INDICES[0]
        for offset, spec in enumerate(ALL_DIRECT_STRUCTURE_SPECS):
            annotation[:, offset + 1, 1] = spec["identifier"]
        # Create a second contiguous exact source state: the first fine label is
        # present only at z=0, while every direct leaf remains present somewhere.
        annotation[1:, 1, 1] = 0
        annotation[first_plane, 1, 6] = FINE_ANATOMY_STRUCTURES[0]["identifier"]

        asset = build_fine_anatomy(
            annotation,
            terminology_rows,
            list(DEFAULT_Z_INDICES),
            expected_source_state_count=2,
        )

        self.assertEqual(asset["geometryStatus"], "INF")
        self.assertEqual(asset["measurementUse"], "forbidden")
        self.assertEqual(asset["registrationCount"], 0)
        self.assertEqual(asset["samplingSummary"]["structureCount"], 37)
        self.assertEqual(asset["sourceInventory"]["directLeafCount"], 73)
        self.assertEqual(
            asset["sourceInventory"]["annotationNonzeroIdentifiers"],
            asset["sourceInventory"]["directLeafIdentifiers"],
        )
        self.assertTrue(asset["sourceInventory"]["directLeafEqualityValidated"])
        self.assertEqual(asset["sourceInventory"]["hierarchyOnlyDirectVoxelCount"], 0)
        self.assertEqual(asset["sourceStateCoverage"]["distinctSourceStateCount"], 2)
        self.assertEqual(asset["sourceStateCoverage"]["coveredDistinctStateCount"], 2)
        self.assertTrue(asset["sourceStateCoverage"]["allSourceStatesCovered"])
        self.assertEqual(asset["lanePolicy"]["structuralContextStructureCount"], 3)
        self.assertEqual(asset["lanePolicy"]["motorContextStructureCount"], 33)
        self.assertEqual(asset["lanePolicy"]["allDirectStructureCount"], 73)
        self.assertEqual(asset["lanePolicy"]["motorContextDefaultVisibility"], "off")
        self.assertFalse(asset["lanePolicy"]["atlasRegionCountsAreInterneuronCounts"])
        self.assertFalse(asset["lanePolicy"]["motorContextIncludedInInterneuronCounts"])
        self.assertEqual(
            asset["samplingSummary"]["categoryCounts"],
            {"lamina": 14, "nucleus_or_column": 17, "tract": 6},
        )
        self.assertEqual(
            [structure["identifier"] for structure in asset["structures"]],
            [spec["identifier"] for spec in FINE_ANATOMY_STRUCTURES],
        )
        self.assertEqual(
            [structure["identifier"] for structure in asset["structuralContextStructures"]],
            [spec["identifier"] for spec in STRUCTURAL_CONTEXT_STRUCTURES],
        )
        self.assertEqual(
            [structure["identifier"] for structure in asset["motorContextStructures"]],
            [spec["identifier"] for spec in MOTOR_CONTEXT_STRUCTURES],
        )
        self.assertTrue(
            all(structure["selectionMode"] == "exact_identifier" for structure in asset["structures"])
        )
        self.assertTrue(
            all(
                120 not in structure["rootIdentifierPath"]
                for structure in asset["structures"]
            )
        )
        self.assertEqual(len(asset["structures"][0]["planes"][0]["components"]), 2)
        self.assertTrue(all(
            plane["presence"] == "missing"
            and plane["missingReason"] == "source_mask_absent_at_sampled_plane"
            for plane in asset["structures"][0]["planes"][1:]
        ))
        self.assertTrue(all(
            plane["presence"] == "present"
            for structure in asset["structures"][1:]
            for plane in structure["planes"]
        ))

        with TemporaryDirectory() as temporary_directory:
            lanes, file_declarations = write_fine_anatomy_fill_overlays(
                annotation,
                terminology_rows,
                list(DEFAULT_Z_INDICES),
                Path(temporary_directory),
            )
            self.assertEqual(len(lanes), 2)
            self.assertEqual(len(file_declarations), 76)
            self.assertEqual(
                [lane["includedInInterneuronCounts"] for lane in lanes],
                [False, False],
            )
            self.assertEqual(
                [lane["defaultVisibility"] for lane in lanes],
                ["on", "off"],
            )
            self.assertEqual(lanes[0]["overlays"][0]["opaqueVoxelCount"], 41)
            self.assertEqual(lanes[0]["overlays"][1]["opaqueVoxelCount"], 39)
            self.assertEqual(lanes[1]["overlays"][0]["opaqueVoxelCount"], 33)
            self.assertTrue(all(
                (Path(temporary_directory) / declaration["path"]).is_file()
                for declaration in file_declarations
            ))


if __name__ == "__main__":
    unittest.main()
