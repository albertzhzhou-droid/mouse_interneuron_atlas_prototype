import type { IndependentObject, IndependentPayload, IndependentViewState } from './independent-source-workspace-types';
export const INDEPENDENT_OBJECT_VIEW_INDEX: ReturnType<typeof import('./independent-source-objects.js').buildIndependentSourceObjectIndex>;
export const INDEPENDENT_OBJECT_VIEW_BUILD: Readonly<{applicationVersion:string;scope:string;inputs:readonly {path:string;bytes:number;sha256:string}[]}>;
export type IndependentObjectViewDocument={documentType:string;schemaVersion:string;applicationVersion:string;object:Record<string,unknown>;verification:Record<string,unknown>;view:IndependentViewState;sourceIdentity:unknown;scope:string;independentObjectViewSchemaVersion:'0.2.0';generatedAt:string;rendererBuild:typeof INDEPENDENT_OBJECT_VIEW_BUILD};
export function independentObjectSourceTransform(payload:IndependentPayload,record:IndependentObject):IndependentViewState['displayTransform'];
export function preflightIndependentObjectView(document:unknown,applicationVersion:string):{record:IndependentObject;view:IndependentViewState};
export function validateIndependentObjectView(document:unknown,payload:IndependentPayload,applicationVersion:string):{record:IndependentObject;view:IndependentViewState};
export function exportIndependentObjectView(key:string,payload:IndependentPayload,view:IndependentViewState,applicationVersion:string,verificationRevision:number):IndependentObjectViewDocument;
export function assertIndependentObjectViewApplied(document:IndependentObjectViewDocument,payload:IndependentPayload,actualView:IndependentViewState,applicationVersion:string,previousPayload:IndependentPayload|null,revision:number):true;
