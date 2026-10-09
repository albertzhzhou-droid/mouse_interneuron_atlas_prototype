# Research timeline — iteration 2.76 (2026-09-23)

## Scope

Continued from the immutable 2.75 release. This increment followed UPG-249's open-data discovery gate. It identifies openly licensed adult-mouse spinal FIB-SEM datasets that are relevant as separate axonal-ultrastructure comparators, while checking whether either supplies a spinal interneuron identity route. No microscopy payload was downloaded and no new geometry was admitted.

## Open mouse spinal FIB-SEM near-matches

- Figshare and OpenOrganelle metadata identify two public adult-mouse dorsal corticospinal-tract FIB-SEM volumes: wild type (`jrc_mus-sc-zp104a`) and Atl1 KI/KI / Reep1 KO (`jrc_mus-sc-zp105a`). Both are from 6-month-old females, report CC BY 4.0, have 6 × 6 × 6 nm voxels, and cover 40 × 30 × 75 μm.
- The primary paper describes corticospinal axons and ER/mitochondria analysis, including one selected manually reconstructed axon per genotype across 501 consecutive images. The dataset is in a descending projection-axon tract; neither record is a spinal interneuron or a normal interneuron template.
- These records improve public-data availability from “no qualifying hit in the earlier bounded repository screen” to “two openly licensed adjacent spinal EM volumes found, but zero exact interneuron-object routes.” The first UPG-243 audit remains a frozen account of its original query scope.
- Exact image arrays, labels, stable axon object IDs, and segmentation-file receipts were not retrieved into the project. There are zero interneuron/organelle objects admitted, zero same-cell joins, zero atlas registrations, and zero measurements.

## Interface and evidence boundary

- The existing open-EM search card now includes a follow-up section with both exact dataset IDs, species/age/region/genotype, voxel and volume dimensions, license, and separate Figshare/OpenOrganelle links.
- The panel explicitly labels the datasets as corticospinal-axon comparators and does not make them selectable morphology for a spinal interneuron.
- UPG-249 remains partially completed because its BANC same-cell payload/version/reuse gates and the search for a genuinely open adult mouse spinal interneuron volume remain unresolved.

## Verification and release

- Strict metadata schema, exact-ID/coordinate/license validator, mutation-rejection tests, and a 2.76 snapshot validator preserve the no-download/no-geometry boundary.
- The full current research suite passed: 947 tests total, 932 passed, 15 intentionally skipped, 0 failed (49.3 seconds).
- Lint and production build passed. The build reports the existing large-chunk advisory and an unclassified-route warning; neither failed the build.
- The sealed 2.76 manifest records 24 authoritative inputs and remains parented to immutable iteration 2.75. No project copy, microscopy download, or new geometry was introduced.

## Primary references

- [Wild-type dorsal corticospinal-tract FIB-SEM · CC BY 4.0](https://figshare.com/articles/dataset/Isotropic_3D_electron_microscopy_data_of_wild-type_mouse_dorsal_corticospinal_tract_jrc_mus-sc-zp104a_/20134574)
- [Wild-type volume in OpenOrganelle](https://openorganelle.janelia.org/datasets/jrc_mus-sc-zp104a)
- [Atl1 KI/KI / Reep1 KO dorsal corticospinal-tract FIB-SEM · CC BY 4.0](https://figshare.com/articles/dataset/Isotropic_3D_electron_microscopy_data_of_double-mutant_ATL1_KI_REEP1_KO_mouse_dorsal_corticospinal_tract_jrc_mus-sc-zp105a_/20134979)
- [Mutant volume in OpenOrganelle](https://openorganelle.janelia.org/datasets/jrc_mus-sc-zp105a)
- [Primary article: Zhu et al., 2022](https://doi.org/10.1093/hmg/ddac072)
- [OpenOrganelle data portal](https://openorganelle.janelia.org/)
