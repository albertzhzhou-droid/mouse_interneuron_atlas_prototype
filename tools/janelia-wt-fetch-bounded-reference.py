#!/usr/bin/env python3
"""Acquire only the two explicitly pinned WT chunks and their exact metadata."""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data/source-candidates/janelia-wt-reference-20260930"
AUDIT = json.loads((ROOT / "data/open-source-modeling-availability-audit-0.1.json").read_text())
CANDIDATE = next(item for item in AUDIT["candidates"] if item["candidateId"] == "JANELIA_JRC_MUS_SC_ZP104A_BOUNDED_RAW_NUCLEUS")


def fetch(job):
    url, name, expected_hash = job
    target = OUT / name
    if target.exists():
        data = target.read_bytes()
    else:
        with urllib.request.urlopen(url, timeout=30) as response:
            data = response.read(3_000_001)
    if len(data) > 3_000_000:
        raise ValueError("Bounded object exceeds declared acquisition budget")
    actual_hash = hashlib.sha256(data).hexdigest()
    if expected_hash and actual_hash != expected_hash:
        raise ValueError("Pinned source object changed: " + url)
    if name.endswith(".json"):
        json.loads(data)
    if not target.exists():
        partial = target.with_name(target.name + ".partial")
        partial.write_bytes(data)
        partial.replace(target)
    return {"url": url, "path": str(target.relative_to(ROOT)), "bytes": len(data), "sha256": actual_hash,
            "historicalPinMatched": bool(expected_hash)}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    jobs = [(CANDIDATE["source"]["rawDatasetApiUrl"], "raw-figshare.json", None),
            (CANDIDATE["source"]["manualNucleiApiUrl"], "nucleus-figshare.json", None)]
    for item in CANDIDATE["descriptorReceipts"]:
        jobs.append((item["url"], item["receiptId"] + ".json", item["sha256"]))
    jobs.append((CANDIDATE["boundedPair"]["rawChunk"]["url"], "raw-82-22-17.zstd", CANDIDATE["boundedPair"]["rawChunk"]["sha256"]))
    jobs.append((CANDIDATE["boundedPair"]["manualNucleusChunk"]["url"], "nucleus-10-2-2.zstd", CANDIDATE["boundedPair"]["manualNucleusChunk"]["sha256"]))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        files = list(executor.map(fetch, jobs))
    receipt = {"checkedDate": "2026-09-30", "datasetId": "jrc_mus-sc-zp104a", "scope": "two_explicit_source_chunks_and_metadata",
               "files": files, "totalBytes": sum(item["bytes"] for item in files),
               "selectedCellJoins": 0, "interneuronIdentityEstablished": False}
    (OUT / "receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")
    print(json.dumps({"files": len(files), "bytes": receipt["totalBytes"], "historicalPinsMatched": sum(item["historicalPinMatched"] for item in files)}))


if __name__ == "__main__":
    main()
