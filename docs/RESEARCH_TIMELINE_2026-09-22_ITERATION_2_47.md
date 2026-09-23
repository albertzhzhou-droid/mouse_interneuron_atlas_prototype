# Research timeline — iteration 2.47

Date: 2026-09-22  
Scope: source-gated contour-derived display geometry for one exact NeuroMorpho record.  
Working rule: continue in the existing project tree; preserve exact OBS contour loops and prior release snapshots.

## Research question

Can a 3D display surface be derived without substituting generic geometry or silently treating source-native Neurolucida traces as an observed membrane?

## Evidence admitted

- NeuroMorpho NMO 50394 source record: mouse, lumbar superficial dorsal horn; repository source labels include nNOS-positive, PrP-promoter-positive and interneuron. These labels remain source metadata, not independently validated subtype or cell-wide identity claims.
- Original DAT: 191,975 bytes; SHA-256 `eceb6bc0cd2247e2ef2c51c6063b97db64d194d8483ef6d7427c715d9054a109`.
- Exact source-native contour payload: 14 `Cell Body` objects / 768 vertices; SHA-256 `61fddbab3764e761600c2519e478eec4cee7918a581b2fde29ac2d8880c90a92`; ordered point payload SHA-256 `b823d7ef36d28ec05836425c82ba5b9bd4edfd8fb1bf1b821eecce833abe8f4b`.
- All 14 raw source closed flags remain false. The line-loop admission retains the exact `Cell Body` name, empty-value `CellBody` property, pinned independent parser `somaContour` classification and MBF cell-body closure semantics. This does not create a generic rule for other false-flag contours.
- The contours occupy one object per unique plane, ascending z `-58` through `-45 µm`, with 1 µm gaps. All 14 planar polygons passed the implemented simple-loop check. Maximum adjacent centroid shift: 0.673 µm; maximum adjacent area ratio: 1.457; maximum phase-aligned RMS: 1.304 µm.

## Derived display artifact

One separate `DER_INTERPOLATED_SOURCE_CONTOUR_OPEN_SHELL` is generated from the verified OBS contours by equal-arclength resampling (128 points per observed contour), counterclockwise winding normalization for mesh construction only, minimum-RMS cyclic phase matching to the previous plane, and fixed two-triangle strips between adjacent planes. Source line loops and their source order remain unchanged and available in the same viewer.

- 14 rings; 1,792 derived vertices; 3,328 triangles.
- Two open end boundaries; no end caps, smoothing or use of trace radius.
- The shell is an interpolation aid only: not an observed membrane, closed volume, nucleus, organelle, internal segmentation, biological measurement, selected-cell identity join or atlas registration.
- Artifact byte receipt: 309,804 bytes; SHA-256 `a1d4d93ef2e8e2d95a6ae479524ed4a960fdfe49d76fe62da1d10a386873b0e0`.
- Receipt: `data/native-contour-derived-soma-surface-0.1.json`.

## Interface and provenance behavior

The NMO 50394 card keeps OBS loops and the DER open shell separately labeled, exposes an explicit shell visibility control, and reports zero observed surfaces, volumes, internal structures and registrations. Record switches never reuse this derivative for another neuron. Other records remain on exact admitted source line geometry or held/unavailable states; no generic sphere or inferred proxy is introduced.

## Remaining evidence gaps

- No same-cell raw ultrastructural stack, nucleus or organelle segmentation is available for NMO 50394 in this source package. The mesh must not be described as internal structural refinement.
- NMO 50424 retains an unresolved adjacent-contour transition; NMO 50408 has two self-intersecting source loops. Both remain unmeshed under planned UPG-220.
- This exact example does not establish a representative interneuron morphology, general-purpose interpolation threshold, subtype frequency, or comprehensive atlas coverage.

## Sources

- [NeuroMorpho NMO 50394 record](https://neuromorpho.org/api/neuron/id/50394)
- [Todd et al. primary paper](https://doi.org/10.1523/JNEUROSCI.0406-15.2015)
- [MBF Neurolucida cell-body tracing semantics](https://www.mbfbioscience.com/help/neurolucida/Content/Ribbons/Trace/traceCellBody.htm)
- [NeuroMorpho terms of use](https://neuromorpho.org/useterm.jsp)
