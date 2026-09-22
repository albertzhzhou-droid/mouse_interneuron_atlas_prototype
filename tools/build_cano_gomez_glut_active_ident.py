#!/usr/bin/env python3
"""Extract source-native GLUT active.ident assignments without interneuron admission."""

import argparse
from collections import Counter, defaultdict
import gzip
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile

from extract_cano_gomez_rds_metadata_stream import _table_dicts
from inspect_cano_gomez_glut_active_ident import SOURCE_BYTES, SOURCE_NAME, SOURCE_SHA256, SOURCE_URL, sha256_file

ROOT = Path(__file__).resolve().parents[1]
EXTRACTIONS = ROOT / "data/source-extractions/cano-gomez-p56"
OBSERVATION = EXTRACTIONS / "GSE318731_P56_glutamatergic_multiome_UPDATE.active-ident-observation.json"
METADATA_AUDIT = EXTRACTIONS / "GSE318731_P56_glutamatergic_multiome_UPDATE.audit.json"
METADATA_GZIP = EXTRACTIONS / "GSE318731_P56_glutamatergic_multiome_UPDATE.metadata.csv.gz"
DATA_PATH = ROOT / "data/cano-gomez-glut-active-ident-labels-0.1.json"
ROSTER_PATH = ROOT / "public/data/cano_gomez_glut_active_ident_v1/GSE318731_P56_glutamatergic_active_ident_assignments.jsonl.gz"
ROW_COUNT = 92782
LABEL_COUNT = 277
GROUP_COUNT = 28
CONTEXT_FIELDS = ("source", "anatomy", "Sex")
R_PROGRAM = r'''
args <- commandArgs(TRUE)
object <- readRDS(args[1])
stopifnot(isS4(object), "Seurat" %in% class(object))
metadata <- attr(object, "meta.data", exact=TRUE)
ident <- attr(object, "active.ident", exact=TRUE)
stopifnot(is.data.frame(metadata), is.factor(ident), nrow(metadata) == 92782L)
stopifnot(length(ident) == nrow(metadata), identical(names(ident), rownames(metadata)))
stopifnot(!anyNA(names(ident)), !anyDuplicated(names(ident)), all(nzchar(names(ident))))
stopifnot(!("neuron_types" %in% colnames(metadata)))
stopifnot(all(c("groups", "source", "anatomy", "Sex") %in% colnames(metadata)))
labels <- as.character(ident)
stopifnot(!anyNA(labels), all(nzchar(labels)), length(unique(labels)) == 277L)
stopifnot(length(levels(ident)) == 277L, all(levels(ident) %in% labels))
out <- data.frame(source_nucleus_id=names(ident), source_active_ident=labels,
  groups=as.character(metadata$groups), source=as.character(metadata$source),
  anatomy=as.character(metadata$anatomy), Sex=as.character(metadata$Sex),
  metadata_neuron_types=rep(NA_character_, nrow(metadata)), check.names=FALSE)
write.table(out, args[2], sep=",", row.names=FALSE, col.names=TRUE,
  quote=TRUE, na="NA", qmethod="double", fileEncoding="UTF-8", eol="\n")
cat(R.version.string, "\n", sep="")
'''


