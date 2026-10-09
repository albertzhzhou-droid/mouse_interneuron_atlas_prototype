import { wrapNativeContourPngCaption } from "./native-contour-png-export.js";

/** Caption layout only is shared with native contours; their source proof is not reused. */
export async function encodeSourceViewPng(canvas, captions, { pixelRatio, assertCurrent, appendReceipt }) {
  assertCurrent();
  const output = document.createElement("canvas");
  output.width = canvas.width;
  const context = output.getContext("2d");
  if (!context || canvas.width <= 0 || canvas.height <= 0) throw new Error("The current PNG canvas is unavailable.");
  const fontSize = Math.max(12, Math.round(14 * pixelRatio)), padding = Math.max(10, Math.round(12 * pixelRatio));
  const lineHeight = Math.ceil(fontSize * 1.45);
  context.font = `${fontSize}px sans-serif`;
  const lines = captions.flatMap(caption => wrapNativeContourPngCaption(caption, output.width - padding * 2, text => context.measureText(text).width));
  output.height = canvas.height + padding * 2 + lines.length * lineHeight;
  context.fillStyle = "#0a1714"; context.fillRect(0, 0, output.width, output.height);
  context.drawImage(canvas, 0, 0);
  context.fillStyle = "#f5f8f2"; context.fillRect(0, canvas.height, output.width, output.height - canvas.height);
  context.fillStyle = "#203c32"; context.font = `${fontSize}px sans-serif`; context.textBaseline = "top";
  lines.forEach((line, index) => context.fillText(line, padding, canvas.height + padding + index * lineHeight));
  const encoded = await new Promise((resolve, reject) => output.toBlob(blob => blob ? resolve(blob) : reject(new Error("PNG encoding failed.")), "image/png"));
  assertCurrent();
  const blob = await appendReceipt(encoded);
  assertCurrent();
  const preview = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("PNG preview is unavailable."));
    reader.onerror = () => reject(new Error("PNG preview is unavailable.")); reader.readAsDataURL(blob);
  });
  assertCurrent();
  return { blob, preview };
}
