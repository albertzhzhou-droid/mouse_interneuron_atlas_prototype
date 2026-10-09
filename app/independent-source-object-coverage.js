function freezeRow(row) {
  return Object.freeze(row);
}

function coordinateFrame(frame, units) {
  return [frame, units ? `units: ${units}` : null].filter(Boolean).join(" · ");
}

export function buildIndependentSourceObjectCoverage({
  micronsReference,
  micronsAudit,
  bancMorphologyRoute,
  bancInternalAudit,
  bancMitochondriaAudit,
  superClemReference,
  microStructFormerReference,
  nativeContourAudit,
}) {
  const micronsCell = micronsReference.components.find((item) => item.id === "cell-segmentation-surface");
  const micronsNucleus = micronsReference.components.find((item) => item.id === "nucleus-segmentation-surface");
  const micronsIds = [micronsReference.identityChain.cellRootId, micronsReference.identityChain.somaValenceTable.nucleusId];
  const micronsResolution = micronsAudit.synapseTable.coordinateFields.releaseNotesNominalVoxelResolutionNanometre;
  const contourSummary = nativeContourAudit.summary;
  const contourRecords = nativeContourAudit.records;
  const palm = superClemReference.acquisition;
  const micro = microStructFormerReference.datasetRelease;

  return Object.freeze([
    freezeRow({
      id: "microns-phase1",
      sourceName: "MICrONS Phase 1",
      scope: `${micronsReference.sourceDataset.species} · ${micronsReference.sourceDataset.specimen.age} · ${micronsReference.sourceDataset.specimen.sex} · ${micronsReference.sourceDataset.specimen.region} · ${micronsReference.sourceDataset.modality.replaceAll("_", " ")} · release ${micronsReference.sourceDataset.segmentationRelease}`,
      sourceScopedCount: "1 exact cortical cell root; 2 admitted mesh components (cell + linked nucleus). Not a project interneuron denominator.",
      objectIds: `Cell root ${micronsIds[0]} · nucleus ${micronsIds[1]}`,
      coordinateFrame: coordinateFrame(micronsReference.coordinateContract.nativeFrame, micronsReference.coordinateContract.nativeUnits),
      resolution: `${micronsResolution.join(" × ")} nm is reported for the separate v185 synapse-table grid; voxel resolution for the admitted v185.4 mesh is not asserted here.`,
      completeness: `${micronsReference.sourceDataset.proofreadingBoundary} Segmentation timestamp is not present in the admitted receipts.`,
      displayed: `${micronsCell.vertexCount.toLocaleString("en-US")} cell-surface vertices and ${micronsNucleus.vertexCount.toLocaleString("en-US")} linked-nucleus vertices; source segmentation surfaces, not a membrane measurement.`,
      notAdmitted: `${micronsAudit.admission.synapsePointCount} synapse points and ${micronsAudit.admission.mitochondriaObjectCount} mitochondria objects; no spinal identity or atlas registration.`,
      rights: `${micronsReference.sourceDataset.rights.license}; attribution required.`,
      sourceUrl: micronsReference.sourceDataset.sourcePage,
      sourceLabel: "MICrONS Phase 1 source page",
      detailHref: "#microns-observed-reference",
      detailLabel: "Open the admitted reference controls",
      scopeClass: "comparative",
    }),
    freezeRow({
      id: "banc-v888",
      sourceName: "BANC v888 · IN14A018",
      scope: `${bancMorphologyRoute.biologicalScope.species} · ${bancMorphologyRoute.biologicalScope.lifeStage} · ${bancMorphologyRoute.biologicalScope.sex} · ${bancMorphologyRoute.biologicalScope.region} · one source specimen; comparative fly-VNC lane.`,
      sourceScopedCount: `1 exact neuron root; ${bancMorphologyRoute.skeleton.nodeCount.toLocaleString("en-US")} SWC nodes and 1 linked nucleus point. Not a mouse or interneuron denominator.`,
      objectIds: `Root ${bancMorphologyRoute.identity.rootId} · nucleus ${bancMorphologyRoute.identity.nucleusId}`,
      coordinateFrame: coordinateFrame(bancMorphologyRoute.skeleton.coordinates.frame, bancMorphologyRoute.skeleton.coordinates.unit),
      resolution: `${bancMorphologyRoute.nucleusAnnotation.sourceVoxelResolutionNanometres.join(" × ")} nm source voxels for the nucleus annotation; the SWC retains source-native coordinates.`,
      completeness: "The admitted route is a source skeleton plus nucleus point; the source route does not certify whole-neuron reconstruction completeness. SWC type codes remain uninterpreted.",
      displayed: "Source-local centerline and one same-root nucleus point; no cell or nucleus surface.",
      notAdmitted: `${bancMitochondriaAudit.representation.mitochondriaPointMarkersAdmitted} mitochondria points, ${bancMitochondriaAudit.representation.synapseObjectsAdmitted ?? bancInternalAudit.admission.synapseObjects} synapse objects, and no mouse identity join. The reported mitochondria count is metadata only.`,
      rights: `${bancMorphologyRoute.rights.license} for the pinned Dataverse SWC member; separate mutable EM/internal-object routes have not cleared reuse/version gates.`,
      sourceUrl: bancMorphologyRoute.rights.sourceUrl,
      sourceLabel: "Pinned BANC morphology release",
      detailHref: "#banc-in14a018-route",
      detailLabel: "Open the exact BANC morphology route",
      scopeClass: "comparative",
    }),
    freezeRow({
      id: "super-clem-palm",
      sourceName: "Super-CLEM · PALM localization",
      scope: `One ${palm.region} acquisition · ${palm.sex} · source age label ${palm.ageSourceLabel}; species is not established in this file-level contract. Modality: source-native 2D localization detections.`,
      sourceScopedCount: `${palm.matRowsByColumns[1].toLocaleString("en-US")} detections in one MAT file; not a cell count, receptor-molecule count, or exhaustive partition by the 2 reported clusters.`,
      objectIds: `Image ${palm.imageId} · animal ${palm.animalId} · parent neuron ${palm.parentNeuronIdentity}`,
      coordinateFrame: "File-native X/Y numeric values; physical unit, origin, axis orientation and drift correction are not established.",
      resolution: "No physical scale or Z coordinate is reported for this file.",
      completeness: "A localization series only; it does not reconstruct a complete cell, synapse, or 3D volume.",
      displayed: "18,358 source XY records in a 2D plot; no cell or synapse identity link.",
      notAdmitted: "No 3D geometry, cell join, subtype assignment, or overlay with the separate EM acquisition.",
      rights: `${superClemReference.source.license}; attribution to the source study and deposited file.`,
      sourceUrl: `https://doi.org/${superClemReference.source.datasetDoi}`,
      sourceLabel: "Super-CLEM deposited PALM file",
      detailHref: "#superclem-palm-reference",
      detailLabel: "Open the source-coordinate plot",
      scopeClass: "source-only",
    }),
    freezeRow({
      id: "microstructformer",
      sourceName: "MicroStructFormer · 2D EM labels",
      scope: `${microStructFormerReference.source.biologicalContext} Modality: ${microStructFormerReference.source.sourceModality}.`,
      sourceScopedCount: `${micro.rowCount} image/mask rows (${micro.splitCounts.train} train, ${micro.splitCounts.validation} validation); no unique-cell or interneuron denominator.`,
      objectIds: `Row identity is split + row index only (example ${micro.sampleRowPreview.split}:${micro.sampleRowPreview.rowIndex}); no neuron, animal, section, or cell ID.`,
      coordinateFrame: "Image pixels only; no biological coordinate frame is exposed by the row viewer.",
      resolution: `${micro.sampleRowPreview.imageDimensionsPixel.join(" × ")} pixels describes the preview row only; physical pixel scale is not provided.`,
      completeness: "No serial stack, calibrated volume, or complete source-neuron reconstruction is available in the admitted dataset contract.",
      displayed: "Link-only source reference; images, masks, model weights and predictions are not bundled or rendered as cell geometry.",
      notAdmitted: `${microStructFormerReference.identityAndGeometryBoundary.identifiedInterneuronCount} identified interneurons, ${microStructFormerReference.identityAndGeometryBoundary.admittedCellGeometryCount} cell geometries and ${microStructFormerReference.identityAndGeometryBoundary.admittedInternalGeometryCount} internal geometries.`,
      rights: `${microStructFormerReference.modelAndLicense.datasetLicense}; link-only because redistribution and derivative conditions apply.`,
      sourceUrl: microStructFormerReference.sources.find((item) => /dataset card/i.test(item.label))?.url ?? microStructFormerReference.sources[0].url,
      sourceLabel: "MicroStructFormer dataset card",
      detailHref: "#microstructformer-reference",
      detailLabel: "Open the source and its boundary notes",
      scopeClass: "source-only",
    }),
    freezeRow({
      id: "todd-native-contours",
      sourceName: "Todd · source-native soma contours",
      scope: `Two exact NeuroMorpho DAT records: ${contourRecords.map((item) => item.assetId).join(" · ")}. Selected source-native contour audit; not a corpus census.`,
      sourceScopedCount: `${contourSummary.auditedRecordCount} audited records · ${contourSummary.sourceContourCount} contours · ${contourSummary.sourceVertexCount.toLocaleString("en-US")} vertices; these are source-trace counts, not additional cells.`,
      objectIds: contourRecords.map((item) => `${item.assetId}: ${item.title}`).join("; "),
      coordinateFrame: `${nativeContourAudit.method.coordinateFrame}; source contour Z values are recorded in micrometres; no atlas registration.`,
      resolution: "Trace coordinates are not voxel measurements; no image voxel resolution is asserted by this audit.",
      completeness: `${contourSummary.adjacentTransitionsWithinReferenceScreen}/${contourSummary.adjacentTransitionCount} adjacent transitions pass an exploratory software screen only; ${contourSummary.adjacentTransitionsHeld} remain held. Screen passage is not surface admission.`,
      displayed: `${contourSummary.contourDerivedSurfaceAdmittedCount} contour-derived surfaces and ${contourSummary.admittedTriangleCount} triangles in this two-record audit; raw closure flags and coordinates are retained. LineLoop closure follows the separately audited source soma semantics, and does not admit a surface.`,
      notAdmitted: `${contourSummary.internalStructureObjectCount} internal objects, ${contourSummary.sameCellJoinCount} cross-source cell joins, and ${contourSummary.registrationCount} registrations.`,
      rights: "NeuroMorpho source-object terms and original-paper attribution apply; keep this file-level derivative within its recorded source rights and citation boundary.",
      sourceUrl: contourRecords[0]?.source?.officialRecordUrl ?? "https://neuromorpho.org/useterm.jsp",
      sourceLabel: "Exact NeuroMorpho source record",
      detailHref: "https://neuromorpho.org/api/neuron/id/50424",
      detailLabel: "Open an exact source record",
      scopeClass: "source-only",
    }),
  ]);
}
