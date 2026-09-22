#!/usr/bin/env python3
"""Extract source-row metadata from the three Cano-Gomez GSE318731 RDS files.

This is a deliberately narrow clean-room route for environments without R.  Its
only identity authority is the ordered, unique, non-empty ``meta.data`` row
name and the raw metadata values on that same row.  It does not inspect or
validate Seurat Cells(), assay colnames, active identities, same-cell links, or
geometry.

The supported rdata parser is an exact, locally patched rdata 0.11.2 runtime.
Pass its site-packages directory explicitly with ``--site-packages`` when it is
not already on PYTHONPATH.  See ``cano_gomez_python_rdata_runtime-0.1.json`` and
``patches/rdata-0.11.2-seurat-rds-parser.patch`` beside this script.
"""

from __future__ import annotations

import argparse
import gzip
import hashlib
import importlib
import importlib.metadata
import json
import os
import platform
import re
import sys
import tempfile
import warnings
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from types import SimpleNamespace
from typing import Any, Dict, Iterable, List, Mapping, Optional, Sequence, Tuple


ACCESSION = "GSE318731"
FORMAT_VERSION = "0.1.0"
AUTHORITY_MODE = "PYTHON_RDATA_META_DATA_ROW_ONLY"
UNRESOLVED_IDENTITY = "not_yet_resolved_by_python_clean_room_parser"
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
REQUIRED_RAW_COLUMNS = ("groups", "neuron_types", "anatomy", "source", "Sex")
CORE_RUNTIME_VERSIONS = {
    "numpy": "2.0.2",
    "pandas": "2.3.3",
    "rdata": "0.11.2",
}
PATCHED_PARSER_SHA256 = (
    "52aa37ef301136240931dd0970f9891da127aa222bd84541239b774b19337aa5"
)
SHA256_PATTERN = re.compile(r"^[0-9a-f]{64}$")


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
        transmitter_class="CHOL",
        file_name="GSE318731_P56_cholinergic_multiome.rds",
        expected_bytes=127_862_795,
        expected_rows=3_199,
        expected_groups=5,
        public_url=(
            "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE318nnn/"
            "GSE318731/suppl/GSE318731_P56_cholinergic_multiome.rds"
        ),
    ),
    "GABA": SourceSpec(
        transmitter_class="GABA",
        file_name="GSE318731_P56_gabaergic_multiome.rds",
        expected_bytes=1_646_402_816,
        expected_rows=73_364,
        expected_groups=24,
        public_url=(
            "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE318nnn/"
            "GSE318731/suppl/GSE318731_P56_gabaergic_multiome.rds"
        ),
    ),
    "GLUT": SourceSpec(
        transmitter_class="GLUT",
        file_name="GSE318731_P56_glutamatergic_multiome_UPDATE.rds",
        expected_bytes=1_832_005_077,
        expected_rows=92_782,
        expected_groups=28,
        public_url=(
            "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE318nnn/"
            "GSE318731/suppl/"
            "GSE318731_P56_glutamatergic_multiome_UPDATE.rds"
        ),
    ),
}


@dataclass(frozen=True)
class MetadataSnapshot:
    """Pure-Python snapshot used by both the RDS route and fixture tests."""

    source_file_name: str
    source_bytes: int
    source_expected_bytes: int
    source_sha256: str
    source_expected_sha256: str
    transmitter_class: str
    expected_rows: int
    expected_groups: int
    row_names: Tuple[str, ...]
    metadata_columns: Tuple[str, ...]
    values: Mapping[str, Tuple[Optional[str], ...]]
    storage_classes: Mapping[str, str]
    factor_levels: Mapping[str, Tuple[str, ...]]
    public_url: str = ""


@dataclass(frozen=True)
class RuntimeReceipt:
    python_implementation: str
    python_version: str
    package_versions: Mapping[str, str]
    parser_sha256: str


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


def _root_object(converted: Any) -> Any:
    if isinstance(converted, dict) and len(converted) == 1:
        return next(iter(converted.values()))
    return converted


