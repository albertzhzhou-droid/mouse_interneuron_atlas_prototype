#!/usr/bin/env python3
"""Build the exact no-age mouse spinal-interneuron NeuroMorpho universe.

This is a query-universe and source-object admission build, not a biological
census.  The frozen 142-record adult asset set and seven previously admitted
named routes are referenced in place.  Only the remaining standardized SWCs
are stored in the delta directory.  No generated geometry JSON is duplicated:
new SWCs are checksum-verified and parsed lazily by the browser.
"""

from __future__ import annotations

import argparse
import collections
import concurrent.futures
import hashlib
import json
import shutil
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

from build_neuromorpho_census import (
    ParsedSwc,
    base_missingness,
    dimensionality,
    domain_matches_types,
    explicit_measure,
    json_bytes,
    normalized_metadata,
    parse_swc_bytes,
    sha256_bytes,
    sha256_path,
    source_diameter_available,
    swc_url,
)


SCHEMA_VERSION = "1.0.0"
REPOSITORY_RELEASE = "8.6.124"
SNAPSHOT_DATE = "2026-09-01"
ASSET_SET_ID = "neuromorpho:8.6.124:mouse-spinal-interneuron-no-age-universe-v1"
EXPECTED_TOTAL = 1097
EXPECTED_PAGES = 3
PAGE_SIZE = 500
QUERY_BASE = (
    "https://neuromorpho.org/api/neuron/select?q=species:mouse&"
    "fq=brain_region:spinal%20cord&fq=cell_type:interneuron&"
    "size=500&sort=neuron_id,asc"
)
FIELDS_URL = "https://neuromorpho.org/api/neuron/fields"
OUTPUT_DIRECTORY = Path("public/data/neuromorpho_release_8_6_124_no_age_universe_v1")
CONTRACT_PATH = Path("data/neuromorpho-no-age-query-universe-0.1.json")
ROSTER_PATH = Path("data/neuromorpho-no-age-query-universe-roster-0.1.json")
FROZEN_CENSUS_DIRECTORY = Path("public/data/neuromorpho_release_8_6_124_census_v1")
FROZEN_CENSUS_INDEX = FROZEN_CENSUS_DIRECTORY / "census-index.json"
SUPPLEMENTARY_ADAPTER = Path("data/supplementary-morphology-comparison-adapter-0.1.json")
USER_AGENT = (
    "OHRI-Open-Data-NeuroMorpho-Universe-UPG-088/1.0 "
    "(metadata API and documented direct standardized-SWC access)"
)

EXPECTED_DISTRIBUTIONS = {
    "attributes": {
        "Diameter, 3D, Angles": 916,
        "No Diameter, 3D, Angles": 142,
        "Diameter, 2D, Angles": 39,
    },
    "domain": {
        "Dendrites, Soma, No Axon": 842,
        "Dendrites, Soma, Axon": 253,
        "Neurites, Soma": 2,
    },
    "physical_Integrity": {
        "Dendrites Moderate": 740,
        "Dendrites & Axon Moderate": 233,
        "Dendrites Complete": 79,
        "Dendrites Incomplete": 23,
        "Dendrites Moderate, Axon Incomplete": 20,
        "Neurites Moderate": 2,
    },
    "age_classification": {"young": 729, "young adult": 226, "adult": 142},
    "archive": {"Ginty": 650, "Todd": 309, "Hughes": 87, "Bannatyne": 49, "Chen_Dai": 2},
}

ROUTE_IDS = {
    "mouse.sc.renshaw_l5_lamina_vii.observed.nmo_45674",
    "mouse.sc.repository_labeled_premotor_non_renshaw_l5_ventral_horn.observed.nmo_45718",
    "mouse.sc.nnos_prp_l2i_dorsal_horn.observed.nmo_50394",
    "mouse.sc.galanin_prp_l2i_dorsal_horn.observed.nmo_50408",
    "mouse.sc.npy_l2i_dorsal_horn.observed.nmo_50424",
    "mouse.sc.pv_pax2_lamina_ii_iii.observed.nmo_170035",
    "mouse.sc.grpr_lamina_i_ii.observed.nmo_249676",
}

