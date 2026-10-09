# Research timeline — iteration 2.71 (2026-09-23)

## Scope

Continued the current mouse spinal interneuron atlas in place from the immutable 2.70 parent. This increment converts a bounded source-coverage audit into a selected-profile information card; it does not generate cell geometry or claim a profile-to-morphology identity.

## Evidence update

- Compared the normalized exact publication DOI from all 10 displayed interneuron taxonomy namespaces (387 source profiles) against `sourcePaper.dois` in the pinned NeuroMorpho.Org 8.6.124 no-age query (1,097 deposited morphology records).
- The bounded metadata comparison found 0/10 exact taxonomy-source publication DOI overlaps and 0/1,097 morphology-record matches.
- Added a reproducible audit, strict JSON Schema, source-byte receipts, and validator. The selected type dossier now displays the selected source label, source paper DOI, the pinned-query hit count, and the limit of this publication-level metadata relationship.
- Retained the independent morphology handoff as a literal source-label search; no DOI or label result is treated as a subtype, specimen, same-cell, or geometry link.
- Added UPG-246 to the research queue. It records only the completed citation-level coverage increment; it does not claim biological absence or close morphology discovery across other sources.

## Model and UI disposition

- No new records, source profiles, denominators, geometry, internal structures, registrations, measurements, or identity joins were admitted.
- The pinned 8.6.124 query and 142-record main-scene subset remain unchanged.
- Zero DOI matches are limited to the cited source contracts and this exact metadata snapshot. Incomplete or missing source-paper citation fields and other repositories remain outside this negative result.

## Verification and rollback

- The deterministic builder and schema validator recompute every source DOI and record match from checksum-receipted JSON inputs.
- The 2.71 manifest seals the exact 2.70 manifest as immutable parent and includes this unique timeline file.
- Roll back this iteration by restoring the parent listed in `data/research-iteration-manifest-2.71.json`; preserve that parent snapshot.
- No full-project copy was created.
