export type MainSceneSourceCameraFitBounds = {
  minimum: [number, number, number] | number[];
  maximum: [number, number, number] | number[];
};

/** Live signature comparison only; captured receipts preserve the actual values. */
export function sameMainSceneCameraForCapture(a: unknown, b: unknown): boolean;

export type MainSceneSourceCameraFit = {
  target: number[];
  position: number[];
  up: number[];
  radius: number;
  distance: number;
};

/** A default viewer pose only; the caller retains exact source admission gates. */
export function computeMainSceneSourceCameraFit(options: {
  bounds: MainSceneSourceCameraFitBounds;
  aspect: number;
  dimensionality: "2D" | "3D";
  direction?: [number, number, number] | number[];
  up?: [number, number, number] | number[];
}): MainSceneSourceCameraFit;
