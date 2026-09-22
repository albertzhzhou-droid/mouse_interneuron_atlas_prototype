# Public-source research watch — 2026-08-18

**Status:** planning evidence for future candidates; not bundled in the 0.4 curator package  
**Policy:** public digital sources only; no OHRI internal data, physical specimens, unpublished records, or automatic source download  
**Registration count affected:** `0`

## P1 — Cano-Gomez adult mouse spinal-cord resource

### Public evidence checked

| Public record | What it supports | What it does not support yet |
|---|---|---|
| [bioRxiv preprint](https://www.biorxiv.org/content/10.64898/2026.06.11.731752v1), DOI `10.64898/2026.06.11.731752` | The study is a preprint posted 2026-06-16, with a stated CC BY-NC 4.0 preprint license; it describes adult mouse spinal-cord cellular/spatial profiling. | Peer-reviewed stability, data-file rights, a project-space transform, or a registration claim. |
| [GEO GSE318731](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE318731) | The preprint's data-availability statement names raw and summary snMultiome data at this accession. | A selected processed object, a checksum manifest, cross-modality cell keys, or a source-to-project transform. |
| [Brain Image Library DOI `10.35077/g.1196`](https://doi.brainimagelibrary.org/doi/10.35077/g.1196) | The preprint names this resource for Xenium spatial-transcriptomic data. | Asset-level reuse or hosting authorization, specimen-level inventory, pixel scale/orientation, or a validated common reference space. |
| [analysis code](https://github.com/PoolLab/cano-gomez) and [spatial-registration code](https://github.com/isst001/spatial-image-registration) | The preprint publicly identifies separate analysis and spatial-registration code resources. | That a current repository commit reproduces a particular dataset release, or that a code path has an independent held-out registration error. |

### Current scientific decision

Treat every future acquired coordinate as `AUTHOR_SPACE_OBS` or `SOURCE_LOCAL_OBS` until a source file provides its units, axis orientation, origin, specimen ID, and transform provenance, and until a separate validation reports held-out physical-space error. A public code repository is neither a transform file nor an error estimate.

The study's preprint status must stay attached to every derived display or metadata record. Its stated preprint license cannot be reused as an asset-level bundle or public-hosting decision for GEO, BIL, processed matrices, images, or code-derived outputs.

## Queued upgrades

| Queue ID | Priority | Deliverable | Admission gate | Hard stop |
|---|---|---|---|---|
| `UPG-002A` | P1 | Public metadata intake for `PDS-CANOGOMEZ-2026`, with every fact linked to the preprint, GEO, BIL, or a declared code record. | Exact accession/version/date; preprint status; source-specific rights fields; zero downloaded files and zero registrations. | Any statement that an author-space coordinate is project `REG`. |
| `UPG-002B` | P1 | Specimen-and-file manifest for a deliberately selected public processed subset. | Stable object names, bytes, SHA-256, format, specimen IDs, sex/region/assay, units, pixels/voxels, axes, origin, and source URL. | A file without clear reuse terms, coordinate metadata, or a reproducible source record. |
| `UPG-002C` | P1 | Source-local spatial viewer adapter. | The renderer preserves specimen identity, native coordinates, missing metadata, and preprint status; it never co-locates with current SYN entities as a measurement. | An interaction that implies a same-cell multiomic join, a curated segment label, or registration. |
| `UPG-002D` | P1 | Registration-candidate report, if data quality permits. | Pinned transform artifact, training/held-out landmark split, target-space units, independent error distribution, anatomist/curator review, and asset-level rights approval. | Visual alignment alone, an unreported error, a shared label transfer, or a transform borrowed from another specimen. |

### `UPG-002B-1` implementation receipt — 2026-08-18

The current generic object-level manifest (`0.7`) permits `PDS-CANOGOMEZ-2026` as a source ID, but it does **not** make specimen identity, animal metadata, source frame, pixel/voxel scale, or cross-modality linkage mandatory. It therefore cannot by itself satisfy `UPG-002B` for the Cano-Gomez resource.

The next candidate must add a distinct, schema-validated **specimen-aware Cano-Gomez preflight** before accepting any manifest row. Every proposed object must retain `specimenId`, `animalId` or an explicit missing reason, sex, spinal region, assay, native coordinate unit, axis order/direction, coordinate origin, pixel or voxel scale, source frame, source checksum and rights decision. Each spatial object must point only to declared specimen records and must not be co-displayed as a project measurement. The preflight must still require zero downloaded files, `localSha256=null`, zero bundled assets, and zero registrations.

**Hard stop:** a generic object manifest, a paper-level data-availability statement, a BIL DOI without a matched object record, or a study-level image overlay is not a substitute for a specimen-aware manifest.

## Data model required before an adapter

Each source object must retain the following values or an explicit `missingReason`: `studyVersion`, `sourceAccession`, `specimenId`, `animalId`, `sex`, `spinalRegion`, `lifeStage`, `assay`, `coordinateUnit`, `axisOrder`, `axisDirection`, `coordinateOrigin`, `pixelOrVoxelScale`, `sourceFrame`, `transformArtifact`, `transformChecksum`, `trainingLandmarks`, `heldOutLandmarks`, `heldOutError`, `rightsDecision`, and `preprintStatus`.

No field may be inferred from a visualization-only scale, a portal screenshot, an author-space plot, or a matching cell-type label.

## Release rule

The next application candidate may include the **metadata intake** only after it is backed by a strict schema, semantic validator, and manifest lock equivalent to the SpinalJ 0.4 intake. It may include a candidate file only after `UPG-002B` passes. It may call nothing `REG` unless `UPG-002D` passes in a later independently reviewed release.

## P0 file-manifest retrieval boundary — SpinalJ processed example

On 2026-08-18, the public Mendeley Data landing page and documentation were rechecked. The documented unauthenticated request to `https://api.data.mendeley.com/datasets/mkc37w4rrv?version=1` returned HTTP `401`; a guessed `data.mendeley.com/public-api/.../versions/1` route returned HTTP `404`. Neither response is a file list and neither candidate file was downloaded.

This does not mean the public processed dataset is unavailable. It means an automated anonymous API request is not a defensible source of file inventory in this build. The acquisition queue therefore requires one of the following before any candidate file is considered: a public landing-page export/manual inventory with stable object identifiers and an access date; a documented OAuth-enabled metadata request that stores no credentials in the project; or a manually selected file whose page supplies its name, size, MIME type, source URL, and checksum. A ZIP-level “download all” action is not a substitute for an object-level manifest.

### Added queue gate

| Queue ID | Priority | Deliverable | Accept only if | Reject if |
|---|---|---|---|---|
| `UPG-001A` | P0 | Imported file-manifest preflight for one processed SpinalJ object. | Every candidate row gives public source URL, dataset/version, opaque file ID or stable name, bytes, format, SHA-256, rights decision, and native-coordinate metadata or explicit missing reasons. | The build discovers files through an undocumented endpoint, saves a credential, downloads bulk data automatically, or uses a missing checksum/coordinate field as an implicit pass. |

## P0 source-checksum correction — Mendeley file metadata

The [official Mendeley API reference](https://dev.mendeley.com/methods/) documents a file-level `filehash` as **SHA-1** alongside a file ID, MIME type and byte size. Its public-dataset guide also describes a published dataset as a permanent versioned record but shows OAuth access in its API examples. The public SpinalJ landing page identifies processed example data, version 1, CC BY 4.0, and says that it includes generated section-registration, atlas-mapping and analysis files; it does not itself expose a source SHA-256 in the checked record.

Therefore, source-provided SHA-1 is valid **source integrity metadata**, but it must never be relabeled as SHA-256. A locally computed SHA-256 belongs only to a later, explicitly user-initiated acquisition stage. The 0.7 preflight accepts neither a downloaded file nor a locally computed hash; it records a source checksum algorithm/value/provenance and requires `localSha256=null`.

### Added queue gate

| Queue ID | Priority | Deliverable | Accept only if | Reject if |
|---|---|---|---|---|
| `UPG-001B` | P0 | Source-checksum-aware object manifest for one deliberately selected SpinalJ object. | A source metadata checksum is recorded with `algorithm` (`sha1` or `sha256`), exact value, public object URL, bytes, format, rights decision, and coordinates or explicit missing reason; `localSha256` remains null at preflight. | SHA-1 is labeled SHA-256, the source checksum algorithm/provenance is absent, a local hash appears without an explicit acquisition stage, or importing triggers data download/registration. |

## P1 BIL metadata-manifest discovery check — Cano-Gomez resource

On 2026-08-18, BIL's documented public Metadata API was checked without requesting an image or data file. The documented `retrieve` lookup returned `success=false` for both `https://doi.brainimagelibrary.org/doi/10.35077/g.1196` and `https://doi.org/10.35077/g.1196`; the suffix query `g.1196` also returned no entry. The documented full-text endpoint accepted `Cano` and `Cano-Gomez`, but returned the same generic autocomplete-like set of `ace-pie-*` BIL IDs, not a uniquely attributable resource record.

The result is an explicit **not-yet-discoverable manifest identity**, not an absence claim about the Cano-Gomez data. Do not select any returned BIL ID, infer a download URL, or join BIL metadata to GEO/preprint records until a public BIL landing page or author-supplied BIL ID establishes the match. The next safe action is a curator-recorded source page with the exact BIL ID/DOI/manifest URL, followed by a read-only retrieve response saved with its access date; only then can `UPG-002B` evaluate object metadata.

## P1 spatial-method boundary — Cano-Gomez preprint

On 2026-08-18, the NIH-hosted preprint record and the bioRxiv record were rechecked. Both still identify the study as a preprint, not a peer-reviewed journal article. The preprint describes a study-specific spatial-registration workflow: cell centroids and transcripts were loaded from a Seurat object; 22 manually defined gray-matter-boundary anchors were matched between each spinal-cord dataset and an Allen reference segment (C5, T12, L5, or S1); and a thin-plate-spline surface was fitted to transform coordinates. The paper then describes aggregating cell-location data across 20 anatomical sections (10 male and 10 female).

This is valuable provenance for a future source-local adapter, but it is **not** a project registration artifact. The public methods record does not supply a selected public object manifest, an independent training/held-out landmark split, or a held-out physical-space error distribution. It also does not make the current BrainGlobe `allen_cord_20um` derivative the same target space. Therefore this project must preserve any future coordinates as author/source-local observations and must not call the paper's anchor fit a validated `REG` transform.

The article's Data Availability statement names GEO `GSE318731` for raw and summary snMultiome data and BIL `10.35077/g.1196` for Xenium data, but its formatted BIL DOI text omits the dot in the group suffix (`g4196`). The canonical BIL landing page continues to use `10.35077/g.1196`; no asset identity or rights decision is inferred from that typographic discrepancy.

### Added method-specific hard stops

| Queue ID | Accept only if | Reject if |
|---|---|---|
| `UPG-002C-1` | A source-local display retains specimen/section identity, source frame, anchor definition, reference segment, transformation method, and explicit absence of independent error. | A thin-plate-spline overlay is shown as held-out validated, transferred to a different specimen, or presented in BrainGlobe space without a declared transform. |
| `UPG-002D-1` | A future registration report provides a pinned transform artifact, disjoint training and held-out landmarks, declared target coordinates, and physical-space error before curator review. | Manual anchors used to fit a transform are reused as its validation set, or aggregate anatomical plots are treated as per-cell project registration. |

## Curator-adjudication gate before any scientific promotion

The local feedback inbox does not adjudicate a review. `UPG-007` requires at least two independently identified feedback records that match the same curator distribution, ZIP SHA-256, workbench release ID, release-manifest SHA-256, and `0 REG` count. The next implementation must preserve every `revise` and `unable_to_assess` response, record a human adjudicator's resolution or explicit deferral for each blocker, and reject mismatched or duplicate curator identities.

This gate applies before a future source object is bundled, interpreted as a supported adapter result, or proposed for `REG`; it cannot compensate for missing public object identity, rights, coordinate provenance, transforms, or held-out validation error.

## P1 — Russ 2021 harmonized molecular taxonomy

### Public evidence checked

| Public record | What it supports | What it does not support yet |
|---|---|---|
| [Russ et al. 2021](https://www.nature.com/articles/s41467-021-25125-1), DOI `10.1038/s41467-021-25125-1` | A peer-reviewed, CC BY 4.0 harmonized postnatal mouse spinal-cord transcriptomic reference with 69 neuronal populations, a hierarchy of regional/transmitter/family/population relationships, and selected adult-lumbar validation context. | An exhaustive adult interneuron census, a universal one-to-one label transfer, an individual-cell coordinate, or a project registration. |
| [GEO GSE158380](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE158380) | Public raw matrix, feature and cell identifier files for the authors' deposited study. The checked `GSE158380_cells.csv.gz` object is an identifier list, not a complete cell-type annotation table. | A bundled cell-level analysis, a spatial coordinate, a cross-study same-cell join, or an entitlement to re-host an unspecified processed object. |
| [Supplementary Table 1](https://static-content.springer.com/esm/art%3A10.1038%2Fs41467-021-25125-1/MediaObjects/41467_2021_25125_MOESM5_ESM.xlsx) | The published marker-ranking worksheet. Access checked 2026-08-18: 1,475,885 bytes, SHA-256 `a45578c893998fae42acf781c4700d162249497476b0b81149302f49929fd2e0`. | A unique rule that one marker defines a prototype entity, adult segment, morphology, projection edge, or position. |

### Current scientific decision

Candidate 1.5 retains a **derived, attributed type-level crosswalk**: all 69 source labels, their group membership, and the first three published Wilcoxon-ranked marker rows. It does not bundle the XLSX, count matrix, or individual-cell data. The displayed crosswalk treats every relationship to the seven prototype evidence records as `no_unique_mapping`, `broad_candidate_only`, `marker_context_only`, or `axis_only`; there are no exact mappings.

The paper reports different robustness across groups and cautions that many mid/ventral clusters are less distinct. It also separates a postnatal harmonized transcriptomic reference from selected adult-lumbar in-tissue validation. Those contexts remain distinct in the product. In particular, a marker appearing in the table—for example `Vsx2` or `Sim1`—is shown only as source marker context, never as a claim that the project entity is the same cell population.

### Added queue receipts

| Queue ID | Current state | Delivery and hard stop |
|---|---|---|
| `UPG-003` | In progress | A schema-validated 69-population crosswalk with pinned source URL, bytes, SHA-256, source attribution, group coverage and all seven non-exact prototype crosswalk records. Reject any claim that a marker rank creates a unique identity, adult segment assignment, individual coordinate or same-cell multimodal join. |
| `UPG-009` | Research watch | Reconcile the pinned marker table, main article, corrections and adult-lumbar validation context before a narrower label transfer. Reject silent substitution of a legacy label, marker rank or corrected nomenclature for a curator-reviewed one-to-one identity. |

### Next safe upgrade

`UPG-009` is intentionally not a data-acquisition gate. A future transfer may be proposed only after it names the exact source version, corrected label source, study age/region/assay, target vocabulary and rejection conditions. It must continue to distinguish molecular similarity from developmental lineage, projection class, spatial location, and experimental state. No outcome of this reconciliation can create `REG`.

### Correction-state reconciliation receipt — 2026-08-18

The [original Russ article](https://www.nature.com/articles/s41467-021-25125-1) now points to two author corrections. The [2022-02 correction](https://www.nature.com/articles/s41467-022-28698-7), DOI `10.1038/s41467-022-28698-7`, fixes missing supplementary links and incorrect cross-references to Supplementary Tables 2, 5, 7, and 8. The [2022-10 correction](https://www.nature.com/articles/s41467-022-33998-z), DOI `10.1038/s41467-022-33998-z`, corrects a Figure 3A label: duplicated `Excit-21` becomes `Excit-31`, and `Excit-32` is restored. Neither correction states that Supplementary Table 1 marker values or labels changed.

Candidate 1.5 therefore records a version-pinned, exportable provenance dossier rather than silently changing the derived taxonomy. It locks the reviewed Supplementary Table 1 receipt (1,475,885 bytes; SHA-256 `a45578c893998fae42acf781c4700d162249497476b0b81149302f49929fd2e0`), preserves the postnatal reference and adult-lumbar validation as separate conditions, and prohibits exact identity transfer, coordinate assignment, connection inference, or `REG`.

## P1 — STARmap PLUS adult lumbar spatial-reference lead

| Public record | What it supports | What it does not support yet |
|---|---|---|
| [STARmap PLUS study](https://www.nature.com/articles/s41586-023-06569-5), DOI `10.1038/s41586-023-06569-5` | An adult mouse CNS spatial-transcriptomic resource using a targeted 1,022-gene panel; the published study includes one coronal lumbar spinal-cord slice among 20 CNS slices from three mice. | A whole-spinal-cord atlas, complete transcriptome, morphology, connectivity, project registration, or a source-to-BrainGlobe transform. |
| [Single Cell Portal SCP1830](https://singlecell.broadinstitute.org/single_cell/study/SCP1830) | A public study landing page and a potential route to identify an exact spatial object. | A pinned file identity, specimen/slice metadata, coordinate units/origin, asset-level redistribution decision, or a verified local checksum in this release. |
| [Zenodo record](https://doi.org/10.5281/zenodo.8327576) | A public record named by the study for its data release. | Permission to bundle an unspecified object or a direct assertion that its coordinates share this project's atlas frame. |

### Queue gate: `UPG-010`

Before a source-local display is even proposed, one exact SCP or Zenodo object must have a versioned manifest recording its URL, specimen and lumbar-slice identity, cell-coordinate units, axes, origin, targeted gene-panel scope, checksum, and asset-level rights. Missing fields are rejection criteria, not values to infer from a portal view. Any admitted coordinate remains `SOURCE_LOCAL_OBS`; one lumbar source slice cannot be expanded to a whole-spine census or labelled `REG`.

## Tabulae local 2D session — implemented boundary and next watch gate

The GEO supplementary archive listing for `GSE234774` publicly enumerates 24 matched low-resolution image, spot-position and scale-factor gzip triplets. Candidate 1.7 uses that enumeration only to constrain a researcher-selected local browser session. It does not download the archive, package any source member, resolve an asset-level reuse decision, or promote a local hash to a publisher checksum. The permitted result is a source-local 2D image/spot overlay and a minimal local receipt; a Visium spot remains an aggregate source position, not an individual interneuron.

`UPG-012` is the next research-watch gate. It requires a stable object/specimen manifest, section order and physical source frame, scale/orientation, an explicitly versioned transform, independent held-out landmark error, and curator/rights review before proposing any cross-section source-frame or 3D capability. Passing it would still not register existing synthetic entities or NeuroMorpho examples.

## Tabulae source-local comparison boundary — 2026-08-18

The [10x Space Ranger spatial-output specification](https://www.10xgenomics.com/support/software/space-ranger/3.1/analysis/outputs/spatial-outputs) describes how `tissue_positions[_list].csv` and `scalefactors_json.json` map spots to the matching tissue image within a spatial run. It does not supply an inter-section physical coordinate frame, landmark transform, orientation, order, or registration error for `GSE234774` in this project.

Candidate 1.8 consequently permits up to four local sessions only as independent side-by-side source-local 2D cards. `UPG-013` rejects using those cards for overlay, normalization, section order, stacking, numerical comparison, 3D coordinates, treatment effects, or `REG`. A future comparison proposal must provide a compatible-condition plan, stable specimen/object identities, checksum and rights decisions, source-supported geometry, frozen transform provenance, a disjoint held-out validation plan, and curator review.

## Metadata provenance interoperability watch

The [RO-Crate 1.1 structure specification](https://www.researchobject.org/ro-crate/specification/1.1/structure) defines a JSON-LD metadata file and supports web-based external data entities. This makes it a candidate for portable provenance metadata, not a justification to download or bundle public research objects. The workbench records this as `UPG-014`: a future implementation must preserve public-source IDs, URL/date/checksum provenance, rights decision and acquired-versus-unacquired state; validate its selected profile independently; and receive curator review. It cannot make an author-space coordinate project space or create `REG`.
