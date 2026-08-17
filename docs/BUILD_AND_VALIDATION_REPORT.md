# Build and validation report

**Release:** `ohri-mouse-interneuron-feasibility-0.1.0`

**Validation date:** 2026-08-17 (America/Toronto)

**Scope:** adult mouse, C1-S3 schematic scaffold, five evidence populations and two injury-state overlays

## Final verification

| Check | Result |
|---|---|
| `npm run lint` | Pass; zero ESLint errors or warnings |
| `npm test` | Pass; 7/7 tests, 0 failures |
| Production build | Pass with vinext 1.0.0-beta.6 / Vite 8.2.1 |
| Release-data validator | Pass; 7 source-linked records, all geometry `SYN`, all pathways `SCH` |
| Production root route | HTTP 200, HTML, 22,793 bytes, product title present |
| Versioned URL-state route | HTTP 200, HTML, 20,978 bytes, P14 and spasm state present |
| `npm audit` | 0 known vulnerabilities across the resolved dependency graph |
| External scientific asset requests | None required by release 0.1 |

The automated scientific red-team suite protects the source-specific boundaries
for P02, P03, P05, P08, P09, P14 and P16. It also prevents state overlays from
being counted as mutually exclusive cell families and rejects exact-coordinate or
complete-connectome claims.

## Built-size record

| Measure | Bytes |
|---|---:|
| Client JavaScript, raw | 999,012 |
| Client JavaScript, gzip sum | 271,967 |
| Client CSS, raw | 23,405 |
| Client CSS, gzip sum | 6,090 |
| All client files, raw | 1,171,413 |
| All client files, gzip sum | 425,520 |
| Complete `dist` directory on disk | 2,648 KiB |
| Largest client chunk, raw | 611,946 |
| Largest client chunk, gzip | 154,833 |

The largest client chunk contains the Three.js renderer and triggers Vite's
500 kB raw-chunk advisory. Its gzip size is 154,833 bytes and the complete client
JavaScript gzip sum is 271,967 bytes, below the prototype's 650 kB budget.

## Non-blocking toolchain notices

- Node 26 reports that `module.register()` is deprecated inside the current
  vinext toolchain. This is upstream and does not fail the build.
- vinext cannot yet statically classify the root route and reports it as
  `Unknown`; direct production requests and server-rendering tests both pass.
- Real browser hardware remains an external variable. When WebGL2 is absent,
  the semantic population list, evidence cards and CSS transverse view remain
  available by design.

## Reproducibility boundary

The release-manifest checksums cover the evidence dataset, benchmark snapshot
and dependency lockfile. Release 0.1 intentionally bundles no atlas volumes,
observed coordinates, registered morphologies or connectome edges. Those data
must not be added without accession, rights, transform, registration error,
checksum and curator-review records.
