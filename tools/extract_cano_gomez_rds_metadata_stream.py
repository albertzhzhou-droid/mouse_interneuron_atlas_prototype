#!/usr/bin/env python3
"""Checksum-count and stream one canonical GSE318731 RDS into base R.

The compressed RDS is never persisted by this transport. Base R readRDS still
materializes the complete Seurat object in memory, so CHOL is the mandatory
memory probe before either larger class is considered.
"""

from __future__ import annotations

import argparse
import gzip
import hashlib
import http.client
import json
import os
import platform
import re
import resource
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Mapping, Optional, Sequence, Tuple


ACCESSION = "GSE318731"
FORMAT_VERSION = "0.1.0"
AUTHORITY_MODE = "BASE_R_STREAM_META_DATA_ROW_ONLY"
COMPOUND_KEY_EXPRESSION = "GSE318731|exact source filename|row.name"
CSV_HEADER = (
    "nucleus_id",
    "transmitter_class",
    "group",
    "neuron_type",
    "source",
    "anatomy",
    "sex",
)
RAW_TO_OUTPUT_COLUMNS = {
    "groups": "group",
    "neuron_types": "neuron_type",
    "source": "source",
    "anatomy": "anatomy",
    "Sex": "sex",
}
REQUIRED_ASSIGNMENT_COLUMNS = ("groups", "neuron_types")
GLUT_SOURCE_WITHOUT_METADATA_TYPES_SHA256 = (
    "ff3784791ccb5d23311b9d0a8e2a4bd09dd251f75d0a2fc4b30e762dcef29c92"
)
OPTIONAL_CONTEXT_COLUMNS = ("source", "anatomy", "Sex")
CONTRACT_RAW_COLUMNS = REQUIRED_ASSIGNMENT_COLUMNS + OPTIONAL_CONTEXT_COLUMNS
PRESERVED_SOURCE_COLUMN_VALUES = "PRESERVED_SOURCE_COLUMN_VALUES"
ABSENT_SOURCE_COLUMN_TO_SOURCE_NA = (
    "SOURCE_COLUMN_ABSENT_EMITTED_AS_SOURCE_NA"
)
SOURCE_COLUMN_ABSENCE_REASON = "source_meta_data_column_absent"
SHA256_PATTERN = re.compile(r"^[0-9a-f]{64}$")
UNRESOLVED_IDENTITY = "not_resolved_by_base_r_meta_data_row_only_stream"
CANONICAL_CHOL_SOURCE_SHA256 = (
    "d4ad07a1e434f2ed4553738f3e1df1b395ce81b154f974c41f3ba6a9d674aed2"
)


@dataclass(frozen=True)
class SourceSpec:
    transmitter_class: str
    file_name: str
    expected_bytes: int
    expected_rows: int
    expected_groups: int
    public_url: str


SOURCE_SPECS: Mapping[str, SourceSpec] = {
    "CHOL": SourceSpec(
        "CHOL",
        "GSE318731_P56_cholinergic_multiome.rds",
        127_862_795,
        3_199,
        5,
        "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE318nnn/"
        "GSE318731/suppl/GSE318731_P56_cholinergic_multiome.rds",
    ),
    "GABA": SourceSpec(
        "GABA",
        "GSE318731_P56_gabaergic_multiome.rds",
        1_646_402_816,
        73_364,
        24,
        "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE318nnn/"
        "GSE318731/suppl/GSE318731_P56_gabaergic_multiome.rds",
    ),
    "GLUT": SourceSpec(
        "GLUT",
        "GSE318731_P56_glutamatergic_multiome_UPDATE.rds",
        1_832_005_077,
        92_782,
        28,
        "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE318nnn/"
        "GSE318731/suppl/GSE318731_P56_glutamatergic_multiome_UPDATE.rds",
    ),
}


@dataclass(frozen=True)
class TransportReceipt:
    source_bytes: int
    source_sha256: str
    http_status: int
    response_content_length: int
    response_content_encoding: str
    response_last_modified: str
    final_url: str
    r_worker_max_resident_set_bytes: int
    r_worker_stdout: str = ""
    r_worker_stderr: str = ""
    source_persisted_to_disk: bool = False
    source_file_basename: Optional[str] = None
    http_reconnect_count: int = 0


@dataclass(frozen=True)
class CholProbeReceipt:
    audit_sha256: str
    source_sha256: str
    transport_extractor_sha256: str
    base_r_worker_sha256: str


@dataclass(frozen=True)
class LosslessField:
    value: Optional[str]
    quoted: bool


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def sha256_ordered_lines(values: Iterable[str]) -> str:
    digest = hashlib.sha256()
    for value in values:
        digest.update(value.encode("utf-8"))
        digest.update(b"\n")
    return digest.hexdigest()


def _require_audit_value(
    observed: object, expected: object, label: str
) -> None:
    if observed != expected or type(observed) is not type(expected):
        raise ValueError(
            f"CHOL probe audit {label} changed: "
            f"expected {expected!r}, observed {observed!r}"
        )


def _require_audit_sha256(observed: object, label: str) -> str:
    if not isinstance(observed, str) or not SHA256_PATTERN.fullmatch(observed):
        raise ValueError(f"CHOL probe audit {label} is not a lowercase SHA-256")
    return observed


