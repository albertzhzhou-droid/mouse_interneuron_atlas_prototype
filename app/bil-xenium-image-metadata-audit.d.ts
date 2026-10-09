import audit from '../data/bil-xenium-image-metadata-audit-0.1.json';
import type { BilXeniumCoordinateSourceAudit } from './bil-xenium-coordinate-source-audit.js';
import type { BilXeniumGeometrySchemaAudit } from './bil-xenium-geometry-schema-audit.js';
export type BilXeniumImageMetadataAudit = typeof audit;
export function validateBilXeniumImageMetadataAudit(value: BilXeniumImageMetadataAudit, coordinates: BilXeniumCoordinateSourceAudit, schema: BilXeniumGeometrySchemaAudit): {sourceObjectKey: string; metadataRangeBytes: number; imageWidth: number; imageHeight: number; declaredZPlanes: number; inBoundsCellCentroids: number; outlineAreasReproduced: number; geometryObjects: number};
