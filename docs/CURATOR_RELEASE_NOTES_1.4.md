# Curator release notes — public-data workbench candidate 1.4

**Distribution candidate:** `1.4.0-curator.1`  
**Workbench release:** `ohri-mouse-interneuron-public-data-workbench-1.4.0`  
**Release-manifest content SHA-256:** `7d6c120e18988dbd2128b20d3e1ca6056708f7db414c481c98ce8b1883994949`  
**Registration count:** **0 registrations**

Candidate 1.4 adds a local 69-population Russ 2021 taxonomy explorer. It bundles a derived, version-pinned metadata crosswalk with eight groups, 65 displayed interneuron candidates, and three marker ranks per source label. The original Supplementary Table XLSX and all processed count matrices remain unbundled; the crosswalk records the exact source-table URL, 1,475,885-byte receipt, and SHA-256 `a45578c893998fae42acf781c4700d162249497476b0b81149302f49929fd2e0`.

This is `TYPE_LEVEL` molecular context only. It contains no individual-cell coordinate, atlas registration, same-cell multimodal join, synaptic connection, adult segment assignment, or exact prototype identity. In particular, `Excit-36` / `Vsx2` and `Excit-38` / `Sim1` are marker-context candidates, not exact mappings. Every one of the seven prototype crosswalks is non-exact.

`UPG-003` is now in progress as a provenance-locked crosswalk; `UPG-009` is a research watch requiring curator reconciliation of the source table, article narrative, corrections, and adult-lumbar validation context before any narrower label transfer can appear. Reconciliation cannot create a spatial coordinate, same-cell pairing, connectivity edge, or `REG` object.

The existing Cano-Gomez specimen-aware preflight remains author-space and requires a source frame and native coordinate metadata or explicit missingness. It does not download a file, create a local checksum, bundle an asset, transform coordinates, or create a registration; every submitted record retains `localSha256=null`. No selected BIL object record, pinned transform artifact, or independent held-out error is supplied. The local adjudication-packet workflow requires at least two uniquely identified feedback records and preserves every response; a mixed verdict cannot be converted into a recommendation for the next private review.

Candidate 1.4 preserves the zero-file SpinalJ and Cano-Gomez preflights, the header-only Tabulae audit, and the two-curator local adjudication workflow. It remains read-only: it cannot modify evidence, certify a ZIP digest, authenticate a curator, acquire data, authorize public release, or create registration.

This package is private curator-review material. Public deployment or redistribution remains subject to institutional review and asset-level rights decisions.