def validate_chol_probe_audit(
    audit_path: Path,
    transport_script: Path,
    worker_script: Path,
) -> CholProbeReceipt:
    """Verify the exact CHOL receipt required before a larger RDS run.

    This gate verifies that the smallest canonical source completed under the
    current transport and base-R worker. It is an operational precondition,
    not evidence that GABA or GLUT will fit in memory.
    """

    if not audit_path.is_file():
        raise ValueError(
            f"--chol-probe-audit is not a regular file: {audit_path}"
        )
    try:
        audit = json.loads(audit_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        raise ValueError(
            f"--chol-probe-audit is not valid UTF-8 JSON: {audit_path}"
        ) from error
    if not isinstance(audit, dict):
        raise ValueError("CHOL probe audit root must be a JSON object")

    spec = SOURCE_SPECS["CHOL"]
    exact_values = (
        (audit.get("formatVersion"), FORMAT_VERSION, "format version"),
        (
            audit.get("receiptKind"),
            "cano_gomez_base_r_stream_meta_data_row_only_audit",
            "receipt kind",
        ),
        (audit.get("authorityMode"), AUTHORITY_MODE, "authority mode"),
        (
            audit.get("crossAssayCellIdentityVerified"),
            False,
            "cross-assay identity boundary",
        ),
        (audit.get("sourceAccession"), ACCESSION, "source accession"),
        (audit.get("sourceFile"), spec.file_name, "source filename"),
        (audit.get("sourcePublicUrl"), spec.public_url, "source URL"),
        (audit.get("sourceBytes"), spec.expected_bytes, "source bytes"),
        (
            audit.get("sourceExpectedBytes"),
            spec.expected_bytes,
            "expected source bytes",
        ),
        (
            audit.get("sourceBytesMatchesExpected"),
            True,
            "source byte match flag",
        ),
        (
            audit.get("sourceSha256"),
            CANONICAL_CHOL_SOURCE_SHA256,
            "source SHA-256",
        ),
        (
            audit.get("sourceExpectedSha256"),
            CANONICAL_CHOL_SOURCE_SHA256,
            "expected source SHA-256",
        ),
        (
            audit.get("sourceSha256MatchesExpected"),
            True,
            "source SHA-256 match flag",
        ),
        (audit.get("transmitterClass"), "CHOL", "transmitter class"),
        (audit.get("rowCount"), spec.expected_rows, "row count"),
        (
            audit.get("uniqueRowNameCount"),
            spec.expected_rows,
            "unique row-name count",
        ),
    )
    for observed, expected, label in exact_values:
        _require_audit_value(observed, expected, label)

    denominators = audit.get("denominators")
    if not isinstance(denominators, dict):
        raise ValueError("CHOL probe audit denominators are absent")
    for field, expected in (
        ("expectedRowCount", spec.expected_rows),
        ("observedRowCount", spec.expected_rows),
        ("expectedGroupCount", spec.expected_groups),
        ("observedNonemptyGroupCount", spec.expected_groups),
    ):
        _require_audit_value(
            denominators.get(field), expected, f"denominators.{field}"
        )
    observed_types = denominators.get("observedNonemptyNeuronTypeCount")
    if type(observed_types) is not int or observed_types <= 0:
        raise ValueError(
            "CHOL probe audit observed neuron-type denominator is absent"
        )
    validate_audit_metadata_field_contract(
        audit,
        spec,
        "CHOL probe audit",
        expected_present_optional=OPTIONAL_CONTEXT_COLUMNS,
    )

    identity = audit.get("identityChecks")
    if not isinstance(identity, dict):
        raise ValueError("CHOL probe audit identity checks are absent")
    for field, expected in (
        ("authorityMode", AUTHORITY_MODE),
        ("stableIdSource", "meta.data row.names"),
        ("stableCompoundKeyExpression", COMPOUND_KEY_EXPRESSION),
        ("metadataRowNamesUniqueNonempty", True),
        ("sameRowRawMetadataAssignmentVerified", True),
        ("objectCellsExactOrder", UNRESOLVED_IDENTITY),
        ("assayColnamesExactOrder", UNRESOLVED_IDENTITY),
        ("activeIdentNamesExactOrder", UNRESOLVED_IDENTITY),
        ("crossAssayCellIdentityVerified", False),
        ("sameCellClaimAuthorized", False),
    ):
        _require_audit_value(identity.get(field), expected, f"identityChecks.{field}")
    _require_audit_sha256(
        identity.get("orderedMetadataRowNamesSha256"),
        "ordered metadata row-name SHA-256",
    )
    _require_audit_sha256(
        identity.get("orderedCompoundNucleusKeysSha256"),
        "ordered compound-key SHA-256",
    )

    runtime = audit.get("runtime")
    if not isinstance(runtime, dict):
        raise ValueError("CHOL probe audit runtime receipt is absent")
    for field, expected in (
        ("baseROnly", True),
        ("seuratObjectNamespaceLoaded", False),
        ("rWorkerMaxResidentSetBytesExcludedFromDeterministicAudit", True),
    ):
        _require_audit_value(runtime.get(field), expected, f"runtime.{field}")
    for field in ("rVersion", "rPlatform"):
        value = runtime.get(field)
        if not isinstance(value, str) or not value:
            raise ValueError(f"CHOL probe audit runtime.{field} is absent")
    for field in (
        "transportPythonImplementation",
        "transportPythonVersion",
    ):
        value = runtime.get(field)
        if not isinstance(value, str) or not value:
            raise ValueError(f"CHOL probe audit runtime.{field} is absent")

    transport = audit.get("transport")
    if not isinstance(transport, dict):
        raise ValueError("CHOL probe audit transport receipt is absent")
    for field, expected in (
        ("sourceBytesStreamedDirectlyToRStdin", True),
        ("sameRawBytesCountedAndHashedBeforeRStdinWrite", True),
        ("boundedChunkTransport", True),
    ):
        _require_audit_value(transport.get(field), expected, f"transport.{field}")
    source_persisted = transport.get("sourcePersistedToDisk")
    if type(source_persisted) is not bool:
        raise ValueError(
            "CHOL probe audit transport.sourcePersistedToDisk is absent"
        )
    if source_persisted:
        _require_audit_value(
            transport.get("mode"), "LOCAL_FILE_TO_R_STDIN", "transport.mode"
        )
        _require_audit_value(
            transport.get("localSourceBasename"),
            spec.file_name,
            "transport.localSourceBasename",
        )
    else:
        _require_audit_value(
            transport.get("mode"),
            "HTTP_RANGE_RESUMABLE_TO_R_STDIN",
            "transport.mode",
        )
        if "localSourceBasename" not in transport:
            raise ValueError(
                "CHOL probe audit transport.localSourceBasename is absent"
            )
        _require_audit_value(
            transport.get("localSourceBasename"),
            None,
            "transport.localSourceBasename",
        )
        _require_audit_value(
            transport.get("finalUrl"), spec.public_url, "transport.finalUrl"
        )

    memory = audit.get("memoryBoundary")
    if not isinstance(memory, dict):
        raise ValueError("CHOL probe audit memory boundary is absent")
    for field, expected in (
        ("readRDSMaterializesCompleteObject", True),
        ("metadataRetainedThenCompleteObjectReleasedBeforeWriting", True),
        ("compressedByteSizeIsNotAReliableMemoryPredictor", True),
        ("CHOLMemoryProbeRequiredBeforeLargerClasses", True),
        ("CHOLProbeDoesNotAuthorizeGabaOrGlutRun", True),
    ):
        _require_audit_value(memory.get(field), expected, f"memoryBoundary.{field}")
    probe_gate = memory.get("cholProbeGate")
    if not isinstance(probe_gate, dict):
        raise ValueError("CHOL probe audit self-gate receipt is absent")
    for field, expected in (
        ("requiredForThisClass", False),
        ("verifiedBeforeSourceTransport", False),
        ("probeAuditSha256", None),
        ("probeSourceSha256", None),
        ("probeTransportExtractorSha256", None),
        ("probeBaseRWorkerSha256", None),
        ("largerClassMemorySafetyEstablished", False),
        ("scientificOrClassificationAuthorityAdded", False),
    ):
        if field not in probe_gate:
            raise ValueError(
                f"CHOL probe audit memoryBoundary.cholProbeGate.{field} is absent"
            )
        _require_audit_value(
            probe_gate.get(field), expected, f"memoryBoundary.cholProbeGate.{field}"
        )

    scope = audit.get("scopeBoundaries")
    if not isinstance(scope, dict):
        raise ValueError("CHOL probe audit scope boundaries are absent")
    for field, expected in (
        ("rawLabelsPreserved", True),
        ("sourceNaAndExactEmptyStringDistinguished", True),
        ("absentContextSourceColumnsEmittedOnlyAsSourceNa", True),
        ("optionalContextInferenceApplied", False),
        ("sourceColumnAbsenceInterpretedAsBiologicalAbsence", False),
        ("sameMetaDataRowAssignmentsOnly", True),
        ("labelNormalizationApplied", False),
        ("classificationInferenceApplied", False),
        ("reported516TypeDenominatorHardAssertionApplied", False),
        ("crossAssayCellIdentityVerified", False),
        ("sameCellLinkageAuthorized", False),
        ("geometryClaimAuthorized", False),
        ("internalStructureClaimAuthorized", False),
        ("atlasRegistrationClaimAuthorized", False),
    ):
        _require_audit_value(scope.get(field), expected, f"scopeBoundaries.{field}")

    output_root = audit.get("output")
    if not isinstance(output_root, dict):
        raise ValueError("CHOL probe audit output receipt is absent")
    output = output_root.get("metadataCsvGzip")
    if not isinstance(output, dict):
        raise ValueError("CHOL probe audit metadata output receipt is absent")
    for field, expected in (
        ("fileName", f"{spec.file_name[:-4]}.metadata.csv.gz"),
        ("mediaType", "text/csv"),
        ("contentEncoding", "gzip"),
        ("rowCount", spec.expected_rows),
        ("columnCount", len(CSV_HEADER)),
        ("orderedColumnNames", list(CSV_HEADER)),
    ):
        _require_audit_value(output.get(field), expected, f"output.{field}")
    for field in ("uncompressedBytes", "compressedBytes"):
        value = output.get(field)
        if type(value) is not int or value <= 0:
            raise ValueError(f"CHOL probe audit output.{field} is absent")
    for field in ("uncompressedSha256", "compressedSha256"):
        _require_audit_sha256(output.get(field), f"output.{field}")

    extractors = audit.get("extractors")
    if not isinstance(extractors, dict):
        raise ValueError("CHOL probe audit extractor receipts are absent")
    expected_transport_sha256 = sha256_file(transport_script)
    expected_worker_sha256 = sha256_file(worker_script)
    for component, file_name, expected_sha256 in (
        ("transport", transport_script.name, expected_transport_sha256),
        ("baseRWorker", worker_script.name, expected_worker_sha256),
    ):
        receipt = extractors.get(component)
        if not isinstance(receipt, dict):
            raise ValueError(f"CHOL probe audit extractors.{component} is absent")
        _require_audit_value(
            receipt.get("fileName"),
            file_name,
            f"extractors.{component}.fileName",
        )
        _require_audit_value(
            receipt.get("sha256"),
            expected_sha256,
            f"extractors.{component}.sha256",
        )

    return CholProbeReceipt(
        audit_sha256=sha256_file(audit_path),
        source_sha256=CANONICAL_CHOL_SOURCE_SHA256,
        transport_extractor_sha256=expected_transport_sha256,
        base_r_worker_sha256=expected_worker_sha256,
    )


def _finish_field(characters: List[str], quoted: bool) -> LosslessField:
    text = "".join(characters)
    if quoted:
        return LosslessField(text, True)
    if text == "NA":
        return LosslessField(None, False)
    raise ValueError(
        "worker CSV contains an unquoted field other than the source-NA token"
    )


def read_lossless_csv(path: Path) -> List[List[LosslessField]]:
    """Parse always-quoted strings without collapsing source NA and literal NA."""

    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError as error:
        raise ValueError(f"worker CSV is not valid UTF-8: {path}") from error
    if not text.endswith("\n"):
        raise ValueError(f"worker CSV lacks its required final newline: {path}")

    rows: List[List[LosslessField]] = []
    row: List[LosslessField] = []
    field: List[str] = []
    quoted = False
    in_quotes = False
    after_quote = False
    at_start = True
    index = 0
    while index < len(text):
        character = text[index]
        if in_quotes:
            if character == '"':
                if index + 1 < len(text) and text[index + 1] == '"':
                    field.append('"')
                    index += 2
                    continue
                in_quotes = False
                after_quote = True
            else:
                field.append(character)
            index += 1
            continue

        if after_quote:
            if character not in (",", "\n"):
                raise ValueError("worker CSV has bytes after a closing quote")
            row.append(_finish_field(field, quoted))
            field = []
            quoted = False
            after_quote = False
            at_start = True
            if character == "\n":
                rows.append(row)
                row = []
            index += 1
            continue

        if at_start:
            if character == '"':
                quoted = True
                in_quotes = True
                at_start = False
                index += 1
                continue
            if character in (",", "\n"):
                raise ValueError("worker CSV contains an empty unquoted field")
            field.append(character)
            at_start = False
            index += 1
            continue

        if character == ",":
            row.append(_finish_field(field, quoted))
            field = []
            quoted = False
            at_start = True
        elif character == "\n":
            row.append(_finish_field(field, quoted))
            rows.append(row)
            row = []
            field = []
            quoted = False
            at_start = True
        elif character == '"':
            raise ValueError("worker CSV has an unexpected quote")
        else:
            field.append(character)
        index += 1

    if in_quotes or after_quote or row or field or not at_start:
        raise ValueError("worker CSV ended in an incomplete record")
    if not rows:
        raise ValueError("worker CSV is empty")
    return rows


def _lossless_table(
    path: Path,
) -> Tuple[Tuple[str, ...], List[Tuple[Optional[str], ...]]]:
    parsed = read_lossless_csv(path)
    if any(field.value is None for field in parsed[0]):
        raise ValueError(f"worker CSV header contains source NA: {path}")
    header = tuple(field.value or "" for field in parsed[0])
    if len(set(header)) != len(header) or any(not name for name in header):
        raise ValueError(f"worker CSV has empty or duplicate headers: {path}")
    rows: List[Tuple[Optional[str], ...]] = []
    for index, raw_row in enumerate(parsed[1:], start=2):
        if len(raw_row) != len(header):
            raise ValueError(
                f"worker CSV row {index} has {len(raw_row)} fields; "
                f"expected {len(header)}"
            )
        rows.append(tuple(field.value for field in raw_row))
    return header, rows


def _table_dicts(path: Path) -> List[Dict[str, Optional[str]]]:
    header, rows = _lossless_table(path)
    return [dict(zip(header, row)) for row in rows]


def _require_bool(value: Optional[str], context: str) -> bool:
    if value == "true":
        return True
    if value == "false":
        return False
    raise ValueError(f"{context} is not a lower-case boolean")


def _require_int(value: Optional[str], context: str) -> int:
    if value is None or not re.fullmatch(r"0|[1-9][0-9]*", value):
        raise ValueError(f"{context} is not a canonical non-negative integer")
    return int(value)


def source_absent_assignment_fields(spec, columns, source_sha256):
    """Permit only the observed, checksum-pinned GLUT metadata-field absence."""
    if spec.transmitter_class == "GLUT" and "neuron_types" not in columns:
        if source_sha256 != GLUT_SOURCE_WITHOUT_METADATA_TYPES_SHA256:
            raise ValueError("GLUT missing neuron_types requires the exact recovered source SHA-256")
        return ["neuron_types"]
    return []


def validate_audit_metadata_field_contract(
    audit: Mapping[str, object],
    spec: SourceSpec,
    context: str,
    expected_present_optional: Optional[Sequence[str]] = None,
) -> None:
    columns = audit.get("metadataColumns")
    if (
        not isinstance(columns, list)
        or any(not isinstance(field, str) or field == "" for field in columns)
        or len(set(columns)) != len(columns)
    ):
        raise ValueError(f"{context} metadata column inventory is invalid")
    source_absent_assignments = source_absent_assignment_fields(
        spec, columns, audit.get("sourceSha256")
    )
    required_assignments = tuple(
        field for field in REQUIRED_ASSIGNMENT_COLUMNS
        if field not in source_absent_assignments
    )
    missing_required = sorted(set(required_assignments) - set(columns))
    if missing_required:
        raise ValueError(
            f"{context} lacks required assignment columns {missing_required}"
        )
    present_optional = [
        field for field in OPTIONAL_CONTEXT_COLUMNS if field in columns
    ]
    absent_optional = [
        field for field in OPTIONAL_CONTEXT_COLUMNS if field not in columns
    ]
    if (
        expected_present_optional is not None
        and present_optional != list(expected_present_optional)
    ):
        raise ValueError(f"{context} optional-context source presence changed")

    contract = audit.get("metadataFieldContract")
    if not isinstance(contract, dict):
        raise ValueError(f"{context} metadata field contract is absent")
    expected_contract = {
        "requiredAssignmentFields": list(required_assignments),
        "optionalContextFields": list(OPTIONAL_CONTEXT_COLUMNS),
        "presentOptionalContextFields": present_optional,
        "absentOptionalContextFields": absent_optional,
        "absentOptionalContextEmissionMode": ABSENT_SOURCE_COLUMN_TO_SOURCE_NA,
        "allContractFieldsHaveExplicitPresenceReceipts": True,
    }
    if source_absent_assignments:
        expected_contract["sourceAbsentAssignmentFields"] = source_absent_assignments
    if contract != expected_contract:
        raise ValueError(f"{context} metadata field contract changed")

    profiles = audit.get("metadataFields")
    if not isinstance(profiles, dict) or set(profiles) != set(CONTRACT_RAW_COLUMNS):
        raise ValueError(f"{context} metadata field profile set changed")
    for raw_column in CONTRACT_RAW_COLUMNS:
        profile = profiles.get(raw_column)
        if not isinstance(profile, dict):
            raise ValueError(f"{context} {raw_column} profile is absent")
        present = raw_column in columns
        if profile.get("sourceColumnPresent") is not present:
            raise ValueError(
                f"{context} {raw_column} source-column presence changed"
            )
        expected_index = columns.index(raw_column) + 1 if present else None
        if profile.get("sourceColumnIndex") != expected_index:
            raise ValueError(f"{context} {raw_column} source-column index changed")
        expected_mode = (
            PRESERVED_SOURCE_COLUMN_VALUES
            if present
            else ABSENT_SOURCE_COLUMN_TO_SOURCE_NA
        )
        expected_reason = None if present else SOURCE_COLUMN_ABSENCE_REASON
        if (
            profile.get("emissionMode") != expected_mode
            or profile.get("sourceColumnAbsenceReason") != expected_reason
        ):
            raise ValueError(f"{context} {raw_column} emission receipt changed")
        for field in (
            "rowCount",
            "missingCount",
            "sourceMissingCount",
            "sourceEmptyStringCount",
            "sourceWhitespaceOnlyCount",
            "observedNonemptyUniqueCount",
        ):
            value = profile.get(field)
            if type(value) is not int or value < 0:
                raise ValueError(f"{context} {raw_column} {field} is absent")
        if profile.get("rowCount") != spec.expected_rows:
            raise ValueError(f"{context} {raw_column} row denominator changed")
        if profile.get("missingCount") != (
            profile.get("sourceMissingCount")
            + profile.get("sourceEmptyStringCount")
        ):
            raise ValueError(f"{context} {raw_column} missingness receipt changed")
        counts = profile.get("counts")
        if (
            not isinstance(counts, dict)
            or any(
                not isinstance(key, str)
                or type(value) is not int
                or value <= 0
                for key, value in counts.items()
            )
            or sum(counts.values()) != spec.expected_rows
        ):
            raise ValueError(f"{context} {raw_column} value counts changed")
        if counts.get("", 0) != profile.get("missingCount"):
            raise ValueError(f"{context} {raw_column} empty/NA counts changed")
        if len([value for value in counts if value != ""]) != profile.get(
            "observedNonemptyUniqueCount"
        ):
            raise ValueError(f"{context} {raw_column} unique count changed")
        if present:
            if any(
                not isinstance(profile.get(field), str) or profile.get(field) == ""
                for field in ("typeof", "storageMode", "class")
            ) or any(
                type(profile.get(field)) is not bool
                for field in ("isFactor", "isOrderedFactor")
            ):
                raise ValueError(
                    f"{context} {raw_column} source type receipt is absent"
                )
        else:
            if raw_column not in OPTIONAL_CONTEXT_COLUMNS + tuple(source_absent_assignments):
                raise ValueError(f"{context} required {raw_column} column is absent")
            if any(
                profile.get(field) is not None
                for field in (
                    "typeof",
                    "storageMode",
                    "class",
                    "isFactor",
                    "isOrderedFactor",
                )
            ):
                raise ValueError(
                    f"{context} {raw_column} absent source type was fabricated"
                )
            if not (
                profile.get("sourceMissingCount") == spec.expected_rows
                and profile.get("sourceEmptyStringCount") == 0
                and profile.get("sourceWhitespaceOnlyCount") == 0
                and profile.get("observedNonemptyUniqueCount") == 0
                and counts == {"": spec.expected_rows}
                and profile.get("factorLevels") == []
                and profile.get("zeroCountLevels") == []
            ):
                raise ValueError(
                    f"{context} {raw_column} absent source column has non-NA output"
                )


def _gzip_deterministic(plain_path: Path, gzip_path: Path) -> None:
    with plain_path.open("rb") as source, gzip_path.open("wb") as raw_target:
        with gzip.GzipFile(
            filename="", mode="wb", compresslevel=9, fileobj=raw_target, mtime=0
        ) as target:
            for block in iter(lambda: source.read(1024 * 1024), b""):
                target.write(block)


def _rss_to_bytes(max_rss: int) -> int:
    return max_rss if sys.platform == "darwin" else max_rss * 1024


def stream_source_to_r_worker(
    spec: SourceSpec,
    expected_source_sha256: str,
    rscript: Path,
    worker_script: Path,
    run_directory: Path,
    timeout_seconds: int,
    chunk_bytes: int,
    source_file: Optional[Path] = None,
) -> TransportReceipt:
    """Send the same counted and hashed HTTP or local bytes to R stdin."""

    if not SHA256_PATTERN.fullmatch(expected_source_sha256):
        raise ValueError("expected source SHA-256 must be lower-case hexadecimal")
    if not rscript.is_file():
        raise ValueError(f"Rscript is not a regular file: {rscript}")
    if not worker_script.is_file():
        raise ValueError(f"R worker is not a regular file: {worker_script}")
    if not 64 * 1024 <= chunk_bytes <= 16 * 1024 * 1024:
        raise ValueError("chunk size must be between 64 KiB and 16 MiB")
    if source_file is not None:
        source_file = source_file.resolve()
        if not source_file.is_file():
            raise ValueError(f"local source is not a regular file: {source_file}")
        if source_file.name != spec.file_name:
            raise ValueError(
                f"local source basename changed: expected {spec.file_name}, "
                f"observed {source_file.name}"
            )
        if source_file.stat().st_size != spec.expected_bytes:
            raise ValueError(
                f"local source byte size changed: expected {spec.expected_bytes}, "
                f"observed {source_file.stat().st_size}"
            )

    artifact_directory = run_directory / "artifacts"
    artifact_directory.mkdir()
    stdout_path = run_directory / "r-worker.stdout"
    stderr_path = run_directory / "r-worker.stderr"
    digest = hashlib.sha256()
    observed_bytes = 0
    process: Optional[subprocess.Popen[bytes]] = None
    response = None
    response_content_encoding = ""
    response_last_modified = ""
    final_url = ""
    status = 0
    response_content_length = 0
    http_reconnect_count = 0
    try:
        with stdout_path.open("wb") as worker_stdout, stderr_path.open(
            "wb"
        ) as worker_stderr:
            process = subprocess.Popen(
                [
                    str(rscript),
                    str(worker_script),
                    spec.transmitter_class,
                    str(spec.expected_rows),
                    str(spec.expected_groups),
                    str(artifact_directory),
                ],
                stdin=subprocess.PIPE,
                stdout=worker_stdout,
                stderr=worker_stderr,
            )
            if process.stdin is None:
                raise RuntimeError("R worker stdin pipe was not created")

            def feed_block(block: bytes) -> None:
                nonlocal observed_bytes
                if not block:
                    return
                if observed_bytes + len(block) > spec.expected_bytes:
                    raise RuntimeError("source stream exceeded its canonical byte count")
                digest.update(block)
                try:
                    process.stdin.write(block)
                except BrokenPipeError as error:
                    raise RuntimeError(
                        "R worker closed stdin before the source stream ended"
                    ) from error
                observed_bytes += len(block)

            if source_file is not None:
                status = 0
                response_content_length = spec.expected_bytes
                with source_file.open("rb") as local_source:
                    for block in iter(lambda: local_source.read(chunk_bytes), b""):
                        feed_block(block)
            else:
                empty_responses = 0
                while observed_bytes < spec.expected_bytes:
                    offset = observed_bytes
                    headers = {
                        "Accept-Encoding": "identity",
                        "User-Agent": "OHRI-Cano-Gomez-open-data-audit/0.1",
                    }
                    if offset > 0:
                        headers["Range"] = f"bytes={offset}-"
                    request = urllib.request.Request(
                        spec.public_url, headers=headers, method="GET"
                    )
                    try:
                        response = urllib.request.urlopen(
                            request, timeout=timeout_seconds
                        )
                    except urllib.error.HTTPError as error:
                        if error.code not in (429, 500, 502, 503, 504):
                            raise
                        if http_reconnect_count >= 63:
                            raise RuntimeError(
                                f"source HTTP remained unavailable at byte "
                                f"{observed_bytes} (last status={error.code})"
                            ) from error
                        http_reconnect_count += 1
                        delay_seconds = min(2 ** min(http_reconnect_count, 3), 8)
                        print(
                            f"NOTICE: source HTTP {error.code} at byte "
                            f"{observed_bytes}; retrying in {delay_seconds}s",
                            file=sys.stderr,
                            flush=True,
                        )
                        time.sleep(delay_seconds)
                        continue
                    except urllib.error.URLError as error:
                        if http_reconnect_count >= 63:
                            raise RuntimeError(
                                f"source HTTP open failed repeatedly at byte "
                                f"{observed_bytes}: {error}"
                            ) from error
                        http_reconnect_count += 1
                        delay_seconds = min(2 ** min(http_reconnect_count, 3), 8)
                        print(
                            f"NOTICE: source HTTP open failed at byte "
                            f"{observed_bytes}; retrying in {delay_seconds}s",
                            file=sys.stderr,
                            flush=True,
                        )
                        time.sleep(delay_seconds)
                        continue
                    segment_status = int(
                        getattr(response, "status", response.getcode())
                    )
                    expected_status = 200 if offset == 0 else 206
                    if segment_status != expected_status:
                        raise RuntimeError(
                            f"source HTTP status at offset {offset} is "
                            f"{segment_status}, not {expected_status}"
                        )
                    content_length_text = response.headers.get("Content-Length")
                    if (
                        content_length_text is None
                        or not content_length_text.isdigit()
                    ):
                        raise RuntimeError(
                            "source response lacks a canonical Content-Length"
                        )
                    segment_content_length = int(content_length_text)
                    if offset == 0:
                        if segment_content_length != spec.expected_bytes:
                            raise RuntimeError(
                                "source response Content-Length changed: "
                                f"expected {spec.expected_bytes}, "
                                f"observed {segment_content_length}"
                            )
                        status = segment_status
                        response_content_length = segment_content_length
                        response_content_encoding = response.headers.get(
                            "Content-Encoding", ""
                        )
                        response_last_modified = response.headers.get(
                            "Last-Modified", ""
                        )
                        final_url = response.geturl()
                    else:
                        content_range = response.headers.get("Content-Range", "")
                        match = re.fullmatch(
                            r"bytes ([0-9]+)-([0-9]+)/([0-9]+)",
                            content_range,
                        )
                        if match is None:
                            raise RuntimeError(
                                f"range response lacks a valid Content-Range: "
                                f"{content_range!r}"
                            )
                        start, end, total = map(int, match.groups())
                        if (
                            start != offset
                            or total != spec.expected_bytes
                            or end < start
                            or end >= total
                            or segment_content_length != end - start + 1
                        ):
                            raise RuntimeError(
                                f"range receipt changed at offset {offset}: "
                                f"Content-Range={content_range!r}, "
                                f"Content-Length={segment_content_length}"
                            )
                        if response.geturl() != final_url:
                            raise RuntimeError("range response final URL changed")
                        if response.headers.get("Content-Encoding", "") != response_content_encoding:
                            raise RuntimeError("range response Content-Encoding changed")
                        if response.headers.get("Last-Modified", "") != response_last_modified:
                            raise RuntimeError("range response Last-Modified changed")

                    if response.geturl() != spec.public_url:
                        raise RuntimeError(
                            f"source URL redirected unexpectedly: {response.geturl()}"
                        )
                    read_error: Optional[BaseException] = None
                    try:
                        while observed_bytes < spec.expected_bytes:
                            block = response.read(chunk_bytes)
                            if not block:
                                break
                            feed_block(block)
                    except http.client.IncompleteRead as error:
                        if error.partial:
                            feed_block(error.partial)
                        read_error = error
                    except (ConnectionError, TimeoutError, OSError) as error:
                        read_error = error
                    finally:
                        response.close()
                        response = None

                    if observed_bytes == spec.expected_bytes:
                        break
                    if observed_bytes == offset:
                        empty_responses += 1
                    else:
                        empty_responses = 0
                    if empty_responses > 3 or http_reconnect_count >= 63:
                        raise RuntimeError(
                            f"source stream made insufficient progress at byte "
                            f"{observed_bytes}; last error={read_error!r}"
                        )
                    http_reconnect_count += 1
                    print(
                        f"NOTICE: resuming exact source stream at byte "
                        f"{observed_bytes} after premature HTTP end",
                        file=sys.stderr,
                        flush=True,
                    )

            process.stdin.close()
            return_code = process.wait(timeout=timeout_seconds)

        worker_stdout_text = stdout_path.read_text(
            encoding="utf-8", errors="replace"
        )
        worker_stderr_text = stderr_path.read_text(
            encoding="utf-8", errors="replace"
        )
        source_sha256 = digest.hexdigest()
        if observed_bytes != spec.expected_bytes:
            raise RuntimeError(
                f"source byte count changed: expected {spec.expected_bytes}, "
                f"observed {observed_bytes}; R worker exit={return_code}; "
                f"stderr={worker_stderr_text.strip()}"
            )
        if source_sha256 != expected_source_sha256:
            raise RuntimeError(
                f"source SHA-256 mismatch: expected {expected_source_sha256}, "
                f"observed {source_sha256}; R worker exit={return_code}; "
                f"stderr={worker_stderr_text.strip()}"
            )
        if return_code != 0:
            raise RuntimeError(
                f"R worker failed after an exact {observed_bytes}-byte, "
                f"SHA-256-verified source stream (exit {return_code}): "
                f"{worker_stderr_text.strip()}"
            )
        max_rss = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss
        return TransportReceipt(
            source_bytes=observed_bytes,
            source_sha256=source_sha256,
            http_status=status,
            response_content_length=response_content_length,
            response_content_encoding=response_content_encoding,
            response_last_modified=response_last_modified,
            final_url=final_url,
            r_worker_max_resident_set_bytes=_rss_to_bytes(int(max_rss)),
            r_worker_stdout=worker_stdout_text,
            r_worker_stderr=worker_stderr_text,
            source_persisted_to_disk=source_file is not None,
            source_file_basename=source_file.name if source_file is not None else None,
            http_reconnect_count=http_reconnect_count,
        )
    except Exception:
        if response is not None:
            response.close()
        if process is not None and process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=10)
        raise


