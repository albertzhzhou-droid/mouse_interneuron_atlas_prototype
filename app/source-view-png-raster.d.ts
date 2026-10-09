export function encodeSourceViewPng(canvas: HTMLCanvasElement, captions: string[], options: {
  pixelRatio: number; assertCurrent: () => void; appendReceipt: (blob: Blob) => Promise<Blob>;
}): Promise<{ blob: Blob; preview: string }>;
