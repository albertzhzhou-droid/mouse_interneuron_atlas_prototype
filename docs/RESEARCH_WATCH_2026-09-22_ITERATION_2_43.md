# Research watch: observed spinal microdetail, iteration 2.43

Checked 2026-09-22 UTC. UPG-212 is reserved for this iteration's information-page work; the three proposed research rows below begin at UPG-213. This note adds source evidence only. It changes no application record counts, public assets, centralized manifest, source registry or upgrade queue.

The useful new result is two small, preserved source packages: an explicitly linked **same recorded interneuron / electron-microscopy figure**, and **18,358 measured two-dimensional PALM detections** from a named mouse dorsal-horn acquisition. Neither supplies an identified spinal interneuron's three-dimensional nucleus or organelle segmentation. This search did not verify a new qualifying object of that stronger kind.

## 1. Davis inhibitory-calretinin cell: morphology and EM explicitly linked

[Davis et al., Scientific Reports 13, 11561 (2023)](https://www.nature.com/articles/s41598-023-38605-9), DOI `10.1038/s41598-023-38605-9`, is absent from the current source/upgrade registries. [Figure 1](https://www.nature.com/articles/s41598-023-38605-9/figures/1) directly identifies panels **e–g as EM views of the recorded cell drawn in panel d**. This is stronger than a shared marker or a same-paper assumption. Panels a–c are other cells and must remain separate.

The experiment used five tonic-firing CR::GFP cells from three mice (two female, one male). Figure 1 contains four morphology drawings; its e/f panels show that cell's axonal boutons forming axoaxonic synapses on type-I glomerular central terminals, and g shows its postsynaptic dendrite. The authors report compromised EM preservation. The study-wide age range is 4–29 weeks; an exact age, animal identifier and sex for panel d are not established by these methods/caption. Do not assign that cell to a particular transcriptomic iCR class.

**Retained object:** the publisher's complete Figure 1 PNG, with original labels and scale bars (100 µm for a–d; 0.5 µm for e–g), visually checked at 1,594 × 1,172 pixels. It is a published composite, not raw TEM frames or machine-readable neurite geometry. The drawing was made with a drawing tube; its visible lines do not supply source z coordinates.

- Canonical file: [`41598_2023_38605_Fig1_HTML.png`](../data/source-candidates/davis-icr-same-cell-20260922/41598_2023_38605_Fig1_HTML.png).
- Exact [publisher image URL](https://media.springernature.com/full/springer-static/image/art%3A10.1038%2Fs41598-023-38605-9/MediaObjects/41598_2023_38605_Fig1_HTML.png), HTTP 200 on 2026-09-22; 1,195,290 bytes; SHA-256 `3beafa543799863db6752e97e31b718e9d6e93645866d4065178c8ce3413cb74`.
- [Local receipt and caption](../data/source-candidates/davis-icr-same-cell-20260922/receipt.json) preserve the source-supported panel relationship, exact byte receipt, caption transcription normalization and limitations.
- [Article rights](https://www.nature.com/articles/s41598-023-38605-9#rightslink): CC BY 4.0; no separate Figure 1 credit exception was found. No image bytes were modified.

**Practical next step:** implement an independently accessed two-dimensional figure viewer with whole-figure context, panel d/e/f/g navigation and the authors' linkage visible. Preserve a–c as different recorded cells. A selected cell elsewhere in the application may link to this study as related evidence, but cannot inherit its observed synapses. No independent segmentation, raw serial stack, nucleus, organelle mesh, NeuroMorpho match or 3D registration has been obtained. The article makes underlying datasets available on reasonable request; it does not provide a public raw-image repository.

The same study's Figures 9–10 further show genetically targeted iCR profiles and serial-section synaptic triads, including vesicle-containing dendrites. Those are a useful future extension within this source, not additional cells of Figure 1d. They have not been downloaded or segmented here.

## 2. A bounded Super-CLEM PALM acquisition with actual XY detections

[Maynard et al., eLife 10:e74441](https://elifesciences.org/articles/74441), [Figshare 17816747 v1](https://doi.org/10.6084/m9.figshare.17816747.v1), is already represented by UPG-093/099/112. The new delta is an exact **point-data object**, distinct from the already planned eleven-section EM reconstruction. The [versioned API](https://api.figshare.com/v2/articles/17816747/versions/1) returned 787 files and CC BY 4.0. A direct mirror request timed out; acquisition succeeded through Figshare.

The source README maps `181130_EosRmov009` to dorsal tissue of animal **AQ848**, female, source age label `>2 months WT`, genotype `EosGlyRb KI/KI mRFP-GPHN KI/KI`. The source DAT/NeuroMorpho cells are unrelated. The previously admitted D2-GB-E9 EM slice comes from the **BP057 / 190313** series; this AQ848 object cannot be overlaid on it.

All four exact source objects below are retained in [`data/source-candidates/superclem-palm-localization-20260922/`](../data/source-candidates/superclem-palm-localization-20260922/). The [receipt](../data/source-candidates/superclem-palm-localization-20260922/receipt.json) includes full SHA-256 values, source names, Figshare MD5 matches, source scope and observed matrix statistics.

| Exact object | File ID / source | Bytes | Meaning |
| --- | --- | ---: | --- |
| `181130_EosRmov009_MTT_without_tracking_results.mat` | [32526932](https://ndownloader.figshare.com/files/32526932) | 606,421 | One `matrice_results` numeric-double matrix, 5 × 18,358: frame, X, Y, alpha, sigma |
| `181130-EosRmov009-roi1-counts.txt` | [32600930](https://ndownloader.figshare.com/files/32600930) | 226 | Two source cluster rows, seven columns; 3,654 and 2,519 detections, respectively |
| `README_full info.pdf` | [32598743](https://ndownloader.figshare.com/files/32598743) | 58,501 | Source animal/acquisition mapping and row/column definitions; relevant pages visually checked |
| `figshare-17816747-v1.api.json` | Versioned API above | 261,398 | Exact access/inventory/license receipt, not a local derivative substituted for repository metadata |

The MAT file's SHA-256 is `57999c43c3ce6d0406e3db35546ad6f3d8e153cefe04997ecb992b28df356272`. A bounded Python `struct`/`zlib` inspection verified its compressed MATLAB Level-5 payload, matrix class/name/dimensions, expected payload length and finite values. Frames span 1–24,997; raw X spans 4.0585–245.9930 and Y 4.0459–245.8980. This is research inspection, not an admitted general-purpose MAT parser.

**Practical next step:** build a separate source-local 2D localization viewer for this acquisition. First resolve raw XY units, origin and drift-correction state against the analysis method; verify any transform to the source count-table centroids. The article reports 107 nm camera sampling and 10 nm rendered-image pixels; neither number alone proves the unit of the raw MAT XY values. Show detections as detections, retaining frame/alpha/sigma. Repeated fluorophore appearances are not individual receptor molecules. Do not infer cluster membership from the two count rows or force them to partition all 18,358 detections. There is no Z coordinate, parent-neuron identity, presynaptic identity, nucleus or other intracellular segmentation in this package.

This can add measured synaptic molecular detail with under 1 MB of retained source data. It does not establish that the observed postsynaptic parent cell is itself an inhibitory interneuron.

## 3. GRPR terminal to projection-neuron dendrite: a third concrete 2D target

[Bardoni et al., Scientific Reports 9, 15804 (2019)](https://doi.org/10.1038/s41598-019-52316-0), [PMC full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC6825123/), reports double immuno-EM in adult mouse lumbar cord. The source identifies GRPR-eGFP terminals by silver-enhanced nanogold and PBN-projecting dendrites by retrograde Fluoro-Gold/peroxidase; Supplementary Figure 1 shows asymmetric synapses between them. The experiment uses 50 nm ultrathin sections. This is a more specific cell-class/target relationship than unidentified neuropil ultrastructure.

The exact public supplement link is [`41598_2019_52316_MOESM1_ESM.docx`](https://pmc.ncbi.nlm.nih.gov/articles/instance/6825123/bin/41598_2019_52316_MOESM1_ESM.docx), listed by PMC as 696.1 KB. The web fetch returned a cache-miss error; the binary has **not** been acquired or independently inspected. The open article's text and caption reference are accessible, and its CC BY 4.0 terms include images unless otherwise credited. The data-availability statement promises unrestricted availability but supplies no raw EM deposit.

**Practical next step:** acquire and inspect that specific supplement, retain its complete source caption and original embedded image, then expose the observed 2D connection with its labeling method. Until that inspection succeeds, this is an acquisition candidate, not an admitted image. The experimental adult EM group must remain separate from P16–P25 electrophysiology. No particular GRPR NeuroMorpho record—including UPG-208's NMO249676—is the same cell by virtue of its marker. No total synapse count, 3D terminal, molecular atlas identity or soma/nucleus follows from this image.

## Negative results that constrain the next modeling step

- **New 2026 mitochondrial labeling exists, but raw geometry is not public.** [Chen et al., Nature Communications 17, 7271, published 25 July 2026](https://www.nature.com/articles/s41467-026-75948-z) uses mitochondrial-matrix APEX2 in NFH/NaV1.8 sensory neurons. Figure 5 contains lumbar afferent-terminal mitochondria and synapses, with examples from three mice. These are incoming sensory terminals, not identified resident spinal interneurons. The authors explicitly did not reconstruct full serial-section terminals and state that raw image/video files were not publicly deposited. Therefore this is literature context, not a new intracellular-model acquisition row.
- **Cryo-ET organelle access does not solve interneuron identity.** [The mammalian-axon cryo-ET study](https://pmc.ncbi.nlm.nih.gov/articles/PMC7612188/) provides DRG sensory-axon tomograms through EMD-13598/13599/13600/13601/13602 and EMPIAR-10814/10815. These are not resident spinal interneurons; no download or new queue row was made.
- **Myelination/glial data are not neuronal internals.** [Djannatian et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC9856851/) combines mouse optic-nerve volume EM with zebrafish spinal myelin/glial observations. It did not yield a new exact identified spinal-interneuron nuclear/organelle segmentation in this check. A microglial or oligodendrocyte lysosome must not fill the selected neuron's interior.
- Existing Fish1, PKD2L1 serial EM, Janelia spinal corticospinal-tract labels, Svara/Guan zebrafish EM, MICrONS and generic EMPIAR searches already have queue entries. Their unresolved raw-object, same-cell or biological-scope limitations were not repackaged as new research rows.

## Proposed rows for the central queue

| ID | Priority | Proposed status | Concrete next deliverable and boundary | Primary evidence |
| --- | --- | --- | --- | --- |
| UPG-213 | P1 | research source retained; 2D viewer planned | Expose the preserved Davis Figure 1 in a source-local 2D comparison: morphology panel d and explicitly same-recorded-cell EM panels e–g, with intact whole-figure context, source scales and compromised-preservation limitation. Panels a–c remain different cells; no independent segmentation, 3D geometry, organelle/nucleus or NeuroMorpho join. | [Davis Figure 1](https://www.nature.com/articles/s41598-023-38605-9/figures/1); local receipt |
| UPG-214 | P1 | exact PALM point object retained; viewer planned | Render measured XY detections from Super-CLEM file 32526932 as a separate 2D acquisition after object-specific unit/drift validation; preserve all 18,358 source detections and distinguish source count-table clusters from receptor molecules. AQ848 dorsal tissue is not the existing BP057 EM object or an identified parent interneuron. | [Figshare v1](https://doi.org/10.6084/m9.figshare.17816747.v1); [source MAT](https://ndownloader.figshare.com/files/32526932); local receipt |
| UPG-215 | P2 | exact supplement acquisition planned | Acquire Bardoni Supplementary Figure 1 and its caption as a 2D immuno-EM example of source-labeled GRPR terminal → FG-labeled PBN-projection dendrite. Preserve adult mouse lumbar and 50 nm section context; no raw stack, 3D reconstruction, NMO249676 identity or cross-source synapse transfer. | [Bardoni primary study](https://doi.org/10.1038/s41598-019-52316-0); [exact supplement](https://pmc.ncbi.nlm.nih.gov/articles/instance/6825123/bin/41598_2019_52316_MOESM1_ESM.docx) |

## Preservation and admission status

Before acquisition, 24,917 project paths were inventoried for the Davis filename and 342 small image objects were checked against its advertised ETag as a preliminary duplicate hint. ETag was not assumed to equal MD5. Before retaining any of the five objects, a full project inventory (including ignored/generated files, excluding `.git`) selected every same-size file and compared SHA-256: six comparisons, no identical pre-existing bytes. No workspace copy was made.

The five retained source objects total **2,121,836 bytes**, plus two small research receipts. Both packages are `research_only_unadmitted`, with `geometryAdmissionCount: 0` and `publicAssetAdmissionCount: 0`. The full Davis figure and original PALM binary remain unmodified. No entire journal article, large image stack, new segmentation, generated biological detail or public asset was added.