def _validate_worker_profile_origin(
    raw_column: str,
    values: Sequence[Optional[str]],
    worker_profile: Mapping[str, Optional[str]],
    factor_rows: Sequence[Mapping[str, Optional[str]]],
    column_names: Sequence[Optional[str]],
    source_absent_assignments: Sequence[str] = (),
) -> Dict[str, object]:
    if worker_profile.get("column_name") != raw_column:
        raise ValueError(f"worker profile name changed for {raw_column}")
    source_column_present = _require_bool(
        worker_profile.get("source_column_present"),
        f"{raw_column} source_column_present",
    )
    inventory_present = raw_column in column_names
    if source_column_present != inventory_present:
        raise ValueError(
            f"{raw_column} source-column presence disagrees with inventory"
        )
    if raw_column in REQUIRED_ASSIGNMENT_COLUMNS and raw_column not in source_absent_assignments and not source_column_present:
        raise ValueError(f"required assignment column {raw_column} is absent")

    source_column_index: Optional[int]
    if source_column_present:
        source_column_index = _require_int(
            worker_profile.get("source_column_index"),
            f"{raw_column} source column index",
        )
        expected_index = column_names.index(raw_column) + 1
        if source_column_index != expected_index:
            raise ValueError(
                f"{raw_column} source column index disagrees with inventory"
            )
        if worker_profile.get("emission_mode") != PRESERVED_SOURCE_COLUMN_VALUES:
            raise ValueError(f"{raw_column} source-preserving emission mode changed")
        if worker_profile.get("source_column_absence_reason") is not None:
            raise ValueError(
                f"{raw_column} present source column has an absence reason"
            )
        for field in ("typeof", "storage_mode", "class"):
            value = worker_profile.get(field)
            if not isinstance(value, str) or value == "":
                raise ValueError(
                    f"{raw_column} present source column lacks {field}"
                )
        is_factor: Optional[bool] = _require_bool(
            worker_profile.get("is_factor"), f"{raw_column} is_factor"
        )
        is_ordered_factor: Optional[bool] = _require_bool(
            worker_profile.get("is_ordered_factor"),
            f"{raw_column} is_ordered_factor",
        )
        if not is_factor and factor_rows:
            raise ValueError(
                f"{raw_column} non-factor column has factor-level receipts"
            )
    else:
        if raw_column not in OPTIONAL_CONTEXT_COLUMNS + tuple(source_absent_assignments):
            raise ValueError(f"non-optional source column {raw_column} is absent")
        source_column_index = None
        if worker_profile.get("source_column_index") is not None:
            raise ValueError(
                f"{raw_column} absent source column has a source column index"
            )
        if worker_profile.get("emission_mode") != ABSENT_SOURCE_COLUMN_TO_SOURCE_NA:
            raise ValueError(f"{raw_column} absent-source emission mode changed")
        if (
            worker_profile.get("source_column_absence_reason")
            != SOURCE_COLUMN_ABSENCE_REASON
        ):
            raise ValueError(f"{raw_column} source-column absence reason changed")
        for field in (
            "typeof",
            "storage_mode",
            "class",
            "is_factor",
            "is_ordered_factor",
        ):
            if worker_profile.get(field) is not None:
                raise ValueError(
                    f"{raw_column} absent source column fabricated {field}"
                )
        if any(value is not None for value in values):
            raise ValueError(
                f"{raw_column} absent source column was not emitted entirely as source NA"
            )
        if factor_rows:
            raise ValueError(
                f"{raw_column} absent source column has factor-level receipts"
            )
        is_factor = None
        is_ordered_factor = None

    return {
        "sourceColumnPresent": source_column_present,
        "sourceColumnIndex": source_column_index,
        "emissionMode": worker_profile.get("emission_mode"),
        "sourceColumnAbsenceReason": worker_profile.get(
            "source_column_absence_reason"
        ),
        "isFactor": is_factor,
        "isOrderedFactor": is_ordered_factor,
    }


