"use client";

import { useState } from "react";
import { useResearchActiveRecord } from "./ResearchActiveRecordProvider";
import { loadVerifiedResearchExplorerIndex, researchExplorerLoadingReceipt } from "./research-explorer-index.js";

type LoadReceipt = {
  documentType: string; assetSetId: string; recordCount: number; canonicalUrl: string; requestedUrl: string;
  transport: string; forceFresh: boolean; contentEncoding: string | null; declaredContentLength: number | null;
  actualTransferBytes: number | null; actualEncodedBodyBytes: number | null; actualDecodedBodyBytes: number | null;
  verifiedDecodedBytes: number; verifiedDecodedSha256: string;
  manifestMilliseconds: number; fetchAndBodyMilliseconds: number; checksumMilliseconds: number;
  jsonDecodeParseMilliseconds: number; schemaValidationMilliseconds: number; totalDataReadyMilliseconds: number;
  timingScope: string; browserCacheScope: string;
};

export default function ResearchIndexLoadingEvidence() {
  const { indexState } = useResearchActiveRecord();
  const initial = indexState.index ? researchExplorerLoadingReceipt(indexState.index) as LoadReceipt | null : null;
  const [measurement, setMeasurement] = useState<LoadReceipt | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const receipt = measurement ?? initial;
  if (!initial) return null;
  const measure = async (transport: "canonical" | "compressed") => {
    setLoading(true); setMessage("Measuring this browser's data request. The current record remains selected.");
    try {
      const measured = await loadVerifiedResearchExplorerIndex({ transport, forceFresh: true });
      const next = researchExplorerLoadingReceipt(measured) as LoadReceipt;
      setMeasurement(next); setMessage("Measured the source-index request on this device; other application and scene costs are outside this result.");
    } catch (error) { setMeasurement(null); setMessage(error instanceof Error ? error.message : "The measurement could not be verified."); }
    finally { setLoading(false); }
  };
  return <details className="rrss-loading-evidence" data-testid="research-index-loading-evidence">
    <summary>Loading evidence for the source index</summary>
    <p>This index contains {receipt!.recordCount} fixed source records. Separate source-route supplements and cell geometry have their own loading costs.</p>
    <dl>
      <div><dt>Verified source data</dt><dd>{receipt!.verifiedDecodedBytes.toLocaleString("en-US")} bytes · exact decoded SHA-256 retained</dd></div>
      <div><dt>Observed transfer</dt><dd>{receipt!.actualTransferBytes === null ? "Not exposed by this browser" : `${receipt!.actualTransferBytes.toLocaleString("en-US")} bytes including response overhead`}<small>Encoded response: {receipt!.actualEncodedBodyBytes ?? "not exposed"} bytes · {receipt!.contentEncoding ?? "no content encoding reported"}</small></dd></div>
      <div><dt>Data ready</dt><dd>{receipt!.totalDataReadyMilliseconds.toFixed(1)} ms<small>Fetch/body {receipt!.fetchAndBodyMilliseconds.toFixed(1)} · checksum {receipt!.checksumMilliseconds.toFixed(1)} · JSON decode/parse {receipt!.jsonDecodeParseMilliseconds.toFixed(1)} · schema {receipt!.schemaValidationMilliseconds.toFixed(1)} ms</small></dd></div>
    </dl>
    <p>{receipt!.browserCacheScope} {receipt!.timingScope}</p>
    <p>The canonical URL may already serve gzip. Compare observed encoded bytes and cache state; these two requests are not a historical before/after benchmark.</p>
    <div className="rrss-actions"><button type="button" disabled={loading} onClick={() => measure("canonical")}>Measure canonical URL</button><button type="button" disabled={loading} onClick={() => measure("compressed")}>Measure explicit gzip route</button></div>
    {message && <p role="status">{message}</p>}
    <label>Actual source-index loading receipt<textarea aria-label="Actual source-index loading receipt" readOnly value={JSON.stringify(receipt, null, 2)} rows={8} spellCheck={false} /></label>
  </details>;
}
