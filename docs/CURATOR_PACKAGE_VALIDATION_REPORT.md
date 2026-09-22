# Curator package validation report — Candidate 1.4

**Distribution release:** `1.4.0-curator.1`  
**Scientific release:** `ohri-mouse-interneuron-public-data-workbench-1.4.0`  
**Validation date:** 2026-08-18  
**Decision:** pass for private, attributed curator review; not authorized for public deployment or broader redistribution

## Frozen artifact

| Field | Final value |
|---|---|
| ZIP | `OHRI-Mouse-Interneuron-Atlas-1.4.0-curator.1.zip` |
| ZIP bytes | `1,823,706` |
| ZIP SHA-256 | `a8c42806af4c5f48b5e8a354a6e7d4e044c988b5ade69c4d52ebd5d036b1392a` |
| Package files | `98` |
| Package-manifest content SHA-256 | `092ede26779ebfe27c8d7be7bbfa7eac5e94dde3cce57b7fc63efc0d4cdd78a6` |
| Scientific release-manifest content SHA-256 | `7d6c120e18988dbd2128b20d3e1ca6056708f7db414c481c98ce8b1883994949` |
| Registered objects | `0` |

The companion `.zip.sha256` records the final ZIP digest. The internal package manifest pins every package-relative path, byte count, and SHA-256 digest; it sets private named-curator review, no public-deployment authorization, and no automatic external request.

## Candidate 1.4 additions and boundary

- The package includes a derived Russ 2021 crosswalk with **69** published neural-population labels, **65** displayed interneuron candidates, and **8** groups.
- Authority is `TYPE_LEVEL`: the explorer contains no individual-cell coordinate, atlas registration, same-cell join, connection edge, or exact project-entity identity.
- The source Supplementary Table XLSX and count matrices are not bundled. The source-table receipt is pinned to 1,475,885 bytes and SHA-256 `a45578c893998fae42acf781c4700d162249497476b0b81149302f49929fd2e0`.
- `Excit-36` / `Vsx2` and `Excit-38` / `Sim1` remain marker-context candidates only. All seven prototype crosswalks are non-exact.
- `UPG-009` is a provenance/adult-context reconciliation watch, not an acquisition or registration gate.

## Automated release validation

```text
npm run lint: PASS
npm test: PASS
Node tests: 85 passed, 0 failed
Research MVP, schema, public-data, Russ taxonomy, intake, preflight, curator-contract, spatial, and release-manifest validators: PASS
Curator package build and verification: PASS
Node package verifier: 98 files; 0 REG; PASS
Python package verifier: 98 files; 0 REG; PASS
git diff --check: PASS
```

The regressions cover type-level cardinality and source-table receipt, rejection of exact identity/registration transfer, source-specific intake boundaries, runtime identity/hash locks, CJK-free package text, package traversal/symlink/tamper rejection, and full manifest drift detection.

## Final localhost smoke test

The extracted final package was launched by its included loopback-only Node server at `127.0.0.1`. A real browser loaded the static/hydrated application, switched to **Sources**, selected **Russ et al. harmonized mouse spinal-cord cell-type atlas**, and verified:

- title and candidate version `1.4`;
- `69 published neural populations · 65 displayed as interneuron candidates · no exact prototype mapping`;
- `TYPE_LEVEL` spatial boundary;
- group selector, label/marker search, and local crosswalk export control;
- `Excit-36` / `Vsx2` warning that marker context is not identity transfer or registration; and
- visible `UPG-009` research-watch record.

The server processes were stopped after the smoke test. The known non-blocking build warning remains: the Three.js client chunk exceeds 500 kB after minification. No validation, package-integrity, or browser-smoke failure was associated with it.

## Scientific and rights boundary

- All seven evidence-entity geometries remain `SYN`; displayed evidence paths remain `SCH`.
- The BrainGlobe atlas derivative remains `INF` and is not measurement-valid entity placement.
- The five NeuroMorpho SWCs remain `OBS` in source-local frames, unregistered, and non-representative.
- The package contains **0 `REG` objects**.
- Private sharing with named curators is permitted only with all attribution and source records intact.
- Public hosting, public deployment, and broader redistribution remain institutional asset-level review gates.