_request_gate = threading.Lock()
_last_request_at = 0.0


def page_url(page: int) -> str:
    return f"{QUERY_BASE}&page={page}"


def absolute_public_path(path: str) -> Path:
    normalized = path.removeprefix("/")
    if not normalized.startswith("data/"):
        raise ValueError(f"Expected a /data/ public path, got {path}")
    return Path("public") / normalized


def public_url(path: Path) -> str:
    relative = path.relative_to(Path("public"))
    return f"/{relative.as_posix()}"


def distribution(records: list[dict[str, Any]], field: str) -> dict[str, int]:
    return dict(sorted(collections.Counter(str(record.get(field)) for record in records).items()))


def validate_distribution(records: list[dict[str, Any]], field: str, expected: dict[str, int]) -> None:
    actual = distribution(records, field)
    if actual != dict(sorted(expected.items())):
        raise SystemExit(f"Official {field} distribution changed: expected {expected}, got {actual}")


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def throttled_fetch(url: str, *, retries: int, delay_seconds: float) -> tuple[bytes, str | None]:
    global _last_request_at
    with _request_gate:
        wait_for = delay_seconds - (time.monotonic() - _last_request_at)
        if wait_for > 0:
            time.sleep(wait_for)
        _last_request_at = time.monotonic()
    return fetch_bytes_with_agent(url, retries=retries, delay_seconds=delay_seconds)


def fetch_bytes_with_agent(url: str, *, retries: int, delay_seconds: float) -> tuple[bytes, str | None]:
    last_error: Exception | None = None
    for attempt in range(retries + 1):
        if attempt:
            time.sleep(delay_seconds * (2**attempt))
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                return response.read(), response.headers.get("Date")
        except (urllib.error.URLError, TimeoutError, OSError) as error:
            last_error = error
    assert last_error is not None
    raise last_error


def load_or_fetch(
    cache_path: Path,
    url: str,
    *,
    refresh: bool,
    retries: int,
    delay_seconds: float,
) -> tuple[bytes, str]:
    if cache_path.exists() and not refresh:
        return cache_path.read_bytes(), "cached_snapshot"
    body, response_date = throttled_fetch(url, retries=retries, delay_seconds=delay_seconds)
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_bytes(body)
    return body, response_date or "response_date_unavailable"


def load_official_roster(
    cache_root: Path,
    output: Path,
    *,
    refresh: bool,
    retries: int,
    delay_seconds: float,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], dict[str, Any]]:
    api_output = output / "api"
    api_output.mkdir(parents=True, exist_ok=True)
    all_records: list[dict[str, Any]] = []
    receipts: list[dict[str, Any]] = []
    raw_page_hashes: list[str] = []
    for page_number in range(EXPECTED_PAGES):
        cache_path = cache_root / "api" / f"page-{page_number}.json"
        body, response_date = load_or_fetch(
            cache_path,
            page_url(page_number),
            refresh=refresh,
            retries=retries,
            delay_seconds=delay_seconds,
        )
        try:
            payload = json.loads(body)
        except json.JSONDecodeError as error:
            raise SystemExit(f"Official page {page_number} is not JSON: {error}") from error
        page = payload.get("page") or {}
        records = (payload.get("_embedded") or {}).get("neuronResources")
        if not isinstance(records, list):
            raise SystemExit(f"Official page {page_number} lacks neuronResources")
        if (
            page.get("number") != page_number
            or page.get("size") != PAGE_SIZE
            or page.get("totalElements") != EXPECTED_TOTAL
            or page.get("totalPages") != EXPECTED_PAGES
        ):
            raise SystemExit(f"Official page metadata changed for page {page_number}: {page}")
        expected_page_count = PAGE_SIZE if page_number < EXPECTED_PAGES - 1 else EXPECTED_TOTAL % PAGE_SIZE
        if len(records) != expected_page_count:
            raise SystemExit(f"Official page {page_number} has {len(records)} records, expected {expected_page_count}")
        output_path = api_output / f"page-{page_number}.json"
        output_path.write_bytes(body)
        digest = sha256_bytes(body)
        raw_page_hashes.append(digest)
        receipts.append({
            "page": page_number,
            "url": page_url(page_number),
            "path": public_url(output_path),
            "sha256": digest,
            "bytes": len(body),
            "responseDate": response_date,
            "recordCount": len(records),
        })
        all_records.extend(records)

    ids = [record.get("neuron_id") for record in all_records]
    if len(ids) != EXPECTED_TOTAL or len(set(ids)) != EXPECTED_TOTAL or any(not isinstance(value, int) for value in ids):
        raise SystemExit("Official pages are incomplete, overlapping, or contain invalid neuron IDs")
    # Server sorting is lexical in the live response. Preserve the pages, then
    # make the derived index explicitly numeric and deterministic.
    all_records.sort(key=lambda record: int(record["neuron_id"]))
    for field, expected in EXPECTED_DISTRIBUTIONS.items():
        validate_distribution(all_records, field, expected)
    if any("Axon Complete" in str(record.get("physical_Integrity")) for record in all_records):
        raise SystemExit("Unexpected complete-axon label appeared in the official query")
    if any(len(record.get("reference_doi") or []) != 1 or len(record.get("reference_pmid") or []) != 1 for record in all_records):
        raise SystemExit("Every query record must retain exactly one DOI and one PMID")

    roster_digest = sha256_bytes(
        ("\n".join(str(value) for value in ids) + "\n").encode("ascii")
    )
    numeric_roster_digest = sha256_bytes(
        ("\n".join(str(record["neuron_id"]) for record in all_records) + "\n").encode("ascii")
    )
    page_set_digest = sha256_bytes(("\n".join(raw_page_hashes) + "\n").encode("ascii"))
    return all_records, receipts, {
        "rawServerOrderNeuronIdSha256": roster_digest,
        "numericNeuronIdSha256": numeric_roster_digest,
        "rawPageSetSha256": page_set_digest,
    }


