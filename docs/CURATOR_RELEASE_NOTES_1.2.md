# Curator release notes — public-data workbench candidate 1.2

**Distribution candidate:** `1.2.0-curator.1`  
**Workbench release:** `ohri-mouse-interneuron-public-data-workbench-1.2.0`  
**Release-manifest content SHA-256:** generated and locked in `data/release-manifest-1.2.json`  
**Registration count:** **0 registrations**

Candidate 1.2 preserves every frozen earlier curator package. It promotes only the Cano-Gomez public **metadata and method audit** to an explicit, versioned registry record; it does not acquire a data file, add a cell, authorize reuse, or create a registration.

## What changed

- `PDS-CANOGOMEZ-2026` is now `metadata_audited` and links to `PSI-CANOGOMEZ-2026-08-18`.
- The registry has four cited public evidence records and five reported facts: bioRxiv preprint, GEO `GSE318731`, BIL DOI `10.35077/g.1196`, and a PMC-hosted preprint record.
- The method record reports 22 manually defined gray-matter-boundary anchors, thin-plate-spline mapping to C5/T12/L5/S1 reference segments, and aggregation across 20 sections. It remains `AUTHOR_SPACE_OBS`, preprint-bounded, and has **zero registrations**.
- The next gate is `UPG-002B`: select a deliberately scoped public processed object and retain specimen IDs, units, axes, origin, pixel/voxel scale, terms, checksum, and source transform provenance before any source-local adapter is considered.

## What did not change

- Zero downloaded files and zero admitted candidate files for Cano-Gomez.
- No selected object manifest, pinned transform artifact, independent training-versus-held-out landmark split, physical-space held-out error distribution, or transform to the bundled BrainGlobe derivative.
- No project entity or NeuroMorpho SWC became registered; the registration count remains **0**.
- The local adjudication-packet workflow remains read-only. Its read-only packet verifier requires at least two uniquely identified feedback records with one human-reported ZIP digest before a packet can be exported. Packet import verifies structure and exact package identity only; it does **not** recompute or certify the original ZIP digest, authenticate a human identity, approve a release, acquire data, or modify evidence.
- A mixed verdict cannot be converted into `recommend_next_private_review`; dissent and unable-to-assess outcomes remain visible.

## Curator focus

Confirm that the Cano-Gomez card and source-export payload preserve all of the following:

1. `preprint_resource` stays visible.
2. The reported spatial method is source context, not a verified transform or project `REG`.
3. `UPG-002B` is the next gate; no file has been downloaded or admitted.
4. A source-local viewer, if later built, must preserve specimen identity and missing metadata rather than co-display author-space points as measured atlas locations.

The underlying open-source assets retain their own attribution requirements. This privately distributed package is for named curator review only; public deployment or redistribution still requires institutional review.