def _profile(
    raw_column: str,
    values: Sequence[Optional[str]],
    worker_profile: Mapping[str, Optional[str]],
    factor_rows: Sequence[Mapping[str, Optional[str]]],
    column_names: Sequence[Optional[str]],
    source_absent_assignments: Sequence[str] = (),
) -> Dict[str, object]:
    origin = _validate_worker_profile_origin(
        raw_column,
        values,
        worker_profile,
        factor_rows,
        column_names,
        source_absent_assignments,
    )
    serialized = ["" if value is None else value for value in values]
    counts = Counter(serialized)
    source_na_count = sum(value is None for value in values)
    source_empty_count = sum(value == "" for value in values)
    whitespace_count = sum(
        value is not None and value != "" and value.strip() == ""
        for value in values
    )
    observed_nonempty = sorted(value for value in counts if value != "")
    expected_checks = {
        "row_count": len(values),
        "source_na_count": source_na_count,
        "source_empty_string_count": source_empty_count,
        "source_whitespace_only_count": whitespace_count,
        "observed_nonempty_unique_count": len(observed_nonempty),
    }
    for field, expected in expected_checks.items():
        observed = _require_int(worker_profile.get(field), f"profile {field}")
        if observed != expected:
            raise ValueError(
                f"worker profile {field} disagrees with row stream: "
                f"expected {expected}, observed {observed}"
            )

    ordered_levels = sorted(
        factor_rows,
        key=lambda row: _require_int(row.get("level_index"), "factor level index"),
    )
    levels: List[Optional[str]] = []
    zero_count_levels: List[Optional[str]] = []
    for factor_row in ordered_levels:
        level = factor_row.get("level")
        expected_count = _require_int(
            factor_row.get("observed_count"), "factor level count"
        )
        observed_count = sum(
            value is None if level is None else value == level for value in values
        )
        if observed_count != expected_count:
            raise ValueError(
                f"factor level {level!r} count changed: "
                f"expected {expected_count}, observed {observed_count}"
            )
        levels.append(level)
        if observed_count == 0:
            zero_count_levels.append(level)

    return {
        **origin,
        "typeof": worker_profile.get("typeof"),
        "storageMode": worker_profile.get("storage_mode"),
        "class": worker_profile.get("class"),
        "rowCount": len(values),
        "missingCount": counts[""],
        "sourceMissingCount": source_na_count,
        "sourceEmptyStringCount": source_empty_count,
        "sourceWhitespaceOnlyCount": whitespace_count,
        "observedNonemptyUniqueCount": len(observed_nonempty),
        "factorLevels": levels,
        "zeroCountLevels": zero_count_levels,
        "counts": {value: counts[value] for value in sorted(counts)},
    }


