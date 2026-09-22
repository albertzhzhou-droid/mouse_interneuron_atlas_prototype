# Public-data workbench architecture — candidate 0.4

**Application candidate:** `ohri-mouse-interneuron-public-data-workbench-0.4.0`  
**Scope:** public-source metadata intake only; no candidate data acquisition  
**Registration count:** `0`

## What changed from 0.3

Candidate 0.4 keeps the 0.3 source catalog and all frozen 0.2 evidence boundaries, then implements the first P0 admission record for the SpinalJ processed example data. This is a metadata-only gate, not a data import.

```
Public landing page + public protocol + repository context
  -> SpinalJ metadata intake JSON
  -> schema + semantic validator
  -> catalog link and Sources-panel audit card
  -> release manifest with SHA-256 input lock
  -> private curator package
```

## Admission model

`data/public-source-intakes/spinalj-processed-metadata-audit-0.4.json` records the following before any candidate file enters the application:

- Which public pages support each reported metadata statement.
- The dataset DOI/version, reported CC BY 4.0 landing-page license, and dataset-declared `SpinalJ v1.13` provenance.
- The exact negative state: no remote acquisition attempted, no candidate file enumeration, no file checksum, no bundled asset, and no project registration.
- Pending requirements for file-level inventory, hashes, native metadata, transforms, held-out landmarks, rights decisions, and curator review.

The intake deliberately distinguishes a landing-page license from an asset-level bundle or public-hosting authorization. It also treats the current public source-code repository as context only: no unpinned repository version can be substituted for the dataset-declared pipeline version.

## Source-status semantics

| Catalog status | Meaning | Permitted claim |
|---|---|---|
| `bundled_local` | Existing local reference asset with recorded provenance | Asset-specific `INF` or source-local `OBS`, never a new registration by co-display |
| `ready_for_metadata_audit` | Public lead found, no audited intake | No asset may enter a build |
| `metadata_audited` | Public metadata record verified, no candidate file admitted | Source is a reproducibility candidate only; zero file-level spatial claim |
| `ready_for_adapter` | A processed accession is selected for prospective adapter work | Adapter remains condition/type/source-local unless its own admission passes |

## Controls and failure behavior

- `validate-public-source-intake.mjs` fails if the audit claims a download, candidate-file listing, hash, bundle, public-host authorization, or registration.
- The catalog validator fails unless the SpinalJ source links exactly to this intake and `UPG-001` remains in progress rather than falsely complete.
- The release manifest locks both 0.4 schemas and the intake JSON alongside the catalog, frozen evidence payload, spatial manifests, rights ledger, and dependency lock.
- The UI can export the selected source together with its pinned intake, but it never fetches, transforms, or installs a remote research asset.

## Next P0 gate

The next implementation may acquire a deliberately selected processed file only after its complete file manifest and reuse decision are recorded. It must preserve source-local coordinate semantics, split training versus held-out landmarks, report physical-space error, and remain unable to register current synthetic evidence entities or unregistered NeuroMorpho SWCs.

## 1.7 extension: browser-local spatial session

The current workbench extends this metadata-first architecture with `data/tabulae-spatial-local-session-0.1.json`, a deliberately non-admitting contract for 24 exact Tabulae `GSE234774` source section labels. The UI can parse only one researcher-selected local gzip triplet at a time and renders the low-resolution image plus source-local Visium spots in 2D. It uses no network acquisition, upload, persistence or source-asset bundle; it stores no claim that a local SHA-256 is a publisher checksum.

The extension is governed by [ADR-001](ADR-001-TABULAE-LOCAL-SPATIAL-SESSION.md). It does not change the candidate's registration count of zero. `UPG-011` governs a future numerical adapter, while `UPG-012` prohibits cross-section/3D work until stable specimen identity, physical frame/orientation/order, transform provenance, asset rights and held-out landmark error have been reviewed.

## 1.8 extension: multi-session source-local comparison

`data/tabulae-spatial-local-comparison-0.1.json` adds a bounded browser state that can hold up to four unique declared local sessions. It only renders separate source-local cards and exports lightweight per-card receipts. It deliberately provides no cross-section transform, established order or inter-section geometry, source bundle, numerical comparison, or registration capability.

The design is governed by [ADR-002](ADR-002-TABULAE-LOCAL-COMPARISON-BOARD.md). Its explicit `UPG-013` research-watch record prevents a visual comparison from becoming an unstated spatial correspondence or scientific effect claim. The release registration count remains zero.

## 1.9 extension: local public file-admission composer

`PublicFileAdmissionManifestComposer.tsx` is a browser-local authoring surface, not a data-ingestion service. It fixes the public source ID, manifest format, `localSha256: null` and `metadata_only_not_downloaded_not_registered` decision for each of the two source-specific paths. It accepts publisher/repository metadata and exports a JSON file only after source URL, byte count, checksum, rights record and all required source-frame/specimen fields have passed local structural validation.

The component has no source-file picker, remote request, credential store, persistent storage, local hash calculation, transform implementation or registration output. The existing strict importer remains the gate for independently prepared manifests. The completed `UPG-014` extension maps selected catalog metadata to a detached RO-Crate 1.3 external-reference document; it cannot change the acquisition or registration boundary. See [ADR-003](ADR-003-LOCAL-ADMISSION-MANIFEST-COMPOSER.md) and [ADR-004](ADR-004-DETACHED-RO-CRATE-PROVENANCE.md).

## 2.1 extension: public-source feasibility planner

`EvidenceFeasibilityPlanner.tsx` turns the versioned source catalogue into a bounded research-planning surface. It accepts at most four declared evidence axes and uses the planner contract to distinguish a single source-specific route, separate non-joinable routes, and a package-coverage gap. A browser-local receipt preserves the selected axes, route IDs, decision, and scientific boundary for review.

## 2.2 extension: two-lane provenance trace

`EvidenceProvenanceTrace.tsx` derives two independent views from frozen local contracts: Research MVP `entity → claim → condition → statement/source` references, and public-source `axis → route → source` planning references. It does not create an edge between them. The receipt exports declared identifiers and the no-acquisition/zero-registration boundary only. `CrossLaneRelationshipAdmission.tsx` implements `UPG-017` as a proposal-only gate: it emits a typed, not-admitted local record of missing object, rights, source-frame, independent-evidence, and validation requirements. It cannot create a candidate edge, change the trace, acquire a source object, or affect a future release without separate evidence and authorization.

The extension cannot fetch, upload, download, inspect, hash, persist, combine, align, transform, or bundle a source object. It does not establish biological absence, same-cell or same-specimen identity, shared coordinates, causality, source authorization, or `REG`. The design is governed by [ADR-005](ADR-005-PUBLIC-SOURCE-FEASIBILITY-PLANNER.md); future source integration remains subject to the existing source-admission and registration gates.
