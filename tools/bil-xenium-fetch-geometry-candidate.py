#!/usr/bin/env python3
"""Acquire exactly three source tables for local inspection, not viewer admission."""
import hashlib
import json
from pathlib import Path
import re
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
FOLDER = "Run8_Slide2_Mus_M7_F7"
BASE = "https://download.brainimagelibrary.org/fe/79/fe798993f13debd2/" + FOLDER + "/"
OUT = ROOT / "data/source-candidates/bil-xenium-geometry-20260930" / FOLDER
EXPECTED = {"cells.parquet": 3_763_859, "cell_boundaries.parquet": 17_485_669,
            "nucleus_boundaries.parquet": 16_032_941}


def main():
    listing_path = ROOT / "data/source-candidates/bil-xenium-20260929" / FOLDER / "index.html"
    listing = listing_path.read_bytes()
    for name, size in EXPECTED.items():
        match = re.search(r'href="' + re.escape(name) + r'"[^\n]*?\s(\d+)\s*$', listing.decode(), re.M)
        if not match or int(match.group(1)) != size:
            raise ValueError("Frozen listing no longer matches the bounded acquisition: " + name)
    metadata = json.loads((ROOT / "data/bil-xenium-source-metadata-0.1.json").read_text())
    run = next(x for x in metadata["runs"] if x["directoryFolder"] == FOLDER)
    OUT.mkdir(parents=True, exist_ok=True)
    previous_path = OUT.parent / "receipt.json"
    previous = json.loads(previous_path.read_text()) if previous_path.exists() else None
    receipts = []
    for name, expected in EXPECTED.items():
        target = OUT / name
        partial = target.with_name(name + ".partial")
        acquisition = "reused_local"
        if not target.exists():
            try:
                total = 0
                with urllib.request.urlopen(BASE + name, timeout=30) as response, partial.open("wb") as output:
                    if response.status != 200:
                        raise ValueError("Unexpected HTTP status")
                    declared = response.headers.get("Content-Length")
                    if declared is not None and int(declared) != expected:
                        raise ValueError("Publisher size changed: " + name)
                    while chunk := response.read(256 * 1024):
                        total += len(chunk)
                        if total > expected:
                            raise ValueError("Explicit acquisition budget exceeded")
                        output.write(chunk)
                if total != expected:
                    raise ValueError("Incomplete source table: " + name)
                with partial.open("rb") as handle:
                    if handle.read(4) != b"PAR1":
                        raise ValueError("Not a Parquet source table")
                    handle.seek(-4, 2)
                    if handle.read(4) != b"PAR1":
                        raise ValueError("Missing Parquet footer")
                partial.replace(target)
                acquisition = "downloaded"
            finally:
                partial.unlink(missing_ok=True)
        data = target.read_bytes()
        if len(data) != expected or data[:4] != b"PAR1" or data[-4:] != b"PAR1":
            raise ValueError("Invalid local source file: " + name)
        digest = hashlib.sha256(data).hexdigest()
        relative = str(target.relative_to(ROOT))
        if previous:
            old = next((x for x in previous["files"] if x["path"] == relative), None)
            if not old or old["bytes"] != len(data) or old["sha256"] != digest:
                raise ValueError("Previous receipt does not match current file: " + name)
        receipts.append({"path": relative, "url": BASE + name, "bytes": len(data),
                         "sha256": digest, "hashOrigin": "local_inspection_computed_not_publisher_checksum",
                         "acquisition": acquisition})
        print(json.dumps({"file": name, "bytes": len(data), "acquisition": acquisition}), flush=True)
    receipt = {"checkedDate": "2026-09-30", "collectionDoi": "10.35077/g.1196",
               "sourceObjectKey": run["sourceObjectKey"], "directoryFolder": FOLDER,
               "manifestIdentity": run["manifestIdentity"],
               "mode": "bounded_geometry_tables_local_inspection_only",
               "frozenListing": {"path": str(listing_path.relative_to(ROOT)), "bytes": len(listing),
                                 "sha256": hashlib.sha256(listing).hexdigest()},
               "files": receipts, "totalBytes": sum(x["bytes"] for x in receipts),
               "rights": run["rights"], "geometryViewerAdmission": False,
               "sectionLinkedCellObjects": 0, "interneuronObjects": 0, "atlasRegistrations": 0}
    if previous:
        # Preserve the first acquisition record byte-for-byte on repeat inspection.
        print(json.dumps({"files": len(receipts), "bytes": receipt["totalBytes"], "receipt": "verified_existing"}))
    else:
        previous_path.write_text(json.dumps(receipt, indent=2, ensure_ascii=False) + "\n")
        print(json.dumps({"files": len(receipts), "bytes": receipt["totalBytes"], "receipt": "created"}))


if __name__ == "__main__":
    main()
