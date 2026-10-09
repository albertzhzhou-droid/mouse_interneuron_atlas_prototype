# Research watch — Koh et al. zebrafish spinal SBEM supplement

## Decision

Keep this as a source-data audit candidate under UPG-257. Do not import the supplementary workbook or display its coordinates until its actual sheets, records, coordinate contract and reuse terms have been inspected. It is a comparative larval-zebrafish circuit source, not a mouse-interneuron atlas input.

## Verified source-level facts

The final article describes a serial block-face EM volume from a 6-days-post-fertilization zebrafish spinal cord, measuring 74 × 74 × 207 µm at 9 × 9 × 21 nm voxel size. The paper states that the EM analysis used one healthy animal. The article reports a local circuit spanning dorsal-root-ganglion neurons, spinal interneurons and motor neurons, with astroglial contacts also analyzed. These are the scope and sampling unit of this study, not a whole-cord census or a prevalence denominator.

The PMC article page lists a 1.8-MB supplementary PDF and a 216.8-KB supplementary XLSX. In its methods, the article describes three analysis lists: an object list containing Knossos object IDs and cell-type labels; a synapse list containing coordinates, synapse type and pre-/postsynaptic references into the object list; and a tripartite-glia list. The workbook itself has not been inspected, so it is not yet established which list is in which worksheet, whether the listed fields are present as described, how many rows or objects exist, or whether coordinates are directly renderable.

The article describes the paper as open access under CC BY-NC-ND. That does not by itself settle reuse rights for each supplementary object or authorize redistribution of a derivative geometry asset. The article credits collaborators with providing the serial-EM dataset and segmentation; availability of those raw volume and segmentation payloads through a separate source route remains unverified here.

## Access and audit status

The public article/search record exposed both supplementary filenames and their sizes. A direct workbook download was not available in this work environment: the PMC route presented an access challenge and the browser blocked the direct attachment, while the command-line request could not resolve the PMC host. No worksheet contents were parsed, no source-object IDs were copied, and no file hash was recorded. This is an access limitation, not evidence that the workbook or raw volume is absent.

## Admission gate

Before any viewer or model change, retrieve and checksum the exact workbook and separately verify its file-level license/terms. Inventory every worksheet, row count, hidden range, identifier field and blank; test that stable IDs remain unique within their stated source namespace; establish axis order, origin, units and transform against the cited volume; and reconcile each pre-/postsynaptic reference to the object list. Preserve source labels that distinguish DRG sensory neurons, interneuron classes, motor neurons and glia. Report unresolved or merged objects instead of repairing them silently.

If the payload contains only object labels and synapse points, a later source-local comparative circuit view may be appropriate after permission review. Such points do not supply complete cell morphology, an organelle-resolved neuron interior, atlas registration or mouse-type identity. Do not join this candidate to Svara/Fish1 or mouse records without an exact shared source key and validated coordinate contract. Keep it separate from UPG-081's underlying volume/segmentation availability gate.

## Primary references

- [Koh et al., *Cell Reports*, article and associated data](https://pmc.ncbi.nlm.nih.gov/articles/PMC12958134/)
- [Supplementary XLSX listed by PMC](https://pmc.ncbi.nlm.nih.gov/articles/instance/12958134/bin/NIHMS2142936-supplement-2.xlsx)
- [UPG-081, existing Svara raw-volume and rights gate](RESEARCH_MODEL_UPGRADE_QUEUE.md)