def ordered_hash(values):
    return hashlib.sha256(json.dumps(list(values), ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()


def counts(values):
    items = Counter(values)
    return [{"value": value, "count": items[value]} for value in sorted(items, key=lambda value: (value is not None, (value or "").encode()))]


def label_id(label):
    return "cano.glut.active-ident.sha256." + hashlib.sha256(label.encode()).hexdigest()[:24]


def checked_rows(rows, metadata_rows):
    if len(rows) != ROW_COUNT or len(metadata_rows) != ROW_COUNT:
        raise ValueError("GLUT row denominator changed")
    names = [row["source_nucleus_id"] for row in rows]
    if len(set(names)) != ROW_COUNT or any(not name or "|" in name or "\n" in name for name in names):
        raise ValueError("GLUT source identities must be unique exact nonempty row names")
    if names != [row["nucleus_id"] for row in metadata_rows]:
        raise ValueError("Active-ident names/order differ from retained metadata row names")
    for row, metadata in zip(rows, metadata_rows):
        if not row["source_active_ident"] or row["metadata_neuron_types"] is not None or metadata["neuron_type"] is not None:
            raise ValueError("Source labels are missing or absent metadata neuron_types was filled")
        for field, retained in [("groups", "group"), ("source", "source"), ("anatomy", "anatomy"), ("Sex", "sex")]:
            if row[field] != metadata[retained]:
                raise ValueError(f"Exact source metadata context changed: {field}")
    if len({row["source_active_ident"] for row in rows}) != LABEL_COUNT or len({row["groups"] for row in rows}) != GROUP_COUNT:
        raise ValueError("Source label/group denominators changed")
    return rows


def build(source_file, rscript):
    if DATA_PATH.exists() or ROSTER_PATH.exists():
        raise FileExistsError("Adapter artifacts already exist; review before replacing exact files")
    before = source_file.stat()
    if source_file.name != SOURCE_NAME or before.st_size != SOURCE_BYTES or sha256_file(source_file) != SOURCE_SHA256:
        raise ValueError("Expected the exact verified GLUT UPDATE source object")
    observation = json.loads(OBSERVATION.read_text())
    observed = observation["observation"]
    if observation["sourceSha256"] != SOURCE_SHA256 or not observed["slotNamesExactlyEqualMetadataRowNamesInOrder"] or observed["observedDistinctNonmissingLabelCount"] != LABEL_COUNT or observed["metadataNeuronTypesColumnPresent"]:
        raise ValueError("Pinned observation receipt does not support this source-slot extraction")
    metadata_audit = json.loads(METADATA_AUDIT.read_text())
    if metadata_audit["sourceSha256"] != SOURCE_SHA256 or sha256_file(METADATA_GZIP) != metadata_audit["output"]["metadataCsvGzip"]["compressedSha256"]:
        raise ValueError("Retained exact metadata checksum changed")
    with tempfile.TemporaryDirectory(prefix="cano-glut-active-ident-") as temporary:
        temp = Path(temporary)
        extracted = temp / "active-ident.csv"
        completed = subprocess.run([str(rscript.resolve()), "-e", R_PROGRAM, str(source_file.resolve()), str(extracted)], check=True, capture_output=True, text=True, timeout=600)
        retained = temp / "metadata.csv"
        retained.write_bytes(gzip.decompress(METADATA_GZIP.read_bytes()))
        rows = checked_rows(_table_dicts(extracted), _table_dicts(retained))
    after = source_file.stat()
    if (before.st_ino, before.st_size, before.st_mtime_ns) != (after.st_ino, after.st_size, after.st_mtime_ns):
        raise ValueError("Source changed during extraction")
    ROSTER_PATH.parent.mkdir(parents=True, exist_ok=True)
    row_groups = defaultdict(list)
    plain_digest = hashlib.sha256()
    plain_bytes = 0
    with ROSTER_PATH.open("xb") as output:
        with gzip.GzipFile(fileobj=output, mode="wb", filename="", mtime=0, compresslevel=9) as compressed:
            for row in rows:
                row["source_accession"] = "GSE318731"
                row["source_file_name"] = SOURCE_NAME
                row["compound_nucleus_key"] = "GSE318731|" + SOURCE_NAME + "|" + row["source_nucleus_id"]
                row["source_label_id"] = label_id(row["source_active_ident"])
                line = (json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\n").encode()
                compressed.write(line)
                plain_digest.update(line)
                plain_bytes += len(line)
                row_groups[row["source_active_ident"]].append(row)
    labels = []
    for label in sorted(row_groups, key=lambda label: label.encode()):
        grouped = row_groups[label]
        labels.append({"id": label_id(label), "rawLabel": label, "nucleusCount": len(grouped),
            "groupCounts": counts(row["groups"] for row in grouped),
            "contextCounts": {field: counts(row[field] for row in grouped) for field in CONTEXT_FIELDS},
            "orderedCompoundNucleusKeysSha256": ordered_hash(row["compound_nucleus_key"] for row in grouped),
            "metadataNeuronTypesMissingCount": len(grouped)})
    document = {
        "schemaVersion": "0.1.0", "adapterId": "cano-gomez-p56-glut-active-ident-0.1.0",
        "title": "Cano-Gomez P56 GLUT source-slot assignments", "parentSourceId": "SRC-CANOGOMEZ-2026",
        "source": {"accession": "GSE318731", "fileName": SOURCE_NAME, "bytes": SOURCE_BYTES, "sha256": SOURCE_SHA256, "url": SOURCE_URL, "lifeStage": "P56", "slot": "active.ident", "metadataSlot": "meta.data"},
        "identity": {"authority": "SOURCE_LOCAL_NAMED_SLOT_ASSIGNMENT", "metadataNameOrderExactlyVerified": True, "uniqueNonemptyNameCount": ROW_COUNT,
            "orderedSourceNucleusNamesSha256": ordered_hash(row["source_nucleus_id"] for row in rows),
            "orderedSourceActiveIdentLabelsSha256": ordered_hash(row["source_active_ident"] for row in rows),
            "stableKeyExpression": "GSE318731|exact source filename|row.name"},
        "denominators": {"nucleusCount": ROW_COUNT, "sourceLabelCount": LABEL_COUNT, "factorLevelCount": LABEL_COUNT, "unusedFactorLevelCount": 0, "sourceGroupCount": GROUP_COUNT, "confirmedInterneuronProfilesAdded": 0},
        "metadataNeuronTypes": {"sourceColumnPresent": False, "status": "SOURCE_COLUMN_ABSENT", "missingCount": ROW_COUNT, "substitutionApplied": False},
        "contextCounts": {field: counts(row[field] for row in rows) for field in CONTEXT_FIELDS},
        "groupCounts": counts(row["groups"] for row in rows), "labels": labels,
        "artifact": {"path": str(ROSTER_PATH.relative_to(ROOT)), "publicUrl": "/" + str(ROSTER_PATH.relative_to(ROOT / "public")), "mediaType": "application/x-ndjson", "contentEncoding": "gzip", "rowCount": ROW_COUNT,
            "compressedBytes": ROSTER_PATH.stat().st_size, "compressedSha256": sha256_file(ROSTER_PATH), "uncompressedBytes": plain_bytes, "uncompressedSha256": plain_digest.hexdigest(),
            "rowOrder": "exact source active.ident names, identical to meta.data row.names", "labelFilterField": "source_label_id"},
        "reproduction": {"builderPath": str(Path(__file__).resolve().relative_to(ROOT)), "builderSha256": sha256_file(Path(__file__)), "baseRProgramSha256": hashlib.sha256(R_PROGRAM.encode()).hexdigest(), "rVersion": completed.stdout.strip(), "completeRdsObjectMaterialized": True,
            "inputs": [{"path": str(path.relative_to(ROOT)), "bytes": path.stat().st_size, "sha256": sha256_file(path)} for path in [OBSERVATION, METADATA_AUDIT, METADATA_GZIP]]},
        "boundaries": {"confirmedInterneuronAdmission": False, "metadataNeuronTypesSubstitution": False, "crossAssayCellIdentity": False, "crossSourceIdentity": False, "markerInferenceFromLabelTokens": False, "geometry": False, "internalStructures": False, "atlasRegistration": False,
            "displayScope": "277 raw labels from the source active.ident slot; projection/local interneuron status remains unresolved. These labels do not enlarge the separate 11-profile CHOL_IN confirmed-interneuron roster.",
            "rights": "Project-authored factual derivative in the private research repository; source RDS remains link-only and unbundled. Article CC-BY-NC-4.0 is not generalized to GEO RDS redistribution; public release remains subject to separate review."}}
    DATA_PATH.write_text(json.dumps(document, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"summary": str(DATA_PATH), "summaryBytes": DATA_PATH.stat().st_size, "roster": str(ROSTER_PATH), "rosterBytes": ROSTER_PATH.stat().st_size, "labels": LABEL_COUNT, "rows": ROW_COUNT, "groups": GROUP_COUNT}, sort_keys=True))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-file", required=True, type=Path)
    parser.add_argument("--rscript", required=True, type=Path)
    args = parser.parse_args()
    build(args.source_file, args.rscript)
