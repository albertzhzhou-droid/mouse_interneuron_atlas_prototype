import sourceBytes from "../../../../public/data/cano_gomez_p56_multiome_interneuron_v1/GSE318731_confirmed_interneuron_nucleus_roster.csv.gz?ohri-source-bytes";

/** Raw source-file bytes, rather than an HTTP Content-Encoding representation. */
export function GET() {
  const body = new Uint8Array(sourceBytes);
  return new Response(body.buffer, {
    headers: {
      "Content-Type": "application/gzip",
      "Content-Length": String(body.byteLength),
      "Cache-Control": "public, max-age=0, must-revalidate, no-transform",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
