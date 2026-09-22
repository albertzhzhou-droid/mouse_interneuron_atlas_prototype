# ADR-001: use a browser-local 2D session for unbundled Tabulae spatial images

**Status:** Accepted  
**Date:** 2026-08-18  
**Decision scope:** Public-data workbench candidate 1.7 only

## Context

The public GEO `GSE234774_RAW.tar` listing names 24 matched Visium triplets: a low-resolution tissue PNG, spot-position CSV, and scale-factor JSON for each declared section. The archive itself is publicly listed, but this release does not have a published source checksum for that archive, an asset-level redistribution decision, a source-to-project transform, or a held-out registration error.

The project must remain usable offline, must not require OHRI data, and must not silently convert a spatial spot into a cell, 3D coordinate, or project registration.

## Options considered

1. **Bundle selected source images.** Rejected: it would require a resolved, object-level reuse decision and source-integrity record that are not present.
2. **Fetch the archive from the browser.** Rejected: it would make review network-dependent, make acquisition implicit, and weaken the reproducibility and rights boundary.
3. **Display only metadata.** Safe but insufficient: it cannot let a researcher inspect a lawfully obtained source-local section.
4. **Require researcher-selected local triplets and parse them in the browser.** Accepted.

## Decision

Candidate 1.7 accepts exactly one declared `.png.gz` / `.csv.gz` / `.json.gz` triplet at a time. The browser validates the selected filenames against one of 24 declared GEO sections, decompresses the files locally, calculates local SHA-256 receipts, and overlays source-local Visium spot positions on the selected 2D tissue image.

The session makes no remote request, upload, persistence, automatic acquisition, source-file bundling, transform, segmentation, gene-expression inference, cell-type call, same-cell join, 3D reconstruction, or `REG` object. A receipt includes filenames, local hashes, parser counts, and scale factors only; it excludes the image and coordinate rows.

## Consequences

This adds a real, researcher-controlled inspection capability while retaining public-data-only and offline review. It does **not** admit the archive as a bundled asset or resolve its source checksum/rights status. The release keeps **0 registrations** and is not authorized for public deployment. `UPG-011` remains the numerical-admission gate; `UPG-012` is the separate cross-section/3D eligibility gate. Neither gate can promote the current session to `REG` without a declared coordinate system, transform, independent held-out landmark error, rights decision, and curator review.

## Source records

- [GEO GSE234774 record](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE234774)
- [Public GEO supplementary archive listing](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE234nnn/GSE234774/suppl/)
- [Tabulae Paralytica study](https://www.nature.com/articles/s41586-024-07504-y)