def _meta_data_only(root: Any) -> Any:
    """Resolve only Seurat's meta.data slot; do not traverse other slots."""

    if isinstance(root, SimpleNamespace):
        return getattr(root, "meta.data", None)
    if isinstance(root, dict):
        return root.get("meta.data")
    return getattr(root, "meta.data", None)


def _scalar_text(value: Any, pandas_module: Any, numpy_module: Any) -> Optional[str]:
    if value is None:
        return None
    missing = pandas_module.isna(value)
    if isinstance(missing, (bool, numpy_module.bool_)):
        if bool(missing):
            return None
    else:
        raise ValueError("nested or non-scalar metadata values are not supported")
    return str(value)


def _series_factor_levels(series: Any, pandas_module: Any) -> Tuple[str, ...]:
    if isinstance(series.dtype, pandas_module.CategoricalDtype):
        return tuple(str(value) for value in series.cat.categories.tolist())
    return ()


def _load_runtime(site_packages: Sequence[Path]) -> Tuple[Any, Any, Any, RuntimeReceipt]:
    for directory in reversed(site_packages):
        resolved = directory.resolve()
        if not resolved.is_dir():
            raise ValueError(f"site-packages directory does not exist: {resolved}")
        sys.path.insert(0, str(resolved))

    try:
        numpy_module = importlib.import_module("numpy")
        pandas_module = importlib.import_module("pandas")
        rdata_module = importlib.import_module("rdata")
        parser_module = importlib.import_module("rdata.parser._parser")
    except ImportError as error:
        raise RuntimeError(
            "Missing the pinned Python extraction runtime. Install the versions in "
            "tools/cano_gomez_python_rdata_runtime-0.1.json and pass its "
            "site-packages directory with --site-packages."
        ) from error

    observed_versions = {
        package: importlib.metadata.version(package)
        for package in CORE_RUNTIME_VERSIONS
    }
    mismatches = {
        package: {"expected": expected, "observed": observed_versions[package]}
        for package, expected in CORE_RUNTIME_VERSIONS.items()
        if observed_versions[package] != expected
    }
    if mismatches:
        raise RuntimeError(
            "Core extraction package version mismatch: "
            + json.dumps(mismatches, sort_keys=True)
        )

    parser_path = Path(parser_module.__file__).resolve()
    parser_sha256 = sha256_file(parser_path)
    if parser_sha256 != PATCHED_PARSER_SHA256:
        raise RuntimeError(
            "rdata 0.11.2 parser is not the checksum-pinned patched parser "
            f"(expected {PATCHED_PARSER_SHA256}, observed {parser_sha256})."
        )

    runtime = RuntimeReceipt(
        python_implementation=platform.python_implementation(),
        python_version=platform.python_version(),
        package_versions=observed_versions,
        parser_sha256=parser_sha256,
    )
    return numpy_module, pandas_module, rdata_module, runtime


