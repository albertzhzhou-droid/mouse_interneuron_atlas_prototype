# Curator package validation report — 2.2.0-curator.1

**Scientific release:** `ohri-mouse-interneuron-public-data-workbench-2.2.0`  
**Distribution scope:** private named-curator review only  
**Registration count:** **0 registrations**

## Distribution identity

| Item | Verified value |
|---|---|
| ZIP | `OHRI-Mouse-Interneuron-Atlas-2.2.0-curator.1.zip` |
| ZIP SHA-256 | Read the paired `OHRI-Mouse-Interneuron-Atlas-2.2.0-curator.1.zip.sha256` sidecar. |
| Release-manifest content SHA-256 | Read `data/release-manifest-2.2.json` in the generated package. |
| Release-manifest input count | `42` SHA-256-locked inputs |

The companion digest is the authority for recipient verification. This report does not authorize public deployment, hosting, or redistribution.

## Automated verification

Before distribution, run:

```bash
npm run lint
npm test
npm run package:curator
npm run validate:curator-package
```

Expected outcomes: lint passes; build completes with only the existing non-blocking bundle-size advisory; every validator and regression test passes; package verification confirms English-only text, archive integrity, loopback-only serving, byte counts, file hashes, and `0 REG`.

## UPG-016 interactive check

1. Open the Sources panel and select a Research MVP entity in the atlas.
2. Select one or more feasibility axes; verify only declared public-source routes appear in the second lane.
3. Confirm the **NO CROSS-LANE EDGE** policy prohibits identity, coordinate, causal, authorization, and registration inference.
4. Export a trace receipt; confirm `sourceObjectsAcquired` is `false` and `registrationsCreated` is `0`.

## Remaining verification boundary

The static site and standard-library loopback runtime are validated locally. Double-click launcher behavior on clean macOS, Windows, and Linux systems remains a recipient/platform acceptance check. It does not change the scientific boundary: this is a localhost engineering candidate with no registered objects.