def load_existing_assets() -> dict[int, dict[str, Any]]:
    census = load_json(FROZEN_CENSUS_INDEX)
    adapter = load_json(SUPPLEMENTARY_ADAPTER)
    existing: dict[int, dict[str, Any]] = {}
    for record in census["records"]:
        neuron_id = int(record["neuronId"])
        raw_path = f"/data/neuromorpho_release_8_6_124_census_v1/{record['geometry']['rawSwcPath']}"
        geometry_path = f"/data/neuromorpho_release_8_6_124_census_v1/{record['geometry']['path']}"
        existing[neuron_id] = {
            "membership": "frozen_adult_subset",
            "routeIds": [],
            "record": record,
            "rawSwcPath": raw_path,
            "rawSwcSha256": record["geometry"]["rawSwcSha256"],
            "geometryPath": geometry_path,
            "geometrySha256": record["geometry"]["sha256"],
            "geometryBytes": record["geometry"]["bytes"],
        }
    for record in adapter["records"]:
        neuron_id = int(record["neuronId"])
        if neuron_id in existing:
            raise SystemExit(f"Supplementary route {neuron_id} overlaps frozen adult subset")
        route_id = record["comparisonMembership"]["routeId"]
        existing[neuron_id] = {
            "membership": "named_route",
            "routeIds": [route_id],
            "record": record,
            "rawSwcPath": record["geometry"]["rawSwcPath"],
            "rawSwcSha256": record["geometry"]["rawSwcSha256"],
            "geometryPath": record["geometry"]["path"],
            "geometrySha256": record["geometry"]["sha256"],
            "geometryBytes": record["geometry"]["bytes"],
        }
    if len(existing) != 149:
        raise SystemExit(f"Expected 149 existing exact assets, found {len(existing)}")
    if ROUTE_IDS != {item["routeIds"][0] for item in existing.values() if item["routeIds"]}:
        raise SystemExit("Named-route identity map drifted")
    return existing