def extract_snapshot(
    source: Path,
    spec: SourceSpec,
    expected_rows: int,
    expected_groups: int,
    site_packages: Sequence[Path],
    expected_source_sha256: str,
) -> Tuple[MetadataSnapshot, RuntimeReceipt]:
    source = source.resolve()
    if not source.is_file():
        raise ValueError(f"RDS source is not a regular file: {source}")
    if source.name != spec.file_name:
        raise ValueError(
            f"source basename mismatch: expected {spec.file_name}, observed {source.name}"
        )
    if expected_rows != spec.expected_rows or expected_groups != spec.expected_groups:
        raise ValueError(
            "CLI denominators disagree with the canonical Cano-Gomez source spec: "
            f"rows {expected_rows}/{spec.expected_rows}, "
            f"groups {expected_groups}/{spec.expected_groups}"
        )
    observed_bytes = source.stat().st_size
    if observed_bytes != spec.expected_bytes:
        raise ValueError(
            f"source byte-size mismatch: expected {spec.expected_bytes}, "
            f"observed {observed_bytes}"
        )
    source_sha256 = sha256_file(source)
    if source_sha256 != expected_source_sha256:
        raise ValueError(
            "source SHA-256 mismatch: "
            f"expected {expected_source_sha256}, observed {source_sha256}"
        )

    numpy_module, pandas_module, rdata_module, runtime = _load_runtime(site_packages)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        parsed = rdata_module.parser.parse_file(source)
        converted = rdata_module.conversion.convert(parsed)
    metadata = _meta_data_only(_root_object(converted))
    if not isinstance(metadata, pandas_module.DataFrame):
        raise TypeError(
            "converted Seurat meta.data is not a pandas DataFrame; "
            f"observed {type(metadata)!r}"
        )
    if len(metadata) != expected_rows:
        raise ValueError(
            f"meta.data row denominator changed: expected {expected_rows}, "
            f"observed {len(metadata)}"
        )

    metadata_columns = tuple(str(column) for column in metadata.columns.tolist())
    if any(not column for column in metadata_columns):
        raise ValueError("meta.data contains an empty column name")
    if len(set(metadata_columns)) != len(metadata_columns):
        raise ValueError("meta.data contains duplicate column names")
    missing_columns = [
        column for column in REQUIRED_RAW_COLUMNS if column not in metadata_columns
    ]
    if missing_columns:
        raise ValueError(f"meta.data lacks required raw columns: {missing_columns}")

    row_names_list: List[str] = []
    for value in metadata.index.tolist():
        text_value = _scalar_text(value, pandas_module, numpy_module)
        if text_value is None or text_value == "":
            raise ValueError("meta.data row names contain a missing or empty value")
        if "|" in text_value:
            raise ValueError("meta.data row name contains reserved compound-key delimiter `|`")
        row_names_list.append(text_value)
    if len(row_names_list) != expected_rows:
        raise ValueError("meta.data row-name count disagrees with its row count")
    if len(set(row_names_list)) != len(row_names_list):
        raise ValueError("meta.data row names are not unique")

    values: Dict[str, Tuple[Optional[str], ...]] = {}
    storage_classes: Dict[str, str] = {}
    factor_levels: Dict[str, Tuple[str, ...]] = {}
    for column in REQUIRED_RAW_COLUMNS:
        series = metadata[column]
        values[column] = tuple(
            _scalar_text(value, pandas_module, numpy_module)
            for value in series.tolist()
        )
        storage_classes[column] = str(series.dtype)
        factor_levels[column] = _series_factor_levels(series, pandas_module)

    group_values = values["groups"]
    if any(value is None or value == "" for value in group_values):
        raise ValueError("raw groups contains a missing or empty assignment")
    observed_groups = sorted(set(value for value in group_values if value is not None))
    if len(observed_groups) != expected_groups:
        raise ValueError(
            f"group denominator changed: expected {expected_groups}, "
            f"observed {len(observed_groups)}"
        )

    snapshot = MetadataSnapshot(
        source_file_name=source.name,
        source_bytes=observed_bytes,
        source_expected_bytes=spec.expected_bytes,
        source_sha256=source_sha256,
        source_expected_sha256=expected_source_sha256,
        transmitter_class=spec.transmitter_class,
        expected_rows=expected_rows,
        expected_groups=expected_groups,
        row_names=tuple(row_names_list),
        metadata_columns=metadata_columns,
        values=values,
        storage_classes=storage_classes,
        factor_levels=factor_levels,
        public_url=spec.public_url,
    )
    validate_snapshot(snapshot)
    return snapshot, runtime


