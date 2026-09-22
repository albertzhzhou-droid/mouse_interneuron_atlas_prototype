# Curator release notes — public-data workbench candidate 0.3

**Distribution candidate:** `0.3.0-curator.1`  
**Workbench release:** `ohri-mouse-interneuron-public-data-workbench-0.3.0`  
**Workbench catalog schema:** `0.3.0`  
**Frozen evidence release:** `ohri-mouse-interneuron-research-mvp-candidate-0.2.0`  
**Evidence schema:** `0.2.0`  
**Manifest content SHA-256:** `755a36cd4fc60f3ed79f8557665ce81edaedd03a31046a76ccfa637e9c64c3b1`

## What is new

Candidate 0.3 retains the existing seven evidence entities, eight claims, thirteen separated conditions, thirty-one safeguards, local BrainGlobe reference, five local-frame NeuroMorpho SWCs, and zero registrations. It adds a public-data workbench rather than adding unreviewed biological observations.

The Sources panel contains six public-source leads and six versioned upgrade records. A reviewer can search by source, accession, modality, boundary, and admission stage; inspect source-specific provenance and rights state; open a source by deliberate user action; and export a local intake JSON record. The app does not download candidate data automatically.

| Source category | Count | Current status |
|---|---:|---|
| Bundled local references | 2 | BrainGlobe reference and NeuroMorpho morphology remain separately bounded. |
| Metadata-audit leads | 2 | SpinalJ and Cano-Gomez require file/specimen/coordinate/rights audit before a candidate asset enters a build. |
| Adapter leads | 2 | Russ taxonomy and Tabulae injury data require accession-pinned processed inputs and condition-specific schemas. |
| Upgrade records | 6 | The queue is machine-validated and exportable; it is not a promise that every upgrade will qualify. |
| Registered objects | **0** | No candidate source has been promoted to project REG. |

## Scientific and distribution boundary

The workbench is public-data-only. It does not require OHRI internal experimental data, physical specimens, unpublished institutional records, or a runtime network request. Public access does not automatically permit rebundling or public deployment; each asset still needs a recorded rights and provenance decision.

No source in the 0.3 catalog is allowed to grant an observed project registration. Source-local, author-space, type-level, aggregate, spot-level, inferred, and local morphology records remain distinct. The SpinalJ benchmark is a reproducibility exercise; it must not transfer a transform to a NeuroMorpho SWC or to a synthetic evidence entity.

This package may be reviewed privately by named curators with the attribution records intact. It is not approval to publish, host, redistribute broadly, make a clinical claim, or describe the workbench as a complete interneuron census or connectome.

## Required review focus

1. Confirm the Sources panel distinguishes a catalog lead from a bundled asset and makes automatic acquisition impossible.
2. Confirm the SpinalJ, Cano-Gomez, Russ, and Tabulae records retain their stated coordinate and aggregation limits.
3. Confirm empty catalog results do not imply biological or public-data absence.
4. Confirm source intake JSON contains the selected source, linked upgrade records, policy flags, and no downloaded or registered object.
5. Confirm the existing SYN, SCH, INF, OBS and zero-REG boundaries remain visible elsewhere in the application.
6. Record any source, license, provenance, or scientific-boundary correction in the independent feedback form.

## Repository verification

Developer verification for this candidate:

    node scripts/validate-research-mvp.mjs
    node scripts/validate-json-schema.mjs
    node scripts/validate-public-data-catalog.mjs
    node scripts/validate-spatial-assets.mjs
    node scripts/build-release-manifest.mjs --check
    npm test

Package recipients do not run these commands. They verify the supplied ZIP digest, extract the kit, open START_HERE.html, use the loopback launcher, and complete the included feedback form.
