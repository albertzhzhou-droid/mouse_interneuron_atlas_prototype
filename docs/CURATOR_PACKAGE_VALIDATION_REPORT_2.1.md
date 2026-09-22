# Curator package validation report — 2.1.0-curator.1

**Scientific release:** `ohri-mouse-interneuron-public-data-workbench-2.1.0`  
**Distribution scope:** private named-curator review only  
**Registration count:** **0 registrations**

## Distribution identity

| Item | Verified value |
|---|---|
| ZIP | `OHRI-Mouse-Interneuron-Atlas-2.1.0-curator.1.zip` |
| ZIP SHA-256 | Read the paired `OHRI-Mouse-Interneuron-Atlas-2.1.0-curator.1.zip.sha256` sidecar. |
| Release-manifest content SHA-256 | `6ccb1ef67bff9b292c0da75524333268837c4b9babfd1fae8a400cb936bc4515` |
| Release-manifest input count | `40` SHA-256-locked inputs |
| Package file count | `118` |

The companion `.zip.sha256` sidecar is the authority for recipient verification. The ZIP must be privately shared with its attribution records intact; this report does not authorize public deployment, hosting, or redistribution.

## Automated verification

The source candidate was validated on 2026-08-20 with:

```bash
npm run lint
npm test
npm run validate:curator-package
```

Results:

- lint passed;
- the production build passed (with the existing non-blocking bundle-size advisory);
- `npm test` passed: 109 tests, 0 failures;
- all release, research, schema, public-source, taxonomy, spatial, planner, curator-contract, manifest, SSR, and package checks passed;
- the generated package passed its internal file-set, byte-count, SHA-256, English-text, archive-integrity, loopback-policy, and `0 REG` verification.

## UPG-015 interactive check

A production localhost browser session verified the new public-source feasibility planner:

1. The URL parameter `plan=molecular_taxonomy,adult_lumbar_marker_context` restored the two selected axes and displayed the single Russ source-specific route.
2. Adding `morphology` updated the URL state and changed the decision to `partitioned_routes_no_join` with the explicit prohibition on same-cell, same-specimen, coordinate, and causal inference.
3. Exporting the planning receipt produced a local JSON file with `sourceObjectsAcquired: false` and `registrationsCreated: 0`.

The planner makes no remote request, source-file upload/download, persistence, source-object inspection, coordinate transform, biological analysis, or registration claim.

## Remaining verification boundary

The package’s static site and standard-library loopback runtime were verified locally. Double-click launcher behavior on a separate clean macOS, Windows, and Linux machine remains a recipient/platform acceptance check. It does not change the scientific boundary: the package remains a localhost engineering candidate with no registered objects.
