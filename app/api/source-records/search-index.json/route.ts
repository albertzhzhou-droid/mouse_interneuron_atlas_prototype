import sourceBytes from "../../../../public/data/research_explorer_index_v1/search-index.json.gz?ohri-source-bytes";

/** HTTP gzip representation; fetch decodes it before canonical JSON verification. */
export function GET() {
  const body = new Uint8Array(sourceBytes);
  return new Response(body.buffer, { headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Encoding": "gzip",
    "Content-Length": String(body.byteLength),
    "Cache-Control": "public, max-age=0, must-revalidate, no-transform",
    "X-Content-Type-Options": "nosniff",
  } });
}
