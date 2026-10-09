export type IndependentObject = {
  key: string; sourceId: string; registryId: string; releaseId: string; objectKind: string; sourceObjectId: string; title: string;
  context: Record<string, unknown>;
  coordinateFrame: { frame: string | null; unit: string | null; unitStatus: string; dimensions: number };
  components: { id: string; [name: string]: unknown }[];
  relationships: Record<string, unknown>[];
  files: Record<string, unknown>[];
  structureCoverage: { id: string; label: string; status: string; detail: string; locator: string }[];
  counts: { value: number; unit: string; scopeKey: string; derivedFrom: unknown }[];
  viewer: { kind: string; neuronId?: number };
  sourceUrl: string;
};

export type IndependentPayload = {
  key: string; kind: string;
  points: { position: number[]; frameIndex?: number; sourceMatrixColumn?: number }[];
  edges: [number[], number[]][];
  meshes: { positions: Float32Array; triangles: Uint32Array; componentId: string; authority: string }[];
  contours: unknown[];
  receipt: Record<string, unknown>;
};

export type IndependentViewState = {
  key: string; revision: string; status: "rendered" | "link-only" | "text-only";
  verificationRevision: number;
  representation: string;
  layers: { id: string; requested: boolean; actual: boolean }[];
  camera: { position: number[]; target: number[]; up: number[]; projection: "perspective"; fov: number; near: number; far: number } | null;
  displayTransform: { centerNative: number[]; scale: number; coordinateFrame: IndependentObject["coordinateFrame"] } | null;
  renderer: { name: string; version: string | null; width: number; height: number };
  clipping?: { globalPlanes: { normal: number[]; constant: number }[]; localClippingEnabled: boolean } | null;
  loadMilliseconds: number;
  renderMilliseconds: number;
};
