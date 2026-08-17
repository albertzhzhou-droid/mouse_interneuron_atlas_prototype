import releaseJson from "../data/atlas-release-0.1.json";
import benchmarkJson from "../data/benchmark-snapshot-2026-08-17.json";

export type GeometryStatus = "OBS" | "REG" | "INF" | "SCH" | "SYN";
export type Transmitter =
  | "excitatory"
  | "inhibitory"
  | "mixed_or_unspecified"
  | "state_dependent";

export type AtlasEntity = {
  id: string;
  order: number;
  name: string;
  shortLabel: string;
  entityKind: string;
  classificationAxes: string[];
  transmitter: Transmitter;
  markers: string[];
  segmentGroup: "cervical" | "thoracic" | "lumbar" | "sacral";
  segmentLabel: string;
  lamina: string;
  laterality: string;
  endpoint: "locomotion" | "breathing" | "spasm";
  injuryType: string;
  injuryContext: string;
  geometry: {
    status: GeometryStatus;
    pathStatus: GeometryStatus;
    schematicPosition: [number, number, number];
    seed: number;
  };
  claimGrades: string[];
  endpointLevels: string[];
  allowedClaim: string;
  notEstablished: string;
  negativeFindings: string[];
  ledgerId: string;
  fullTextStatus: string;
  citation: string;
  doi: string;
  sourceUrl: string;
  humanCausalEvidence?: boolean;
};

export type AtlasRelease = Omit<typeof releaseJson, "entities"> & {
  entities: AtlasEntity[];
};

export type BenchmarkResource = (typeof benchmarkJson.resources)[number];

export const atlasRelease = releaseJson as AtlasRelease;
export const benchmarkSnapshot = benchmarkJson;

export const TRANSMITTER_COLORS: Record<Transmitter, string> = {
  excitatory: "#0072B2",
  inhibitory: "#D55E00",
  mixed_or_unspecified: "#6F5A8A",
  state_dependent: "#CC79A7",
};

export const STATUS_LABELS: Record<GeometryStatus, string> = {
  OBS: "Observed",
  REG: "Registered",
  INF: "Inferred",
  SCH: "Schematic",
  SYN: "Synthetic",
};