def validate_worker_artifacts(
    spec: SourceSpec, artifact_directory: Path, source_sha256: Optional[str] = None
) -> Mapping[str, object]:
    expected_files = {
        "metadata.csv",
        "columns.csv",
        "required_profiles.csv",
        "factor_levels.csv",
        "worker_receipt.csv",
    }
    observed_files = {path.name for path in artifact_directory.iterdir()}
    if observed_files != expected_files:
        raise ValueError(
            "worker artifact set changed: "
            f"expected {sorted(expected_files)}, observed {sorted(observed_files)}"
        )

    header, rows = _lossless_table(artifact_directory / "metadata.csv")
    if header != CSV_HEADER:
        raise ValueError(f"worker metadata header changed: {header}")
    if len(rows) != spec.expected_rows:
        raise ValueError(
            f"worker row denominator changed: expected {spec.expected_rows}, "
            f"observed {len(rows)}"
        )
    values_by_column: Dict[str, List[Optional[str]]] = {
        name: [] for name in CSV_HEADER
    }
    row_names: List[str] = []
    groups = set()
    for row_index, row in enumerate(rows, start=1):
        values = dict(zip(CSV_HEADER, row))
        nucleus_id = values["nucleus_id"]
        if nucleus_id is None or nucleus_id == "" or "|" in nucleus_id:
            raise ValueError(f"invalid source nucleus id at row {row_index}")
        if values["transmitter_class"] != spec.transmitter_class:
            raise ValueError(f"transmitter class changed at row {row_index}")
        group = values["group"]
        if group is None or group == "":
            raise ValueError(f"group assignment is missing at row {row_index}")
        row_names.append(nucleus_id)
        groups.add(group)
        for column_name, value in values.items():
            values_by_column[column_name].append(value)
    if len(set(row_names)) != len(row_names):
        raise ValueError("source nucleus ids are not unique")
    if len(groups) != spec.expected_groups:
        raise ValueError(
            f"group denominator changed: expected {spec.expected_groups}, "
            f"observed {len(groups)}"
        )

    column_rows = _table_dicts(artifact_directory / "columns.csv")
    column_names = [row.get("column_name") for row in column_rows]
    if any(name is None or name == "" for name in column_names):
        raise ValueError("worker column inventory contains a missing name")
    if len(set(column_names)) != len(column_names):
        raise ValueError("worker column inventory contains duplicate names")
    source_absent_assignments = source_absent_assignment_fields(spec, column_names, source_sha256)
    required_assignments = tuple(field for field in REQUIRED_ASSIGNMENT_COLUMNS if field not in source_absent_assignments)
    missing_raw = sorted(set(required_assignments) - set(column_names))
    if missing_raw:
        raise ValueError(
            f"worker column inventory lacks required assignment columns {missing_raw}"
        )
    for expected_index, column_row in enumerate(column_rows, start=1):
        observed_index = _require_int(
            column_row.get("source_column_index"), "column index"
        )
        if observed_index != expected_index:
            raise ValueError("worker column inventory order is not contiguous")

    profile_rows = _table_dicts(artifact_directory / "required_profiles.csv")
    profile_by_name = {row.get("column_name"): row for row in profile_rows}
    if (
        len(profile_by_name) != len(profile_rows)
        or set(profile_by_name) != set(CONTRACT_RAW_COLUMNS)
    ):
        raise ValueError("worker contracted-profile field set changed")
    factor_rows = _table_dicts(artifact_directory / "factor_levels.csv")
    for row in factor_rows:
        if row.get("column_name") not in CONTRACT_RAW_COLUMNS:
            raise ValueError("factor receipt names a non-contracted column")

    metadata_profiles: Dict[str, object] = {}
    for raw_column, output_column in RAW_TO_OUTPUT_COLUMNS.items():
        metadata_profiles[raw_column] = _profile(
            raw_column,
            values_by_column[output_column],
            profile_by_name[raw_column],
            [
                row
                for row in factor_rows
                if row.get("column_name") == raw_column
            ],
            column_names,
            source_absent_assignments,
        )

    receipt_rows = _table_dicts(artifact_directory / "worker_receipt.csv")
    if len(receipt_rows) != 1:
        raise ValueError("worker receipt must contain exactly one row")
    worker_receipt = receipt_rows[0]
    expected_receipt = {
        "contract_version": FORMAT_VERSION,
        "object_is_s4": "true",
        "metadata_access": "attr(object, meta.data, exact=TRUE)",
        "metadata_rows": str(spec.expected_rows),
        "metadata_columns": str(len(column_rows)),
        "required_assignment_columns": "|".join(required_assignments),
        "optional_context_columns": "|".join(OPTIONAL_CONTEXT_COLUMNS),
        "present_optional_context_columns": "|".join(
            field for field in OPTIONAL_CONTEXT_COLUMNS if field in column_names
        ),
        "absent_optional_context_columns": "|".join(
            field for field in OPTIONAL_CONTEXT_COLUMNS if field not in column_names
        ),
        "absent_optional_context_emitted_as_source_na": "true",
        "observed_groups": str(spec.expected_groups),
        "base_r_only": "true",
        "complete_object_materialized_by_read_rds": "true",
        "seurat_object_namespace_loaded": "false",
        "cross_assay_cell_identity_verified": "false",
        "same_cell_claim_authorized": "false",
        "geometry_claim_authorized": "false",
        "internal_structure_claim_authorized": "false",
    }
    for field, expected in expected_receipt.items():
        if worker_receipt.get(field) != expected:
            raise ValueError(
                f"worker receipt {field!r} changed: "
                f"expected {expected!r}, observed {worker_receipt.get(field)!r}"
            )
    if "Seurat" not in (worker_receipt.get("object_class") or "").split("/"):
        raise ValueError("worker receipt does not identify a Seurat object")
    observed_type_count = metadata_profiles["neuron_types"][
        "observedNonemptyUniqueCount"
    ]
    if worker_receipt.get("observed_nonempty_neuron_types") != str(
        observed_type_count
    ):
        raise ValueError("worker neuron-type denominator disagrees with row stream")

    return {
        "rows": rows,
        "row_names": row_names,
        "groups": groups,
        "values_by_column": values_by_column,
        "column_rows": column_rows,
        "column_names": column_names,
        "metadata_profiles": metadata_profiles,
        "worker_receipt": worker_receipt,
        "source_absent_assignments": source_absent_assignments,
    }


