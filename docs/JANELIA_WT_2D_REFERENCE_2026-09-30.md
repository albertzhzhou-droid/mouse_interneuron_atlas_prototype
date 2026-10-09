# UPG-195 · WT raw / nucleus 原生二维源参考

2026-09-30。本轮可声明 **completed，范围仅为独立 source-local 二维 raw / manual-nucleus co-display**。它没有完成 M4，没有建立脊髓中间神经元身份、同一细胞内部结构链、atlas 配准或生物学测量。UPG-179/196 是相关历史来源记录，不因本轮视图自动改变完成状态。

## 当前原始来源及转换

本轮从两个确切的 Figshare v1 记录、对应 Zarr NGFF 元数据和两个明确 chunk 恢复小输入。八个原始文件共 **1,410,836 B**，存于 `data/source-candidates/janelia-wt-reference-20260930/`；逐文件 URL、字节数、SHA256 见 `receipt.json`。两个 chunk 和四个 Zarr 描述文件的六个 SHA256 均匹配 UPG-195 历史指纹。此次重新读取的两个 Figshare API JSON 使用新指纹，未声称历史 API 字节相同。

| 来源 | 当前版本 / 许可 | 当前可核验的关系 |
| --- | --- | --- |
| [WT raw EM，20134574](https://janelia.figshare.com/articles/dataset/Isotropic_3D_electron_microscopy_data_of_wild-type_mouse_dorsal_corticospinal_tract_jrc_mus-sc-zp104a_/20134574) | v1；10.25378/janelia.20134574.v1；CC BY 4.0 | `jrc_mus-sc-zp104a`，WT female 6-month dorsal corticospinal-tract source volume |
| [Manual nuclei，26513224](https://janelia.figshare.com/articles/dataset/Manual_nuclei_segmentations_in_near-isotropic_reconstructed_volume_electron_microscopy_FIB-SEM_of_mouse_Spinal_Cord_jrc_mus-sc-zp104a_/26513224) | v1；10.25378/janelia.26513224.v1；CC BY 4.0 | Annotation record explicitly identifies `jrc_mus-sc-zp104a` as EM parent; dense manual nucleus annotation using Amira 3D 2021.1 |

`tools/build_janelia_wt_bounded_reference.mjs` verifies source receipts, licenses, exact parent, axes and affines before losslessly decompressing two source Zstd chunks. It was exercised on Node v26.0.0 with native `node:zlib.zstdDecompressSync`. The resulting browser buffers are derivatives, not additional source acquisitions:

| Native derivative | Bytes | SHA256 |
| --- | ---: | --- |
| `public/data/janelia_wt_reference_v1/raw.u8` | 2,097,152 | `1a473947d5093925e09e0b7d830de4a38734f512d90232905bc72ed60d915c05` |
| `public/data/janelia_wt_reference_v1/nucleus.u8` | 262,144 | `39130ba800eaf10d89c6974959c51f322308105f8af77b48e62ca6beb298face` |

The viewer retains source citation strings, exact v1 links and CC BY attribution, and names the lossless decompression, label color and source-ROI rectangle as display changes. No intensity adjustment, inferred segmentation, interpolation or 3D mesh is introduced.

## Source frame and admissible display

`data/janelia-wt-bounded-reference-0.1.json` declares source-local Z,Y,X axes in nanometers. Source metadata gives the following sample-coordinate affines; no unstated pixel-corner convention is inferred.

| Array | Native chunk | Chunk key Z,Y,X | First global index Z,Y,X | Scale Z,Y,X | Translation Z,Y,X |
| --- | --- | --- | --- | --- | --- |
| Raw s0 | 128³, uint8, C order | 82,22,17 | 10496,2816,2176 | 6,6,6 nm | 0,0,0 nm |
| Manual nucleus s0 | 64³, uint8, C order | 10,2,2 | 640,128,128 | 96,96,96 nm | 45,45,45 nm |

The raw chunk maps to the nucleus native block `[16:24,48:56,8:16]`: **512 coarse samples, all source label 2**. Native label values in the whole bounded label chunk are `[0,2]`; label 2 occupies 69,867 samples and touches the chunk’s first and final Z planes, so it is retained as a **partial manual nucleus instance, cell class unknown**. There is no stable biological cell ID. Source semantics retain 0 as annotation absent and 255 as annotation unknown; neither is relabeled as a negative biological observation.

The component shows 128 native raw Z planes, each 128×128, alongside eight corresponding native 64×64 label planes. For raw local Z `r`, native label local Z is `16 + floor(r/16)`. The label sample coordinate is the mean coordinate of its group of 16 raw samples; it is not the same individual raw plane. The cyan 8×8 rectangle is the location of the raw patch in the native label grid. Since all label samples there are 2, it does not expose a nucleus boundary within the raw patch. The larger native label plane shows only the actual source partial annotation.

The nominal Figshare XYZ extent, 40×30×75 µm, still differs from the live raw-array XYZ extent, 54×42×76.188 µm. This unresolved difference is preserved; biological measurements remain disabled. The local source-coordinate display is independently supported by the pinned NGFF affines and does not resolve that discrepancy.

## Implementation and verification

- `app/janelia-wt-bounded-reference-viewer.tsx`: standalone component, no selected-cell input; checksum-verified loading/failure states, native Z slider, source citations, plane receipt export. A different atlas selection cannot change its source identity.
- `app/janelia-wt-bounded-reference.js`: strict source contract, checksum verification, bounded plane extraction, coarse/native correspondence and unknown/absent label semantics. Invalid source/frame/license/identity promotion fails closed.
- `scripts/validate-janelia-wt-bounded-reference-0.1.mjs`: hashes eight original files, compares derivatives byte-for-byte to source decompression and maps source metadata directly to the declared frame.
- `tests/janelia-wt-bounded-reference.test.mjs`: **5/5 passed**, including corrupt/truncated payloads, wrong frame/license, forbidden IN/complete-object claims, all 128 plane mappings and actual partial-instance/ROI inventory.
- The first project TypeScript check after this module was added had 0 diagnostics; new-file lint passed. The later aggregate check encountered six concurrent errors in `ComparativeSwcReferenceWorkbench.tsx`, with no errors in this module; final aggregate validation is owned by the main task. Source-pixel contact sheet at raw Z 0/64/127 was inspected; actual raw grayscale and partial label planes match the declared orientation and ROI. Integrated browser checks are recorded separately by the main task.

Reproduction: run `node tools/build_janelia_wt_bounded_reference.mjs`, `node scripts/validate-janelia-wt-bounded-reference-0.1.mjs` and `node --test tests/janelia-wt-bounded-reference.test.mjs`. The builder is offline once exact source receipts are present. Reacquisition is bounded to eight known files via `tools/janelia-wt-fetch-bounded-reference.py`.

## Remaining source dependencies

A typed interneuron or same-cell internal-chain lane still needs exact cell/parent IDs, source-backed type evidence and the relevant cell/soma plus intracellular segmentation in one calibrated source acquisition. Spatial overlap with nucleus instance 2 is insufficient. Full-object completeness and measurement require separate source evidence and resolution of the extent discrepancy. These are upstream scientific dependencies, not a hidden UI completion claim.
