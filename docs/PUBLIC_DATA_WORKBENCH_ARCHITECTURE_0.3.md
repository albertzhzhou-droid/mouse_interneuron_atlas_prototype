# Public-data workbench architecture 0.3

**Application candidate:** ohri-mouse-interneuron-public-data-workbench-0.3.0  
**Scientific evidence payload:** frozen ohri-mouse-interneuron-research-mvp-candidate-0.2.0  
**Deployment:** localhost only; zero automatic external research-data requests

## Requirements and constraints

The workbench must let a researcher or curator discover future public inputs, see precisely what may and may not be claimed, inspect the work required before data are bundled, and export an audit record. It must never depend on OHRI internal experimental records, physical samples, unpublished institutional data, a runtime data service, or a fabricated shared coordinate frame.

The performance target is static local rendering: the catalog is a small bundled JSON file and filtering is performed in-memory in the browser. Candidate raw datasets are intentionally not downloaded by the app. This makes an offline curator review deterministic and keeps data acquisition an explicit, logged action.

## Component and data flow

Published public source or accession
  -> manual source-specific metadata and rights audit
  -> public-data-catalog-0.3.json
  -> JSON Schema and semantic validator
  -> release-manifest-0.3.json
  -> Sources workbench, URL state, version-locked JSON state, and intake JSON export
  -> future adapter or registration benchmark
  -> provenance, checksum and coordinate validation
  -> curator gate before any REG proposal

data/public-data-catalog-0.3.json is the source of truth for six public leads and six upgrade records. app/PublicDataWorkbench.tsx is a read-only interaction layer. It creates no remote request, mutates no catalog, and makes source downloads a deliberate external-link action only.

The existing evidence release, BrainGlobe derivative, and NeuroMorpho SWCs retain their individual provenance chains. The workbench does not merge them into a single biological dataset.

## Interfaces

| Interface | Contract |
|---|---|
| Catalog filter | Searches source identity, accession, modality, proposed use, boundary, and admission checks; empty results explicitly do not imply no public source exists. |
| Source detail | Exposes accession, version, verified date, source URL, rights state, coordinate authority, admissible use, prohibited claims, and next checks. |
| Intake export | Exports the selected catalog record, its linked queue items, policy flags, and a timestamp. It says catalog_only_not_downloaded_or_registered. |
| URL / JSON state | Persists catalog query, admission stage, and selected source along with existing atlas state. The import validator accepts older state exports by applying a deterministic default catalog state. |
| Release lock | Hashes the catalog and its schema with the existing scientific inputs and exact package lock. |

## Admission and spatial policy

The catalog uses INF, OBS_LOCAL, SOURCE_LOCAL_OBS, AUTHOR_SPACE_OBS, TYPE_LEVEL, and AGGREGATED_OR_SPOT_LEVEL as source authorities. REG is deliberately absent from the allowed values. A later release needs a separate source/target coordinate-space declaration, transform checksum, disjoint training and held-out landmarks, reported target-space error, rights decision, and dual-curator approval before any record can be considered for REG.

The primary technical trade-off is deliberate: a static, offline catalog cannot acquire or validate very large data assets by itself. This preserves reproducibility and avoids silent licensing or coordinate failures. A future admission service can perform pinned download and checksum work, but it must retain an approval boundary before it writes a package input.

## Growth points already queued

1. **SpinalJ** — establish a reproducible source-local registration benchmark, not a transferred cell registration.
2. **Cano-Gomez** — audit specimen identifiers, spatial units, orientation, modality links, and transform availability before drawing source-local geometry.
3. **Russ** — add a type-level marker and taxonomy crosswalk with ambiguity retained.
4. **Tabulae Paralytica** — add condition-specific injury-state records with spot-level and cell-level data modeled separately.
5. **NeuroMorpho** — expand morphology only after source-paper, topology, completeness, and local-frame QC.
6. **Admission service** — generate deterministic source manifests, but do not automate scientific approval.

## What to revisit

If the catalog grows beyond a few hundred records or needs multi-user curation, replace the bundled JSON with an append-only, signed manifest service and authenticated curator decision records. That service should expose read-only public-catalog APIs and a separate protected decision API; it should not serve source data or make download or redistribution decisions implicitly.
