# Research iteration 2.21 — canonical sources and exact MICrONS cell+nucleus reference

Application label: `2.21.0-research.1`  
Date: 2026-08-30  
Distribution status: unpackaged localhost research iteration; the frozen `2.8.0-curator.1` archive is unchanged.

## Outcome

This iteration fills two information gaps without filling unsupported biology:

1. A canonical research-source registry now distinguishes a source package from its record sets and from any exact child roster. The Sources surface exposes source-local species, life stage, region, condition, modality, experimental unit, denominator, assets, rights/admission state, missingness and linked research milestones.
2. A separate observed-EM scene now renders one exact MICrONS Phase 1 v185.4 visual-cortex cell segmentation surface and its source-linked nucleus. It does not become the selected spinal NeuroMorpho cell, a molecular type, an Allen-atlas placement or an SCI evidence entity.

## Exact observed object

- Source: [MICrONS Phase 1](https://www.microns-explorer.org/phase1)
- Primary publication: [Turner et al., Cell 2022](https://doi.org/10.1016/j.cell.2022.01.023)
- Identity-table deposit: [Zenodo 7510511](https://doi.org/10.5281/zenodo.7510511)
- Segmentation release: `v185.4`; identity-table deposit version: `185.3`
- Specimen context: P36 male mouse, visual cortex layer 2/3
- Cell root: `648518346349516051`
- Source-linked nucleus: `4309`
- Coarse human classification: inhibitory / chandelier; this is not a transcriptomic or molecular subtype
- Same-object relation: true only for the admitted cell-root and nucleus pair in the source-native coordinate frame
- Relationships to spinal morphology, spinal type evidence and Allen spinal anatomy: `co_display_only`, false same-object identity, zero joins, zero project registrations

### Geometry receipts

| Component | Raw fragments | Vertices | Triangles | Position SHA-256 | Triangle SHA-256 |
|---|---:|---:|---:|---|---|
| Cell segmentation surface | 94 | 372,382 | 704,444 | `0eeb79d91607afff797be1a81a8c1378a66689373ef7df499a4c0a2aba243fda` | `b72fee4500fdf85b389897a623cde3f30289fff6c52e04b4e135ede2ebad9c62` |
| Linked nucleus segmentation | 3 | 12,682 | 23,344 | `9fbe8c12ce08586ca45f91dfee1043d3a904a873adf93ee0e57b4eee627a9efb` | `e6561a5e266d34da2d7d9b7d21ad4819b74e97cebf81b8ed76e7f805f8baefb5` |

The 94,901-byte asset manifest has SHA-256 `063e66321ecfcb8633dd39be0e08d467318ea276eeae0e6fef8344b313c5f2f1`. A clean-room rebuild reproduced the manifest and all four browser arrays byte-for-byte. Browser geometry remains native-nanometre Float32 positions and Uint32 triangle indices. The viewer applies the declared soma-centred uniform transform as an object display transform; it does not rewrite the position buffers.

The active `research-iteration-manifest-2.21` snapshot pins ten current inputs, including the 9,639-byte MICrONS admission contract (SHA-256 `9b5141072192b9d272c0babe097de380d2aebd98659c2c57745ee75d226b744c`) and the 94,901-byte asset manifest. Its canonical content SHA-256 is `9a3b2b99f8eeccb9c6ea4dc1436abb69eeec3aec1e8850d8bbb951cbb5cb7134`. The historical 0.2 and frozen 2.8 manifests remain unchanged.

No vertex welding, smoothing, repair, decimation, hole filling, generated normals or coordinate transformation is applied. The outer object is labelled **Cell segmentation surface**, not membrane.

## Structures still empty

The exact MICrONS scene does not render or infer:

- mitochondria;
- synapses or partners;
- endoplasmic reticulum or Golgi;
- receptors or molecular membrane composition;
- other organelles;
- spinal identity, NeuroMorpho identity, molecular subtype or atlas placement.

The admitted public receipts do not contain a source segmentation timestamp; that field remains explicitly unavailable. Same-cell organelle/synapse work remains the blocked second phase of UPG-111.

## Information-model changes

- `research-source-registry-0.1` reconciles 22 canonical source packages and 22 record sets. It retains 153 non-deduplicated type records, two exact bundled child-roster/object chains, zero open scope contradictions and zero registrations.
- Every displayed molecular type and Research Explorer molecular record carries `parentSourceId`, `recordKind`, `unitOfObservation`, `assignmentAuthority`, `cellRosterAvailability` and `canonicalIdentityStatus`.
- The coverage model now includes Hayashi P0 as the sixth source lane and constrains Häring to P17–P28 without a broader adult/juvenile/young-adult assertion. The matrix contains 42 source-by-axis judgments.
- The Research Explorer contains 398 records and six source lanes.
- `research-model-upgrade-registry-0.1` deterministically resolves all UPG-022–116 queue rows. Research pages expose status, lane, blocker, evidence basis, last verification and acceptance boundary; the separate 21-item governance/admission queue remains excluded.
- Every source-registry `linkedUpgradeId` now resolves in the machine research-upgrade registry. The historical SpinalJ governance identifier remains preserved separately as `linkedGovernanceIds`, so the UI and exported source dossier cannot silently disagree.

## Runtime and state audit

- Before rendering, the browser verifies the exact asset manifest and all four cell/nucleus position/index streams by byte count and SHA-256. The runtime receipt keeps expected and actually verified hashes separate and records object IDs, vertex/triangle counts and component visibility.
- Verification failure shows zero substitute geometry and exports the exact bounded failure reason. Leaving the MICrONS view during verification clears the pending state instead of retaining a stale `loading` receipt.
- JSON export embeds the immutable MICrONS contract, requested components and a non-authoritative runtime receipt. Importing the MICrONS camera requires an exact canonical contract match and consistent component toggles. Imported runtime claims are ignored; the local files must be verified again.
- `state.url`, the morphology runtime receipt and the MICrONS runtime receipt are explicitly marked as regenerated/non-authoritative round-trip fields.

## New public-data opportunities

UPG-114–116 are documented in `OPEN_DATA_RESEARCH_WATCH_2026-08-30.md`:

- Ronzano et al. eLife 81976 can add source-local early-postnatal lumbar premotor labelled-cell XYZ points, but not neurites, molecular types, atlas registration or adult anatomy.
- Ronzano et al. eLife 70858 can add source-local divergent-premotor and long-descending-propriospinal 2D points and soma areas, but not a z coordinate, axon path or connectome.
- Lister et al. eLife 100451 / GEO GSE265957 can add a peripheral-neuropathic-pain RNA-versus-translation state lane. SNI/CFA must never be relabelled as SCI, and pooled GAD2/TAC1 measurements are not single-cell spatial or morphological records.

Only UPG-114 offers reusable three-coordinate spinal labelled-cell positions. None closes the same-cell morphology+molecular+synapse+organelle gap.

## Validation gates

- Exact MICrONS contract, 97 source fragments, four browser arrays, relationship policy and mutation failures
- Ten-input iteration-manifest hash verification, including the exact MICrONS contract and asset-manifest pins
- Negative import fixtures for missing provenance, changed nucleus/manifest/transforms/relationship boundaries and mismatched component toggles
- Canonical source registry and source-universe reconciliation
- Deterministic research-upgrade registry and queue-drift detection
- Type-record granularity and Research Explorer index checks
- Six-lane knowledge-coverage checks
- Production build, lint and full research regression suite
- Frozen `2.8.0-curator.1` package integrity

The browser scene fails closed: a manifest, byte-count or SHA-256 mismatch produces no exact-object fallback geometry.
