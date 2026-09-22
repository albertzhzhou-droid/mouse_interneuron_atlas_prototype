#!/usr/bin/env python3
"""Observe the exact retained GLUT active.ident slot without admitting its labels.

Usage: python3 tools/inspect_cano_gomez_glut_active_ident.py --source-file
<exact-RDS> --rscript <portable-Rscript> --output <new-observation.json>

The embedded base-R program is the complete inspection recipe. It deserializes
the whole object and observes only metadata row names and the active.ident slot;
it does not fill meta.data neuron_types or inspect assay identities.
"""

import argparse
import hashlib
import json
from pathlib import Path
import subprocess


SOURCE_NAME = "GSE318731_P56_glutamatergic_multiome_UPDATE.rds"
SOURCE_BYTES = 1832005077
SOURCE_SHA256 = "ff3784791ccb5d23311b9d0a8e2a4bd09dd251f75d0a2fc4b30e762dcef29c92"
SOURCE_URL = "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE318nnn/GSE318731/suppl/" + SOURCE_NAME

R_PROGRAM = r'''
object <- readRDS(commandArgs(TRUE)[1])
stopifnot(isS4(object), "Seurat" %in% class(object))
metadata <- attr(object, "meta.data", exact=TRUE)
ident <- attr(object, "active.ident", exact=TRUE)
stopifnot(is.data.frame(metadata), !is.null(ident))
labels <- as.character(ident)
ident_names <- names(ident)
metadata_names <- rownames(metadata)
emit <- function(key, value) cat(key, as.character(value), "\n", sep="\t")
emit("rVersion", R.version.string)
emit("rPlatform", R.version$platform)
emit("slotClass", paste(class(ident), collapse="/"))
emit("slotTypeof", typeof(ident))
emit("slotStorageMode", storage.mode(ident))
emit("slotIsFactor", is.factor(ident))
emit("slotLength", length(ident))
emit("factorLevelCount", if (is.factor(ident)) length(levels(ident)) else 0L)
emit("observedDistinctNonmissingLabelCount", length(unique(labels[!is.na(labels)])))
emit("observedMissingLabelCount", sum(is.na(labels)))
emit("observedEmptyLabelCount", sum(!is.na(labels) & labels == ""))
emit("unobservedFactorLevelCount", if (is.factor(ident)) sum(!(levels(ident) %in% labels)) else 0L)
emit("slotNamesPresent", !is.null(ident_names))
emit("slotNameCount", length(ident_names))
emit("uniqueNonmissingSlotNameCount", length(unique(ident_names[!is.na(ident_names)])))
emit("missingSlotNameCount", sum(is.na(ident_names)))
emit("emptySlotNameCount", sum(!is.na(ident_names) & ident_names == ""))
emit("metadataRowCount", nrow(metadata))
emit("metadataRowNameCount", length(metadata_names))
emit("uniqueNonmissingMetadataRowNameCount", length(unique(metadata_names[!is.na(metadata_names)])))
emit("missingMetadataRowNameCount", sum(is.na(metadata_names)))
emit("emptyMetadataRowNameCount", sum(!is.na(metadata_names) & metadata_names == ""))
emit("slotNamesExactlyEqualMetadataRowNamesInOrder", identical(ident_names, metadata_names))
emit("metadataNeuronTypesColumnPresent", "neuron_types" %in% colnames(metadata))
'''


def sha256_file(path):
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def inspect(source_file, rscript, output):
    if output.exists():
        raise FileExistsError(f"Observation output already exists: {output}")
    before = source_file.stat()
    if source_file.name != SOURCE_NAME or before.st_size != SOURCE_BYTES:
        raise ValueError("Expected exact canonical GLUT UPDATE filename and size")
    if sha256_file(source_file) != SOURCE_SHA256:
        raise ValueError("Retained source SHA-256 does not match the verified GLUT object")
    completed = subprocess.run(
        [str(rscript.resolve()), "-e", R_PROGRAM, str(source_file.resolve())],
        check=True, capture_output=True, text=True, timeout=600,
    )
    after = source_file.stat()
    if (before.st_size, before.st_mtime_ns, before.st_ino) != (after.st_size, after.st_mtime_ns, after.st_ino):
        raise ValueError("Source file changed during inspection")
    observed = {}
    for line in completed.stdout.splitlines():
        key, value = line.rstrip("\t").split("\t", 1)
        if key in observed:
            raise ValueError(f"Repeated observation field: {key}")
        observed[key] = True if value == "TRUE" else False if value == "FALSE" else int(value) if value.isdecimal() else value
    if observed.get("slotLength") != 92782 or observed.get("metadataRowCount") != 92782:
        raise ValueError("Exact source row/slot denominators changed")
    report = {
        "schemaVersion": "0.1.0",
        "receiptKind": "source_observation_only_active_ident_slot",
        "sourceAccession": "GSE318731",
        "sourceFileName": SOURCE_NAME,
        "sourceUrl": SOURCE_URL,
        "sourceBytes": SOURCE_BYTES,
        "sourceSha256": SOURCE_SHA256,
        "sourceSlot": "active.ident",
        "comparisonSlot": "meta.data row.names",
        "observation": observed,
        "reproduction": {
            "inspectorScript": "tools/inspect_cano_gomez_glut_active_ident.py",
            "inspectorScriptSha256": sha256_file(Path(__file__)),
            "baseRProgramSha256": hashlib.sha256(R_PROGRAM.encode()).hexdigest(),
            "command": "python3 tools/inspect_cano_gomez_glut_active_ident.py --source-file <exact-retained-GLUT-RDS> --rscript <Rscript> --output <new-observation.json>",
            "completeRdsObjectMaterialized": True,
            "sourceFileStableDuringObservation": True,
        },
        "boundaries": {
            "observationOnly": True,
            "classificationOrInterneuronAdmissionAdded": False,
            "metadataNeuronTypesSynthesized": False,
            "crossAssayCellIdentityVerified": False,
            "crossSourceIdentityAsserted": False,
            "sameCellMorphologyOrPhysiologyJoinAdded": False,
            "geometryOrInternalStructuresAdded": False,
            "note": "Exact slot-name/metadata-row-name equality, when observed, is a within-object named-order observation only. No assay identity was inspected and no active.ident label was substituted into the metadata-only production registry.",
        },
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("x") as handle:
        handle.write(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps({"output": str(output), "bytes": output.stat().st_size, "sha256": sha256_file(output), "observation": observed}, sort_keys=True))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-file", required=True, type=Path)
    parser.add_argument("--rscript", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    inspect(args.source_file, args.rscript, args.output)
