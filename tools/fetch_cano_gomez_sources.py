#!/usr/bin/env python3
"""Resume exact public GEO byte ranges without copying a project or buffering an RDS.

CHOL/GABA are pinned to earlier verified source SHA-256 receipts. The GLUT
checksum was computed on the verified 2026-09-22 recovery, not supplied by the
publisher. Source bytes, HTTPS origin, Content-Range, and gzip CRC are
verified before an artifact is exposed as complete. The extractor independently
rehashes this file and verifies row/group/schema contracts.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import gzip
import hashlib
import json
import os
from pathlib import Path
import time
import urllib.request


SOURCES = {
    "CHOL": ("GSE318731_P56_cholinergic_multiome.rds", 127862795,
             "d4ad07a1e434f2ed4553738f3e1df1b395ce81b154f974c41f3ba6a9d674aed2"),
    "GABA": ("GSE318731_P56_gabaergic_multiome.rds", 1646402816,
             "700361c804806b521bb01aa58c263cd01b189fe03d3299aeef5806839a4f5f31"),
    "GLUT": ("GSE318731_P56_glutamatergic_multiome_UPDATE.rds", 1832005077,
             "ff3784791ccb5d23311b9d0a8e2a4bd09dd251f75d0a2fc4b30e762dcef29c92"),
}
BASE_URL = "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE318nnn/GSE318731/suppl/"


def digest_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def fetch_chunk(url: str, folder: Path, start: int, end: int, size: int):
    complete = folder / f"{start}-{end}.chunk"
    receipt = folder / f"{start}-{end}.json"
    partial = folder / f"{start}-{end}.part"
    length = end - start + 1
    if complete.exists() and receipt.exists():
        saved = json.loads(receipt.read_text())
        if complete.stat().st_size == length and digest_file(complete) == saved["sha256"]:
            return complete, saved
        raise ValueError(f"Completed range checksum mismatch: {complete}")
    for attempt in range(6):
        offset = partial.stat().st_size if partial.exists() else 0
        if offset > length:
            raise ValueError(f"Oversized partial range: {partial}")
        if offset == length:
            break
        request = urllib.request.Request(url, headers={
            "Range": f"bytes={start + offset}-{end}",
            "Accept-Encoding": "identity",
            "User-Agent": "OHRI-public-research-recovery/2.41",
        })
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                expected = f"bytes {start + offset}-{end}/{size}"
                if response.status != 206 or response.headers.get("Content-Range") != expected:
                    raise ValueError(f"Wrong response range: {response.status} {response.headers}")
                if response.geturl() != url:
                    raise ValueError("Source origin changed during range retrieval")
                with partial.open("ab") as handle:
                    while offset < length:
                        block = response.read(min(1024 * 1024, length - offset))
                        if not block:
                            raise OSError("Premature range EOF")
                        handle.write(block)
                        offset += len(block)
                    if response.read(1):
                        raise ValueError("Response exceeded requested byte range")
                    handle.flush()
                    os.fsync(handle.fileno())
            break
        except (OSError, TimeoutError):
            if attempt == 5:
                raise
            time.sleep(min(2 ** attempt, 16))
    if partial.stat().st_size != length:
        raise ValueError("Range length mismatch")
    saved = {"start": start, "end": end, "bytes": length,
             "sha256": digest_file(partial)}
    partial.rename(complete)
    receipt.write_text(json.dumps(saved, sort_keys=True) + "\n")
    return complete, saved


def fetch_source(class_name: str, directory: Path, workers: int, chunk_bytes: int):
    name, size, expected_sha256 = SOURCES[class_name]
    url = BASE_URL + name
    directory.mkdir(parents=True, exist_ok=True)
    output = directory / name
    output_receipt = directory / (name + ".download.json")
    if output.exists():
        if not output_receipt.exists():
            raise FileExistsError(f"Unreceipted source already exists: {output}")
        saved = json.loads(output_receipt.read_text())
        if (output.stat().st_size != size or digest_file(output) != saved["sha256"]
                or saved["url"] != url or (expected_sha256 and saved["sha256"] != expected_sha256)):
            raise ValueError("Existing source does not match recovery receipt")
        return saved
    folder = directory / (name + ".ranges")
    folder.mkdir(exist_ok=True)
    ranges = [(start, min(start + chunk_bytes - 1, size - 1))
              for start in range(0, size, chunk_bytes)]
    verified = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        futures = [pool.submit(fetch_chunk, url, folder, start, end, size)
                   for start, end in ranges]
        for future in concurrent.futures.as_completed(futures):
            path, receipt = future.result()
            verified.append((path, receipt))
            print(f"{class_name}: {len(verified)}/{len(ranges)} verified ranges", flush=True)
    staging = directory / (name + ".assembling")
    with staging.open("wb") as target:
        for path, receipt in sorted(verified, key=lambda item: item[1]["start"]):
            with path.open("rb") as source:
                for block in iter(lambda: source.read(1024 * 1024), b""):
                    target.write(block)
        target.flush()
        os.fsync(target.fileno())
    digest = digest_file(staging)
    if staging.stat().st_size != size or (expected_sha256 and digest != expected_sha256):
        raise ValueError(f"Complete source checksum/size mismatch: {name} {digest}")
    with gzip.open(staging, "rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            pass
    saved = {"fileName": name, "url": url, "bytes": size, "sha256": digest,
             "checksumAuthority": "previous_verified_source_sha256" if expected_sha256
             else "locally_computed_from_exact_https_source_ranges",
             "gzipCrcVerified": True, "ranges": [r for _, r in sorted(verified, key=lambda i: i[1]["start"])]}
    output_receipt.write_text(json.dumps(saved, indent=2) + "\n")
    staging.rename(output)
    for path, receipt in verified:
        path.unlink()
        (folder / f"{receipt['start']}-{receipt['end']}.json").unlink()
    folder.rmdir()
    return saved


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("class_name", choices=SOURCES)
    parser.add_argument("directory", type=Path)
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--chunk-bytes", type=int, default=16 * 1024 * 1024)
    args = parser.parse_args()
    if not 1 <= args.workers <= 16 or not 1024 <= args.chunk_bytes <= 64 * 1024 * 1024:
        parser.error("workers must be 1..16 and chunks 1 KiB..64 MiB")
    receipt = fetch_source(args.class_name, args.directory, args.workers, args.chunk_bytes)
    print(json.dumps({key: value for key, value in receipt.items() if key != "ranges"}, sort_keys=True))
