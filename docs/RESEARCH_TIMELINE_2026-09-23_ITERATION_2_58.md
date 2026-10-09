# Research timeline — iteration 2.58 (2026-09-23)

## Objective and rollback

Continue the public-data, evidence-bounded atlas in the existing project tree. The immutable rollback parent is `data/research-iteration-manifest-2.57.json` (366,609 bytes; SHA-256 `1389886d52b748bf4b4abe970151a120b47a6175f999705ded98708855df2a4d`; content SHA-256 `3d783781ea4d60bc6379d7159afd1f7036dd1d122db438acc473c9b4be9a729f`). Iteration 2.57 remains frozen at 213 research/model upgrades; the live queue advances to 214 with UPG-232.

## Research increment

- Audited one exact adult *Drosophila melanogaster* BANC v888 VNC-intrinsic candidate (`720575941350424112`, `IN14A018`). Its root ID is stable across v626/v850/v888/v890, but it remains comparative fly evidence and is not joined to a mouse interneuron.
- The pinned v3 per-neuron metadata row reports a candidate-specific mitochondria count metric of 31. That value is a count only: candidate per-mitochondrion rows were not retrieved, no mitochondrial positions were verified, and zero points or surfaces are admitted.
- The BANC data map lists a public 1,107,598,431-byte per-mitochondrion table (file 13917846; MD5 `2e3be9c0d063969ae019121117007e9a`) keyed to v888 root IDs. A separate detected-mitochondria segmentation product remains marked `MISSING`; the two products are not conflated.
- The documented `bancr::banc_mitochondria(rootids=...)` route supports filtering by `pt_root_id`, but the documented implementation initializes a configured CAVE client. No user credentials were inspected and no query was run. The whole compressed archive was not downloaded as a substitute for a root-filtered request.
- UPG-232 records the next authorization/data gate: obtain only an authorized root-filtered subset or exact public export, then verify row IDs, schema, units, root/materialization membership, reuse terms and coordinate agreement with a versioned BANC cell boundary. Centroid-only evidence would support labeled points, not organelle surfaces.
- The selected mouse record still receives no BANC-derived geometry, homolog claim, identity join or registration. The 31-count metric appears only in the separate comparative reference card.

## Verification

- `npm run test:research` passed the production build, ESLint, project validators and 842 current research tests (827 passed, 15 optional/source-access tests skipped, 0 failed). The strict BANC route-audit schema and the 2.58 mutation-boundary tests are included.
- The production build still reports a minified client chunk above 500 kB; this remains tracked by UPG-230 and was not addressed by removing features.
- 2.57 is sealed with a byte/content-locked snapshot validator and remains the rollback parent; it is not rebuilt against live 2.58 inputs.
- The existing project tree is updated in place. No whole-project copy is created, and this iteration does not commit or push.
