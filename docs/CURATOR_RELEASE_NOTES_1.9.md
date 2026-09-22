# Curator release notes — 1.9.0-curator.1

**Workbench release:** `ohri-mouse-interneuron-public-data-workbench-1.9.0`  
**Distribution scope:** private named-curator review only; public deployment is not authorized.  
**Registration count:** `0 registrations`

## What changed

Candidate 1.9 adds a browser-local public file-admission manifest composer for two existing public-source gates:

- SpinalJ uses the object-level `0.7.0` manifest shape.
- Cano-Gomez uses the specimen-aware `0.8.0` manifest shape and preserves its preprint boundary.

The composer only exports researcher-entered metadata JSON. It requires an HTTPS source URL, published byte count, format, source-declared SHA-1/SHA-256 checksum, recorded file-level rights decision, and required coordinate/specimen fields or an explicit missing reason. It fixes `localSha256` to `null` and the admission state to `metadata_only_not_downloaded_not_registered`.

The composer does not fetch, upload, persist or hash a source file; it also cannot select, decompress, bundle, transform or register one. A generated manifest is not a verified asset, a reuse authorization, a biological conclusion, a coordinate transform or `REG`.

## Upgrade queue

The catalog has seven public-source leads and fourteen upgrade records. `UPG-014` is a research-watch gate for a future metadata-only, external-reference provenance export. It does not implement an RO-Crate in this candidate and cannot turn a URL/checksum record into possession, rights clearance, source-to-project registration or `REG`.

`UPG-001` and `UPG-002` remain the scientific/asset gates for any possible future SpinalJ or Cano-Gomez source-object admission. The established 1.8 Tabulae side-by-side panel remains source-local 2D only and does not become an alignment, stack, quantitative comparison, effect claim or registration.

## Release lock

The `data/release-manifest-1.9.json` content lock is `9a9406b1325c32002215192ac8b12e51eebe0d2e84b7ecbe8e07a1d85eaf865a`. See that file for its canonical SHA-256 input list and `PACKAGE_MANIFEST.json` for the package file lock. Verify the ZIP against its companion `.zip.sha256` before opening `START_HERE.html`.

## Review focus

Confirm that the composer is clearly metadata-only, the two schemas remain distinct, publisher-side checksum values are never presented as local hashes, and no UI wording suggests acquisition, asset-level rights clearance, validation, spatial registration or a full interneuron census.
