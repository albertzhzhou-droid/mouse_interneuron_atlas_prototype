# OHRI Mouse Spinal Interneuron Atlas — Feasibility 0.1

An evidence-linked 3D/2.5D feasibility prototype for exploring adult mouse spinal interneuron populations and SCI-state overlays.

> Research visualization only. The app is not a complete cell census, connectome, clinical model or treatment recommendation. All rendered cells and pathways are synthetic/schematic and are not valid for measurement.

## What the prototype proves

- The species is fixed to adult *Mus musculus*.
- Five population entities and two non-family injury-state overlays can coexist without being forced into one mutually exclusive taxonomy.
- A researcher can search and filter by transmitter, segment, injury model and endpoint.
- The 3D scaffold supports orbit/zoom, four camera presets, entity picking, layer controls and a transverse-plane slider.
- Every entity opens an evidence card containing its source, allowed claim, causal grade, endpoint, negative findings and a “not established” boundary.
- URL state and JSON export preserve the release ID, filters, selected entity and disclaimer.
- A semantic list and CSS transverse orientation view remain available when WebGL2 is unavailable.

## Run and verify

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev
npm test
```

`npm test` builds the deployable site, validates the release data and runs server-rendering plus scientific red-team tests.

## Important files

- `app/AtlasPrototype.tsx` — interaction, filters, evidence UI, URL state and export.
- `app/SceneCanvas.tsx` — native Three.js procedural renderer.
- `data/atlas-release-0.1.json` — authoritative seven-record prototype release.
- `data/benchmark-snapshot-2026-08-17.json` — machine-readable comparison with BrainGlobe, SpinalJ, Neuroglancer, NeuroMorpho, Allen, SPARC and Fish1.
- `docs/PHASE_1_BENCHMARK_AND_SCOPE.md` — benchmark decisions and first-stage boundary.
- `docs/PROTOTYPE_COMPLETION_AUDIT.md` — completion and external validation gates.
- `docs/RIGHTS_LEDGER.csv` — current reuse/redistribution boundary.
- `scripts/validate-release.mjs` — scientific contract and red-team validator.

## Geometry semantics

- `OBS`: directly measured geometry in its stated source frame.
- `REG`: registered geometry with a recorded transform.
- `INF`: interpolated or probabilistic representation.
- `SCH`: literature-supported schematic pathway.
- `SYN`: synthetic prototype geometry.

Release 0.1 contains only `SYN` entity geometry and `SCH` pathways. A future release cannot add `OBS` or `REG` labels without source accession, license, transform, error, checksum and review metadata.
