import audit from '../data/bil-xenium-coordinate-source-audit-0.1.json';
import type { BilXeniumGeometrySchemaAudit } from './bil-xenium-geometry-schema-audit.js';
export type BilXeniumCoordinateSourceAudit = typeof audit;
export function validateBilXeniumCoordinateSourceAudit(value: BilXeniumCoordinateSourceAudit, schemaAudit: BilXeniumGeometrySchemaAudit): { sourceObjectKey: string; exactCellIdJoinCount: number; centroidUnits: string; geometryObjects: number; assignedAutomatedCellCount: number; unassignedAutomatedCellCount: number };