def validate_snapshot(snapshot: MetadataSnapshot) -> None:
    if not SHA256_PATTERN.fullmatch(snapshot.source_sha256):
        raise ValueError("source_sha256 is not a lowercase SHA-256 value")
    if snapshot.source_bytes != snapshot.source_expected_bytes:
        raise ValueError("snapshot source byte count does not match its expected receipt")
    if not SHA256_PATTERN.fullmatch(snapshot.source_expected_sha256):
        raise ValueError("source_expected_sha256 is not a lowercase SHA-256 value")
    if snapshot.source_sha256 != snapshot.source_expected_sha256:
        raise ValueError("snapshot source SHA-256 does not match its expected receipt")
    if len(snapshot.row_names) != snapshot.expected_rows:
        raise ValueError("snapshot row denominator changed")
    if any(not value for value in snapshot.row_names):
        raise ValueError("snapshot row names contain an empty value")
    if any("|" in value for value in snapshot.row_names):
        raise ValueError("snapshot row name contains reserved `|`")
    if len(set(snapshot.row_names)) != len(snapshot.row_names):
        raise ValueError("snapshot row names are not unique")
    if len(set(snapshot.metadata_columns)) != len(snapshot.metadata_columns):
        raise ValueError("snapshot metadata columns are not unique")
    for column in REQUIRED_RAW_COLUMNS:
        if column not in snapshot.metadata_columns or column not in snapshot.values:
            raise ValueError(f"snapshot lacks required raw column {column}")
    for column in REQUIRED_RAW_COLUMNS:
        if len(snapshot.values[column]) != snapshot.expected_rows:
            raise ValueError(f"snapshot column {column} has the wrong row count")
    groups = snapshot.values["groups"]
    if any(value is None or value == "" for value in groups):
        raise ValueError("snapshot groups contains a missing or empty assignment")
    if len(set(value for value in groups if value is not None)) != snapshot.expected_groups:
        raise ValueError("snapshot group denominator changed")


def _serialized_value(value: Optional[str]) -> str:
    return "" if value is None else value


def _profile(snapshot: MetadataSnapshot, column: str) -> Dict[str, Any]:
    raw_values = snapshot.values[column]
    serialized = [_serialized_value(value) for value in raw_values]
    counts = Counter(serialized)
    observed_nonempty = sorted(value for value in counts if value != "")
    levels = list(snapshot.factor_levels.get(column, ()))
    return {
        "storageClass": snapshot.storage_classes.get(column, "unknown"),
        "rowCount": len(raw_values),
        "missingCount": sum(value == "" for value in serialized),
        "sourceMissingCount": sum(value is None for value in raw_values),
        "sourceEmptyStringCount": sum(value == "" for value in raw_values),
        "sourceWhitespaceOnlyCount": sum(
            value is not None and value != "" and value.strip() == ""
            for value in raw_values
        ),
        "observedNonemptyUniqueCount": len(observed_nonempty),
        "factorLevels": levels,
        "zeroCountLevels": [level for level in levels if counts[level] == 0],
        "counts": {value: counts[value] for value in sorted(counts)},
    }


def _csv_rows(snapshot: MetadataSnapshot) -> Iterable[Tuple[Optional[str], ...]]:
    fields = snapshot.values
    for index, nucleus_id in enumerate(snapshot.row_names):
        yield (
            nucleus_id,
            snapshot.transmitter_class,
            fields["groups"][index],
            fields["neuron_types"][index],
            fields["source"][index],
            fields["anatomy"][index],
            fields["Sex"][index],
        )


def _encode_csv_value(value: Optional[str]) -> str:
    """Match the R extractor's lossless NA/string serialization contract."""

    if value is None:
        return "NA"
    return '"' + value.replace('"', '""') + '"'


def _write_plain_csv(snapshot: MetadataSnapshot, path: Path) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        handle.write(",".join(CSV_HEADER) + "\n")
        for row in _csv_rows(snapshot):
            handle.write(",".join(_encode_csv_value(value) for value in row) + "\n")


def _gzip_deterministic(plain_path: Path, gzip_path: Path) -> None:
    with plain_path.open("rb") as source, gzip_path.open("wb") as raw_target:
        with gzip.GzipFile(
            filename="",
            mode="wb",
            compresslevel=9,
            fileobj=raw_target,
            mtime=0,
        ) as target:
            for block in iter(lambda: source.read(1024 * 1024), b""):
                target.write(block)


def _source_stem(source_file_name: str) -> str:
    if not source_file_name.endswith(".rds"):
        raise ValueError("source filename must end with .rds")
    return source_file_name[:-4]


