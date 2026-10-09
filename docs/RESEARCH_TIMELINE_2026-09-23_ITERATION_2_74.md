# Research timeline — iteration 2.74 (2026-09-23)

## Scope

Continued in place from the immutable 2.73 release. This increment adds one checksum-verified BANC v888 adult-female Drosophila ventral-nerve-cord comparison object to the evidence-separated internal-detail panel. It does not update the mouse spinal-cord census or assign fly geometry to a selected mouse record.

## Exact source object and display permission

- Candidate: BANC v888 root `720575941350424112`, source type `IN14A018`, source subclass `ventral_nerve_cord_contralateral_restricted`, proofread; the root ID is stable across v626, v850, v888 and v890.
- Bundled source member: `720575941350424112_skeleton.swc`, 489,716 bytes, SHA-256 `aff95c90a2ba5449f93573769f61aad6b02eb3db75108287d8cb6ee78f0d395e`. It was extracted using bounded HTTP range reads from the CC BY 4.0 Dataverse v3 ZIP; the 16.58 GB archive was not downloaded in full.
- The SWC parses to 7,451 unique nodes and 7,450 parent-child edges in one connected tree. Every node has source type code 2; its axon/dendrite meaning is not established. Radius values are retained in the source but ignored by the display.
- One exact nucleus annotation row links nucleus ID `73044750394982464` to the same root. Its source-local position is `[461824, 954944, 188415]` nm and lies within the SWC bounds. The panel shows only a screen-space point marker, not a nucleus boundary or volume.
- The viewer verifies byte length, SHA-256, node/edge counts, type codes and coordinate bounds before display. Any mismatch or WebGL failure shows no fallback geometry. The only rendered primitives are source SWC line segments and the same-root annotation point.
- Native BANC coordinates remain unregistered. Recentring and nm-to-μm conversion are display-only; biological measurement, mouse joins, and mouse denominator contribution remain zero.
- The source-reported metric of 31 mitochondria remains count metadata only. Candidate-specific mitochondrial positions and geometry, synapse rows, and a source-version-linked cell mesh remain unresolved.

## Registry, interface, and upgrade queue

- Added one comparative source package and exact one-object route. The live registry now resolves 30 sources, 39 record sets, 13 exact cell/profile rosters and 4 exact source-object sets. The separate source-profile denominator remains 387; none of these changes alters the 1,097-record frozen mouse morphology census.
- Registry-derived UI denominators continue to cover all eight required displays; the stale-literal audit reports zero. Source taxonomy, count units, fly/mouse boundary and the distinction between a route-member count and an interneuron denominator are retained.
- UPG-248 is completed for this bounded source-local centerline + annotation-point view. UPG-221 remains partial for source-version-matched internal objects. UPG-249 is the next P0 research gate: verify a source-matched nucleus boundary, candidate-specific mitochondrial/synapse rows, exact coordinates and reuse terms; separately continue searching for an openly licensed mouse spinal interneuron EM volume.
- The release version is `2.74.0-research.1`. No full-project copy or duplicate project folder was created; the SWC is the only large source payload newly bundled.

## Verification and rollback

- Route validation checks the member hash, topology, exact root/nucleus identity, native bounds, CC BY 4.0 attribution and no-surface/no-organelle/no-mouse-join limits.
- Focused source-registry, upgrade-queue, SWC parser and panel tests are recorded with the 2.74 manifest. Production build and lint are run before sealing.
- The immutable rollback parent is `data/research-iteration-manifest-2.73.json`; the 2.74 manifest records its exact byte/hash receipt. To roll back this iteration, restore only the 2.73 parent snapshot and retain the timeline for audit; do not overwrite or rebuild older timelines/manifests.

## Primary public references

- [BANC v888 Harvard Dataverse release · CC BY 4.0](https://doi.org/10.7910/DVN/7WTH1N)
- [BANC primary paper](https://doi.org/10.1038/s41586-026-10735-w)
- [BANC source/data README](https://github.com/natverse/bancr)
- [BANC CAVE table documentation](https://natverse.org/bancr/reference/banc_cave_tables.html)
