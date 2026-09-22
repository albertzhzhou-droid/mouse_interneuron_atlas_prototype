# Iteration 2.42 — source morphology inspection and research-page navigation

Date: 2026-09-22 UTC (2026-09-21 America/Toronto at start).
Version: `2.42.0-research.1`. Status: declared 2.42 feature and recovery increment verified; overall App goal remains active.

Previous goal-turn classification: no implementation progress; it located the two project branches but did not advance this App objective. This turn resumes the actual working tree and makes code/data changes.

## Starting evidence

The resumed 2.41 working tree did not build. It imported a nonexistent `data/research-iteration-manifest-2.41.json` and a nonexistent Cano-Gomez production registry. Its prior temporary raw/extracted RDS objects were absent. The 2.41 timeline explicitly said its manifest had not been produced. Therefore 2.42 uses the last sealed immutable 2.40 parent; it does not invent or backdate a 2.41 release. The large pre-existing dirty worktree is preserved.

## User-visible changes

- UPG-205: exact-SWC node selection, deposited parent-path and downstream-arbor inspection, local camera focus, and source-authorized neurite diameter display. Original geometry, 2D restrictions, object identity and missing diameter authority are retained. These traces do not add intracellular segmentation.
- UPG-206: three direct information-page routes for cell shape, molecular profiles and SCI conditions. Concise collection counts remain visible; full definitions, available-data descriptions and interpretation limits expand on demand.
- Public-source research continues in `RESEARCH_WATCH_2026-09-22_MODEL_EXPANSION.md`; its concrete follow-ups are added to the existing upgrade queue and generated registry.

## Source recovery

Cano-Gomez GSE318731 recovery uses three exact public NCBI objects totaling 3,606,270,688 compressed bytes. Raw downloads stay in a recovery-owned temporary directory; persistent outputs are metadata derivatives. Recovery used actual source bytes, verified extraction, the all-nucleus audit and exact CHOL_IN profile/roster validation; the old narrative counts alone were not used to synthesize records.

Recovery verified the actual 169,345 rows and 57 source-scoped groups. Only 11 exact CHOL_IN profiles / 923 nuclei are admitted. The GLUT UPDATE object has no `meta.data$neuron_types` column; the extractor now permits this one SHA-pinned absence and preserves 92,782 missing assignments. A small reproducible observation receipt verifies its separate `active.ident` slot has 277 factor levels / 277 observed labels and 92,782 unique nonempty names exactly matching metadata row names in order. A production label adapter remains a UPG-211 task; this observation creates no new admission. The observed metadata label union is 242, and the paper total 516 remains a separate reported denominator. A JSON-key-order comparison bug was corrected using structural deep equality.

Persistent source metadata/audits/acquisition receipts occupy about 4.36 MB including the three production derivatives. Two additional native DAT candidates plus one new API receipt add 263,851 source bytes and remain unadmitted; the other API receipt is reused.

## Validation

- `npm test` passed: production build, lint, scientific/data validators and 747 discovered regression tests — 732 passed, zero failed, 15 environment-conditional skips. The portable-R source-recovery run independently passed 34/34 Node checks with no skips; downloader tests passed 4/4. The final metadata/input-lock refresh is checked again after this whole-app run.
- Browser verification passed for exact node selection, branch highlighting, camera focus, context dim/restore, invalid node rejection, selection clearing between source records, 2D geometry restrictions, scope disclosure, and the exact `CHOL_IN_Best3_Htr1b` / 146-source-assigned-nucleus route. Molecular focus clears previous cell geometry. Final branch and Cano checks reported zero page errors.
- Desktop and 390-pixel narrow layouts were visually inspected. New route cards occupy one 338-pixel column within the narrow viewport. Screenshots and a compact verification record are saved under `output/`.
- `npx tsc --noEmit` remains failing with 26 diagnostics in existing application/worker typing. Production build and lint do not establish a clean strict typecheck. These remaining diagnostics are retained in `output/iteration-2-42-typecheck.log`.
- A Vite browser-only rejection of public-directory JSON imports was fixed with an exact byte-checked 57 KB Cano import mirror. The builder limits mirror synchronization to the canonical production target; fixture builds cannot replace it.
- The historical 2.34 snapshot validator treats three deliberately edited live viewers as superseded; the immutable manifest and source-data checks remain intact, and 2.42 hashes all three current viewers.
- The PrP source-pack validator admits exactly two already-authorized later native-contour derivatives only after the current contour catalog verifies their paths, bytes, hashes and semantics. Unknown extra files, altered derivatives and redirected paths remain rejected; the frozen original PrP manifest is unchanged.
- Four stale rendered-HTML expectations were updated to the current version/navigation and existing Crozat aggregate-anatomy wording. All 39 SSR checks passed while retaining denominator and no-cell-coordinate assertions.

Evidence: `output/iteration-2-42-validation.log`, `output/iteration-2-42-verification.json`, `output/iteration-2-42-typecheck.log`, and `output/playwright/iteration-2-42-*.png`.

## Research queue

The canonical queue now contains 193 entries through UPG-211, with 50 declared increments completed. UPG-205 and UPG-206 complete this iteration. Five future entries retain concrete source gates: SP/Tac1 and GRPR native DAT detail; Xenopus neural identities; zebrafish V0v group evidence; and the separate GLUT `active.ident` slot. The two new DAT candidates remain unadmitted. They do not enlarge the existing five-record, 48-loop, 2,379-vertex native catalog.

## File-specific rollback

`docs/rollback/iteration-2.42-source-reverse.patch` reverses only modified pre-existing text files to the bytes captured at this turn's start. Its companion JSON records the before/after SHA-256 for every patched file. Run `git apply --check docs/rollback/iteration-2.42-source-reverse.patch` from this project directory before applying it with `git apply` if rollback is wanted. Do not force a patch after later edits; use the per-file hashes to resolve those changes.

This is a source-change rollback, not a complete data snapshot. The starting unsealed 2.41 tree failed to build; reversing this patch restores that starting state rather than a known-good release. New feature modules, recovered Cano production/source metadata, candidate inputs, new manifest and QA evidence remain in place. The two regenerated Research Explorer index files had no captured preimage and are intentionally retained. New unused feature files may be removed individually after their imports have been reversed. No blanket reset, staging or project deletion is required.

Only touched-file preimages were kept in `/private/tmp/ohri-iteration-preimages` during work. The persistent rollback artifact contains a small text delta, not a full-project copy. The 2.40 and older manifests and frozen curator 2.8 package remain unchanged. The exact GLUT raw RDS is temporarily retained for UPG-211; CHOL and GABA recovery-owned raw objects were removed after verified derivative extraction. No unrelated source material was deleted.

## Remaining objective

The complete requested App is not achieved. Spinal same-cell intracellular segmentations, broader confirmed type coverage, and several existing research-queue items remain incomplete. Cross-species and cross-region references cannot fill those gaps by relabelling them as mouse spinal interneurons.
