#!/usr/bin/env python3
"""Validate and package five unregistered NeuroMorpho morphology exemplars.

Raw SWC coordinates are preserved.  A separate soma-centred display transform
is emitted for the localhost viewer; it is never described as atlas placement.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import shutil
import urllib.request
from dataclasses import dataclass
from pathlib import Path


NEUROMORPHO_RELEASE = "8.6.124"
USER_AGENT = "OHRI-Research-MVP/0.2 (local research asset builder)"


@dataclass(frozen=True)
class Spec:
    neuron_id: int
    name: str
    swc_url: str
    expected_sha256: str
    phenotype: str
    transmitter: str
    brain_region: list[str]
    strain: str
    sex: str
    age: dict
    domain: str
    physical_integrity: str
    doi: str
    pmid: str


SPECS = (
    Spec(
        104003,
        "SST2A-GFP-SST-VGLUT2-cell-13",
        "https://neuromorpho.org/dableFiles/todd/CNG%20version/SST2A-GFP-SST-VGLUT2-cell-13.CNG.swc",
        "0f24943c43854cbe48f8bebfd4b45b905a5f897580d4dc25fd55c8ec9c4b8d8d",
        "Dynorphin-expressing inhibitory interneuron",
        "inhibitory",
        ["spinal cord", "lumbar", "mid-lumbar", "dorsal horn"],
        "B6;129S-Pdyntm1.1(cre)Mjkr/LowlJ",
        "female",
        {"value": None, "missingReason": "not_reported"},
        "Dendrites, Soma, No Axon",
        "Dendrites Moderate",
        "10.1038/s41593-018-0119-z",
        "29556030",
    ),
    Spec(
        108974,
        "cell-17_7",
        "https://neuromorpho.org/dableFiles/todd/CNG%20version/cell-17_7.CNG.swc",
        "0fc8e7050e455ed1f79fa5a8e4da304c69054fb5ddd0167fcb3970c5d4c0982d",
        "Substance P-expressing excitatory interneuron",
        "excitatory",
        ["spinal cord", "lumbar", "mid-lumbar", "dorsal horn"],
        "Tac1-IRES2-Cre-D",
        "male_or_female",
        {"value": None, "missingReason": "not_reported"},
        "Dendrites, Soma, No Axon",
        "Dendrites Complete",
        "10.1097/j.pain.0000000000001406",
        "30247267",
    ),
    Spec(
        109005,
        "26-11-14-A-A6",
        "https://neuromorpho.org/dableFiles/todd/CNG%20version/26-11-14-A-A6.CNG.swc",
        "3f74c3796e9992b63dabb4f9c8430695658f35bd03f824bb47a58ce1c625726e",
        "GRP-expressing excitatory interneuron",
        "excitatory",
        ["spinal cord", "lumbar", "mid-lumbar", "dorsal horn"],
        "Tg(Grp-EGFP)DV197Gsat",
        "male_or_female",
        {"value": None, "missingReason": "not_reported"},
        "Dendrites, Soma, Axon",
        "Dendrites & Axon Moderate",
        "10.1097/j.pain.0000000000001406",
        "30247267",
    ),
    Spec(
        242822,
        "19-7-18B-L3-Cell1-file-2",
        "https://neuromorpho.org/dableFiles/todd/CNG%20version/19-7-18B-L3-Cell1-file-2.CNG.swc",
        "2bbb7f6abb138a5eaed2aa2300fb80ef12c1f73f77d5702dcd66032b9504a742",
        "Substance P-expressing radial excitatory interneuron",
        "excitatory",
        ["spinal cord", "lumbar", "L2"],
        "Tac1-IRES2-Cre-D",
        "male_or_female",
        {"value": None, "missingReason": "not_reported"},
        "Dendrites, Soma, No Axon",
        "Dendrites Complete",
        "10.1016/j.neuroscience.2020.06.038",
        "32634530",
    ),
    Spec(
        260150,
        "100521A-S14_set5_cell11",
        "https://neuromorpho.org/dableFiles/todd/CNG%20version/100521A-S14_set5_cell11.CNG.swc",
        "ac078ee88e43cc9831544be2242c24ac6212d26cf7c9a237a3597314a5e27f7f",
        "NPFF-positive vertical excitatory interneuron",
        "excitatory",
        ["spinal cord", "L1-L2", "dorsal horn", "superficial"],
        "NPFFCre",
        "male_or_female",
        {"value": "P35-P84", "missingReason": None},
        "Dendrites, Soma, No Axon",
        "Dendrites Complete",
        "10.1038/s41598-023-32720-3",
        "37041197",
    ),
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def download(url: str, target: Path) -> None:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60) as response, target.open("wb") as out:
        shutil.copyfileobj(response, out)


def parse_swc(path: Path):
    nodes: dict[int, tuple[int, float, float, float, float, int]] = {}
    for line_number, raw in enumerate(path.read_text(errors="replace").splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        fields = line.split()
        if len(fields) != 7:
            raise ValueError(f"{path}:{line_number}: expected 7 columns")
        node_id, node_type, parent = int(fields[0]), int(fields[1]), int(fields[6])
        values = tuple(float(value) for value in fields[2:6])
        if node_id in nodes:
            raise ValueError(f"{path}:{line_number}: duplicate node {node_id}")
        if not all(math.isfinite(value) for value in values):
            raise ValueError(f"{path}:{line_number}: non-finite coordinate/radius")
        x, y, z, radius = values
        if radius <= 0:
            raise ValueError(f"{path}:{line_number}: non-positive radius")
        nodes[node_id] = (node_type, x, y, z, radius, parent)

    roots = [node_id for node_id, node in nodes.items() if node[5] == -1]
    if len(roots) != 1:
        raise ValueError(f"{path}: expected one root, found {len(roots)}")
    for node_id, node in nodes.items():
        if node[5] != -1 and node[5] not in nodes:
            raise ValueError(f"{path}: missing parent {node[5]} for {node_id}")
        seen: set[int] = set()
        cursor = node_id
        while cursor != -1:
            if cursor in seen:
                raise ValueError(f"{path}: cycle at {cursor}")
            seen.add(cursor)
            cursor = nodes[cursor][5]

    root = nodes[roots[0]]
    origin = (root[1], root[2], root[3])
    coordinates = [(node[1], node[2], node[3]) for node in nodes.values()]
    mins = [min(values[index] for values in coordinates) for index in range(3)]
    maxs = [max(values[index] for values in coordinates) for index in range(3)]
    span = max(maxs[index] - mins[index] for index in range(3))
    display_scale = 6.0 / span if span else 1.0
    segments = []
    zero_length_edges = 0
    for node_id, node in nodes.items():
        parent_id = node[5]
        if parent_id == -1:
            continue
        parent = nodes[parent_id]
        start = [round((node[index] - origin[index - 1]) * display_scale, 5) for index in (1, 2, 3)]
        end = [round((parent[index] - origin[index - 1]) * display_scale, 5) for index in (1, 2, 3)]
        if start == end:
            zero_length_edges += 1
        segments.append(start + end + [node[0]])
    return nodes, roots[0], mins, maxs, display_scale, segments, zero_length_edges


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("public/data/neuromorpho_release_8_6_124"),
    )
    parser.add_argument("--source-cache", type=Path, default=Path("/private/tmp"))
    args = parser.parse_args()
    swc_output = args.output / "swc"
    swc_output.mkdir(parents=True, exist_ok=True)

    morphology_payload = []
    manifest_records = []
    for spec in SPECS:
        cached = args.source_cache / f"nmo-{spec.neuron_id}.swc"
        target = swc_output / f"nmo-{spec.neuron_id}.swc"
        if cached.exists():
            shutil.copy2(cached, target)
        else:
            download(spec.swc_url, target)
        actual_sha = sha256(target)
        if actual_sha != spec.expected_sha256:
            raise SystemExit(
                f"SHA mismatch for {spec.neuron_id}: expected {spec.expected_sha256}, got {actual_sha}"
            )
        nodes, root_id, mins, maxs, scale, segments, zero_edges = parse_swc(target)
        has_axon = any(node[0] == 2 for node in nodes.values())
        if has_axon != ("Axon" in spec.domain and "No Axon" not in spec.domain):
            raise SystemExit(f"Domain/type mismatch for {spec.neuron_id}")

        common = {
            "assetId": f"NeuroMorpho:{spec.neuron_id}",
            "neuronId": spec.neuron_id,
            "name": spec.name,
            "species": "Mus musculus",
            "lifeStage": "adult",
            "phenotype": spec.phenotype,
            "transmitter": spec.transmitter,
            "brainRegion": spec.brain_region,
            "strain": spec.strain,
            "sex": spec.sex,
            "reportedAge": spec.age,
            "domain": spec.domain,
            "physicalIntegrity": spec.physical_integrity,
            "sourceFrame": "NeuroMorpho_CNG_standardized_local_frame",
            "units": "micrometre_reported_by_source",
            "geometryStatus": "OBS",
            "registrationStatus": "unregistered",
            "atlasTransform": {"value": None, "missingReason": "asset_unavailable"},
            "atlasPlacement": {"value": None, "missingReason": "out_of_scope"},
            "scientificUse": "morphology_illustration_only_not_spatial_query",
            "sourceUrl": f"https://neuromorpho.org/api/neuron/id/{spec.neuron_id}",
            "swcUrl": spec.swc_url,
            "sourcePaper": {"doi": spec.doi, "pmid": spec.pmid},
            "sha256": actual_sha,
            "bytes": target.stat().st_size,
            "nodeCount": len(nodes),
            "rootNodeId": root_id,
            "boundsMicrometre": {"min": mins, "max": maxs},
            "qc": {
                "sevenColumns": True,
                "finite": True,
                "uniqueNodeIds": True,
                "singleRoot": True,
                "parentsPresent": True,
                "acyclic": True,
                "positiveRadius": True,
                "domainMatchesTypes": True,
                "zeroLengthEdges": zero_edges,
            },
        }
        manifest_records.append(common | {"localPath": f"swc/{target.name}"})
        morphology_payload.append(
            common
            | {
                "displayTransform": {
                    "kind": "soma_centered_uniform_scale",
                    "scaleSchematicUnitPerMicrometre": scale,
                    "use": "viewer_only",
                },
                "segments": segments,
            }
        )

    lines_path = args.output / "morphology-lines.json"
    lines_path.write_text(
        json.dumps(
            {
                "release": NEUROMORPHO_RELEASE,
                "warning": (
                    "Five phenotype-stratified exemplars, not a representative census. "
                    "Local reconstruction coordinates are not registered to allen_cord_20um."
                ),
                "morphologies": morphology_payload,
            },
            separators=(",", ":"),
        ),
        encoding="utf-8",
    )
    manifest = {
        "assetSetId": "neuromorpho:8.6.124:adult-mouse-spinal-interneuron-exemplars-v1",
        "release": NEUROMORPHO_RELEASE,
        "selection": (
            "Five phenotype-stratified examples selected from the official API query for "
            "adult mouse spinal-cord interneurons; not a representative sample."
        ),
        "queryUrl": (
            "https://neuromorpho.org/api/neuron/select?q=species:mouse&"
            "fq=brain_region:spinal%20cord&fq=cell_type:interneuron&"
            "fq=age_classification:adult&size=500&sort=neuron_id,asc"
        ),
        "queryTotalAtSnapshot": 142,
        "license": "CC BY 4.0 subject to NeuroMorpho.Org Terms of Use",
        "requiredCitation": [
            "NeuroMorpho.Org, RRID:SCR_002145",
            "Tecuatl et al. 2024, doi:10.1096/fba.2024-00048",
            "Original paper recorded for each morphology",
        ],
        "records": manifest_records,
        "derivedLines": {
            "path": lines_path.name,
            "sha256": sha256(lines_path),
            "bytes": lines_path.stat().st_size,
        },
    }
    manifest_path = args.output / "asset-manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Validated and wrote {len(SPECS)} morphologies")
    print(f"asset-manifest sha256 {sha256(manifest_path)}")


if __name__ == "__main__":
    main()
