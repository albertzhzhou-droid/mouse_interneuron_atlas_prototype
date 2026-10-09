import type * as THREE from 'three';
export type RonzanoFrame = 'raw' | 'normalized';
export type RonzanoCameraPreset = 'three_quarter' | 'transverse' | 'frontal' | 'lateral';
export interface RonzanoRequest { frame: RonzanoFrame; muscle: 'all' | 'LG' | 'TA'; segment: 'all' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6'; cameraPreset: RonzanoCameraPreset; pointSizePixels: number; layers: { points: true; axes: boolean } }
export interface RonzanoGroup { sourceFileId: string; sourceFileSha256: string; muscle: 'LG' | 'TA'; muscleRole: 'ankle_extensor' | 'ankle_flexor'; segment: Exclude<RonzanoRequest['segment'], 'all'>; sourceRows: { first: number; last: number }; points: [number, number, number][] }
export interface RonzanoPayload { schemaVersion: string; assetId: string; sourceDoi: string; sourceObjectKind: string; columns: string[]; representations: { frame: RonzanoFrame; groups: RonzanoGroup[] }[]; totals: { sourceFileCount: number; coordinateRowCountAcrossRepresentations: number; byFrame: Record<RonzanoFrame, number> }; identityPolicy: { rowIdentity: string; crossFramePointIdentity: string; crossSourceIdentity: string; registrationCount: number } }
export interface RonzanoSelectedRow { id: string; sourceFileId: string; sourceFileSha256: string; sourceRow: number; frame: RonzanoFrame; muscle: 'LG' | 'TA'; muscleRole: string; segment: string; sourceCoordinate: [number, number, number]; objectClaim: string; registrationCount: number }
export interface RonzanoSourceToken { readonly kind: 'verified_ronzano_position_sources'; readonly verificationSequence: number }
export interface RonzanoRenderToken { readonly kind: 'attested_ronzano_source_view'; readonly renderSequence: number }
export interface RonzanoCamera { kind: 'PerspectiveCamera'; position: number[]; target: number[]; up: number[]; quaternion: number[]; fov: number; zoom: number; aspect: number; near: number; far: number; filmGauge: number; filmOffset: number }
export interface RonzanoVerification { status: 'verified'; verificationSequence: number; verifiedAt: string; requestCacheMode: 'default' | 'no-store'; scope: string; files: { id: string; path: string; bytes: number; sha256: string }[] }
export interface RonzanoViewDocument { documentType: 'ronzano_premotor_position_actual_view_receipt'; schemaVersion: '0.1.0'; applicationVersion: string; generatedAt: string; rendererBuild: typeof RONZANO_SOURCE_VIEW_BUILD; sourceVerification: RonzanoVerification; sourceContext: Record<string, unknown>; scientificScope: Record<string, unknown>; view: { status: 'rendered_source_points'; runtimeBinding: { sourceVerificationSequence: number; sceneInstanceId: string; revision: number; renderSequence: number }; request: RonzanoRequest; camera: RonzanoCamera; viewport: { cssWidth: number; cssHeight: number; drawingBufferWidth: number; drawingBufferHeight: number; pixelRatio: number }; renderer: Record<string, unknown>; layers: { points: boolean; axes: boolean }; sourceObject: { bounds: { minimum: number[]; maximum: number[] }; pointCount: number; sourceFileIds: string[]; transform: Record<string, unknown>; worldMatrix: number[] }; selectedRow: RonzanoSelectedRow | null; drawing: { authority: string; sourceFileIds: string[]; submittedPointCount: number; pixelsAttested: false } } }
export const RONZANO_SOURCE_VIEW_BUILD: Readonly<{ applicationVersion: string; scope: string; inputs: { path: string; bytes: number; sha256: string }[] }>;
export const RONZANO_CAMERA_PRESETS: readonly RonzanoCameraPreset[];
export const RONZANO_POINT_COLORS: Readonly<Record<'LG' | 'TA', number>>;
export function readVerifiedRonzanoPositions(options?: { fetchImpl?: typeof fetch; signal?: AbortSignal; forceReload?: boolean }): Promise<RonzanoSourceToken>;
export function ronzanoPositionVerification(token: RonzanoSourceToken): RonzanoVerification;
export function ronzanoPositionPayload(token: RonzanoSourceToken): RonzanoPayload;
export function ronzanoDisplayTransform(frame: RonzanoFrame): Record<string, unknown>;
export function ronzanoSelectedRow(token: RonzanoSourceToken, request: RonzanoRequest, id: string | null): RonzanoSelectedRow | null;
export function browseRonzanoRow(token: RonzanoSourceToken, request: RonzanoRequest, currentId: string | null, movement: 'first' | 'last' | 'next' | 'previous' | 'clear'): string | null;
export function createRonzanoPositionObject(token: RonzanoSourceToken, request: RonzanoRequest): THREE.Group;
export function computeRonzanoSourceCameraFit(options: { bounds: { minimum: number[]; maximum: number[] }; aspect: number; preset?: RonzanoCameraPreset; direction?: number[]; up?: number[] }): { target: number[]; position: number[]; up: number[]; radius: number; distance: number; fov: number; near: number; far: number };
export function attestRonzanoRenderedView(token: RonzanoSourceToken, actual: { request: RonzanoRequest; root: THREE.Group; scene: THREE.Scene; camera: THREE.PerspectiveCamera; controls: { object: THREE.Camera; target: THREE.Vector3 }; renderer: THREE.WebGLRenderer; axes: THREE.AxesHelper; selectedRowId?: string | null; sceneInstanceId: string; revision: number }): RonzanoRenderToken;
export function captureRonzanoSourceView(rendered: RonzanoRenderToken): RonzanoViewDocument;
export function validateRonzanoSourceViewReplay(token: RonzanoSourceToken, document: unknown): RonzanoViewDocument['view'];
export function assertRonzanoSourceViewApplied(saved: RonzanoViewDocument, rendered: RonzanoRenderToken, previousToken: RonzanoSourceToken): true;
export function sameRonzanoCameraForCapture(first: RonzanoCamera | null, second: RonzanoCamera | null): boolean;
export function disposeRonzanoPositionObject(root: THREE.Group): void;

export function createRonzanoPositionRenderer(): THREE.WebGLRenderer;
export function bindRonzanoPositionViewport(renderer: THREE.WebGLRenderer, token: RonzanoSourceToken, binding: { scene: THREE.Scene; root: THREE.Group; camera: THREE.PerspectiveCamera; controls: import('three/examples/jsm/controls/OrbitControls.js').OrbitControls; axes: THREE.AxesHelper }): void;
export function renderRonzanoPositionViewport(renderer: THREE.WebGLRenderer): string[];
export function disposeRonzanoPositionRenderer(renderer: THREE.WebGLRenderer): void;
export function validateRonzanoPositionDescriptor(token: RonzanoSourceToken, descriptor: Parameters<typeof attestRonzanoRenderedView>[1]): Pick<RonzanoViewDocument['view'], 'request' | 'camera' | 'viewport' | 'renderer' | 'layers' | 'sourceObject' | 'selectedRow'>;
export function compareRonzanoSourceViewReplayApplied(saved: RonzanoViewDocument, current: RonzanoSourceToken, actualDocument: RonzanoViewDocument, previous: RonzanoSourceToken): true;