def metric_payload(parsed: ParsedSwc, raw_sha: str, diameter_authorized: bool) -> dict[str, Any]:
    return {
        "nodeCount": len(parsed.nodes),
        "segmentCount": parsed.segment_count,
        "nodeTypeCounts": parsed.node_type_counts,
        "rootNodeId": parsed.root_id,
        "boundsMicrometre": {"min": parsed.bounds_min, "max": parsed.bounds_max},
        "extentMicrometre": parsed.extent,
        "zeroLengthEdgeCount": parsed.zero_length_edges,
        "totalCableLengthMicrometre": parsed.total_cable_length,
        "rawSwcSha256": raw_sha,
        "canonicalGeometrySha256": parsed.canonical_geometry_sha256,
        "topologySha256": parsed.topology_sha256,
        "radiusDerived": {
            "value": ({
                "minimumMicrometre": parsed.radius_min,
                "maximumMicrometre": parsed.radius_max,
                "meanMicrometre": parsed.radius_mean,
            } if diameter_authorized else None),
            "missingReason": None if diameter_authorized else "official_attributes_report_no_diameter",
        },
    }


def validate_existing(
    official: dict[str, Any],
    existing: dict[str, Any],
) -> tuple[bytes, ParsedSwc, Path]:
    record = existing["record"]
    metadata = record["normalizedMetadata"]
    if (
        int(official["neuron_id"]) != int(record["neuronId"])
        or official["neuron_name"] != metadata["name"]
        or official["archive"] != metadata["archive"]
    ):
        raise ValueError("existing object metadata does not agree with the no-age query record")
    raw_path = absolute_public_path(existing["rawSwcPath"])
    body = raw_path.read_bytes()
    digest = sha256_bytes(body)
    if digest != existing["rawSwcSha256"]:
        raise ValueError("existing SWC checksum receipt changed")
    geometry_path = absolute_public_path(existing["geometryPath"])
    if sha256_path(geometry_path) != existing["geometrySha256"] or geometry_path.stat().st_size != existing["geometryBytes"]:
        raise ValueError("existing generated-geometry receipt changed")
    parsed = parse_swc_bytes(body, f"NeuroMorpho:{official['neuron_id']}")
    return body, parsed, raw_path


def build_record(
    official: dict[str, Any],
    *,
    existing_assets: dict[int, dict[str, Any]],
    output_swc: Path,
    cache_swc: Path,
    refresh_swc: bool,
    retries: int,
    delay_seconds: float,
) -> dict[str, Any]:
    neuron_id = int(official["neuron_id"])
    existing = existing_assets.get(neuron_id)
    errors: list[str] = []
    body: bytes | None = None
    parsed: ParsedSwc | None = None
    raw_path: Path | None = None
    source_url = swc_url(official)
    transport = "existing_generated_geometry" if existing else "raw_swc_lazy_parse"
    try:
        if existing:
            body, parsed, raw_path = validate_existing(official, existing)
        else:
            cache_path = cache_swc / f"nmo-{neuron_id}.swc"
            if cache_path.exists() and not refresh_swc:
                body = cache_path.read_bytes()
            else:
                body, _response_date = throttled_fetch(source_url, retries=retries, delay_seconds=delay_seconds)
                cache_path.parent.mkdir(parents=True, exist_ok=True)
                cache_path.write_bytes(body)
            parsed = parse_swc_bytes(body, f"NeuroMorpho:{neuron_id}")
            raw_path = output_swc / f"nmo-{neuron_id}.swc"
            raw_path.parent.mkdir(parents=True, exist_ok=True)
            raw_path.write_bytes(body)
        if not domain_matches_types(str(official.get("domain") or ""), parsed.node_type_counts):
            raise ValueError("official domain does not agree with SWC node types")
    except Exception as error:
        errors.append(f"{type(error).__name__}: {error}")

    available = not errors and body is not None and parsed is not None and raw_path is not None
    raw_sha = sha256_bytes(body) if body is not None else None
    if existing and raw_sha != existing["rawSwcSha256"]:
        errors.append("ValueError: existing SWC hash disagrees with membership receipt")
        available = False
    raw_public_path = existing["rawSwcPath"] if existing else (public_url(raw_path) if raw_path else None)
    diameter_authorized = source_diameter_available(official)
    return {
        "assetId": f"NeuroMorpho:{neuron_id}",
        "neuronId": neuron_id,
        "officialMetadata": official,
        "normalizedMetadata": normalized_metadata(official),
        "missingness": base_missingness(official),
        "sourcePaper": {
            "pmids": official.get("reference_pmid") or [],
            "dois": official.get("reference_doi") or [],
        },
        "memberships": {
            "noAgeQueryUniverse": True,
            "frozenAdultSubset": bool(existing and existing["membership"] == "frozen_adult_subset"),
            "namedRouteIds": existing["routeIds"] if existing else [],
        },
        "sourceObject": {
            "status": "admitted" if available else "quarantined",
            "transport": transport if available else "unavailable",
            "directUrl": source_url,
            "rawSwcPath": raw_public_path if available else None,
            "rawSwcSha256": raw_sha if available else None,
            "rawSwcBytes": len(body) if available and body is not None else None,
            "existingGeometryPath": existing["geometryPath"] if existing and available else None,
            "existingGeometrySha256": existing["geometrySha256"] if existing and available else None,
            "existingGeometryBytes": existing["geometryBytes"] if existing and available else None,
            "geometryCopyCount": 0,
            "registrationCount": 0,
            "errors": errors,
        },
        "qc": {
            "status": "passed" if available else "quarantined",
            "sevenColumns": available,
            "finite": available,
            "uniquePositiveNodeIds": available,
            "singleRoot": available,
            "parentsPresent": available,
            "noSelfParent": available,
            "acyclic": available,
            "positiveRadiusSyntax": available,
            "connected": available,
            "domainMatchesTypes": available,
            "sourceTypeIdentityPreserved": available,
            "diameterAuthority": "authorized" if diameter_authorized else "midline_only_no_surface",
            "dimensionalityAuthority": dimensionality(official),
        },
        "morphometrics": {
            "sourceReported": {
                "somaSurface": explicit_measure(official.get("soma_surface"), "square_micrometre"),
                "surface": explicit_measure(official.get("surface"), "square_micrometre"),
                "volume": explicit_measure(official.get("volume"), "cubic_micrometre"),
            },
            "computed": metric_payload(parsed, raw_sha, diameter_authorized) if available and parsed and raw_sha else {},
        },
    }