def validate_and_package_worker_artifacts(
    spec: SourceSpec,
    expected_source_sha256: str,
    transport: TransportReceipt,
    run_directory: Path,
    output_directory: Path,
    worker_script: Path,
    transport_script: Path,
    chol_probe_receipt: Optional[CholProbeReceipt] = None,
) -> Mapping[str, object]:
    """Validate the worker receipt and atomically admit only CSV.gz plus audit."""

    larger_class = spec.transmitter_class in ("GABA", "GLUT")
    if larger_class and chol_probe_receipt is None:
        raise ValueError(
            f"{spec.transmitter_class} packaging requires a verified CHOL probe audit"
        )
    if not larger_class and chol_probe_receipt is not None:
        raise ValueError("CHOL packaging cannot consume a CHOL probe gate receipt")
    if output_directory.exists():
        raise FileExistsError(f"output path already exists: {output_directory}")
    if transport.source_bytes != spec.expected_bytes:
        raise ValueError("transport byte count does not match the source contract")
    if transport.source_sha256 != expected_source_sha256:
        raise ValueError("transport SHA-256 does not match the pinned source hash")
    artifact_directory = run_directory / "artifacts"
    checked = validate_worker_artifacts(spec, artifact_directory, transport.source_sha256)
    metadata_profiles = checked["metadata_profiles"]
    row_names = checked["row_names"]
    groups = checked["groups"]
    column_names = checked["column_names"]
    worker_receipt = checked["worker_receipt"]

    plain_path = artifact_directory / "metadata.csv"
    stem = spec.file_name[:-4]
    gzip_path = artifact_directory / f"{stem}.metadata.csv.gz"
    _gzip_deterministic(plain_path, gzip_path)
    plain_bytes = plain_path.stat().st_size
    plain_sha256 = sha256_file(plain_path)
    gzip_bytes = gzip_path.stat().st_size
    gzip_sha256 = sha256_file(gzip_path)
    compound_keys = (
        f"{ACCESSION}|{spec.file_name}|{row_name}" for row_name in row_names
    )
    present_optional_context_fields = [
        field
        for field in OPTIONAL_CONTEXT_COLUMNS
        if metadata_profiles[field]["sourceColumnPresent"]
    ]
    absent_optional_context_fields = [
        field
        for field in OPTIONAL_CONTEXT_COLUMNS
        if not metadata_profiles[field]["sourceColumnPresent"]
    ]
    audit: Dict[str, object] = {
        "formatVersion": FORMAT_VERSION,
        "receiptKind": "cano_gomez_base_r_stream_meta_data_row_only_audit",
        "authorityMode": AUTHORITY_MODE,
        "crossAssayCellIdentityVerified": False,
        "sourceAccession": ACCESSION,
        "sourceFile": spec.file_name,
        "sourcePublicUrl": spec.public_url,
        "sourceBytes": transport.source_bytes,
        "sourceExpectedBytes": spec.expected_bytes,
        "sourceBytesMatchesExpected": True,
        "sourceSha256": transport.source_sha256,
        "sourceExpectedSha256": expected_source_sha256,
        "sourceSha256MatchesExpected": True,
        "transmitterClass": spec.transmitter_class,
        "rowCount": len(row_names),
        "uniqueRowNameCount": len(set(row_names)),
        "metadataColumns": [str(name) for name in column_names],
        "metadataColumnInventory": checked["column_rows"],
        "metadataFieldContract": {
            "requiredAssignmentFields": [field for field in REQUIRED_ASSIGNMENT_COLUMNS if field not in checked["source_absent_assignments"]],
            **({"sourceAbsentAssignmentFields": checked["source_absent_assignments"]} if checked["source_absent_assignments"] else {}),
            "optionalContextFields": list(OPTIONAL_CONTEXT_COLUMNS),
            "presentOptionalContextFields": present_optional_context_fields,
            "absentOptionalContextFields": absent_optional_context_fields,
            "absentOptionalContextEmissionMode": (
                ABSENT_SOURCE_COLUMN_TO_SOURCE_NA
            ),
            "allContractFieldsHaveExplicitPresenceReceipts": True,
        },
        "metadataFields": metadata_profiles,
        "identityChecks": {
            "authorityMode": AUTHORITY_MODE,
            "stableIdSource": "meta.data row.names",
            "stableCompoundKeyExpression": COMPOUND_KEY_EXPRESSION,
            "metadataRowNamesUniqueNonempty": True,
            "orderedMetadataRowNamesSha256": sha256_ordered_lines(row_names),
            "orderedCompoundNucleusKeysSha256": sha256_ordered_lines(
                compound_keys
            ),
            "sameRowRawMetadataAssignmentVerified": True,
            "objectCellsExactOrder": UNRESOLVED_IDENTITY,
            "assayColnamesExactOrder": UNRESOLVED_IDENTITY,
            "activeIdentNamesExactOrder": UNRESOLVED_IDENTITY,
            "crossAssayCellIdentityVerified": False,
            "sameCellClaimAuthorized": False,
        },
        "denominators": {
            "expectedRowCount": spec.expected_rows,
            "observedRowCount": len(row_names),
            "expectedGroupCount": spec.expected_groups,
            "observedNonemptyGroupCount": len(groups),
            "observedNonemptyNeuronTypeCount": metadata_profiles[
                "neuron_types"
            ]["observedNonemptyUniqueCount"],
        },
        "transport": {
            "mode": (
                "LOCAL_FILE_TO_R_STDIN"
                if transport.source_persisted_to_disk
                else "HTTP_RANGE_RESUMABLE_TO_R_STDIN"
            ),
            "sourcePersistedToDisk": transport.source_persisted_to_disk,
            "localSourceBasename": transport.source_file_basename,
            "sourceBytesStreamedDirectlyToRStdin": True,
            "sameRawBytesCountedAndHashedBeforeRStdinWrite": True,
            "httpStatus": transport.http_status,
            "responseContentLength": transport.response_content_length,
            "responseContentEncoding": transport.response_content_encoding,
            "finalUrl": transport.final_url,
            "httpReconnectCount": transport.http_reconnect_count,
            "boundedChunkTransport": True,
        },
        "runtime": {
            "transportPythonImplementation": platform.python_implementation(),
            "transportPythonVersion": platform.python_version(),
            "rVersion": worker_receipt.get("r_version"),
            "rPlatform": worker_receipt.get("r_platform"),
            "baseROnly": True,
            "seuratObjectNamespaceLoaded": False,
            "rWorkerMaxResidentSetBytesExcludedFromDeterministicAudit": True,
        },
        "extractors": {
            "transport": {
                "fileName": transport_script.name,
                "sha256": sha256_file(transport_script),
            },
            "baseRWorker": {
                "fileName": worker_script.name,
                "sha256": sha256_file(worker_script),
            },
        },
        "memoryBoundary": {
            "readRDSMaterializesCompleteObject": True,
            "metadataRetainedThenCompleteObjectReleasedBeforeWriting": True,
            "compressedByteSizeIsNotAReliableMemoryPredictor": True,
            "CHOLMemoryProbeRequiredBeforeLargerClasses": True,
            "CHOLProbeDoesNotAuthorizeGabaOrGlutRun": True,
            "cholProbeGate": {
                "requiredForThisClass": larger_class,
                "verifiedBeforeSourceTransport": chol_probe_receipt is not None,
                "probeAuditSha256": (
                    chol_probe_receipt.audit_sha256
                    if chol_probe_receipt is not None
                    else None
                ),
                "probeSourceSha256": (
                    chol_probe_receipt.source_sha256
                    if chol_probe_receipt is not None
                    else None
                ),
                "probeTransportExtractorSha256": (
                    chol_probe_receipt.transport_extractor_sha256
                    if chol_probe_receipt is not None
                    else None
                ),
                "probeBaseRWorkerSha256": (
                    chol_probe_receipt.base_r_worker_sha256
                    if chol_probe_receipt is not None
                    else None
                ),
                "largerClassMemorySafetyEstablished": False,
                "scientificOrClassificationAuthorityAdded": False,
            },
        },
        "output": {
            "metadataCsvGzip": {
                "fileName": gzip_path.name,
                "mediaType": "text/csv",
                "contentEncoding": "gzip",
                "deterministicCompression": (
                    "Python gzip.GzipFile compresslevel=9 filename-empty mtime=0"
                ),
                "sourceNaEncoding": "unquoted NA",
                "nonmissingValueEncoding": "always quoted with doubled quotes",
                "rowCount": len(row_names),
                "columnCount": len(CSV_HEADER),
                "orderedColumnNames": list(CSV_HEADER),
                "uncompressedBytes": plain_bytes,
                "uncompressedSha256": plain_sha256,
                "compressedBytes": gzip_bytes,
                "compressedSha256": gzip_sha256,
            }
        },
        "scopeBoundaries": {
            "rawLabelsPreserved": True,
            "sourceNaAndExactEmptyStringDistinguished": True,
            "absentContextSourceColumnsEmittedOnlyAsSourceNa": True,
            "optionalContextInferenceApplied": False,
            "sourceColumnAbsenceInterpretedAsBiologicalAbsence": False,
            "sameMetaDataRowAssignmentsOnly": True,
            "labelNormalizationApplied": False,
            "classificationInferenceApplied": False,
            "reported516TypeDenominatorHardAssertionApplied": False,
            "crossAssayCellIdentityVerified": False,
            "sameCellLinkageAuthorized": False,
            "geometryClaimAuthorized": False,
            "internalStructureClaimAuthorized": False,
            "atlasRegistrationClaimAuthorized": False,
        },
    }

    audit_path = artifact_directory / f"{stem}.audit.json"
    audit_path.write_bytes(
        (
            json.dumps(audit, ensure_ascii=False, indent=2, sort_keys=True)
            + "\n"
        ).encode("utf-8")
    )
    for path in list(artifact_directory.iterdir()):
        if path not in (gzip_path, audit_path):
            path.unlink()
    os.replace(artifact_directory, output_directory)
    final_metadata_path = output_directory / gzip_path.name
    final_audit_path = output_directory / audit_path.name
    return {
        "authorityMode": AUTHORITY_MODE,
        "crossAssayCellIdentityVerified": False,
        "sourceSha256": transport.source_sha256,
        "sourceBytes": transport.source_bytes,
        "rows": len(row_names),
        "groups": len(groups),
        "types": metadata_profiles["neuron_types"][
            "observedNonemptyUniqueCount"
        ],
        "metadata": str(final_metadata_path),
        "metadataBytes": gzip_bytes,
        "metadataSha256": gzip_sha256,
        "audit": str(final_audit_path),
        "auditBytes": final_audit_path.stat().st_size,
        "auditSha256": sha256_file(final_audit_path),
        "rWorkerMaxResidentSetBytes": transport.r_worker_max_resident_set_bytes,
        "readRDSMaterializedCompleteObject": True,
    }


