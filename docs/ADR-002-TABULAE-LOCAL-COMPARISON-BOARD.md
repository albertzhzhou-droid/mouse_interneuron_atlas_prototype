# ADR-002 — Tabulae local comparison board

**Status:** accepted for candidate 1.8

**Decision scope:** public-data workbench candidate 1.8 only

## Context

Candidate 1.7 permitted inspection of one declared `GSE234774` Visium section at a time. The public supplementary archive enumerates matching low-resolution tissue-image, position-table, and scale-factor members for 24 sections. The 10x spatial-output specification explains how the position table and scale factors relate spots to a tissue image within a run. It does not establish an inter-section physical frame, orientation, order, transform, landmark set, or error estimate for this project.

## Options considered

1. Stack labels or images into a three-dimensional cord: rejected. Section names and image pixels are not a validated physical coordinate system.
2. Add automatic overlay, normalization, or quantitative image/spot comparison: rejected. These operations would imply unverified correspondence and could be mistaken for a treatment or cellular effect.
3. Retain exactly one local session: safe but unnecessarily limits curator inspection of independently selected declared sections.
4. Present up to four independent sessions side by side: accepted.

## Decision

The browser may hold up to four researcher-selected, uniquely declared gzip triplets side by side. Each card retains only its source-local image, positions, scale factors, parser counts, and local file hashes. A receipt records only those minimal metadata.

The board performs no remote acquisition, upload, persistence, source-file bundling, cross-section transform, overlay, normalization, ordering, stacking, quantitative comparison, cell call, expression inference, treatment-effect inference, source-to-project transform, or `REG` creation. `sectionOrderAuthority` and `interSectionGeometry` are explicitly `not_established`.

## Consequences

Candidate 1.8 remains a localhost public-data workbench with **0 registrations**. The implementation is a comparative reading aid, not a multi-section reconstruction. Any source-frame or 3D proposal remains gated by `UPG-012`; interpretation or numerical concordance across sections remains additionally gated by `UPG-013` and needs object checksums/rights, stable specimen identity, source-supported physical geometry, frozen transform provenance, disjoint held-out landmarks, physical-space error, and curator review.

This engineering decision does not authorize public deployment, public hosting, or public redistribution.

## Sources

- [GEO GSE234774](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE234774)
- [GEO supplementary archive listing](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE234nnn/GSE234774/suppl/)
- [10x Genomics Space Ranger spatial outputs](https://www.10xgenomics.com/support/software/space-ranger/3.1/analysis/outputs/spatial-outputs)
- [Tabulae Paralytica publication](https://www.nature.com/articles/s41586-024-07504-y)
