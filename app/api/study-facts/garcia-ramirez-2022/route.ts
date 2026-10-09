import { exportGarciaRamirezPhysiology, readGarciaRamirezPhysiologyView } from "../../../garcia-ramirez-physiology.js";

/** A native attachment download of the attributed summaries and exact selection. */
export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const view = readGarciaRamirezPhysiologyView(params);
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  // The page may default to ST1; a file request must name its actual table.
  if (!params.has("physiologyTable") || view.error || !view.tableId) {
    return new Response(JSON.stringify({ error: "Choose one exact published table and an unambiguous property search before downloading.", exportAvailable: false }) + "\n", { status: 400, headers });
  }
  const facts = exportGarciaRamirezPhysiology({ tableId: view.tableId, query: view.query });
  return new Response(JSON.stringify(facts, null, 2) + "\n", { headers: {
    ...headers,
    "Content-Disposition": `attachment; filename="garcia-ramirez-2022-${view.tableId}-aggregate-physiology.json"`,
  } });
}
