# Research timeline — iteration 2.69

Date: 2026-09-23  
Version: `2.69.0-research.1`  
Status: local, unpackaged research iteration  
Rollback parent: [immutable iteration 2.68 manifest](../data/research-iteration-manifest-2.68.json)

## Changes

- Completed UPG-243 as a bounded public-repository query and candidate screen. The live EMPIAR catalogue filter returned 0 matches for `mouse spinal cord` among 3,119 displayed entries including one test dataset. The EMDB search returned no entries for the same terms.
- BioImage Archive full-text searches returned 2,692 and 889 hits; the first 20 visible entries per query were screened. These totals are fuzzy search results, not counts of exact spinal specimens or eligible EM volumes.
- Reviewed two near matches and recorded why neither supports mouse spinal interneuron geometry: S-BSST609 is a mouse/rat spinal sensory-circuit microscopy study listing TIFF/CZI/LSM/LIFF assets, without a serial EM volume or interneuron object crosswalk; S-BIAD2822 is a volume-EM annotation study spanning breast/lung/mammary samples, whose reviewed 3D object is a breast-cancer-cell nucleus.
- Added a source-linked UPG-243 disclosure card to the internal-reference view, with query counts, inspected records, study-level license observations and explicit search limits. The copy distinguishes a bounded no-hit result from a universal absence claim.
- No data payload was downloaded; 0 volumes, segmentations, stable interneuron object routes, joins, registrations and measurements were admitted. No same-cell detail is attached to the selected mouse record.
- Promoted UPG-245 as the next P0: reconcile NeuroMorpho 8.6.126 official release metadata against the bundled 8.6.124 exact no-age mouse spinal query. Release totals and Todd archive listing counts are leads, not eligible cell counts; API/file/identity gates remain open.
- Sealed 2.68 as an immutable parent and kept this iteration incremental; no complete-project copy was made.

## Verification

- `npm run validate:mouse-spinal-em-search-audit`
- `npm run validate:research-upgrades`
- `npm run validate:research-manifest-2.68`
- `npm run validate:research-manifest`
- `node tools/run_current_research_tests.mjs`
- `npm run build` and `npm run lint`
- Browser QA in a temporary local preview: inspect the new UPG-243 panel, its candidate exclusions and external links; preserve the user's existing localhost tab.

## Source basis and limits

- [EMPIAR catalogue](https://www.ebi.ac.uk/empiar/) and [EMPIAR FAQ, modalities and CC0 policy](https://www.ebi.ac.uk/empiar/faq)
- [EMDB bounded query](https://www.ebi.ac.uk/emdb/emsearch/?q=mouse%20spinal%20cord)
- [BioImage Archive S-BSST609](https://www.ebi.ac.uk/biostudies/BioImages/studies/S-BSST609)
- [BioImage Archive S-BIAD2822](https://www.ebi.ac.uk/biostudies/BioImages/studies/S-BIAD2822)
- [NeuroMorpho API reference](https://neuromorpho.org/apiReference.html) and [official archive](https://neuromorpho.org/)

The repository searches record their current UI query state and inspected scope; they do not prove a universal absence of qualifying data. EMPIAR's CC0 policy applies to deposited data, but no matching entry was returned. Study-level licenses observed for excluded BioImage Archive records do not establish asset identity or permission for any different data. Official NeuroMorpho 8.6.126 metadata were not reconciled to stable reconstruction IDs in this iteration; UPG-245 must verify exact API results, source files and terms before updating the 1,097-object registry or allowing new geometry.

## Rollback

Restore application, queue and audit behavior from `data/research-iteration-manifest-2.68.json`. That immutable parent preserves the prior UPG-243 planned state and BIL Xenium link-only reference. Do not rebuild the 2.68 snapshot from the mutable 2.69 queue or application.