def grouped_hashes(records: list[dict[str, Any]], field: str) -> list[dict[str, Any]]:
    grouped: dict[str, list[int]] = collections.defaultdict(list)
    for record in records:
        value = record["morphometrics"]["computed"].get(field)
        if value:
            grouped[str(value)].append(record["neuronId"])
    return [
        {"sha256": digest, "neuronIds": sorted(ids)}
        for digest, ids in sorted(grouped.items())
        if len(ids) > 1
    ]


def record_summary(records: list[dict[str, Any]]) -> dict[str, Any]:
    admitted = [record for record in records if record["sourceObject"]["status"] == "admitted"]
    quarantined = [record for record in records if record["sourceObject"]["status"] == "quarantined"]
    paper_counts = collections.Counter(record["sourcePaper"]["dois"][0] for record in records)
    return {
        "queryRecordCount": len(records),
        "uniqueNeuronIdCount": len({record["neuronId"] for record in records}),
        "admittedSourceObjectCount": len(admitted),
        "quarantinedSourceObjectCount": len(quarantined),
        "frozenAdultSubsetCount": sum(record["memberships"]["frozenAdultSubset"] for record in records),
        "namedRouteCount": sum(bool(record["memberships"]["namedRouteIds"]) for record in records),
        "existingGeometryReferenceCount": sum(record["sourceObject"]["transport"] == "existing_generated_geometry" for record in records),
        "deltaRawSwcCount": sum(record["sourceObject"]["transport"] == "raw_swc_lazy_parse" for record in records),
        "geometryCopyCount": 0,
        "sourceLabelled3DCount": sum(record["normalizedMetadata"]["dimensionality"] == "3D" for record in records),
        "sourceLabelled2DCount": sum(record["normalizedMetadata"]["dimensionality"] == "2D" for record in records),
        "diameterAuthorizedCount": sum(record["normalizedMetadata"]["sourceDiameterAvailable"] for record in records),
        "diameterUnavailableCount": sum(not record["normalizedMetadata"]["sourceDiameterAvailable"] for record in records),
        "axonDomainCount": sum(
            "Axon" in record["normalizedMetadata"]["domain"] and "No Axon" not in record["normalizedMetadata"]["domain"]
            for record in records
        ),
        "completeAxonClaimCount": 0,
        "registrationCount": 0,
        "sameSpecimenInternalStructureCount": 0,
        "paperCount": len(paper_counts),
        "archiveCount": len({record["normalizedMetadata"]["archive"] for record in records}),
        "byLifeStage": distribution([record["officialMetadata"] for record in records], "age_classification"),
        "byArchive": distribution([record["officialMetadata"] for record in records], "archive"),
        "byAttributes": distribution([record["officialMetadata"] for record in records], "attributes"),
        "byDomain": distribution([record["officialMetadata"] for record in records], "domain"),
        "byPhysicalIntegrity": distribution([record["officialMetadata"] for record in records], "physical_Integrity"),
        "bySourcePaper": [
            {"doi": doi, "count": count}
            for doi, count in sorted(paper_counts.items(), key=lambda item: (-item[1], item[0]))
        ],
        "duplicateRawSwcGroups": grouped_hashes(admitted, "rawSwcSha256"),
        "duplicateCanonicalGeometryGroups": grouped_hashes(admitted, "canonicalGeometrySha256"),
        "quarantinedNeuronIds": [record["neuronId"] for record in quarantined],
    }


