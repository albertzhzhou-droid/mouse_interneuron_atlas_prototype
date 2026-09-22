# Curator release notes — 2.0.0-curator.1

**Workbench release:** `ohri-mouse-interneuron-public-data-workbench-2.0.0`  
**Scope:** localhost-only, private named-curator review; 0 registrations

Public deployment, public hosting, and public release remain unauthorized pending institutional review.

## What changed

Candidate 2.0 completes the bounded provenance-export portion of `UPG-014`. In the Sources panel, a curator can export a source-scoped **RO-Crate 1.3 detached JSON-LD metadata document** for any of the seven catalogue entries.

The metadata-only document contains one external HTTPS data entity plus catalogue metadata: source ID, accession, pinned version, catalogue access date, rights status, modality/coverage, and its source-specific scientific boundaries. It is not an archive of the cited source object.

## Hard boundaries

- No remote requests, source-file upload, source-file download, persistence, credential storage, local hash calculation, source-object embedding, or automatic acquisition occurs.
- The export does not prove possession, grant data reuse/redistribution rights, validate biological truth, transform source coordinates, establish a source-to-project relation, or create `REG`.
- The workbench still uses public digital sources only and has no OHRI internal experimental data, physical specimens, or unpublished institutional biological record.
- The underlying Research MVP has 0 registrations; entity geometry remains SYN and paths SCH.

## Validation

Run:

```bash
npm run validate:provenance-crate
node --test tests/public-provenance-crate.test.mjs
npm run validate:manifest
```

The release-manifest content SHA-256 is recorded in `data/release-manifest-2.0.json`. Verify the generated ZIP against its companion `.zip.sha256` before review.

## Curator focus

Confirm that the downloaded filename ends in `-ro-crate-metadata.json`, that it contains only a single external `https://` source entity, and that no payload path, local SHA-256, claimed registration, or rights authorization is present. An acceptable metadata export is still not an admitted source asset.
