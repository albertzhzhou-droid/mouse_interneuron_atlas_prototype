import audit from '../data/bil-xenium-polygon-source-audit-0.1.json';
import type { BilXeniumCoordinateSourceAudit } from './bil-xenium-coordinate-source-audit.js';
import type { BilXeniumGeometrySchemaAudit } from './bil-xenium-geometry-schema-audit.js';
export type BilXeniumPolygonSourceAudit = typeof audit;
export function validateBilXeniumPolygonSourceAudit(value: BilXeniumPolygonSourceAudit, coordinateAudit: BilXeniumCoordinateSourceAudit, schemaAudit: BilXeniumGeometrySchemaAudit): { sourceObjectKey:string; exactCells:number; cellPolygons:number; nucleusPolygons:number; activeVertexRows:number; boundaryPhysicalUnits:string; geometryObjects:number };