def parse_arguments(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Stream one canonical Cano-Gomez RDS directly into base R while "
            "counting and hashing the same compressed source bytes."
        )
    )
    parser.add_argument(
        "--class-name", required=True, choices=tuple(SOURCE_SPECS)
    )
    parser.add_argument("--expected-source-sha256", required=True)
    parser.add_argument(
        "--chol-probe-audit",
        type=Path,
        help=(
            "Required for GABA and GLUT: exact successful CHOL audit emitted "
            "by the current transport and base-R worker. This is an "
            "operational gate, not a larger-object memory-safety claim."
        ),
    )
    parser.add_argument("--rscript", required=True, type=Path)
    parser.add_argument("--output-directory", required=True, type=Path)
    source_group = parser.add_mutually_exclusive_group()
    source_group.add_argument(
        "--http",
        action="store_true",
        help="Use the canonical NCBI GEO URL (default).",
    )
    source_group.add_argument(
        "--source-file",
        type=Path,
        help=(
            "Read one already-complete canonical RDS from disk; only its exact "
            "basename is retained in the output receipt."
        ),
    )
    parser.add_argument("--timeout-seconds", type=int, default=14_400)
    parser.add_argument("--chunk-bytes", type=int, default=1024 * 1024)
    return parser.parse_args(argv)


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = parse_arguments(argv)
    if not SHA256_PATTERN.fullmatch(args.expected_source_sha256):
        raise ValueError(
            "--expected-source-sha256 must be 64 lower-case hex characters"
        )
    if not 60 <= args.timeout_seconds <= 86_400:
        raise ValueError("--timeout-seconds must be between 60 and 86400")
    transport_script = Path(__file__).resolve()
    worker_script = transport_script.with_name(
        "extract_cano_gomez_rds_metadata_stream.R"
    )
    spec = SOURCE_SPECS[args.class_name]
    larger_class = spec.transmitter_class in ("GABA", "GLUT")
    if larger_class and args.chol_probe_audit is None:
        raise ValueError(
            f"--chol-probe-audit is required before {spec.transmitter_class}"
        )
    if not larger_class and args.chol_probe_audit is not None:
        raise ValueError("--chol-probe-audit is only valid for GABA or GLUT")
    chol_probe_receipt = (
        validate_chol_probe_audit(
            args.chol_probe_audit.resolve(), transport_script, worker_script
        )
        if args.chol_probe_audit is not None
        else None
    )
    output_directory = args.output_directory.resolve()
    if output_directory.exists():
        raise FileExistsError(f"output path already exists: {output_directory}")
    output_directory.parent.mkdir(parents=True, exist_ok=True)
    run_directory = Path(
        tempfile.mkdtemp(
            prefix=f".{output_directory.name}.run-",
            dir=output_directory.parent,
        )
    )
    try:
        transport = stream_source_to_r_worker(
            spec=spec,
            expected_source_sha256=args.expected_source_sha256,
            rscript=args.rscript.resolve(),
            worker_script=worker_script,
            run_directory=run_directory,
            timeout_seconds=args.timeout_seconds,
            chunk_bytes=args.chunk_bytes,
            source_file=args.source_file,
        )
        result = validate_and_package_worker_artifacts(
            spec=spec,
            expected_source_sha256=args.expected_source_sha256,
            transport=transport,
            run_directory=run_directory,
            output_directory=output_directory,
            worker_script=worker_script,
            transport_script=transport_script,
            chol_probe_receipt=chol_probe_receipt,
        )
    finally:
        shutil.rmtree(run_directory, ignore_errors=True)
    print(json.dumps(result, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (
        FileExistsError,
        OSError,
        RuntimeError,
        subprocess.TimeoutExpired,
        urllib.error.URLError,
        ValueError,
    ) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(2)