def write_artifacts(
    snapshot: MetadataSnapshot,
    runtime: RuntimeReceipt,
    output_directory: Path,
    extractor_sha256: Optional[str] = None,
) -> Mapping[str, Any]:
    """Write fail-closed deterministic artifacts from an already validated snapshot."""

    validate_snapshot(snapshot)
    output_directory = output_directory.resolve()
    output_directory.mkdir(parents=True, exist_ok=True)
    stem = _source_stem(snapshot.source_file_name)
    metadata_path = output_directory / f"{stem}.metadata.csv.gz"
    audit_path = output_directory / f"{stem}.audit.json"
    if metadata_path.exists() or audit_path.exists():
        raise FileExistsError(
            "refusing to overwrite an existing extraction artifact: "
            f"{metadata_path} or {audit_path}"
        )

    temp_paths: List[Path] = []
    committed_paths: List[Path] = []
    try:
        with tempfile.NamedTemporaryFile(
            prefix=f".{stem}.", suffix=".metadata.csv", dir=output_directory, delete=False
        ) as handle:
            plain_path = Path(handle.name)
        temp_paths.append(plain_path)
        _write_plain_csv(snapshot, plain_path)

        with tempfile.NamedTemporaryFile(
            prefix=f".{stem}.", suffix=".metadata.csv.gz", dir=output_directory, delete=False
        ) as handle:
            gzip_temp_path = Path(handle.name)
        temp_paths.append(gzip_temp_path)
        _gzip_deterministic(plain_path, gzip_temp_path)

        uncompressed_bytes = plain_path.stat().st_size
        uncompressed_sha256 = sha256_file(plain_path)
        compressed_bytes = gzip_temp_path.stat().st_size
        compressed_sha256 = sha256_file(gzip_temp_path)
        compound_keys = (
            f"{ACCESSION}|{snapshot.source_file_name}|{row_name}"
            for row_name in snapshot.row_names
        )
        metadata_profiles = {
            column: _profile(snapshot, column) for column in REQUIRED_RAW_COLUMNS
        }
        audit: Dict[str, Any] = {
            "formatVersion": FORMAT_VERSION,
            "receiptKind": "cano_gomez_python_rdata_meta_data_row_only_audit",
            "authorityMode": AUTHORITY_MODE,
            "crossAssayCellIdentityVerified": False,
            "sourceFile": snapshot.source_file_name,
            "sourceBytes": snapshot.source_bytes,
            "sourceExpectedBytes": snapshot.source_expected_bytes,
            "sourceBytesMatchesExpected": True,
            "sourceSha256": snapshot.source_sha256,
            "sourceExpectedSha256": snapshot.source_expected_sha256,
            "sourceSha256MatchesExpected": True,
            "sourcePublicUrl": snapshot.public_url or None,
            "transmitterClass": snapshot.transmitter_class,
            "rowCount": snapshot.expected_rows,
            "uniqueRowNameCount": len(set(snapshot.row_names)),
            "metadataColumns": list(snapshot.metadata_columns),
            "metadataFields": metadata_profiles,
            "identityChecks": {
                "authorityMode": AUTHORITY_MODE,
                "stableIdSource": "meta.data row.names",
                "stableCompoundKeyExpression": COMPOUND_KEY_EXPRESSION,
                "metadataRowNamesUniqueNonempty": True,
                "orderedMetadataRowNamesSha256": sha256_ordered_lines(
                    snapshot.row_names
                ),
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
                "expectedRowCount": snapshot.expected_rows,
                "observedRowCount": len(snapshot.row_names),
                "expectedGroupCount": snapshot.expected_groups,
                "observedNonemptyGroupCount": metadata_profiles["groups"][
                    "observedNonemptyUniqueCount"
                ],
                "observedNonemptyNeuronTypeCount": metadata_profiles[
                    "neuron_types"
                ]["observedNonemptyUniqueCount"],
            },
            "runtime": {
                "pythonImplementation": runtime.python_implementation,
                "pythonVersion": runtime.python_version,
                "corePackageVersions": dict(sorted(runtime.package_versions.items())),
                "rdataParserFileSha256": runtime.parser_sha256,
                "expectedPatchedParserFileSha256": PATCHED_PARSER_SHA256,
                "parserPatchArtifact": "tools/patches/rdata-0.11.2-seurat-rds-parser.patch",
            },
            "extractor": {
                "fileName": Path(__file__).name,
                "sha256": extractor_sha256,
            },
            "output": {
                "metadataCsvGzip": {
                    "fileName": metadata_path.name,
                    "mediaType": "text/csv",
                    "contentEncoding": "gzip",
                    "deterministicCompression": (
                        "Python gzip.GzipFile compresslevel=9 filename-empty mtime=0"
                    ),
                    "rowCount": snapshot.expected_rows,
                    "columnCount": len(CSV_HEADER),
                    "orderedColumnNames": list(CSV_HEADER),
                    "uncompressedBytes": uncompressed_bytes,
                    "uncompressedSha256": uncompressed_sha256,
                    "compressedBytes": compressed_bytes,
                    "compressedSha256": compressed_sha256,
                }
            },
            "scopeBoundaries": {
                "rawLabelsPreserved": True,
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

        with tempfile.NamedTemporaryFile(
            prefix=f".{stem}.", suffix=".audit.json", dir=output_directory, delete=False
        ) as handle:
            audit_temp_path = Path(handle.name)
        temp_paths.append(audit_temp_path)
        audit_temp_path.write_bytes(
            (
                json.dumps(audit, ensure_ascii=False, indent=2, sort_keys=True)
                + "\n"
            ).encode("utf-8")
        )

        os.replace(gzip_temp_path, metadata_path)
        committed_paths.append(metadata_path)
        temp_paths.remove(gzip_temp_path)
        os.replace(audit_temp_path, audit_path)
        committed_paths.append(audit_path)
        temp_paths.remove(audit_temp_path)
        plain_path.unlink()
        temp_paths.remove(plain_path)
    except Exception:
        for path in committed_paths:
            try:
                path.unlink()
            except FileNotFoundError:
                pass
        raise
    finally:
        for path in temp_paths:
            try:
                path.unlink()
            except FileNotFoundError:
                pass

    return {
        "audit": str(audit_path),
        "auditBytes": audit_path.stat().st_size,
        "auditSha256": sha256_file(audit_path),
        "metadata": str(metadata_path),
        "metadataBytes": metadata_path.stat().st_size,
        "metadataSha256": sha256_file(metadata_path),
        "rows": snapshot.expected_rows,
        "groups": snapshot.expected_groups,
        "types": metadata_profiles["neuron_types"]["observedNonemptyUniqueCount"],
        "authorityMode": AUTHORITY_MODE,
        "crossAssayCellIdentityVerified": False,
    }


def parse_arguments(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Extract checksum-receipted Cano-Gomez meta.data rows without "
            "claiming cross-assay identity."
        )
    )
    parser.add_argument("rds", type=Path, help="Exact canonical GSE318731 RDS file")
    parser.add_argument(
        "--class-name", required=True, choices=tuple(SOURCE_SPECS), dest="class_name"
    )
    parser.add_argument("--expected-rows", required=True, type=int)
    parser.add_argument("--expected-groups", required=True, type=int)
    parser.add_argument("--output-directory", required=True, type=Path)
    parser.add_argument(
        "--site-packages",
        action="append",
        default=[],
        type=Path,
        help="Pinned patched runtime directory; may be repeated",
    )
    parser.add_argument(
        "--expected-source-sha256",
        required=True,
        help="Previously pinned lowercase SHA-256 for fail-closed input checking",
    )
    return parser.parse_args(argv)


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = parse_arguments(argv)
    if not SHA256_PATTERN.fullmatch(args.expected_source_sha256):
        raise ValueError("--expected-source-sha256 must be 64 lowercase hex characters")
    spec = SOURCE_SPECS[args.class_name]
    snapshot, runtime = extract_snapshot(
        source=args.rds,
        spec=spec,
        expected_rows=args.expected_rows,
        expected_groups=args.expected_groups,
        site_packages=args.site_packages,
        expected_source_sha256=args.expected_source_sha256,
    )
    receipt = write_artifacts(
        snapshot=snapshot,
        runtime=runtime,
        output_directory=args.output_directory,
        extractor_sha256=sha256_file(Path(__file__).resolve()),
    )
    print(json.dumps(receipt, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (FileExistsError, RuntimeError, TypeError, ValueError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(2)
