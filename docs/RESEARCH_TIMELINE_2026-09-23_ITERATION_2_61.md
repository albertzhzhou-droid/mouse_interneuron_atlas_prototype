# Research timeline — iteration 2.61 (2026-09-23)

## Objective and rollback

Continue the public-data-only, evidence-bounded atlas in the existing workspace. The immutable rollback parent is `data/research-iteration-manifest-2.60.json` (394,280 bytes; SHA-256 `2f63bb6898871daad8c7090ab6c8fa3aa36fc746bfcac32bbfb3b4d1597ba56b`; content SHA-256 `e99a9cf8bd3dd55acc28d26577506cfaf343f043e5d2cd47f7cb3dc7cbca22fb`). The snapshot preserves the complete 2.60 record and its 217-upgrade denominator without recomputing it against later live inputs.

## Research increment

- Added UPG-236, an exact source `cell_type` filter to the pinned NeuroMorpho 8.6.124 no-age query browser. The filter is built from the checksum-verified index and preserves the exact official values.
- The pinned index contains 1,097 query records, 27 non-missing `cell_type` strings, and 2,735 record-label memberships. There are 1,095 multi-label records, so per-label counts overlap. The facet therefore reports repository-record membership only; it is not a mutually exclusive taxonomy or an animal/prevalence denominator.
- Changing the filter narrows the candidate list but does not auto-select the first result or replace the active source morphology. Clicking a named exact NMO record then loads only that record's checksum-verified source-local SWC; the visible record ID and source metadata stay tied to that object.
- NeuroMorpho documents cell type as source metadata with hierarchical levels, and its FAQ notes that descriptions largely reflect authors' selections. The UI therefore does not normalize raw wording or imply that a repository label is identical to a molecular profile, a consensus cell type, or a representative archetype.
- No new morphology, cell-internal geometry, type-to-cell join, atlas registration or fallback model is added. This increment improves access to real source-record forms without assigning any such form to an unlinked molecular profile.
- Added UPG-237 as a planned paper-by-label provenance cross-tab: exact NMO IDs, source DOIs, archive and multi-label/multi-DOI overlap must remain visible before label-level distributions are interpreted across studies.

## Source basis

- [NeuroMorpho metadata fields](https://www.neuromorpho.org/MetaData.jsp) and [official FAQ](https://neuromorpho.org/myfaq.jsp) document cell-type metadata and its hierarchical/source-described character.
- The displayed label set is computed only from the frozen 8.6.124 index pinned at `data/neuromorpho-no-age-query-universe-0.1.json`; the live 8.6.125 release remains a separate metadata-delta audit and is not silently substituted.

## Verification

`npm run build` passed. Vinext reported a large client-chunk advisory and that it cannot statically classify some routes; the build completed successfully. The targeted MICrONS and SSR checks passed 47/47. `npm run test:research` passed its production/source/registry preflight and all 861 current tests: 846 passed, 15 conditional tests skipped, and 0 failed. The current research-upgrade registry contains 219 rows through UPG-237 (62 completed; 32 research-facing UI IDs). The source registry resolves 28 sources, 37 record sets, 387 profiles, 11 exact rosters, 2 exact object sets and 0 project registrations. The 2.61 manifest contains 501 pinned inputs and reports 0 full project copies.

Automated SSR and English-only checks passed. A screenshot-based visual audit was not possible in this run because the native Mac surface was locked and the in-app browser had no open tab; no claim of manual visual review is made.

## Workspace and rollback discipline

All changes remain in the existing project tree. No complete project copy or source geometry bundle is created. No commit or push is part of this iteration. Rollback is the immutable 2.60 manifest above.