def file_receipt(path: Path, kind: str, neuron_id: int | None = None) -> dict[str, Any]:
    item: dict[str, Any] = {
        "path": public_url(path),
        "kind": kind,
        "sha256": sha256_path(path),
        "bytes": path.stat().st_size,
    }
    if neuron_id is not None:
        item["neuronId"] = neuron_id
    return item


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=OUTPUT_DIRECTORY)
    parser.add_argument("--contract", type=Path, default=CONTRACT_PATH)
    parser.add_argument("--roster", type=Path, default=ROSTER_PATH)
    parser.add_argument("--source-cache", type=Path, default=Path("/private/tmp/ohri-neuromorpho-no-age-v1"))
    parser.add_argument("--refresh-api", action="store_true")
    parser.add_argument("--refresh-swc", action="store_true")
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--request-delay", type=float, default=0.08)
    parser.add_argument("--retries", type=int, default=4)
    args = parser.parse_args()
    if args.workers < 1 or args.workers > 8:
        raise SystemExit("--workers must be between 1 and 8")

    args.output.mkdir(parents=True, exist_ok=True)
    output_swc = args.output / "swc"
    output_swc.mkdir(exist_ok=True)
    cache_swc = args.source_cache / "swc"
    cache_swc.mkdir(parents=True, exist_ok=True)

    official_records, page_receipts, roster_receipts = load_official_roster(
        args.source_cache,
        args.output,
        refresh=args.refresh_api,
        retries=args.retries,
        delay_seconds=args.request_delay,
    )
    existing_assets = load_existing_assets()
    official_ids = {int(record["neuron_id"]) for record in official_records}
    if not set(existing_assets).issubset(official_ids):
        missing = sorted(set(existing_assets) - official_ids)
        raise SystemExit(f"Existing exact assets are absent from no-age query: {missing}")

    records: list[dict[str, Any]] = []
    completed = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(
                build_record,
                official,
                existing_assets=existing_assets,
                output_swc=output_swc,
                cache_swc=cache_swc,
                refresh_swc=args.refresh_swc,
                retries=args.retries,
                delay_seconds=args.request_delay,
            ): int(official["neuron_id"])
            for official in official_records
        }
        for future in concurrent.futures.as_completed(futures):
            records.append(future.result())
            completed += 1
            if completed % 100 == 0 or completed == EXPECTED_TOTAL:
                print(f"admitted/QC processed {completed}/{EXPECTED_TOTAL}", flush=True)
    records.sort(key=lambda record: record["neuronId"])
    summary = record_summary(records)
    if summary["queryRecordCount"] != EXPECTED_TOTAL:
        raise SystemExit("Derived universe record count changed")
    if summary["frozenAdultSubsetCount"] != 142 or summary["namedRouteCount"] != 7:
        raise SystemExit(f"Existing membership intersection changed: {summary}")
    if summary["existingGeometryReferenceCount"] != 149 or summary["deltaRawSwcCount"] + summary["quarantinedSourceObjectCount"] != 948:
        raise SystemExit("Delta/reuse accounting is not exhaustive")

    index_payload = {
        "documentType": "neuromorpho_no_age_query_universe_index",
        "schemaVersion": SCHEMA_VERSION,
        "assetSetId": ASSET_SET_ID,
        "repositoryRelease": REPOSITORY_RELEASE,
        "snapshotDate": SNAPSHOT_DATE,
        "query": {
            "species": "mouse",
            "brainRegion": "spinal cord",
            "cellType": "interneuron",
            "ageFilter": None,
            "queryUrl": QUERY_BASE,
            "pageSize": PAGE_SIZE,
            "pageCount": EXPECTED_PAGES,
            "pageReceipts": page_receipts,
            **roster_receipts,
        },
        "authority": {
            "apiReference": "https://neuromorpho.org/apiReference.html",
            "apiHowTo": "https://neuromorpho.org/api.jsp",
            "faq": "https://neuromorpho.org/myfaq.jsp",
            "terms": "https://neuromorpho.org/useterm.jsp",
            "repositoryRrid": "RRID:SCR_002145",
        },
        "rights": {
            "license": "CC BY 4.0 subject to NeuroMorpho.Org Terms of Use",
            "requiredCitations": [
                "Each original paper associated with a displayed reconstruction",
                "NeuroMorpho.Org, RRID:SCR_002145",
                "Tecuatl, Ljungquist & Ascoli 2024, doi:10.1096/fba.2024-00048",
            ],
        },
        "scientificBoundary": {
            "scope": "repository_query_universe_not_biological_type_or_animal_census",
            "geometry": "standardized_source_local_swc_only",
            "newGeometryTransport": "checksum_verified_raw_swc_parsed_lazily_without_generated_geometry_copy",
            "diameterPolicy": "No Diameter records expose centerlines only; syntax radii never authorize a surface",
            "twoDimensionalPolicy": "2D records remain planar and are never extruded",
            "typePolicy": "source node types are preserved; Neurites remain uninterpreted",
            "forbiddenClaims": [
                "atlas placement or cross-source registration",
                "complete biological axon or connectivity",
                "independent animal, specimen, type, or prevalence denominator",
                "molecular or SCI identity transfer",
                "membrane, nucleus, organelle, bouton, synapse, receptor, or ultrastructure",
            ],
        },
        "summary": summary,
        "records": records,
    }
    index_path = args.output / "universe-index.json"
    index_path.write_bytes(json_bytes(index_payload, pretty=True))

    quarantine_payload = {
        "documentType": "neuromorpho_no_age_query_universe_quarantine",
        "schemaVersion": SCHEMA_VERSION,
        "queryRecordCount": summary["queryRecordCount"],
        "admittedSourceObjectCount": summary["admittedSourceObjectCount"],
        "quarantinedSourceObjectCount": summary["quarantinedSourceObjectCount"],
        "records": [
            {
                "neuronId": record["neuronId"],
                "name": record["normalizedMetadata"]["name"],
                "errors": record["sourceObject"]["errors"],
            }
            for record in records
            if record["sourceObject"]["status"] == "quarantined"
        ],
    }
    quarantine_path = args.output / "quarantine-report.json"
    quarantine_path.write_bytes(json_bytes(quarantine_payload, pretty=True))

    declared_files = [
        *[file_receipt(absolute_public_path(receipt["path"]), "official_api_page") for receipt in page_receipts],
        file_receipt(index_path, "universe_index"),
        file_receipt(quarantine_path, "quarantine_report"),
    ]
    for record in records:
        if record["sourceObject"]["transport"] != "raw_swc_lazy_parse":
            continue
        path = absolute_public_path(record["sourceObject"]["rawSwcPath"])
        declared_files.append(file_receipt(path, "delta_standardized_swc", record["neuronId"]))
    declared_files.sort(key=lambda item: item["path"])
    manifest_payload = {
        "documentType": "neuromorpho_no_age_query_universe_asset_manifest",
        "schemaVersion": SCHEMA_VERSION,
        "assetSetId": ASSET_SET_ID,
        "repositoryRelease": REPOSITORY_RELEASE,
        "snapshotDate": SNAPSHOT_DATE,
        "summary": {
            **{key: summary[key] for key in [
                "queryRecordCount",
                "admittedSourceObjectCount",
                "quarantinedSourceObjectCount",
                "existingGeometryReferenceCount",
                "deltaRawSwcCount",
                "geometryCopyCount",
            ]},
            "declaredLocalFileCount": len(declared_files),
        },
        "referencedExistingAssetSets": [
            "neuromorpho:8.6.124:adult-mouse-spinal-interneuron-census-v1",
            "neuromorpho:8.6.124:functional-class-observed-morphology-route-pack-v1",
            "neuromorpho:8.6.124:premotor-comparison-observed-morphology-route-pack-v1",
            "neuromorpho:8.6.124:prp-dorsal-horn-observed-morphology-route-pack-v1",
            "neuromorpho:8.6.124:dorsal-horn-observed-morphology-route-pack-v1",
        ],
        "files": declared_files,
    }
    manifest_path = args.output / "asset-manifest.json"
    manifest_path.write_bytes(json_bytes(manifest_payload, pretty=True))

    roster_payload = {
        "documentType": "neuromorpho_no_age_query_universe_runtime_roster",
        "schemaVersion": "0.1.0",
        "contractId": "neuromorpho-no-age-query-universe-0.1",
        "indexPath": public_url(index_path),
        "indexSha256": sha256_path(index_path),
        "queryRecordCount": summary["queryRecordCount"],
        "admittedNeuronIds": [
            record["neuronId"]
            for record in records
            if record["sourceObject"]["status"] == "admitted"
        ],
        "quarantinedNeuronIds": summary["quarantinedNeuronIds"],
    }
    args.roster.parent.mkdir(parents=True, exist_ok=True)
    args.roster.write_bytes(json_bytes(roster_payload, pretty=True))

    contract_payload = {
        "documentType": "neuromorpho_no_age_query_universe_contract",
        "schemaVersion": "0.1.0",
        "contractId": "neuromorpho-no-age-query-universe-0.1",
        "releaseId": "research-iteration-2.34",
        "dataset": {
            "indexPath": public_url(index_path),
            "indexSha256": sha256_path(index_path),
            "indexBytes": index_path.stat().st_size,
            "assetManifestPath": public_url(manifest_path),
            "assetManifestSha256": sha256_path(manifest_path),
            "assetManifestBytes": manifest_path.stat().st_size,
            "quarantinePath": public_url(quarantine_path),
            "quarantineSha256": sha256_path(quarantine_path),
            "quarantineBytes": quarantine_path.stat().st_size,
            "runtimeRosterPath": args.roster.as_posix(),
            "runtimeRosterSha256": sha256_path(args.roster),
            "runtimeRosterBytes": args.roster.stat().st_size,
        },
        "summary": summary,
        "admission": {
            "everyQueryRecordDisposed": summary["admittedSourceObjectCount"] + summary["quarantinedSourceObjectCount"] == EXPECTED_TOTAL,
            "frozenAdultSubsetMutated": False,
            "existingGeometryCopyCount": 0,
            "deltaGeneratedGeometryCount": 0,
            "unknownFocusFailsClosed": True,
        },
        "scientificBoundary": index_payload["scientificBoundary"],
    }
    args.contract.parent.mkdir(parents=True, exist_ok=True)
    args.contract.write_bytes(json_bytes(contract_payload, pretty=True))

    print(
        f"NeuroMorpho no-age universe: {summary['queryRecordCount']} records; "
        f"{summary['admittedSourceObjectCount']} admitted; "
        f"{summary['quarantinedSourceObjectCount']} quarantined; "
        f"{summary['existingGeometryReferenceCount']} reused; "
        f"{summary['deltaRawSwcCount']} delta SWCs",
        flush=True,
    )
    print(f"universe-index sha256 {sha256_path(index_path)}", flush=True)
    print(f"asset-manifest sha256 {sha256_path(manifest_path)}", flush=True)


if __name__ == "__main__":
    main()
