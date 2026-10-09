# I56 aggregate physiology parent integration

This addon links the separately sealed UPG-173 source-information adapter to the current canonical source registry and research validation entry. It adds one study aggregate information record set. Its four source tables describe alternative partitions of the same 171 recorded observations; they are not four cohorts, 16 canonical cell types, individual physical cells, or molecular profiles.

## Ownership and order

Apply the sealed seventeen-file core candidate first. Integrate the current sealed I55 drilldown before applying `UPG173_PARENT_ADDON_AFTER_I55.patch` (eleven targets). All eight current-root preimages and the sealed current-I54 I55 test preimage are retained in `baseline/`; exact pins are in `UPG173_PARENT_ADDON_OWNERSHIP.json`.

For a current root without I55, the ten-target `UPG173_PARENT_ADDON_CURRENT_ROOT.patch` and the one-target `UPG173_PARENT_ADDON_I55_TEST_COUNTS.patch` are equivalent, split for ordering. The first patch passed read-only `git apply --check` in the current root; the full patch passed `--check --cached` against its exact retained baseline. The I55 test-only patch passed `--check` against the latest sealed I55 proposal at `/private/tmp/ohri-i55-rebased-current-i54-20261004/proposed`.

If the root changes before intake, rebase the narrow logical edits instead of copying whole files:

- Append only `SRC-GARCIA-RAMIREZ-2022`, its four exact assets and one aggregate-information record set; update declared `sourceCount` to the actual source length. Preserve all other 31 source objects byte-faithfully in their current form.
- Change only the UPG-173 Markdown row. Regenerate `data/research-model-upgrade-registry-0.1.json` from the final current queue using the unchanged existing generator; preserve any intervening I54/I55 queue changes. The included derived JSON is exactly reproducible from this proposal queue, and the other 242 rows compare equal to the retained baseline.
- Add the package validator script and its single top-level `test:research` invocation after `validate:source-registry-denominators`. Preserve all other scripts, dependencies, package version and lock file.
- Add the source ID, 42-record-set guard and relationship-gate invocation to the current global source validator. Preserve all unrelated source checks, particularly 387 source profiles, 13 exact cell/profile rosters and 4 exact source-object sets.
- Add the targeted in-progress UPG-173 scientific-scope gate to the current upgrade validator. Do not promote status to completed. Completed upgrades remain 83 of 243 in this proposal.
- Migrate only actual canonical source/set count assertions in the current source-registry tests. In the I55 drilldown test, change only 31 to 32 sources and 41 to 42 declared sets. Retain 15 available sets, 274 selectable entries, 13 exact rosters and 4 exact object sets. The new aggregate record set has no exact child navigation plan.

No app/UI file is owned by this addon. The core candidate continues to mount inside the current `/explore/cell-types/additional` collection wrapper with its existing navigation and styles. `sourceInformationRef.href` names the aggregate information panel; it does not create an exact child roster or source-object reference.

## Parent-owned canonical and runtime recipe

Do not use this addon to overwrite the manifest builder, current canonical manifest, runtime input manifest or frozen receipts. The parent must update only the current `tools/build_research_iteration_manifest_2_91.mjs` source/set guard from 31/41 to 32/42; retain 13/4/387/243 and all unrelated assertions. Admit all seventeen core source/UI/extractor/schema/test targets and the two new addon validator/test targets to the current canonical recipe as appropriate, preserving the I54/I55 input sets. All other addon files are already current authoritative inputs and need refreshed digests.

The actual Positions renderer build includes `package.json`; this package-script change therefore invalidates an older build-bound Ronzano receipt. Regenerate the current canonical and runtime manifests together, run their validators, and capture/restore against the resulting actual build. The 23 original Ronzano source verification inputs remain unchanged. A prior source or browser receipt is retained historical evidence, not evidence for the new build fingerprint.

Historical manifests, historical source counters, frozen runtime files, the source-index schema and legacy version guards remain untouched. The reused 2.41 helper's current source-denominator display fields derive from the current registry; its frozen historical reconstruction checks are not current 32/42 guards.

## Verified denominator impact

The source registry changes from 31 to 32 source packages, 41 to 42 declared record sets and 76 to 79 aliases. It still contains 13 exact cell/profile rosters, 4 exact source-object sets, 387 source profiles and zero registrations. The new record set's included-record count is **one study aggregate information adapter**, keyed by the nonbiological `adapterId`.

The source experimental-unit metadata distinguishes 171 recorded observations (143 Shox2 and 28 Chx10), 51 Shox2 reporter mice, 6 Chx10 reporter mice, and the prior-study reuse subsets of 60 Shox2 observations from 28 of those 51 Shox2 mice. No quantity is pooled into 684 observations, 171 animals or 79 Shox2 mice. Unknown independent-animal count, sex, individual ages and cell-to-animal mapping remain unknown.

A fresh explicit-temp source-index build retained the exact current bytes: schema 1.14.0, 22 indexed source files, 641 base records, 387 molecular profiles. Its search index is 12,327,624 bytes with SHA-256 `c1fb786da4a1624b28fbe4c9c7063eb0f108b6a12e91d082008f1c7102e17085`. The current verified supplemental loader still supplies 32 separate existing morphology records, yielding 673 runtime records. No aggregate physiology record is emitted into the Explorer record index. The denominator-display validator confirms all eight declared displays and zero stale literals.

The 192 literal mean/SD cells, 48 source comparisons, four table partitions, missing fAHP/F-I source units, printed `Cm = Rin/τ` statement and unresolved six stained-positive versus four listed k-group discrepancy remain bounded by the separately sealed source facts. No morphology, internal structures, same-cell identity, lineage, atlas placement, REG, M2 or M4 admission is added.

## Validation and remaining acceptance

Exact argv, executable pin, result codes and output-log pins are in `qa/parent-validation-command-receipt.json`. Meaningful checks include source/rights/asset digest matching, source-owned denominators, prior-study subset parentage, negative pooling/type/roster/geometry promotions, current global validators, generated queue synchronization, unchanged source/upgrade objects, merged full TypeScript and scoped ESLint. The 66 targeted and 22 neighboring tests passed. The validation shadow contains copied baseline files solely for correct source-relative imports; they are excluded from addon ownership and must never be copied wholesale.

This is ready for parent integration and current-manifest regeneration. Actual desktop and narrow dedicated-route acceptance, keyboard/table switching, source boundaries and downloaded JSON must be verified against the integrated build using the separately sealed core browser acceptance plan. No actual browser claim or full UPG-173/roadmap completion is made by this addon.
